const MockApi = require('../../../utils/mock');
const { formatDate } = require('../../../utils/util');

Page({
  data: {
    currentDate: '',
    dashboard: {},
    weekPointsText: '',
    recentCheckins: [],
    pendingOrders: [],
  },

  onLoad() {
    this.setCurrentDate();
    this.initData();
  },

  onShow() {
    // 每次显示刷新数据
    this.loadDashboard();
  },

  onPullDownRefresh() {
    this.initData().then(() => wx.stopPullDownRefresh());
  },

  setCurrentDate() {
    const now = new Date();
    this.setData({
      currentDate: formatDate(now, 'YYYY年MM月DD日 dddd'),
    });
  },

  async initData() {
    await Promise.all([
      this.loadDashboard(),
      this.loadTodayCheckins(),
      this.loadPendingOrders(),
    ]);
  },

  async loadDashboard() {
    try {
      const res = await MockApi.getDashboardStats();
      const dashboard = res.data || {};
      // 预计算格式化值（WXML 不支持调用 JS 函数）
      const val = dashboard.week_points_given;
      let weekPointsText = '0';
      if (val || val === 0) {
        weekPointsText = val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(val);
      }
      this.setData({ dashboard, weekPointsText });
    } catch (e) {
      console.error('加载工作台数据失败:', e);
      this.setData({
        dashboard: { today_checkin_count: 0, week_points_given: 0, pending_orders: 0 },
      });
    }
  },

  async loadTodayCheckins() {
    try {
      const res = await MockApi.getTodayCheckIns();
      const list = (res.data?.list || []).slice(0, 5);
      // 预格式化时间
      const formatted = list.map(item => ({ ...item, timeFormatted: item.time || '' }));
      this.setData({ recentCheckins: formatted });
    } catch (e) {
      console.error('加载签到记录失败:', e);
    }
  },

  async loadPendingOrders() {
    try {
      const res = await MockApi.getPendingOrders();
      const list = (res.data?.list || []).slice(0, 5);
      // 预格式化时间
      const formatted = list.map(item => ({
        ...item,
        timeFormatted: item.created_at ? formatDate(new Date(item.created_at), 'MM-DD HH:mm') : '',
      }));
      this.setData({ pendingOrders: formatted });
    } catch (e) {
      console.error('加载待处理订单失败:', e);
    }
  },

  formatPoints(val) {
    if (!val && val !== 0) return '0';
    return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(val);
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (isToday) {
      return formatDate(d, 'HH:mm');
    }
    return formatDate(d, 'MM-DD HH:mm');
  },

  goSignin() {
    wx.navigateTo({ url: '/pages/staff/signin/staff-signin' });
  },

  goAdjust() {
    wx.navigateTo({ url: '/pages/staff/adjust/staff-adjust' });
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/staff/orders/staff-orders' });
  },
});
