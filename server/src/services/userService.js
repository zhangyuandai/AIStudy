/**
 * 用户服务 - 注册、登录、信息查询
 */
const db = require('../config/database');
const { signUserToken } = require('../utils/token');
const logger = require('../utils/logger');

class UserService {
  /**
   * 微信登录：code → session_key + openid → 查找或创建用户
   */
  async wxLogin(code) {
    // TODO: 生产环境替换为真实微信 code2session 调用
    // const { appid, secret } = config.wechat;
    // const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;
    // const res = await axios.get(url);

    // 开发模式：模拟返回
    let openid = `dev_openid_${code.slice(0, 8)}`;
    if (process.env.NODE_ENV === 'development' && !code.startsWith('mock')) {
      // 开发环境用 code 的前8位作为模拟openid
      openid = `dev_${Date.now()}_${code.slice(0, 6)}`;
    }

    // 查找或创建用户
    let user = await db.queryOne('SELECT * FROM sc_user WHERE openid = ?', [openid]);

    if (!user) {
      const result = await db.query(
        'INSERT INTO sc_user (openid, nickname, avatar_url) VALUES (?, ?, ?)',
        [openid, `滑板用户${Math.floor(Math.random() * 10000)}`, '']
      );
      user = await db.queryOne('SELECT * FROM sc_user WHERE id = ?', [result.insertId]);
      logger.info(`[UserService] 新用户注册: id=${user.id}, openid=${openid}`);

      // 创建积分账户
      await this._initPointsAccount(user.id);
    } else {
      // 更新最后登录时间
      await db.query('UPDATE sc_user SET last_login_at = NOW() WHERE id = ?', [user.id]);
    }

    const token = signUserToken(user);
    return {
      token,
      user: {
        user_id: String(user.id).padStart(12, 'U'),
        openid: user.openid,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        phone: user.phone ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}` : '',
        real_name: user.real_name,
        level: (await this._getUserLevel(user.id)).level,
        total_points_earned: (await this._getPointsAccount(user.id)).total_earned || 0,
      },
    };
  }

  /**
   * 获取用户完整Profile
   */
  async getProfile(userId) {
    const user = await db.queryOne('SELECT id, openid, nickname, avatar_url, phone, real_name, gender, is_staff, created_at FROM sc_user WHERE id = ?', [userId]);
    if (!user) throw { message: '用户不存在', code: 404 };
    return user;
  }

  /**
   * 绑定手机号
   */
  async bindPhone(userId, phone) {
    // 检查手机号是否已被绑定
    const existing = await db.queryOne('SELECT id FROM sc_user WHERE phone = ? AND id != ?', [phone, userId]);
    if (existing) throw { message: '该手机号已绑定其他账号', code: 409 };

    await db.query('UPDATE sc_user SET phone = ? WHERE id = ?', [phone, userId]);
    logger.info(`[UserService] 用户${userId}绑定手机号: ${phone}`);
    return true;
  }

  /**
   * 更新昵称/头像等基本信息
   */
  async updateProfile(userId, data) {
    const fields = [];
    const values = [];
    if (data.nickname !== undefined) { fields.push('nickname=?'); values.push(data.nickname); }
    if (data.avatar_url !== undefined) { fields.push('avatar_url=?'); values.push(data.avatar_url); }
    if (data.real_name !== undefined) { fields.push('real_name=?'); values.push(data.real_name); }
    if (data.gender !== undefined) { fields.push('gender=?'); values.push(data.gender); }

    if (fields.length > 0) {
      values.push(userId);
      await db.query(`UPDATE sc_user SET ${fields.join(',')} WHERE id=?`, values);
    }
    return this.getProfile(userId);
  }

  /**
   * 初始化积分账户（新用户）
   */
  async _initPointsAccount(userId) {
    const config = await this.getRegisterReward();
    await db.query(
      'INSERT INTO sc_points_account (user_id, available_points, total_earned) VALUES (?, ?, ?)',
      [userId, config.points, config.points]
    );
    // 记录流水
    await db.query(
      'INSERT INTO sc_points_record (user_id, type, amount, balance_after, source, source_detail, remark) VALUES (?, "income", ?, ?, "register_bonus", ?, ?)',
      [userId, config.points, config.points, `REG-${Date.now()}`, '新人注册奖励']
    );
  }

  /**
   * 获取积分账户
   */
  async _getPointsAccount(userId) {
    return await db.queryOne(
      'SELECT * FROM sc_points_account WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * 获取用户等级
   */
  async _getUserLevel(userId) {
    const account = await this._getPointsAccount(userId);
    if (!account) return { level: 1, level_name: '青铜滑手', progress: 0, points_to_next: 500 };

    const levels = [
      { min: 0, name: '青铜滑手' },
      { min: 500, name: '白银骑士' },
      { min: 2000, name: '黄金大神' },
      { min: 5000, name: '钻石传奇' },
    ];
    let lv = 1;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (account.total_earned >= levels[i].min) { lv = i + 1; break; }
    }
    const current = levels[lv - 1];
    const next = levels[lv];
    const range = next ? next.min - current.min : current.min;
    const earnedInLevel = next ? account.total_earned - current.min : 0;

    return {
      level: lv,
      level_name: current.name,
      progress: next ? Math.floor((earnedInLevel / range) * 100) : 100,
      points_to_next: next ? next.min - account.total_earned : 0,
    };
  }

  /** 获取注册奖励配置 */
  async getRegisterReward() {
    const row = await db.queryOne("SELECT CAST(config_value AS UNSIGNED) as points FROM sc_system_config WHERE group_key='points' AND config_key='register_reward'");
    return { points: parseInt(row?.points || 50) };
  }
}

module.exports = new UserService();
