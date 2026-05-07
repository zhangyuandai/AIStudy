/**
 * 滑板公社 - 后端服务入口
 * Express + MySQL RESTful API Server
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/index');

// 路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const mallRoutes = require('./routes/mall');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/admin');

// 中间件
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 服务初始化
const staffService = require('./services/staffService');

const app = express();

// ---- 基础中间件 ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },  // 允许图片跨域
}));
app.use(cors({
  origin: config.isDev ? true : ['https://admin.skate-club.com'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 日志（开发彩色，生产简洁）
app.use(morgan(config.isDev ? 'dev' : 'combined'));

// JSON 解析 + 大小限制
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 全局速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: config.isDev ? 1000 : 200,
  message: { code: -1, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    version: '1.0.0',
  });
});

// ---- API 路由挂载 ----

// 认证（无需Token）
app.use('/api/auth', authRoutes);

// 用户端（需用户Token）
app.use('/api/user', userRoutes);

// 商城（部分公开，下单需登录）
app.use('/api/mall', mallRoutes);

// 店员端（需管理员Token）
app.use('/api/staff', staffRoutes);

// 管理后台（需管理员Token）
app.use('/api/admin', adminRoutes);

// ---- 错误处理 ----
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ---- 启动服务 ----
const PORT = config.port;

async function start() {
  try {
    // 初始化默认管理员
    await staffService.initDefaultAdmin();
  } catch (e) {
    console.warn('[Init] 默认管理员初始化跳过（可能已存在）:', e.message);
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log(`║   🛹 滑板公社 API Server v1.0.0        ║`);
    console.log(`║   Mode: ${config.nodeEnv.padEnd(28)}║`);
    console.log(`║   Port: ${String(PORT).padEnd(29)}║`);
    console.log(`║   URL:  http://localhost:${String(PORT).padEnd(19)}║`);
    console.log('╚════════════════════════════════════════╝');
    console.log('');
    if (config.isDev) {
      console.log('[API] 端点列表:');
      console.log('  POST /api/auth/login          - 小程序微信登录');
      console.log('  POST /api/auth/admin/login     - 管理后台登录');
      console.log('  GET  /api/user/profile         - 用户信息(需登录)');
      console.log('  GET  /api/user/points/account  - 积分账户');
      console.log('  GET  /api/user/points/history  - 积分流水');
      console.log('  GET  /api/user/ranking/list     - 排行榜');
      console.log('  GET  /api/mall/gift/list       - 礼品列表');
      console.log('  POST /api/mall/order/create    - 创建订单');
      console.log('  POST /api/staff/checkin        - 签到(店员)');
      console.log('  POST /api/staff/points/adjust  - 调账(店员)');
      console.log('  GET  /api/admin/report/overview- 数据概览(管理)');
      console.log('  ... 更多端点见 routes/ 目录');
      console.log('');
    }
  });
}

start();

module.exports = app;
