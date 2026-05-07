const MockApi = require('../../utils/mock');
const { getLevelInfo } = require('../../utils/util');

Page({
  data: {
    userInfo: {},
    pointsAccount: {},
    isStaff: false, // 是否店员角色
    statItems: [
      { label: '累计获得', value: '0', path: '' },
      { label: '累计消耗', value: '0', path: '' },
      { label: '兑换订单', value: '0', path: '' },
    ],
    menuList: [
      { icon: '📋', label: '我的订单', badge: '', action: 'orders' },
      { icon: '🎁', label: '我的收藏', badge: '', action: 'favorites' },
      { icon: '📖', label: '积分规则', badge: '', action: 'rules' },
      { icon: '💬', label: '意见反馈', badge: '', action: 'feedback' },
      { icon: '⚙️', label: '设置', badge: '', action: 'settings' },
    ],
  },

  onShow() {
    this.loadUserData();
  },

  onPullDownRefresh() {
    this.loadUserData().then(() => wx.stopPullDownRefresh());
  },

  async loadUserData() {
    try {
      // 加载用户信息
      const userRes = await MockApi.getProfile();
      const userInfo = userRes.data;

      // 加载积分账户
      const pointsRes = await MockApi.getPointsAccount();
      const account = pointsRes.data;
      const levelInfo = getLevelInfo(account.total_earned);

      account.level_name = levelInfo.name;
      account.level_progress = levelInfo.progress;
      account.points_to_next_level = levelInfo.pointsToNext;

      // 更新统计数据
      const statItems = [...this.data.statItems];
      statItems[0].value = String(account.total_earned);
      statItems[1].value = String(account.total_spent);

      // 获取订单数（模拟）
      const orderRes = await MockApi.getOrderList();
      statItems[2].value = String(orderRes.data?.total || 0);

      // 更新菜单badge
      const menuList = this.data.menuList.map(item => {
        if (item.action === 'orders') {
          return { ...item, badge: orderRes.data?.total > 0 ? String(orderRes.data.total) : '' };
        }
        return item;
      });

      this.setData({
        userInfo,
        pointsAccount: account,
        statItems,
        menuList,
      });
    } catch (e) {
      console.error('加载用户数据失败:', e);
    }
  },

  editProfile() {
    wx.showToast({ title: '个人信息编辑开发中', icon: 'none' });
  },

  onMenuTap(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.menuList[index];

    switch (item.action) {
      case 'orders':
        wx.showToast({ title: '我的订单功能开发中', icon: 'none' });
        break;
      case 'rules':
        wx.showToast({ title: '积分规则页面开发中', icon: 'none' });
        break;
      case 'feedback':
        wx.showModal({
          title: '意见反馈',
          content: '请添加客服微信或在店内反馈',
          showCancel: false,
        });
        break;
      default:
        wx.showToast({ title: `${item.label}功能开发中`, icon: 'none' });
    }
  },

  navigateTo(e) {
    // 统计项点击 - 积分明细等
    const { path } = e.currentTarget.dataset;
    if (path) {
      wx.navigateTo({ url: path });
    } else {
      // 点击"累计获得"/"累计消耗"跳转到积分明细
      wx.switchTab({ url: '/pages/points-history/points-history' });
    }
  },

  goStaffHome() {
    wx.navigateTo({ url: '/pages/staff/home/staff-home' });
  },
});
