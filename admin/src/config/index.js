/**
 * 管理后台 - 环境配置
 * 开发/生产环境自动切换
 */

// Vite 通过 import.meta.env 注入环境变量
// 开发时用 .env.development，构建时用 .env.production
const config = {
  // API 基础地址（与后端 server 对接）
  apiBase: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  // 标题
  title: '滑板公社后台管理',
};

export default config;
