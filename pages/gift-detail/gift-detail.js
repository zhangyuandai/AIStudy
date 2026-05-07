const MockApi = require('../../utils/mock');

Page({
  data: {
    giftId: '',
    gift: {},
    originalPriceText: '',
    swiperImages: [],
    stockText: '',
    availablePoints: null,
    canExchange: false,
    exchangeRules: [
      '兑换后积分将立即扣除，不可退还',
      '实物礼品将在3个工作日内发货',
      '虚拟商品（体验券/课时）将自动发放至账户',
      '每人每件礼品限兑次数以页面显示为准',
      '如有问题请联系客服或到店咨询',
    ],
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ giftId: id });
    this.loadGiftDetail();
    this.loadPointsAccount();
  },

  // 加载礼品详情
  async loadGiftDetail() {
    try {
      const res = await MockApi.getGiftDetail(this.data.giftId);
      const gift = res.data;
      if (!gift) throw new Error('礼品不存在');

      wx.setNavigationBarTitle({ title: gift.name });

      // 判断是否可兑换
      this.checkCanExchange(gift);

      // 格式化原价显示（WXML 不支持 .toFixed() 调用）
      this.setData({
        gift,
        originalPriceText: gift.original_price > 0 ? '¥' + (gift.original_price / 100).toFixed(2) : '',
        swiperImages: (gift.detail_images && gift.detail_images.length > 0)
          ? gift.detail_images
          : [gift.cover_image_url],
        stockText: gift.stock_count > 0 ? `${gift.stock_count}件` : '暂无库存',
      });
    } catch (e) {
      console.error('加载礼品详情失败:', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  // 加载积分账户
  async loadPointsAccount() {
    try {
      const res = await MockApi.getPointsAccount();
      this.setData({
        availablePoints: res.data.available_points,
      });
      this.checkCanExchange(this.data.gift);
    } catch (e) {
      console.error('加载积分账户失败:', e);
    }
  },

  // 判断是否可兑换
  checkCanExchange(gift) {
    if (!gift || this.data.availablePoints === null) return;

    const canExchange =
      gift.stock_count > 0 &&
      (this.data.availablePoints || 0) >= (gift.points_price || 0);

    this.setData({ canExchange });
  },

  // 去兑换
  goExchange() {
    const { gift, canExchange, availablePoints, giftId } = this.data;

    if (!canExchange) {
      wx.showToast({ title: '积分不足，无法兑换', icon: 'none' });
      return;
    }

    if (gift.stock_count <= 0) {
      wx.showToast({ title: '库存不足', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/exchange-confirm/exchange-confirm?giftId=${giftId}&points=${gift.points_price}`,
    });
  },
});
