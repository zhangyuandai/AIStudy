const MockApi = require('../../../utils/mock');
const { showToast, showModal, formatDate } = require('../../../utils/util');

Page({
  data: {
    currentStatus: 'pending',
    statusTabs: [
      { label: '待处理', value: 'pending', count: 0 },
      { label: '已发货', value: 'shipped', count: 0 },
      { label: '已完成', value: 'done', count: 0 },
    ],
    orderList: [],
    loading: false,
    hasMore: false,
    page: 1,

    // 发货弹窗
    showShipDialog: false,
    currentOrder: {},
    expressCompanies: ['顺丰速运', '中通快递', '圆通速递', '韵达快递', '申通快递', '邮政EMS'],
    selectedExpressIndex: 0,
    trackingNumber: '',
    submittingShip: false,
    canSubmitShip: true,
    shippingOrderId: '',
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, orderList: [] });
    this.loadOrders().then(() => wx.stopPullDownRefresh());
  },

  // 加载订单
  async loadOrders() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await MockApi.getPendingOrders();
      let list = res.data?.list || [];

      // 模拟不同状态的订单
      if (this.data.currentStatus === 'shipped') {
        // 已发货的模拟数据
        list = [
          {
            ...list[0],
            status: 1,
          },
        ].filter(Boolean);
      } else if (this.data.currentStatus === 'done') {
        // 已完成的模拟数据
        list = [];
      } else {
        list = list.filter(o => o.status === 0);
      }

      // 预计算每个订单的属性（WXML 不支持调用 JS 函数）
      const enriched = list.map(item => ({
        ...item,
        _isPhysical: this.isPhysicalOrder(item),
        _statusLabel: this.getStatusLabel(item.status),
        _timeFormatted: item.created_at ? formatDate(new Date(item.created_at), 'MM-DD HH:mm') : '',
      }));

      this.setData({
        orderList: this.data.page === 1 ? enriched : [...this.data.orderList, ...enriched],
        hasMore: false,
        loading: false,
      });

      // 更新tab计数
      const tabs = [...this.data.statusTabs];
      tabs[0].count = this.data.currentStatus === 'pending' ? list.length : tabs[0].count;
      this.setData({ statusTabs: tabs });
    } catch (e) {
      console.error('加载订单失败:', e);
      this.setData({ loading: false });
    }
  },

  loadMore() {
    if (!this.data.loading && this.data.hasMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadOrders();
    }
  },

  onStatusChange(e) {
    const { value } = e.currentTarget.dataset;
    if (value === this.data.currentStatus) return;
    this.setData({
      currentStatus: value,
      page: 1,
      orderList: [],
    });
    this.loadOrders();
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

  getStatusLabel(status) {
    const map = { 0: '待发货', 1: '已发货', 2: '已完成', 3: '已取消' };
    return map[status] || '未知';
  },

  isPhysicalOrder(item) {
    // 判断是否为实物订单：包含"券"/"课"/体验等关键词的视为虚拟商品
    const name = item.gift_name || '';
    const isVirtual =
      name.includes('券') ||
      name.includes('课') ||
      name.includes('体验') ||
      name.includes('折扣');
    return !isVirtual;
  },

  // ===== 发货操作 =====

  showShipDialog(e) {
    const { item } = e.currentTarget.dataset;
    this.setData({
      showShipDialog: true,
      currentOrder: item,
      selectedExpressIndex: 0,
      trackingNumber: '',
      submittingShip: false,
      canSubmitShip: false,
    });
  },

  hideShipDialog() {
    this.setData({ showShipDialog: false, trackingNumber: '' });
  },

  onExpressPickerChange(e) {
    this.setData({ selectedExpressIndex: parseInt(e.detail.value) });
  },

  onTrackingInput(e) {
    this.setData({ trackingNumber: e.detail.value.trim() }, () => {
      this.setData({
        canSubmitShip:
          this.data.selectedExpressIndex >= 0 &&
          this.data.trackingNumber.length > 5,
      });
    });
  },

  async confirmShip() {
    const {
      currentOrder,
      selectedExpressIndex,
      trackingNumber,
      canSubmitShip,
    } = this.data;

    if (!canSubmitShip || !currentOrder.order_id) return;

    const confirmed = await showModal(
      '确认发货',
      `确认为【${currentOrder.user_name}】发货「${currentOrder.gift_name}」？\n快递：${this.data.expressCompanies[selectedExpressIndex]}\n运单号：${trackingNumber}`
    );
    if (!confirmed) return;

    this.setData({ submittingShip: true, shippingOrderId: currentOrder.order_id });

    try {
      const res = await MockApi.shipOrder({
        order_id: currentOrder.order_id,
        express_company: this.data.expressCompanies[selectedExpressIndex],
        tracking_number: trackingNumber,
      });

      if (res.code === 0 && res.data?.success) {
        showToast('发货成功');

        // 从列表中移除
        const newList = this.data.orderList.filter(
          o => o.order_id !== currentOrder.order_id
        );

        this.setData({
          orderList: newList,
          showShipDialog: false,
          submittingShip: false,
          shippingOrderId: '',
        });
      } else {
        showToast(res.message || '发货失败');
        this.setData({ submittingShip: false, shippingOrderId: '' });
      }
    } catch (e) {
      console.error('发货失败:', e);
      showToast(e.message || '操作失败');
      this.setData({ submittingShip: false, shippingOrderId: '' });
    }
  },

  // 虚拟商品确认发放
  async confirmVirtualDelivery(e) {
    const { item } = e.currentTarget.dataset;
    const confirmed = await showModal(
      '确认发放',
      `确认将「${item.gift_name}」发放给【${item.user_name}】？`
    );
    if (!confirmed) return;

    this.setData({ shippingOrderId: item.order_id });

    try {
      // 模拟发放
      await new Promise(r => setTimeout(r, 600));
      showToast('发放成功！礼品已至学员账户');

      const newList = this.data.orderList.filter(
        o => o.order_id !== item.order_id
      );
      this.setData({
        orderList: newList,
        shippingOrderId: '',
      });
    } catch (e) {
      showToast('发放失败，请重试');
      this.setData({ shippingOrderId: '' });
    }
  },
});
