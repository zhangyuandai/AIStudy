/**
 * 签到服务 - 扫码/手动签到
 */
const db = require('../config/database');
const pointsService = require('./pointsService');
const dayjs = require('dayjs');

class CheckinService {
  /**
   * 执行签到（店员操作学员）
   * 返回签到结果 + 积分发放信息
   */
  async checkIn(studentId, courseId = '', operatorId = 0) {
    // 验证用户存在
    const user = await db.queryOne('SELECT id, real_name, nickname FROM sc_user WHERE id = ? AND status = 1', [studentId]);
    if (!user) throw { message: '学员不存在或已禁用', code: 404 };

    const today = dayjs().format('YYYY-MM-DD');

    // 查今日是否已签到
    const existing = await db.queryOne(
      'SELECT id FROM sc_checkin WHERE user_id = ? AND checkin_date = ?',
      [studentId, today]
    );
    if (existing) {
      throw { message: `【${user.real_name || user.nickname}】今日已签到`, code: 409 };
    }

    return await db.transaction(async (conn) => {
      // 写入签到记录
      await conn.query(
        `INSERT INTO sc_checkin (user_id, course_name, operator_id, points_earned, checkin_date, checkin_time)
         VALUES (?, ?, ?, 10, ?, CURTIME())`,
        [studentId, courseId, operatorId, today]
      );

      // 发放积分（含连续签到奖励）
      const result = await pointsService.rewardCheckin(conn, studentId, courseId);

      return {
        success: true,
        record_id: `TC${Date.now()}`,
        student_name: user.real_name || user.nickname,
        points_given: result.points_given,
        streak_days: result.streak_days,
        balance: result.balance,
      };
    });
  }

  /**
   * 今日签到列表
   */
  async getTodayList(params = {}) {
    const { page = 1, pageSize = 20 } = params;
    const today = dayjs().format('YYYY-MM-DD');

    const list = await db.query(
      `SELECT c.*, u.real_name as student_name, u.nickname, u.avatar_url, s.real_name as operator_name
       FROM sc_checkin c
       JOIN sc_user u ON c.user_id = u.id
       LEFT JOIN sc_staff s ON c.operator_id = s.id
       WHERE c.checkin_date = ?
       ORDER BY c.checkin_time DESC LIMIT ? OFFSET ?`,
      [today, pageSize, (page - 1) * pageSize]
    );
    const totalRes = await db.queryOne('SELECT COUNT(*) as total FROM sc_checkin WHERE checkin_date = ?', [today]);
    return { list, total: totalRes.total };
  }

  /**
   * 学员搜索（用于店员端快速查找）
   */
  async searchStudents(keyword = '', page = 1, pageSize = 20) {
    if (!keyword) {
      // 无关键词时返回活跃学员
      const list = await db.query(
        `SELECT u.id as user_id, u.real_name, u.nickname, u.avatar_url, u.phone,
                p.available_points, (SELECT id FROM sc_checkin WHERE user_id=u.id AND checkin_date=CURDATE()) as today_checked_in
         FROM sc_user u JOIN sc_points_account p ON u.id=p.user_id
         WHERE u.status=1 ORDER BY u.last_login_at DESC LIMIT ? OFFSET ?`,
        [pageSize, (page - 1) * pageSize]
      );
      const total = (await db.queryOne('SELECT COUNT(*) as total FROM sc_user WHERE status=1'))?.total ?? 0;
      return { list: list.map(s => ({
        ...s,
        phone: s.phone ? `${s.phone.slice(0,3)}****${s.phone.slice(-4)}` : '',
        today_checked_in: !!s.today_checked_in,
      })), total };
    }

    const likeKw = `%${keyword}%`;
    const list = await db.query(
      `SELECT u.id as user_id, u.real_name, u.nickname, u.avatar_url, u.phone,
              p.available_points, (SELECT id FROM sc_checkin WHERE user_id=u.id AND checkin_date=CURDATE()) as today_checked_in
       FROM sc_user u JOIN sc_points_account p ON u.id=p.user_id
       WHERE u.status=1 AND (u.real_name LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)
       LIMIT ? OFFSET ?`,
      [likeKw, likeKw, likeKw, pageSize, (page - 1) * pageSize]
    );
    const total = (await db.queryOne(
      `SELECT COUNT(*) as total FROM sc_user u WHERE u.status=1 AND (u.real_name LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ?)`,
      [likeKw, likeKw, likeKw]
    ))?.total ?? 0;
    return { list: list.map(s => ({
      ...s,
      phone: s.phone ? `${s.phone.slice(0,3)}****${s.phone.slice(-4)}` : '',
      today_checked_in: !!s.today_checked_in,
    })), total };
  }
}

module.exports = new CheckinService();
