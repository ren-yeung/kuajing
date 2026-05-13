Page({
  data: {
    statusBarHeight: 0,
    fixedTopHeight: 200
  },

  onLoad() {
    var systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },

  onReady() {
    var self = this;
    setTimeout(function() {
      var query = wx.createSelectorQuery();
      query.select('.fixed-top').boundingClientRect(function(rect) {
        if (rect) {
          self.setData({
            fixedTopHeight: rect.height
          });
        }
      }).exec();
    }, 300);
  },

  onShow() {
    // 设置自定义tabBar：我的=2
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
  },

  goPage(e) {
    var page = e.currentTarget.dataset.page;
    // 后续根据 page 跳转到对应页面
    wx.showToast({
      title: page,
      icon: 'none'
    });
  }
});
