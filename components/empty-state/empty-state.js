Component({
  properties: {
    text: { type: String, value: '暂无数据' },
    image: { type: String, value: '' },
    actionText: { type: String, value: '' },
  },

  methods: {
    onActionTap() {
      this.triggerEvent('action');
    },
  },
});
