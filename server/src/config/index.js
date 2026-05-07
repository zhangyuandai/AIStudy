/**
 * 全局配置中心
 * 从环境变量读取，提供默认值和校验
 */
require('dotenv').config();

module.exports = {
  // 服务
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // 数据库
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'skate_club',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT, 10) || 30000,
    timeout: parseInt(process.env.DB_TIMEOUT, 10) || 60000,
    waitForConnections: true,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'skate-club-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
  },

  // 微信
  wechat: {
    appId: process.env.WX_APP_ID || '',
    appSecret: process.env.WX_APP_SECRET || '',
  },

  // 上传
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE, 10) || 5 * 1024 * 1024,
  },

  // 日志
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // 管理员默认账号
  admin: {
    username: process.env.ADMIN_DEFAULT_USERNAME || 'admin',
    password: process.env.ADMIN_DEFAULT_PASSWORD || 'admin123',
  },
};
