Component({
  data: {
    selected: 0,
    messageCount: 0
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const currentRole = wx.getStorageSync('currentRole') || 'user';
      
      // 根据角色决定首页跳转
      let urls;
      if (currentRole === 'merchant') {
        // 商家模式：首页=需求广场
        urls = [
          '/pages/demand-square/demand-square',
          '/pages/message/message',
          '/pages/merchant-profile/merchant-profile'
        ];
      } else {
        // 用户模式：首页=服务广场
        urls = [
          '/pages/index/index',
          '/pages/message/message',
          '/pages/profile/profile'
        ];
      }
      
      wx.reLaunch({
        url: urls[index]
      });
    }
  }
});
