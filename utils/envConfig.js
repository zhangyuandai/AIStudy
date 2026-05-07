/**
 * 环境配置 - 开发/生产环境切换
 *
 * 使用方法：
 *   开发模式: 直接使用（默认指向本地）
 *   生产部署: 将 VITE_API_BASE_URL 改为线上地址后重新编译
 */

// ===== API 基础地址 =====
// 开发环境指向本地 Node.js 服务，生产环境指向线上服务器
const ENV_CONFIG = {
  // 开发环境
  develop: {
    apiUrl: 'http://localhost:3001',
    debug: true,
  },
  // 生产环境
  production: {
    apiUrl: 'https://api.skate-club.com',
    debug: false,
  },
}

// 判断当前环境（微信开发者工具或真机调试时为 develop）
function getCurrentEnv() {
  // #ifdef MP-WEIXIN
  const accountInfo = wx.getAccountInfoSync && wx.getAccountInfoSync();
  if (accountInfo) {
    return accountInfo.miniProgram.envVersion === 'develop' ? 'develop'
      : accountInfo.miniProgram.envVersion === 'trial' ? 'develop'  // 体验版也用开发地址方便调试
      : 'release';  // 正式版用生产地址
  }
  // #endif

  // 兜底：默认开发环境
  return __wxConfig?.envVersion === 'develop' ? 'develop' :
    process.env.NODE_ENV === 'production' ? 'production' : 'develop';
}

const currentEnv = getCurrentEnv();
const config = ENV_CONFIG[currentEnv] || ENV_CONFIG.develop;

module.exports = {
  /** API 基础路径 */
  API_BASE_URL: config.apiUrl,
  /** 是否为开发环境 */
  IS_DEV: config.debug,
  /** 当前环境名 */
  ENV: currentEnv,
};
