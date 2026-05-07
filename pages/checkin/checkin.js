const MockApi = require('../../utils/mock');

Page({
  data: {
    userInfo: {},
    isCheckedIn: false,
    todayPoints: 10,
    showQR: false,
    qrImage: '',
    weekDays: [],
    weekCheckedCount: 0,
    streakDays: 5, // 连续签到天数（模拟数据）
    rules: [
      '到店上课后由店员扫码签到完成积分发放',
      '每次签到可获得 10 积分，每日限签1次',
      '连续4周全勤可额外获得 +20 积分月度奖励',
      '签到时间需在课程前后30分钟内',
    ],
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    // 每次显示刷新签到状态
    this.checkTodayStatus();
  },

  onPullDownRefresh() {
    this.initPage().then(() => wx.stopPullDownRefresh());
  },

  async initPage() {
    const userInfo = wx.getStorageSync('userInfo') || getApp().globalData.userInfo || {};
    this.setData({ userInfo });
    this.generateWeekDays();
    this.checkTodayStatus();
  },

  // 生成本周日期
  generateWeekDays() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=周日
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + mondayOffset + i);
      const isToday = i === (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

      // 模拟：本周前几天的签到状态
      const checkedIn = !isToday && date < now && Math.random() > 0.3;

      weekDays.push({
        name: `周${dayNames[date.getDay()]}`,
        date: date.getDate(),
        isToday,
        checkedIn,
        fullDate: `${date.getMonth() + 1}-${date.getDate()}`,
      });
    }

    const checkedCount = weekDays.filter(d => d.checkedIn).length;
    this.setData({
      weekDays,
      weekCheckedCount: checkedCount,
    });
  },

  // 检查今日签到状态
  checkTodayStatus() {
    // 实际项目中调用API检查今日是否已签到
    // 这里模拟：随机决定是否已签到
    // 生产中改为: MockApi.getTodayCheckInStatus()
    const today = this.data.weekDays.find(d => d.isToday);
    if (today) {
      today.checkedIn = Math.random() > 0.6;
      this.setData({
        weekDays: this.data.weekDays,
        isCheckedIn: today.checkedIn,
        weekCheckedCount: this.data.weekDays.filter(d => d.checkedIn).length,
      });
    }
  },

  // 显示签到二维码
  showQrcode() {
    // 实际项目调用 wxacode.getUnlimited 获取小程序码
    this.setData({ showQR: true });
  },

  hideQrcode() {
    this.setData({ showQR: false });
  },
});
