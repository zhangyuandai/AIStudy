const { formatDate, showToast } = require('../../utils/util');

Page({
  data: {
    orderId: '',
    giftName: '',
    points: 0,
    orderTime: '',
    orderStatusText: '',
    isPhysical: true,
  },

  onLoad(options) {
    const { orderId, giftName, points } = options;

    this.setData({
      orderId: orderId || 'ORD' + Date.now(),
      giftName: decodeURIComponent(giftName || '未知礼品'),
      points: parseInt(points) || 0,
      orderTime: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'),
      orderStatusText: '待发货',
      // 根据礼品类型判断是否实物（简单模拟）
      isPhysical: true,
    });
  },

  copyOrderId() {
    wx.setClipboardData({
      data: this.data.orderId,
      success: () => showToast('订单号已复制'),
    });
  },

  goMall() {
    wx.switchTab({ url: '/pages/mall/mall' });
  },

  goOrders() {
    wx.showToast({ title: '订单功能开发中', icon: 'none' });
  },
});
