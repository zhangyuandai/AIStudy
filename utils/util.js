/**
 * 通用工具函数
 */

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} fmt - 格式，默认 'YYYY-MM-DD HH:mm:ss'
 */
function formatDate(date, fmt = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';
  const d = new Date(date);
  const map = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0'),
  };
  let result = fmt;
  for (const [key, value] of Object.entries(map)) {
    result = result.replace(key, value);
  }
  return result;
}

/**
 * 格式化相对时间（如：3分钟前）
 */
function formatRelativeTime(date) {
  if (!date) return '';
  const now = Date.now();
  const target = new Date(date).getTime();
  const diff = now - target;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)}天前`;
  return formatDate(date, 'YYYY-MM-DD');
}

/**
 * 防抖函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流函数
 */
function throttle(fn, interval = 300) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 显示加载中
 */
function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true });
}

/**
 * 隐藏加载中
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示提示
 */
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({ title, icon, duration });
}

/**
 * 显示确认框
 */
function showModal(title, content) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success: (res) => resolve(res.confirm),
      fail: () => resolve(false),
    });
  });
}

/**
 * 手机号脱敏
 */
function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 4);
}

/**
 * 获取等级信息
 */
function getLevelInfo(totalEarned) {
  const levels = [
    { level: 0, name: '滑板新人', min: 0, max: 199 },
    { level: 1, name: '青铜滑手', min: 200, max: 499 },
    { level: 2, name: '白银骑士', min: 500, max: 999 },
    { level: 3, name: '黄金大神', min: 1000, max: 1999 },
    { level: 4, name: '钻石传奇', min: 2000, max: Infinity },
  ];

  let current = levels[0];
  for (const lv of levels) {
    if (totalEarned >= lv.min && totalEarned <= lv.max) {
      current = lv;
      break;
    }
  }

  // 计算升级进度
  const nextLevel = levels.find(l => l.level === current.level + 1);
  let progress = 100;
  let pointsToNext = 0;

  if (nextLevel) {
    progress = Math.round(
      ((totalEarned - current.min) / (nextLevel.min - current.min)) * 100
    );
    pointsToNext = nextLevel.min - totalEarned;
  }

  return {
    ...current,
    progress,
    pointsToNext,
  };
}

/**
 * 获取积分变动类型的中文描述
 */
function getPointsTypeLabel(type) {
  const map = {
    income: '获得',
    expense: '消耗',
    adjust: '调整',
    expire: '过期',
  };
  return map[type] || type;
}

/**
 * 获取积分来源的中文描述
 */
function getSourceLabel(source) {
  const map = {
    checkin_lesson: '上课签到',
    monthly_bonus: '月度全勤奖励',
    register_bonus: '新人注册奖励',
    invite_reward: '邀请好友奖励',
    staff_adjust_add: '店员补录积分',
    exchange_gift: '兑换礼品',
    staff_adjust_sub: '店员扣除积分',
    admin_adjust: '管理员调整',
    points_expired: '积分过期收回',
  };
  return map[source] || source;
}

/**
 * 订单状态映射
 */
function getOrderStatusText(status) {
  const map = {
    0: '待发货',
    1: '已发货',
    2: '已完成',
    3: '已取消',
    '-1': '全部',
  };
  return map[status] || '未知';
}

module.exports = {
  formatDate,
  formatRelativeTime,
  debounce,
  throttle,
  showLoading,
  hideLoading,
  showToast,
  showModal,
  maskPhone,
  getLevelInfo,
  getPointsTypeLabel,
  getSourceLabel,
  getOrderStatusText,
};
