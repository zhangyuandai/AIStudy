Component({
  properties: {
    item: {
      type: Object,
      value: {},
      observer(newVal) {
        if (newVal && newVal.original_price) {
          this.setData({
            originalPriceText: '¥' + (newVal.original_price / 100).toFixed(2),
          });
        } else {
          this.setData({ originalPriceText: '' });
        }
      },
    },
    showCategory: {
      type: Boolean,
      value: true,
    },
  },

  data: {
    originalPriceText: '',
  },

  methods: {
    onTap() {
      this.triggerEvent('gifttap', { item: this.data.item });
    },
  },
});
