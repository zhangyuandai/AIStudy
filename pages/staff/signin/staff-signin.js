const MockApi = require('../../../utils/mock');
const { showToast, showModal } = require('../../../utils/util');

Page({
  data: {
    keyword: '',
    studentList: [],
    checkedCount: 0,
    loading: false,
    showConfirm: false,
    selectedStudent: {},
    checkingIn: false,
  },

  onLoad() {
    this.loadStudents();
  },

  onShow() {
    // 刷新列表
    if (this.data.studentList.length > 0) {
      this.loadStudents();
    }
  },

  onPullDownRefresh() {
    this.loadStudents().then(() => wx.stopPullDownRefresh());
  },

  // 加载学员列表
  async loadStudents() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await MockApi.searchStudents(this.data.keyword);
      const list = res.data?.list || [];
      const checkedCount = list.filter(s => s.today_checked_in).length;

      this.setData({
        studentList: list,
        checkedCount,
        loading: false,
      });
    } catch (e) {
      console.error('加载学员列表失败:', e);
      this.setData({ loading: false });
    }
  },

  // 搜索
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value.trim() });
  },

  doSearch() {
    this.loadStudents();
  },

  // 扫码签到
  scanCode() {
    wx.scanCode({
      scanType: ['qrCode'],
      success: (res) => {
        // 解析扫码结果中的用户ID
        const scannedId = res.result;
        showToast(`扫码结果: ${scannedId}`);
        // 根据扫描到的ID查找学员并自动触发签到
        this.findAndCheckinByUserId(scannedId);
      },
      fail: () => {
        showToast('扫码取消', 'none');
      },
    });
  },

  findAndCheckinByUserId(userId) {
    const student = this.data.studentList.find(s => s.user_id === userId || userId.includes(s.user_id));
    if (!student) {
      showToast('未找到该学员信息');
      return;
    }

    if (student.today_checked_in) {
      showToast('该学员今日已签到');
      return;
    }

    this.setData({ selectedStudent: student, showConfirm: true });
  },

  // 点击学员卡片
  onStudentTap(e) {
    const { student } = e.currentTarget.dataset;

    if (student.today_checked_in) {
      showToast('该学员今日已签到');
      return;
    }

    this.setData({
      selectedStudent: student,
      showConfirm: true,
    });
  },

  // 取消签到弹窗
  cancelCheckin() {
    this.setData({ showConfirm: false, selectedStudent: {} });
  },

  // 确认执行签到
  async confirmCheckin() {
    const { selectedStudent } = this.data;
    if (!selectedStudent.user_id) return;

    this.setData({ checkingIn: true });

    try {
      const res = await MockApi.checkIn(selectedStudent.user_id);

      if (res.code === 0 && res.data?.success) {
        showToast(res.data.message);

        // 更新本地数据
        const studentList = [...this.data.studentList];
        const idx = studentList.findIndex(s => s.user_id === selectedStudent.user_id);
        if (idx >= 0) {
          studentList[idx].today_checked_in = true;
          studentList[idx].total_points += res.data.points_given || 10;
        }
        const checkedCount = studentList.filter(s => s.today_checked_in).length;

        this.setData({
          studentList,
          checkedCount,
          showConfirm: false,
          checkingIn: false,
          selectedStudent: {},
        });
      } else {
        showToast(res.message || '签到失败');
        this.setData({ checkingIn: false });
      }
    } catch (e) {
      console.error('签到失败:', e);
      showToast(e.message || '签到失败，请重试');
      this.setData({ checkingIn: false });
    }
  },
});
