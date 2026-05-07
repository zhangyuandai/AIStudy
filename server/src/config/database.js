/**
 * MySQL 连接池
 * 使用 mysql2/promise 风格
 */
const mysql = require('mysql2/promise');
const config = require('./index').db;

const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  charset: config.charset,
  connectionLimit: config.connectionLimit,
  waitForConnections: config.waitForConnections,
  // 开发环境打印SQL
  ...((process.env.NODE_ENV !== 'production') && {
    debug: false,
  }),
});

// 测试连接
pool.getConnection()
  .then(conn => {
    console.log(`[DB] MySQL connected → ${config.database}@${config.host}:${config.port}`);
    conn.release();
  })
  .catch(err => {
    console.error('[DB] MySQL connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

/**
 * 执行查询的便捷方法
 */
const db = {
  async query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return Array.isArray(rows) ? rows[0] : null;
  },

  /**
   * 在事务中执行回调
   * @param {Function} callback - 接收 conn 参数的异步函数
   */
  async transaction(callback) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await callback(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  get pool() { return pool; },
};

module.exports = db;
