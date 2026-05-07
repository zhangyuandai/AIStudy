/**
 * API 请求层
 * 所有接口调用统一通过此模块
 */
const app = getApp();

const BASE_URL = 'https://api.skate-club.com'; // 替换为实际API地址

/**
 * 统一请求封装
 */
function request(options) {
  const { url, method = 'GET', data = {}, showLoading = true, loadingText = '加载中...' } = options;

  if (showLoading) {
    wx.showLoading({ title: loadingText, mask: true });
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${app.globalData.token || ''}`,
      },
      data,
      success: (res) => {
        if (res.statusCode === 200) {
          const body = res.data;
          // 兼容多种响应格式
          if (body.code === 0 || body.success || body.data !== undefined) {
            resolve(body.data || body);
          } else {
            reject(body);
          }
        } else if (res.statusCode === 401) {
          app.handleTokenExpired();
          reject(new Error('登录已过期'));
        } else {
          reject({ message: `请求失败(${res.statusCode})`, code: res.statusCode });
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常，请检查网络', icon: 'none' });
        reject(err);
      },
      complete: () => {
        if (showLoading) {
          wx.hideLoading();
        }
      },
    });
  });
}

// ===== 认证相关 =====
const auth = {
  login(code) {
    return request({
      url: '/api/auth/login',
      method: 'POST',
      data: { code },
    });
  },

  getProfile() {
    return request({ url: '/api/user/profile' });
  },
};

// ===== 用户积分相关 =====
const points = {
  getAccount() {
    return request({ url: '/api/user/points/account' });
  },

  getHistory(params = {}) {
    return request({
      url: '/api/user/points/history',
      data: params,
    });
  },
};

// ===== 商城相关 =====
const mall = {
  getGiftList(params = {}) {
    return request({
      url: '/api/mall/gift/list',
      data: params,
      showLoading: false,
    });
  },

  getGiftDetail(giftId) {
    return request({ url: `/api/mall/gift/detail?id=${giftId}` });
  },

  createOrder(data) {
    return request({
      url: '/api/mall/order/create',
      method: 'POST',
      data,
      loadingText: '提交中...',
    });
  },

  getOrderList(params = {}) {
    return request({
      url: '/api/mall/order/list',
      data: params,
    });
  },
};

// ===== 排行榜 =====
const ranking = {
  getList() {
    return request({ url: '/api/ranking/list' });
  },
};

// ===== 任务 =====
const task = {
  getTodayTasks() {
    return request({ url: '/api/task/today' });
  },
};

// ===== 店员端 =====
const staff = {
  checkIn(data) {
    return request({
      url: '/api/staff/checkin',
      method: 'POST',
      data,
      loadingText: '签到中...',
    });
  },

  getTodayCheckIns() {
    return request({ url: '/api/staff/checkin/today' });
  },

  adjustPoints(data) {
    return request({
      url: '/api/staff/points/adjust',
      method: 'POST',
      data,
      loadingText: '处理中...',
    });
  },

  getPendingOrders() {
    return request({ url: '/api/staff/order/pending' });
  },

  shipOrder(data) {
    return request({
      url: '/api/staff/order/ship',
      method: 'POST',
      data,
      loadingText: '提交中...',
    });
  },

  getDashboardStats() {
    return request({ url: '/api/staff/dashboard/stats' });
  },

  searchStudents(keyword) {
    return request({
      url: '/api/staff/student/list',
      data: { keyword },
      showLoading: false,
    });
  },
};

// ===== 管理端（小程序中仅部分功能）=====
const admin = {
  // 礼品管理
  giftCRUD(method, data) {
    return request({
      url: '/api/admin/gift',
      method,
      data,
    });
  },

  updatePointsRule(data) {
    return request({
      url: '/api/admin/rule/points',
      method: 'PUT',
      data,
    });
  },

  getReportOverview() {
    return request({ url: '/api/admin/report/overview' });
  },

  exportReport(params) {
    return request({
      url: '/api/admin/report/export',
      data: params,
    });
  },
};

module.exports = {
  auth,
  points,
  mall,
  ranking,
  task,
  staff,
  admin,
  BASE_URL,
};
