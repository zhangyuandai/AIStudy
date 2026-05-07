Component({
  properties: {
    // 可用积分
    availablePoints: {
      type: Number,
      value: 0,
    },
    // 冻结积分
    frozenPoints: {
      type: Number,
      value: 0,
    },
    // 累计获得
    totalEarned: {
      type: Number,
      value: 0,
    },
    // 累计消耗
    totalSpent: {
      type: Number,
      value: 0,
    },
    // 等级名称
    levelName: {
      type: String,
      value: '',
    },
    // 等级进度 0-100
    levelProgress: {
      type: Number,
      value: 0,
    },
    // 距下一等级所需积分
    pointsToNextLevel: {
      type: Number,
      value: 0,
    },
    // 下一等级名称
    nextLevelName: {
      type: String,
      value: '',
    },
    // 是否显示进度条
    showProgress: {
      type: Boolean,
      value: true,
    },
    // 是否显示统计信息
    showStats: {
      type: Boolean,
      value: false,
    },
  },

  data: {},

  methods: {
    onTap() {
      this.triggerEvent('taptap');
    },
  },
});
