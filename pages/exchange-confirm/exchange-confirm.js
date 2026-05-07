const MockApi = require('../../utils/mock');
const { showModal, showToast } = require('../../utils/util');

Page({
  data: {
    giftId: '',
    gift: {},
    availablePoints: 0,
    remainingPoints: 0,
    needAddress: true,
    form: {
      receiver_name: '',
      receiver_phone: '',
      receiver_address: '',
    },
    canSubmit: false,
    submitting: false,
  },

  onLoad(options) {
    const { giftId, points } = options;
    if (!giftId) {
      showToast('参数错误');
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.setData({ giftId });
    this.loadGiftDetail();
    this.loadPointsAccount();
  },

  async loadGiftDetail() {
    try {
      const res = await MockApi.getGiftDetail(this.data.giftId);
      const gift = res.data;

      // 判断是否需要收货信息
      const needAddress = !['voucher', 'course'].includes(gift.category);

      this.setData({ gift, needAddress });

      // 虚拟商品默认可提交
      if (!needAddress) this.checkFormValid();

      wx.setNavigationBarTitle({ title: '确认兑换' });
    } catch (e) {
      console.error('加载礼品详情失败:', e);
      showToast('加载失败');
    }
  },

  async loadPointsAccount() {
    try {
      const res = await MockApi.getPointsAccount();
      const account = res.data;
      const remaining = account.available_points - (this.data.gift.points_price || 0);

      this.setData({
        availablePoints: account.available_points,
        remainingPoints: Math.max(0, remaining),
        canSubmit: false,
      });

      // 如果不需要地址，直接可提交
      if (!this.data.needAddress) {
        this.setData({ canSubmit: true });
      }
    } catch (e) {
      console.error('加载积分失败:', e);
    }
  },

  // 表单输入
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const form = { ...this.data.form, [field]: value };
    this.setData({ form }, () => {
      this.checkFormValid();
    });
  },

  // 检查表单有效性
  checkFormValid() {
    if (!this.data.needAddress) {
      this.setData({ canSubmit: true });
      return;
    }

    const { receiver_name, receiver_phone, receiver_address } = this.data.form;
    const valid =
      receiver_name.trim().length > 0 &&
      /^1\d{10}$/.test(receiver_phone) &&
      receiver_address.trim().length >= 8;

    this.setData({ canSubmit: valid });
  },

  // 提交兑换
  async submitExchange() {
    if (!this.data.canSubmit || this.data.submitting) return;

    // 二次确认
    const confirmed = await showModal(
      '确认兑换',
      `确定使用 ${this.data.gift.points_price} 积分兑换「${this.data.gift.name}」？兑换后积分不可退还。`
    );
    if (!confirmed) return;

    this.setData({ submitting: true });

    try {
      const data = {
        gift_id: this.data.giftId,
        points_cost: this.data.gift.points_price,
      };

      if (this.data.needAddress) {
        data.receiver_info = {
          receiver_name: this.data.form.receiver_name,
          receiver_phone: this.data.form.receiver_phone,
          receiver_address: this.data.form.receiver_address,
        };
      }

      const res = await MockApi.createOrder(data);

      if (res.code === 0 || res.data?.success) {
        // 跳转到成功页
        wx.redirectTo({
          url: `/pages/exchange-success/exchange-success?orderId=${res.data.order_id}&giftName=${encodeURIComponent(this.data.gift.name)}&points=${this.data.gift.points_price}`,
        });
      } else {
        showToast(res.message || '兑换失败，请重试');
      }
    } catch (e) {
      console.error('兑换失败:', e);
      showToast(e.message || '网络异常，请重试');
    } finally {
      this.setData({ submitting: false });
    }
  },
});
