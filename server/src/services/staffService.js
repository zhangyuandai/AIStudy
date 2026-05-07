/**
 * 店员/管理员服务 - 登录、CRUD、权限管理
 */
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { signAdminToken } = require('../utils/token');
const config = require('../config/index');

class StaffService {
  /**
   * 管理员账号密码登录
   */
  async login(username, password) {
    const staff = await db.queryOne('SELECT * FROM sc_staff WHERE username = ? AND status = 1', [username]);
    if (!staff) throw { message: '账号不存在或已禁用', code: 401, statusCode: 401 };

    const valid = await bcrypt.compare(password, staff.password_hash);
    if (!valid) throw { message: '密码错误', code: 401, statusCode: 401 };

    // 更新登录统计
    await db.query('UPDATE sc_staff SET login_count = login_count + 1, last_login_at = NOW() WHERE id = ?', [staff.id]);

    const token = signAdminToken(staff);
    return {
      token,
      staff: {
        id: staff.id,
        username: staff.username,
        real_name: staff.real_name,
        role: staff.role,
        avatar_url: staff.avatar_url,
      },
    };
  }

  /**
   * 获取员工列表
   */
  async getList(params = {}) {
    const { role, page = 1, pageSize = 20 } = params;
    let where = 'WHERE 1=1';
    const qp = [];
    if (role) { where += ' AND role = ?'; qp.push(role); }

    const list = await db.query(
      `SELECT id, username, real_name, avatar_url, role, status, login_count, last_login_at, remark, created_at
       FROM sc_staff ${where} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...qp, pageSize, (page - 1) * pageSize]
    );
    const total = (await db.queryOne(`SELECT COUNT(*) as total FROM sc_staff ${where}`, qp))?.total ?? 0;
    return { list, total };
  }

  /**
   * 创建员工
   */
  async create(data) {
    const { username, password, real_name, role = 'receptionist', remark = '' } = data;
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO sc_staff (username, password_hash, real_name, role, remark) VALUES (?, ?, ?, ?, ?)',
      [username, hash, real_name, role, remark]
    );
    return result.insertId;
  }

  /**
   * 更新员工
   */
  async update(staffId, data) {
    const fields = [];
    const vals = [];
    if (data.real_name !== undefined) { fields.push('real_name=?'); vals.push(data.real_name); }
    if (data.role !== undefined) { fields.push('role=?'); vals.push(data.role); }
    if (data.remark !== undefined) { fields.push('remark=?'); vals.push(data.remark); }
    if (data.status !== undefined) { fields.push('status=?'); vals.push(data.status); }
    if (fields.length > 0) {
      vals.push(staffId);
      await db.query(`UPDATE sc_staff SET ${fields.join(',')} WHERE id=?`, vals);
    }
  }

  /**
   * 重置密码
   */
  async resetPassword(staffId, newPassword = '123456') {
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE sc_staff SET password_hash = ? WHERE id = ?', [hash, staffId]);
  }

  /**
   * 初始化默认管理员（部署时调用一次）
   */
  async initDefaultAdmin() {
    const existing = await db.queryOne('SELECT id FROM sc_staff WHERE username = ?', [config.admin.username]);
    if (existing) return existing.id;

    const hash = await bcrypt.hash(config.admin.password, 10);
    const result = await db.query(
      `INSERT INTO sc_staff (username, password_hash, real_name, role, status)
       VALUES (?, ?, '系统管理员', 'admin', 1)`,
      [config.admin.username, hash]
    );
    console.log(`[StaffService] 默认管理员已创建: ${config.admin.username}/${config.admin.password}`);
    return result.insertId;
  }

  /**
   * 工作台统计数据（店员首页）
   */
  async dashboardStats() {
    const today = new Date().toISOString().slice(0, 10);
    const [todayCheckins, weekPoints, pendingOrders, recentCheckins] = await Promise.all([
      db.queryOne('SELECT COUNT(*) as cnt FROM sc_checkin WHERE checkin_date = ?', [today]),
      db.queryOne('SELECT COALESCE(SUM(points_earned), 0) as total FROM sc_checkin WHERE checkin_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'),
      db.queryOne('SELECT COUNT(*) as cnt FROM sc_order WHERE status = 0'),
      db.query(
        `SELECT c.*, u.real_name as student_name, u.avatar_url
         FROM sc_checkin c JOIN sc_user u ON c.user_id = u.id
         WHERE c.checkin_date = ? ORDER BY c.checkin_time DESC LIMIT 5`,
        [today]
      ),
    ]);

    return {
      today_checkin_count: todayCheckins.cnt,
      week_points_given: weekPoints.total,
      pending_orders: pendingOrders.cnt,
      recent_checkins: recentCheckins.map(c => ({
        ...c,
        student_name: c.student_name || c.nickname,
        time: c.checkin_time ? String(c.checkin_time).slice(0, 5) : '',
      })),
    };
  }
}

module.exports = new StaffService();
