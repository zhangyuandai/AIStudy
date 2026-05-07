const MockApi = require('../../utils/mock');
const { formatDate, getLevelInfo } = require('../../utils/util');

Page({
  data: {
    pointsAccount: {},
    currentType: '',
    typeTabs: [
      { label: '全部', value: '' },
      { label: '获得', value: 'income' },
      { label: '消耗', value: 'expense' },
      { label: '调整', value: 'adjust' },
      { label: '过期', value: 'expire' },
    ],
    recordList: [],
    groupedRecords: [],
    loading: false,
    hasMore: true,
    page: 1,
  },

  onShow() {
    this.loadPointsAccount();
    this.loadRecords();
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    Promise.all([
      this.loadPointsAccount(),
      this.loadRecords(),
    ]).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (!this.data.loading && this.data.hasMore) {
      this.setData({ page: this.data.page + 1 });
      this.loadRecords();
    }
  },

  async loadPointsAccount() {
    try {
      const res = await MockApi.getPointsAccount();
      const account = res.data;
      const levelInfo = getLevelInfo(account.total_earned);
      account.level_name = levelInfo.name;
      this.setData({ pointsAccount: account });
    } catch (e) {
      console.error('加载积分账户失败:', e);
    }
  },

  async loadRecords() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const res = await MockApi.getPointsHistory({
        type: this.data.currentType || undefined,
        page: this.data.page,
        size: 20,
      });

      const list = res.data?.list || [];
      const total = res.data?.total || 0;

      // 格式化时间
      list.forEach(item => {
        item.created_at = formatDate(item.created_at, 'MM-DD HH:mm');
      });

      const newList =
        this.data.page === 1 ? list : [...this.data.recordList, ...list];

      this.setData({
        recordList: newList,
        groupedRecords: this.groupByDate(newList),
        hasMore: (this.data.page * 20) < total,
        loading: false,
      });
    } catch (e) {
      console.error('加载积分流水失败:', e);
      this.setData({ loading: false });
    }
  },

  // 按日期分组
  groupByDate(records) {
    const groups = {};
    records.forEach(record => {
      const dateStr = record.created_at.split(' ')[0];
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(record);
    });

    return Object.keys(groups).map(date => {
      const records = groups[date];
      let totalIncome = 0;
      let totalExpense = 0;
      records.forEach(r => {
        if (r.type === 'income') totalIncome += r.amount;
        else if (r.type === 'expense') totalExpense += Math.abs(r.amount);
      });

      let summary = '';
      if (totalIncome > 0 && totalExpense > 0) {
        summary = `+${totalIncome} / -${totalExpense}`;
      } else if (totalIncome > 0) {
        summary = `+${totalIncome}`;
      } else if (totalExpense > 0) {
        summary = `-${totalExpense}`;
      }

      return {
        dateLabel: dateStr,
        summary,
        records,
      };
    }).sort((a, b) => b.dateLabel.localeCompare(a.dateLabel));
  },

  onTypeChange(e) {
    const { value } = e.currentTarget.dataset;
    if (value === this.data.currentType) return;

    this.setData({
      currentType: value,
      page: 1,
      recordList: [],
    });
    this.loadRecords();
  },
});
