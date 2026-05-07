App({
  globalData: {
    userInfo: null,
    isLoggedIn: false,
    userRole: 'student', // 'student' | 'staff' | 'admin'
    baseUrl: 'https://api.skate-club.com', // 替换为实际API地址
    token: null,
    _pointsAccount: null, // 缓存积分账户
  },

  onLaunch() {
    // 检查登录态
    this.checkLoginStatus();
    // 检查更新
    this.checkUpdate();
  },

  // 检查登录态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.globalData.isLoggedIn = true;
      // 恢复用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.globalData.userInfo = userInfo;
      }
    }
  },

  // 微信登录
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res.code);
          } else {
            reject(new Error('wx.login 失败'));
          }
        },
        fail: (err) => reject(err),
      });
    });
  },

  // 获取用户信息（新版API）
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => resolve(res.userInfo),
        fail: (err) => reject(err),
      });
    });
  },

  // 检查小程序更新
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success(res) {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          },
        });
      });
      updateManager.onUpdateFailed(() => {});
    }
  },

  // 统一请求方法
  request(options) {
    const { url, method = 'GET', data = {}, showLoading = true } = options;

    if (showLoading) {
      wx.showLoading({ title: '加载中...', mask: true });
    }

    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.globalData.baseUrl}${url}`,
        method,
        header: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.globalData.token || ''}`,
        },
        data,
        success: (res) => {
          if (res.data.code === 0 || res.statusCode === 200) {
            resolve(res.data);
          } else if (res.data.code === 401) {
            // Token过期，重新登录
            this.handleTokenExpired();
            reject(new Error('登录已过期'));
          } else {
            reject(res.data);
          }
        },
        fail: (err) => {
          wx.showToast({ title: '网络异常', icon: 'none' });
          reject(err);
        },
        complete: () => {
          if (showLoading) {
            wx.hideLoading();
          }
        },
      });
    });
  },

  // Token过期处理
  handleTokenExpired() {
    this.globalData.token = null;
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    // 跳转登录页或重新授权
    wx.reLaunch({ url: '/pages/index/index' });
  },

  // 更新全局积分缓存
  setPointsAccount(account) {
    this.globalData._pointsAccount = account;
  },

  getPointsAccount() {
    return this.globalData._pointsAccount;
  },
});
