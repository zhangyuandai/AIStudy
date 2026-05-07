/**
 * 积分服务 - 核心业务：加减积分、查询账户/流水、等级计算
 *
 * ⚠️ 所有积分变动必须通过此服务，保证事务一致性
 */
const db = require('../config/database');
const logger = require('../utils/logger');

class PointsService {
  /**
   * 获取积分账户详情
   */
  async getAccount(userId) {
    const account = await db.queryOne(
      'SELECT * FROM sc_points_account WHERE user_id = ?',
      [userId]
    );
    if (!account) throw { message: '积分账户不存在', code: 404 };

    // 等级计算
    const levelInfo = await this._calcLevel(account.total_earned);
    return {
      ...account,
      ...levelInfo,
    };
  }

  /**
   * 获取积分流水列表
   */
  async getHistory(userId, params = {}) {
    const { type, page = 1, pageSize = 20 } = params;
    let where = 'WHERE user_id = ?';
    const queryParams = [userId];

    if (type && ['income','expense','adjust','expire'].includes(type)) {
      where += ' AND type = ?';
      queryParams.push(type);
    }

    const list = await db.query(
      `SELECT * FROM sc_points_record ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, pageSize, (page - 1) * pageSize]
    );

    const totalResult = await db.queryOne(
      `SELECT COUNT(*) as total FROM sc_points_record ${where}`,
      queryParams
    );

    return { list, total: totalResult.total, has_more: page * pageSize < totalResult.total };
  }

  /**
   * 增加积分（原子操作，在调用方事务中执行）
   * @returns 变动后的余额
   */
  async addPoints(conn, userId, amount, source, sourceDetail, operatorId = 0, remark = '') {
    const connOrDb = conn || db;
    await connOrDb.query(
      'UPDATE sc_points_account SET available_points = available_points + ?, total_earned = total_earned + ?, updated_at = NOW() WHERE user_id = ?',
      [amount, amount, userId]
    );
    const account = await connOrDb.queryOne('SELECT available_points FROM sc_points_account WHERE user_id = ?', [userId]);
    await connOrDb.query(
      `INSERT INTO sc_points_record (user_id, type, amount, balance_after, source, source_detail, operator_id, remark)
       VALUES (?, "income", ?, ?, ?, ?, ?, ?)`,
      [userId, amount, account.available_points, source, sourceDetail, operatorId, remark]
    );
    logger.info(`[Points] +${amount} → 用户${userId} | 来源:${source} | 余额:${account.available_points}`);
    return account.available_points;
  }

  /**
   * 扣减积分（原子操作，含余额校验）
   * @returns 变动后的余额
   */
  async deductPoints(conn, userId, amount, source, sourceDetail, operatorId = 0, remark = '') {
    const connOrDb = conn || db;
    // 先检查余额
    const account = await connOrDb.queryOne('SELECT available_points FROM sc_points_account WHERE user_id = ? FOR UPDATE', [userId]);
    if (!account || account.available_points < amount) {
      throw { message: '积分不足', code: 400, statusCode: 400 };
    }
    await connOrDb.query(
      'UPDATE sc_points_account SET available_points = available_points - ?, total_spent = total_spent + ?, updated_at = NOW() WHERE user_id = ?',
      [amount, amount, userId]
    );
    const after = await connOrDb.queryOne('SELECT available_points FROM sc_points_account WHERE user_id = ?', [userId]);
    await connOrDb.query(
      `INSERT INTO sc_points_record (user_id, type, amount, balance_after, source, source_detail, operator_id, remark)
       VALUES (?, "expense", ?, ?, ?, ?, ?, ?)`,
      [userId, -amount, after.available_points, source, sourceDetail, operatorId, remark]
    );
    logger.info(`[Points] -${amount} → 用户${userId} | 来源:${source} | 余额:${after.available_points}`);
    return after.available_points;
  }

  /**
   * 店员调账（增扣皆可，带上限校验）
   */
  async adjustByStaff(operatorId, studentId, amount, reason) {
    const maxAdjust = await this._getConfigValue('points', 'max_staff_adjust', 500);
    if (Math.abs(amount) > maxAdjust) {
      throw { message: `单次调账上限${maxAdjust}分，请联系管理员`, code: 400 };
    }

    return await db.transaction(async (conn) => {
      if (amount > 0) {
        const balance = await this.addPoints(conn, studentId, amount, 'admin_adjust', `ADJ-${Date.now()}`, operatorId, reason);
        return { success: true, record_id: `ADJ-${Date.now()}`, balance };
      } else {
        const balance = await this.deductPoints(conn, studentId, Math.abs(amount), 'admin_adjust', `ADJ-${Date.now()}`, operatorId, reason);
        return { success: true, record_id: `ADJ-${Date.now()}`, balance };
      }
    });
  }

  /**
   * 签到发积分（含连续签到奖励）
   */
  async rewardCheckin(conn, userId, courseName = '') {
    const account = await conn.queryOne('SELECT streak_days, last_checkin_date FROM sc_points_account WHERE user_id = ? FOR UPDATE', [userId]);
    const today = new Date().toISOString().slice(0, 10);

    // 基础签到积分
    const basePoints = parseInt(await this._getConfigValue('points', 'lesson_checkin', 10));
    let totalBonus = basePoints;
    let streakDays = 1; // 今天签了算第一天

    if (account?.last_checkin_date) {
      const last = new Date(account.last_checkin_date);
      const diff = Math.round((new Date(today) - last) / (1000 * 60 * 60 * 24));
      if (diff === 1) streakDays = (account.streak_days || 0) + 1;
      else if (diff > 1) streakDays = 1; // 断了重计
      else streakDays = account.streak_days || 1; // 同一天重复签到(前面应该被拦截)
    }

    // 连续签到奖励
    if (streakDays >= 3) {
      const bonus3 = parseInt(await this._getConfigValue('points', 'streak_3_bonus', 20));
      totalBonus += bonus3;
    }
    if (streakDays >= 7) {
      const bonus7 = parseInt(await this._getConfigValue('points', 'streak_7_bonus', 80));
      totalBonus += bonus7;
    }

    // 更新连续天数
    await conn.query(
      'UPDATE sc_points_account SET streak_days = ?, last_checkin_date = ?, updated_at = NOW() WHERE user_id = ?',
      [streakDays, today, userId]
    );

    // 加积分
    const sourceDetail = `CI-${today.replace(/-/g, '')}-${String(userId).slice(-4)}`;
    const balance = await this.addPoints(conn, userId, totalBonus, 'checkin_lesson', sourceDetail, 0,
      courseName ? `签到(${courseName})` : '签到'
    );

    return { points_given: totalBonus, balance, streak_days: streakDays };
  }

  /** 内部：等级计算 */
  async _calcLevel(totalEarned) {
    const thresholds = [
      { min: 0, name: '青铜滑手' },
      { min: 500, name: '白银骑士' },
      { min: 2000, name: '黄金大神' },
      { min: 5000, name: '钻石传奇' },
    ];
    let lv = 1;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (totalEarned >= thresholds[i].min) { lv = i + 1; break; }
    }
    const curr = thresholds[lv - 1];
    const next = thresholds[lv];
    const range = next ? next.min - curr.min : 1;
    const progress = next ? Math.floor(((totalEarned - curr.min) / range) * 100) : 100;
    return {
      level: lv,
      level_name: curr.name,
      level_progress: progress,
      points_to_next_level: next ? next.min - totalEarned : 0,
    };
  }

  /** 读取配置值 */
  async _getConfigValue(groupKey, configKey, defaultVal) {
    const row = await db.queryOne(
      'SELECT config_value FROM sc_system_config WHERE group_key = ? AND config_key = ?',
      [groupKey, configKey]
    );
    return row?.config_value ?? String(defaultVal);
  }
}

module.exports = new PointsService();
