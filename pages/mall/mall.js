const MockApi = require('../../utils/mock');

Page({
  data: {
    keyword: '',
    currentCategory: '',
    categories: [],
    giftList: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    cartCount: 2, // 模拟购物车数量
  },

  onLoad() {
    this.loadCategories();
    this.loadGifts();
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadGifts().then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.loadMore();
    }
  },

  // 加载分类
  async loadCategories() {
    try {
      const res = await MockApi.getGiftList({});
      const categories = res.data?.categories || [];
      this.setData({ categories });
    } catch (e) {
      console.error('加载分类失败:', e);
      // 默认分类
      this.setData({
        categories: [
          { code: '', name: '全部' },
          { code: 'equipment', name: '装备配件' },
          { code: 'voucher', name: '体验券' },
          { code: 'course', name: '课程课时' },
          { code: 'limited', name: '限量周边' },
        ],
      });
    }
  },

  // 加载礼品列表
  async loadGifts() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await MockApi.getGiftList({
        category: this.data.currentCategory || undefined,
        keyword: this.data.keyword || undefined,
        page: this.data.page,
        size: this.data.pageSize,
      });

      const list = res.data?.list || [];
      const total = res.data?.total || 0;

      this.setData({
        giftList: this.data.page === 1 ? list : [...this.data.giftList, ...list],
        hasMore: (this.data.page * this.data.pageSize) < total,
        loading: false,
      });
    } catch (e) {
      console.error('加载礼品失败:', e);
      this.setData({ loading: false });
    }
  },

  // 加载更多
  async loadMore() {
    this.setData({ page: this.data.page + 1 }, () => {
      this.loadGifts();
    });
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value.trim() });
  },

  // 执行搜索
  doSearch() {
    this.setData({ page: 1, giftList: [] });
    this.loadGifts();
  },

  // 清除搜索
  clearSearch() {
    this.setData({ keyword: '', page: 1, giftList: [] });
    this.loadGifts();
  },

  // 切换分类
  onCategoryChange(e) {
    const { code } = e.currentTarget.dataset;
    if (code === this.data.currentCategory) return;
    this.setData({
      currentCategory: code,
      page: 1,
      giftList: [],
    });
    this.loadGifts();
  },

  // 点击礼品卡片
  onGiftTap(e) {
    const { item } = e.detail;
    wx.navigateTo({
      url: `/pages/gift-detail/gift-detail?id=${item.gift_id}`,
    });
  },

  // 我的订单（购物车）
  goMyOrders() {
    wx.showToast({ title: '订单功能开发中', icon: 'none' });
  },
});
