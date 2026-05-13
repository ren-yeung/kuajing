Component({
  data: {
    selected: 0,
    messageCount: 0
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const urls = [
        '/pages/index/index',
        '/pages/message/message',
        '/pages/profile/profile'
      ];
      
      wx.switchTab({
        url: urls[index]
      });
    }
  }
});
