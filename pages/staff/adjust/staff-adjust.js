const MockApi = require('../../../utils/mock');
const { showToast, showModal } = require('../../../utils/util');

Page({
  data: {
    selectedStudent: {},
    adjustType: '', // 'add' | 'sub'
    amount: 0,
    reason: '',
    canSubmit: false,
    submitting: false,
    previewPoints: '', // 调整后预估余额
    reasonLength: 0,   // 原因输入字数（WXML 不支持 .length）

    quickAmounts: [10, 20, 50, 100, 200],

    // 学员选择器
    showPicker: false,
    allStudents: [],
    filteredStudents: [],
    pickerKeyword: '',

    // 最近调账记录（模拟数据）
    recentRecords: [
      { studentName: '李小红', amount: 30, isAdd: true, reason: '活动补偿积分', time: '14:20' },
      { studentName: '王大锤', amount: 50, isAdd: false, reason: '误操作纠正-重复签到', time: '13:45' },
      { studentName: '孙小美', amount: 100, isAdd: true, reason: '系统漏记补偿', time: '11:30' },
    ],
  },

  onLoad() {
    this.loadStudents();
  },

  async loadStudents() {
    try {
      const res = await MockApi.searchStudents('');
      const list = res.data?.list || [];
      this.setData({ allStudents: list, filteredStudents: list });
    } catch (e) {
      console.error('加载学员列表失败:', e);
    }
  },

  // ===== 学员选择器 =====

  showStudentPicker() {
    this.setData({
      showPicker: true,
      pickerKeyword: '',
      filteredStudents: this.data.allStudents,
    });
  },

  hideStudentPicker() {
    this.setData({ showPicker: false });
  },

  onPickerSearch(e) {
    const keyword = e.detail.value.trim().toLowerCase();
    let filtered = this.data.allStudents;
    if (keyword) {
      filtered = this.data.allStudents.filter(
        s =>
          (s.real_name || '').includes(keyword) ||
          (s.nickname || '').toLowerCase().includes(keyword) ||
          (s.phone || '').includes(keyword)
      );
    }
    this.setData({ pickerKeyword: e.detail.value, filteredStudents: filtered });
  },

  selectStudent(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({
      selectedStudent: item,
      showPicker: false,
      adjustType: '',
      amount: 0,
      reason: '',
      canSubmit: false,
    });
    this.checkCanSubmit();
  },

  // ===== 操作类型切换 =====

  onTypeChange(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      adjustType: type,
      amount: type === this.data.adjustType ? this.data.amount : 0,
    });
    this.checkCanSubmit();
  },

  selectQuickAmount(e) {
    const { value } = e.currentTarget.dataset;
    this.setData({ amount: value }, () => this.checkCanSubmit());
  },

  onAmountInput(e) {
    const val = parseInt(e.detail.value) || 0;
    this.setData({ amount: Math.min(val, 500) }, () => this.checkCanSubmit());
  },

  onReasonInput(e) {
    this.setData({ reason: e.detail.value, reasonLength: (e.detail.value || '').length }, () => this.checkCanSubmit());
  },

  checkCanSubmit() {
    const { selectedStudent, adjustType, amount, reason } = this.data;
    const valid =
      !!selectedStudent.user_id &&
      !!adjustType &&
      amount > 0 &&
      amount <= 500 &&
      reason.trim().length >= 5;

    // 计算预估余额（WXML 不支持 Math.max 调用）
    let preview = '';
    if (selectedStudent.total_points !== undefined && adjustType && amount > 0) {
      if (adjustType === 'add') {
        preview = selectedStudent.total_points + amount;
      } else {
        preview = Math.max(0, selectedStudent.total_points - amount);
      }
    }
    this.setData({ canSubmit: valid, previewPoints: preview });
  },

  // ===== 提交调账 =====

  async submitAdjust() {
    if (!this.data.canSubmit || this.data.submitting) return;

    const confirmed = await showModal(
      '确认调账',
      `确认为【${this.data.selectedStudent.real_name}】${this.data.adjustType === 'add' ? '补录' : '扣除'} ${this.data.amount} 积分？\n原因：${this.data.reason}`
    );
    if (!confirmed) return;

    this.setData({ submitting: true });

    try {
      const res = await MockApi.adjustPoints({
        student_id: this.data.selectedStudent.user_id,
        amount: this.data.adjustType === 'add' ? this.data.amount : -this.data.amount,
        reason: this.data.reason,
      });

      if (res.code === 0 && res.data?.success) {
        showToast(res.data.message);

        // 添加到最近记录
        const record = {
          studentName: this.data.selectedStudent.real_name,
          amount: this.data.amount,
          isAdd: this.data.adjustType === 'add',
          reason: this.data.reason,
          time: new Date().toTimeString().slice(0, 5),
        };

        this.setData({
          recentRecords: [record, ...this.data.recentRecords].slice(0, 10),
          submitting: false,
          // 重置表单
          adjustType: '',
          amount: 0,
          reason: '',
          canSubmit: false,
        });
      } else {
        showToast(res.message || '调账失败');
        this.setData({ submitting: false });
      }
    } catch (e) {
      console.error('调账失败:', e);
      showToast(e.message || '操作失败，请重试');
      this.setData({ submitting: false });
    }
  },
});
