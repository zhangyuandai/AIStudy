/**
 * 订单服务 - 兑换下单、发货、完成
 */
const db = require('../config/database');
const giftService = require('./giftService');
const pointsService = require('./pointsService');
const dayjs = require('dayjs');

/** 生成订单号 */
function genOrderNo() {
  return `ORD${dayjs().format('YYYYMMDDHHmmss')}${String(Math.floor(Math.random() * 10000)).padStart(4,'0')}`;
}

class OrderService {
  /**
   * 创建兑换订单（核心事务：扣积分 + 冻结 + 减库存 + 创建订单）
   */
  async create(userId, data) {
    const { gift_id, receiver_name, receiver_phone, receiver_address = '', remark = '' } = data;

    return await db.transaction(async (conn) => {
      // 1. 锁定商品
      const gift = await conn.queryOne('SELECT * FROM sc_gift WHERE id = ? FOR UPDATE', [gift_id]);
      if (!gift) throw { message: '商品不存在', code: 404 };
      if (gift.status !== 1) throw { message: '该商品已下架', code: 400 };
      if (gift.stock_count === 0) throw { message: '库存不足', code: 400 };
      if (gift.stock_count > 0) {
        await conn.query('UPDATE sc_gift SET stock_count = stock_count - 1 WHERE id = ?', [gift_id]);
      }

      // 2. 检查兑换限制
      const canExchange = await giftService.checkExchangeLimit(userId, gift_id, gift.limit_per_user);
      if (!canExchange) throw { message: `该商品每人最多兑换${gift.limit_per_user}次`, code: 400 };

      // 3. 扣积分 + 冻结
      const balance = await pointsService.deductPoints(conn, userId, gift.points_price, 'exchange_gift',
        genOrderNo(), 0, `兑换: ${gift.name}`);
      // 冻结等额积分
      await conn.query(
        'UPDATE sc_points_account SET frozen_points = frozen_points + ? WHERE user_id = ?',
        [gift.points_price, userId]
      );

      // 4. 商品快照JSON（防删改）
      const snapshot = JSON.stringify({
        gift_id: gift.id, name: gift.name, cover_image_url: gift.cover_image_url,
        points_price: gift.points_price, gift_type: gift.gift_type
      });

      // 5. 创建订单
      const orderNo = genOrderNo();
      const result = await conn.query(
        `INSERT INTO sc_order (order_no, user_id, gift_id, gift_snapshot, points_cost, status,
                               receiver_name, receiver_phone, receiver_address, remark)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
        [orderNo, userId, gift_id, snapshot, gift.points_price, receiver_name, receiver_phone, receiver_address, remark]
      );

      // 6. 增加兑换计数
      await conn.query('UPDATE sc_gift SET exchange_count = exchange_count + 1 WHERE id = ?', [gift_id]);

      return {
        order_id: result.insertId,
        order_no: orderNo,
        gift_name: gift.name,
        gift_image: gift.cover_image_url,
        points_cost: gift.points_price,
        status: 0,
        status_text: '待发货',
        balance_after: balance,
      };
    });
  }

  /**
   * 我的订单列表
   */
  async getUserOrders(userId, params = {}) {
    const { status, page = 1, pageSize = 20 } = params;
    let where = 'WHERE o.user_id = ?';
    const qParams = [userId];
    if (status !== undefined && status !== '') {
      where += ' AND o.status = ?';
      qParams.push(Number(status));
    }

    const list = await db.query(
      `SELECT o.*, u.nickname as user_nickname
       FROM sc_order o LEFT JOIN sc_user u ON o.user_id = u.id
       ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...qParams, pageSize, (page - 1) * pageSize]
    );
    const totalRes = await db.queryOne(`SELECT COUNT(*) as total FROM sc_order o ${where}`, qParams);

    // 补充状态文本
    const statusMap = { 0: '待发货', 1: '已发货', 2: '已完成', 3: '已取消' };
    const processed = list.map(o => ({ ...o, status_text: statusMap[o.status] ?? '未知' }));

    return { list: processed, total: totalRes.total };
  }

  /**
   * 待处理订单列表（店员/管理端）
   */
  async getPending(params = {}) {
    const { page = 1, pageSize = 20 } = params;
    const list = await db.query(
      `SELECT o.*, u.nickname as user_nickname, u.real_name
       FROM sc_order o JOIN sc_user u ON o.user_id = u.id
       WHERE o.status = 0 ORDER BY o.created_at ASC LIMIT ? OFFSET ?`,
      [pageSize, (page - 1) * pageSize]
    );
    const totalRes = await db.queryOne('SELECT COUNT(*) as total FROM sc_order WHERE status = 0');
    return { list, total: totalRes.total };
  }

  /**
   * 全部订单（管理后台）
   */
  async getAll(params = {}) {
    const { status, page = 1, pageSize = 20 } = params;
    let where = 'WHERE 1=1';
    const qp = [];
    if (status !== undefined && status !== '') {
      where += ' AND o.status = ?'; qp.push(status);
    }

    const list = await db.query(
      `SELECT o.*, u.nickname as user_nickname, u.phone as user_phone
       FROM sc_order o LEFT JOIN sc_user u ON o.user_id = u.id
       ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...qp, pageSize, (page - 1) * pageSize]
    );
    const total = (await db.queryOne(`SELECT COUNT(*) as total FROM sc_order o ${where}`, qp))?.total ?? 0;

    return { list, total };
  }

  /**
   * 发货
   */
  async ship(orderNo, expressCompany, trackingNumber) {
    return await db.transaction(async (conn) => {
      const order = await conn.queryOne('SELECT * FROM sc_order WHERE order_no = ? FOR UPDATE', [orderNo]);
      if (!order) throw { message: '订单不存在', code: 404 };
      if (order.status !== 0) throw { message: '当前状态不可发货', code: 400 };

      await conn.query(
        'UPDATE sc_order SET express_company=?, tracking_number=?, status=1, shipped_at=NOW(), updated_at=NOW() WHERE order_no=?',
        [expressCompany, trackingNumber, orderNo]
      );
      return { success: true, message: '发货成功' };
    });
  }

  /**
   * 完成订单（释放冻结积分）
   */
  async complete(orderNo) {
    return await db.transaction(async (conn) => {
      const order = await conn.queryOne('SELECT * FROM sc_order WHERE order_no = ? FOR UPDATE', [orderNo]);
      if (!order) throw { message: '订单不存在', code: 404 };
      if (order.status !== 1) throw { message: '当前状态无法完成', code: 400 };

      // 释放冻结积分
      await conn.query(
        'UPDATE sc_points_account SET frozen_points = GREATEST(frozen_points - ?, 0), updated_at=NOW() WHERE user_id=?',
        [order.points_cost, order.user_id]
      );
      // 记录消费确认
      await conn.query(
        `INSERT INTO sc_points_record (user_id, type, amount, balance_after, source, source_detail, remark)
         VALUES (?, "expense", 0, ?, "order_complete", ?, "订单已完成")`,
        [order.user_id, 0, orderNo]
      );

      await conn.query('UPDATE sc_order SET status=2, completed_at=NOW(), updated_at=NOW() WHERE order_no=?', [orderNo]);
      return { success: true };
    });
  }
}

module.exports = new OrderService();
