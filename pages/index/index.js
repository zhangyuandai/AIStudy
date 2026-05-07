const MockApi = require('../../utils/mock');
const { getLevelInfo } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    greetingText: '',
    pointsAccount: {},
    todayTasks: [],
    quickEntries: [
      { icon: '🛹', label: '签到上课', path: '/pages/checkin/checkin', bg: 'rgba(255,107,53,0.1)' },
      { icon: '🎁', label: '积分商城', path: '/pages/mall/mall', bg: 'rgba(107,203,119,0.1)' },
      { icon: '📊', label: '积分明细', path: '/pages/points-history/points-history', bg: 'rgba(255,201,60,0.1)' },
      { icon: '🏆', label: '排行榜', path: '', bg: 'rgba(108,117,253,0.1)' },
    ],
    rankingList: [],
    top3Ranking: [],
    hotGifts: [],
  },

  onLoad() {
    this.initData();
  },

  onShow() {
    // 每次显示时刷新积分数据
    this.loadPointsAccount();
  },

  onPullDownRefresh() {
    this.initData().then(() => wx.stopPullDownRefresh());
  },

  // 初始化数据
  async initData() {
    this.setGreeting();
    await Promise.all([
      this.loadUserInfo(),
      this.loadPointsAccount(),
      this.loadTodayTasks(),
      this.loadRanking(),
      this.loadHotGifts(),
    ]);
  },

  // 设置问候语
  setGreeting() {
    const hour = new Date().getHours();
    let text = '你好';
    if (hour < 6) text = '夜深了';
    else if (hour < 12) text = '早上好';
    else if (hour < 14) text = '中午好';
    else if (hour < 18) text = '下午好';
    else text = '晚上好';
    this.setData({ greetingText: text });
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const res = await MockApi.getProfile();
      this.setData({ userInfo: res.data });
      getApp().globalData.userInfo = res.data;
      wx.setStorageSync('userInfo', res.data);
    } catch (e) {
      console.error('加载用户信息失败:', e);
    }
  },

  // 加载积分账户
  async loadPointsAccount() {
    try {
      const res = await MockApi.getPointsAccount();
      const account = res.data;
      // 计算等级信息
      const levelInfo = getLevelInfo(account.total_earned);
      account.level_name = levelInfo.name;
      account.level_progress = levelInfo.progress;
      account.points_to_next_level = levelInfo.pointsToNext;
      this.setData({ pointsAccount: account });
      getApp().setPointsAccount(account);
    } catch (e) {
      console.error('加载积分账户失败:', e);
    }
  },

  // 加载今日任务
  async loadTodayTasks() {
    try {
      const res = await MockApi.getTodayTasks();
      this.setData({ todayTasks: res.data || [] });
    } catch (e) {
      console.error('加载任务失败:', e);
    }
  },

  // 加载排行榜（取前3）
  async loadRanking() {
    try {
      const res = await MockApi.getRanking();
      const list = res.data?.list || [];
      this.setData({
        rankingList: list,
        top3Ranking: list.slice(0, 3),
      });
    } catch (e) {
      console.error('加载排行榜失败:', e);
    }
  },

  // 加载热门礼品（兑换量最高的3个）
  async loadHotGifts() {
    try {
      const res = await MockApi.getGiftList({});
      const gifts = res.data?.list || [];
      // 按兑换量排序取前4
      const sorted = [...gifts].sort((a, b) => b.exchange_count - a.exchange_count).slice(0, 4);
      this.setData({ hotGifts: sorted });
    } catch (e) {
      console.error('加载热门礼品失败:', e);
    }
  },

  // ===== 导航方法 =====

  goProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' });
  },

  goPointsHistory() {
    wx.switchTab({ url: '/pages/points-history/points-history' });
  },

  goCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  goMall() {
    wx.switchTab({ url: '/pages/mall/mall' });
  },

  goRanking() {
    wx.showToast({ title: '排行榜功能开发中', icon: 'none' });
  },

  navigateTo(e) {
    const { path } = e.currentTarget.dataset;
    if (!path) {
      wx.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    if (path.includes('switchTab')) {
      wx.switchTab({ url: path });
    } else {
      wx.navigateTo({ url: path });
    }
  },

  goGiftDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/gift-detail/gift-detail?id=${id}`,
    });
  },
});
