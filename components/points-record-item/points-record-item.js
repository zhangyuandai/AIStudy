const { getSourceLabel } = require('../../utils/util');

Component({
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },

  data: {
    sourceLabel: '',
    displayAmount: '',
  },

  observers: {
    'item': function(item) {
      if (!item) return;
      const sourceLabel = getSourceLabel(item.source);
      const displayAmount = (item.amount > 0 ? '+' : '') + item.amount;
      this.setData({ sourceLabel, displayAmount });
    },
  },

  methods: {},
});
