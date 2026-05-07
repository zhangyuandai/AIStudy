/**
 * 礼品/商城服务
 */
const db = require('../config/database');

class GiftService {
  /**
   * 礼品列表（支持分类/关键词筛选 + 分页）
   */
  async getList(params = {}) {
    const { category, keyword, page = 1, pageSize = 20 } = params;
    let where = 'WHERE status = 1';
    const qParams = [];

    if (category && category !== '') {
      where += ' AND category_code = ?';
      qParams.push(category);
    }
    if (keyword) {
      where += ' AND name LIKE ?';
      qParams.push(`%${keyword}%`);
    }

    const list = await db.query(
      `SELECT id, name, category_code, cover_image_url, points_price, original_price, stock_count,
              limit_per_user, gift_type, exchange_count, sort_order
       FROM sc_gift ${where} ORDER BY sort_order DESC, id ASC LIMIT ? OFFSET ?`,
      [...qParams, pageSize, (page - 1) * pageSize]
    );
    const countRes = await db.queryOne(`SELECT COUNT(*) as total FROM sc_gift ${where}`, qParams);

    // 分类列表
    const categories = await db.query(
      'SELECT code, name FROM sc_gift_category WHERE status = 1 ORDER BY sort_order DESC'
    );

    return { list, total: countRes.total, categories: [{ code: '', name: '全部' }, ...categories] };
  }

  /**
   * 礼品详情
   */
  async getDetail(giftId) {
    const gift = await db.queryOne('SELECT * FROM sc_gift WHERE id = ?', [giftId]);
    if (!gift) throw { message: '礼品不存在', code: 404 };
    return gift;
  }

  /**
   * 创建礼品（管理员）
   */
  async create(data) {
    const result = await db.query(
      `INSERT INTO sc_gift (category_code, name, cover_image_url, detail_images, points_price, original_price,
                            stock_count, limit_per_user, gift_type, description, exchange_notice, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.category_code, data.name, data.cover_image_url, JSON.stringify([]),
       data.points_price, data.original_price, data.stock_count, data.limit_per_user,
       data.gift_type, data.description, data.exchange_notice, data.status, data.sort_order]
    );
    return result.insertId;
  }

  /**
   * 更新礼品
   */
  async update(giftId, data) {
    const fields = [];
    const vals = [];
    for (const key of ['name','category_code','cover_image_url','points_price','original_price',
                       'stock_count','limit_per_user','gift_type','description','exchange_notice','status','sort_order']) {
      if (data[key] !== undefined) { fields.push(`${key}=?`); vals.push(data[key]); }
    }
    if (fields.length === 0) return;
    vals.push(giftId);
    await db.query(`UPDATE sc_gift SET ${fields.join(',')} WHERE id=?`, vals);
  }

  /**
   * 调整库存
   */
  async adjustStock(giftId, delta, reason) {
    await db.query(
      'UPDATE sc_gift SET stock_count = stock_count + ?, updated_at = NOW() WHERE id = ?',
      [delta, giftId]
    );
  }

  /**
   * 上架/下架
   */
  async setStatus(giftId, status) {
    await db.query('UPDATE sc_gift SET status = ? WHERE id = ?', [status, giftId]);
  }

  /**
   * 检查用户兑换限制
   */
  async checkExchangeLimit(userId, giftId, limitPerUser) {
    if (limitPerUser <= 0) return true; // 不限
    const count = await db.queryOne(
      'SELECT COUNT(*) as cnt FROM sc_order WHERE user_id = ? AND gift_id = ? AND status IN (0,1,2)',
      [userId, giftId]
    );
    return count.cnt < limitPerUser;
  }
}

module.exports = new GiftService();
