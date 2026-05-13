Page({
  data: {
    statusBarHeight: 0,
    fixedTopHeight: 200,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58
  },

  onLoad() {
    var systemInfo = wx.getSystemInfoSync();
    var statusBarHeight = systemInfo.statusBarHeight;
    var windowHeight = systemInfo.windowHeight;
    var safeArea = systemInfo.safeArea;
    var bottomSafeHeight = 0;
    var tabBarOuterHeight = 58;

    if (safeArea) {
      bottomSafeHeight = windowHeight - safeArea.bottom;
      // iPhone X 及以上：tabBar 实际高度 = 50px + 安全区高度
      tabBarOuterHeight = 50 + bottomSafeHeight;
    }

    this.setData({
      statusBarHeight: statusBarHeight,
      bottomSafeHeight: bottomSafeHeight,
      tabBarOuterHeight: tabBarOuterHeight
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
