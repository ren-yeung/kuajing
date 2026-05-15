const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    fixedTopHeight: 0,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    isAdmin: false,
    messages: []
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
      tabBarOuterHeight = 50 + bottomSafeHeight;
    }

    this.setData({
      statusBarHeight: statusBarHeight,
      fixedTopHeight: 200,
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
    // 设置自定义tabBar：消息=1
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }

    // 更新管理员状态
    var userInfo = login.getUserInfo();
    this.setData({
      isAdmin: !!(userInfo && userInfo.isAdmin)
    });

    // 加载聊天记录
    this.loadChats();
  },

  // 加载聊天记录
  loadChats() {
    // 先检查登录状态
    if (!login.checkLogin()) {
      this.setData({ messages: [] });
      return;
    }

    wx.cloud.callFunction({
      name: 'getChats',
      success: res => {
        if (res.result && res.result.success) {
          this.setData({
            messages: res.result.data.chats || []
          });
        }
      },
      fail: err => {
        console.error('加载聊天记录失败', err);
      }
    });
  },

  // 切换管理员身份
  switchToAdmin() {
    var self = this;
    var userInfo = login.getUserInfo();

    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '切换身份',
      content: this.data.isAdmin ? '确定切换为普通用户身份？' : '确定切换为管理员身份？',
      success: function(res) {
        if (res.confirm) {
          var newIsAdmin = !self.data.isAdmin;
          login.setIsAdmin(newIsAdmin);

          if (newIsAdmin) {
            wx.showToast({ title: '已切换为管理员', icon: 'none' });
            wx.reLaunch({ url: '/pages/admin-home/admin-home' });
          } else {
            wx.showToast({ title: '已切换为普通用户', icon: 'none' });
            wx.reLaunch({ url: '/pages/index/index' });
          }
        }
      }
    });
  },

  // 进入聊天页面
  goChat(e) {
    var chatId = e.currentTarget.dataset.id;
    var serviceId = e.currentTarget.dataset.serviceid;
    var serviceTitle = e.currentTarget.dataset.servicetitle || '';
    wx.navigateTo({
      url: `/pages/chat/chat?chatId=${chatId}&serviceId=${serviceId}&serviceName=${encodeURIComponent(serviceTitle)}`
    });
  }
});
