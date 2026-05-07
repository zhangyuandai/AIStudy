/**
 * 管理后台路由 - 学生/积分/商品/订单/员工/系统设置/数据报表
 */
const express = require('express');
const router = express.Router();
const { adminAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validator');
const db = require('../config/database');

const giftService = require('../services/giftService');
const orderService = require('../services/orderService');
const staffService = require('../services/staffService');
const configService = require('../services/configService');
const checkinService = require('../services/checkinService');
const pointsService = require('../services/pointsService');

const { success, paginate, notFound } = require('../utils/response');
const dayjs = require('dayjs');

// ============================================================
//  Dashboard 数据概览
// ============================================================
router.get('/report/overview', adminAuth,
  asyncHandler(async (req, res) => {
    const today = dayjs().format('YYYY-MM-DD');
    const weekAgo = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
    const monthAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    const [totalStudents, todayCheckins, totalOrders, pendingOrders] = await Promise.all([
      db.queryOne('SELECT COUNT(*) as cnt FROM sc_user WHERE status=1'),
      db.queryOne('SELECT COUNT(*) as cnt FROM sc_checkin WHERE checkin_date=?', [today]),
      db.queryOne('SELECT COUNT(*) as cnt FROM sc_order'),
      db.queryOne('SELECT COUNT(*) as cnt FROM sc_order WHERE status=0'),
    ]);

    // 近7天积分趋势
    const trend = await db.query(
      `SELECT DATE(created_at) as date,
              SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as earned,
              SUM(CASE WHEN type='expense' THEN ABS(amount) ELSE 0 END) as spent
       FROM sc_points_record
       WHERE created_at >= ?
       GROUP BY DATE(created_at) ORDER BY date`,
      [weekAgo]
    );

    // Top5兑换商品
    const topGifts = await db.query(
      `SELECT g.name, COUNT(o.id) as exchange_cnt, SUM(o.points_cost) as total_points
       FROM sc_order o JOIN sc_gift g ON o.gift_id=g.id GROUP BY g.id ORDER BY exchange_cnt DESC LIMIT 5`
    );

    // 最近签到
    const recentCheckins = await db.query(
      `SELECT c.*, u.real_name, u.nickname, u.avatar_url
       FROM sc_checkin c JOIN sc_user u ON c.user_id=u.id
       ORDER BY c.created_at DESC LIMIT 10`
    );

    success(res, {
      stats: {
        total_students: totalStudents.cnt,
        today_checkins: todayCheckins.cnt,
        total_orders: totalOrders.cnt,
        pending_orders: pendingOrders.cnt,
      },
      trend,
      topGifts,
      recentCheckins: recentCheckins.map(c => ({
        ...c,
        student_name: c.real_name || c.nickname,
        time: c.checkin_time ? String(c.checkin_time).slice(0, 5) : '',
      })),
    });
  })
);

// ============================================================
//  学生管理
// ============================================================
router.get('/students', adminAuth,
  asyncHandler(async (req, res) => {
    const { keyword, level, page = 1, pageSize = 20 } = req.query;
    let where = 'WHERE u.status=1';
    const qp = [];
    if (keyword) { where += ' AND (u.real_name LIKE ? OR u.phone LIKE ? OR u.nickname LIKE ?)'; qp.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    if (level) { where += ' AND pa.level = ?'; qp.push(level); }

    const list = await db.query(
      `SELECT u.id as user_id, u.nickname, u.avatar_url, u.phone, u.real_name, u.created_at,
              pa.available_points, pa.total_earned, pa.streak_days, pa.level, pa.last_checkin_date
       FROM sc_user u JOIN sc_points_account pa ON u.id=pa.user_id
       ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [...qp, pageSize, (page - 1) * pageSize]
    );
    const total = (await db.queryOne(`SELECT COUNT(*) as total FROM sc_user u JOIN sc_points_account pa ON u.id=pa.user_id ${where}`, qp))?.total ?? 0;

    const levelNames = {1:'青铜滑手',2:'白银骑士',3:'黄金大神',4:'钻石传奇'};
    paginate(res, list.map(s => ({...s, level_name: levelNames[s.level], phone: s.phone?`${s.phone.slice(0,3)}****${s.phone.slice(-4)}`:''})), total, page, pageSize);
  })
);

// 学生调账（管理后台）
router.post('/students/:userId/adjust-points', adminAuth,
  validate({ body: schemas.adjustPoints }),
  asyncHandler(async (req, res) => {
    const result = await pointsService.adjustByStaff(
      req.admin.id, parseInt(req.params.userId), req.body.amount, req.body.reason
    );
    success(res, result);
  })
);

// ============================================================
//  积分管理
// ============================================================
router.get('/points/records', adminAuth,
  asyncHandler(async (req, res) => {
    const { type, page = 1, pageSize = 20 } = req.query;
    let where = 'WHERE 1=1';
    const qp = [];
    if (type) { where += ' AND pr.type = ?'; qp.push(type); }

    const list = await db.query(
      `SELECT pr.*, u.nickname, u.real_name
       FROM sc_points_record pr JOIN sc_user u ON pr.user_id=u.id
       ${where} ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`,
      [...qp, pageSize, (page - 1) * pageSize]
    );
    const total = (await db.queryOne(`SELECT COUNT(*) as total FROM sc_points_record pr ${where}`, qp))?.total ?? 0;
    paginate(res, list, total, page, pageSize);
  })
);

// 调账记录
router.get('/points/adjustments', adminAuth,
  asyncHandler(async (req, res) => {
    const list = await db.query(
      `SELECT pr.*, u.nickname as student_name, s.real_name as operator_name
       FROM sc_points_record pr
       JOIN sc_user u ON pr.user_id=u.id
       LEFT JOIN sc_staff s ON pr.operator_id=s.id
       WHERE pr.source='admin_adjust'
       ORDER BY pr.created_at DESC LIMIT 50`
    );
    success(res, list);
  })
);

// ============================================================
//  商品管理 CRUD
// ============================================================
router.get('/gifts', adminAuth,
  asyncHandler(async (req, res) => {
    const { category, keyword, status, page = 1, pageSize = 20 } = req.query;
    let where = 'WHERE 1=1';
    const qp = [];
    if (category) { where += ' AND category_code=?'; qp.push(category); }
    if (keyword) { where += ' AND name LIKE ?'; qp.push(`%${keyword}%`); }
    if (status !== undefined) { where += ' AND status=?'; qp.push(status); }

    const list = await db.query(`SELECT * FROM sc_gift ${where} ORDER BY sort_order DESC, id DESC LIMIT ? OFFSET ?`, [...qp, pageSize, (page-1)*pageSize]);
    const total = (await db.queryOne(`SELECT COUNT(*) as total FROM sc_gift ${where}`, qp))?.total ?? 0;
    // 统计各状态数量
    const [statusOn, statusOff] = await Promise.all([
      db.queryOne("SELECT COUNT(*) as cnt FROM sc_gift WHERE status=1"),
      db.queryOne("SELECT COUNT(*) as cnt FROM sc_gift WHERE status=0"),
    ]);
    paginate(res, list, total, page, pageSize, { statusCount: { on: statusOn.cnt, off: statusOff.cnt } });
  })
);

router.post('/gifts', adminAuth,
  validate({ body: schemas.giftForm }),
  asyncHandler(async (req, res) => {
    const id = await giftService.create(req.body);
    success(res, { id }, '创建成功', 201);
  })
);

router.put('/gifts/:id', adminAuth,
  asyncHandler(async (req, res) => {
    await giftService.update(parseInt(req.params.id), req.body);
    success(res, null, '更新成功');
  })
);

router.patch('/gifts/:id/status', adminAuth,
  asyncHandler(async (req, res) => {
    await giftService.setStatus(parseInt(req.params.id), req.body.status);
    success(res, null, req.body.status ? '已上架' : '已下架');
  })
);

router.post('/gifts/:id/adjust-stock', adminAuth,
  asyncHandler(async (req, res) => {
    await giftService.adjustStock(parseInt(req.params.id), parseInt(req.body.delta), req.body.reason);
    success(res, null, '库存已调整');
  })
);

// ============================================================
//  订单管理
// ============================================================
router.get('/orders', adminAuth,
  asyncHandler(async (req, res) => {
    const data = await orderService.getAll(req.query);
    paginate(res, data.list, data.total, req.query.page, req.query.pageSize);
  })
);

router.post('/orders/ship', adminAuth,
  validate({ body: schemas.shipOrder }),
  asyncHandler(async (req, res) => {
    const result = await orderService.ship(req.body.order_no, req.body.express_company, req.body.tracking_number);
    success(res, result);
  })
);

router.post('/orders/:orderNo/complete', adminAuth,
  asyncHandler(async (req, res) => {
    const result = await orderService.complete(req.params.orderNo);
    success(res, result);
  })
);

// ============================================================
//  员工管理
// ============================================================
router.get('/staff', adminAuth,
  asyncHandler(async (req, res) => {
    const data = await staffService.getList(req.query);
    paginate(res, data.list, data.total, req.query.page, req.query.pageSize);
  })
);

router.post('/staff', adminAuth, requireRole('admin_admin'),  // 只有超级管理员能创建管理员账号
  validate({ body: schemas.staffForm }),
  asyncHandler(async (req, res) => {
    const id = await staffService.create({
      username: req.body.phone,   // 用手机号作为登录名
      password: '123456',         // 默认密码
      real_name: req.body.real_name,
      role: req.body.role,
      remark: req.body.remark,
    });
    success(res, { id, default_password: '123456' }, '创建成功（默认密码：123456）', 201);
  })
);

router.put('/staff/:id', adminAuth,
  asyncHandler(async (req, res) => {
    await staffService.update(parseInt(req.params.id), req.body);
    success(res, null, '更新成功');
  })
);

router.post('/staff/:id/reset-password', adminAuth,
  asyncHandler(async (req, res) => {
    await staffService.resetPassword(parseInt(req.params.id));
    success(res, null, '密码已重置为：123456');
  })
);

// ============================================================
//  系统设置
// ============================================================
router.get('/settings', adminAuth,
  asyncHandler(async (req, res) => {
    const allConfig = await configService.getAllConfig();
    success(res, allConfig);
  })
);

router.put('/settings', adminAuth,
  asyncHandler(async (req, res) => {
    // 接受格式: { points: {...}, mall: {...}, system: {...} }
    const updates = [];
    for (const [groupKey, entries] of Object.entries(req.body)) {
      if (typeof entries === 'object' && entries !== null) {
        for (const [ck, cv] of Object.entries(entries)) {
          updates.push({ group_key: groupKey, config_key: ck, config_value: String(cv) });
        }
      }
    }
    await configService.batchUpdate(updates, req.admin.id);
    success(res, null, '配置保存成功');
  })
);

// ============================================================
//  导出
// ============================================================
router.get('/export/students', adminAuth,
  asyncHandler(async (_req, _res) => {
    // TODO: 实现Excel导出
    _res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    _res.send('\uFEFF用户ID,昵称,真实姓名,手机号,等级,累计获得,当前余额,注册时间\n');
  })
);

module.exports = router;
