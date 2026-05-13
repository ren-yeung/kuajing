const login = require('../../utils/login.js');

// 9个分类（去掉"全部"）
var GUEST_CATEGORIES = [
  { id: 2, name: '跨境网络', icon: '🌐', bgColor: '#E6F1FB' },
  { id: 3, name: '物流服务', icon: '📦', bgColor: '#EAF3DE' },
  { id: 4, name: '报关清关', icon: '🛃', bgColor: '#FFF3E0' },
  { id: 5, name: '支付结算', icon: '💰', bgColor: '#FBEAF0' },
  { id: 6, name: '合规认证', icon: '📋', bgColor: '#EEEDFE' },
  { id: 7, name: '培训咨询', icon: '🎓', bgColor: '#FAEDDA' },
  { id: 8, name: '建站出海', icon: '🖥️', bgColor: '#E8F0FE' },
  { id: 9, name: '营销投流', icon: '📢', bgColor: '#FCE4EC' },
  { id: 10, name: '选品特供', icon: '🔍', bgColor: '#E0F7FA' }
];

Page({
  data: {
    statusBarHeight: 0,
    fixedTopHeight: 200,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    isLoggedIn: false,
    userInfo: null,
    isMerchant: false,
    currentRole: 'user',
    switchRoleText: '',
    mood: '',
    logDate: '',
    logText: '',
    unreadCount: 0,
    avatarUrl: '',
    nickname: '',
    pendingAvatar: '',
    pendingNickname: '',
    stats: {
      publish: 0,
      consult: 0,
      cooperate: 0
    },
    guestCategories: GUEST_CATEGORIES,
    guestGridHeight: 0
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
      bottomSafeHeight: bottomSafeHeight,
      tabBarOuterHeight: tabBarOuterHeight
    });
  },

  onReady() {
    this.calcFixedTopHeight();
    this.calcGuestGridHeight();
  },

  onShow() {
    // 设置自定义tabBar：我的=2（首页=0，消息=1，我的=2）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }

    // 检查登录状态
    var userInfo = login.getUserInfo();
    if (userInfo) {
      var isMerchant = userInfo.isMerchant || false;
      var currentRole = login.getCurrentRole();
      var switchRoleText = login.getSwitchRoleText();
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo,
        isMerchant: isMerchant,
        currentRole: currentRole,
        switchRoleText: switchRoleText
      });
      this.loadUserStats();
    } else {
      // 未登录时计算分类网格高度
      this.calcGuestGridHeight();
    }
    // 每次显示时重新计算高度（应对登录/退出场景）
    this.calcFixedTopHeight();
  },

  // 计算固定区域高度
  calcFixedTopHeight() {
    var self = this;
    wx.nextTick(function() {
      var query = wx.createSelectorQuery();
      query.select('.fixed-top').boundingClientRect(function(rect) {
        if (rect) {
          self.setData({ fixedTopHeight: rect.height });
        }
      }).exec();
    });
  },

  // 计算分类网格高度（用于调整滚动区域高度）
  calcGuestGridHeight() {
    var self = this;
    wx.nextTick(function() {
      var query = wx.createSelectorQuery();
      query.select('.guest-grid').boundingClientRect(function(rect) {
        if (rect) {
          self.setData({ guestGridHeight: rect.height });
        }
      }).exec();
    });
  },

  // 选择微信头像
  onChooseAvatar: function(e) {
    var avatarUrl = e.detail.avatarUrl;
    this.setData({ pendingAvatar: avatarUrl, avatarUrl: avatarUrl });
  },

  // 昵称输入
  onNicknameInput: function(e) {
    this.setData({ pendingNickname: e.detail.value });
  },

  // 昵称输入完成
  onNicknameBlur: function(e) {
    this.setData({ pendingNickname: e.detail.value });
  },

  // 点击确认登录
  onLogin: function() {
    var self = this;
    var pendingAvatar = this.data.pendingAvatar;
    var pendingNickname = this.data.pendingNickname;

    if (!pendingAvatar) {
      wx.showToast({ title: '请先选择头像', icon: 'none' });
      return;
    }
    if (!pendingNickname || pendingNickname.trim() === '') {
      wx.showToast({ title: '请先输入昵称', icon: 'none' });
      return;
    }

    this.setData({ nickname: pendingNickname.trim(), avatarUrl: pendingAvatar });

    login.doLoginWithInfo(pendingNickname.trim(), pendingAvatar)
      .then(function(userInfo) {
        var isMerchant = userInfo.isMerchant || false;
        var currentRole = login.getCurrentRole();
        var switchRoleText = login.getSwitchRoleText();
        self.setData({
          isLoggedIn: true,
          userInfo: userInfo,
          isMerchant: isMerchant,
          currentRole: currentRole,
          switchRoleText: switchRoleText,
          nickname: userInfo.nickname,
          avatarUrl: userInfo.avatar
        });
        self.loadUserStats();
        wx.showToast({ title: '登录成功', icon: 'none' });
        self.calcFixedTopHeight();
      })
      .catch(function(err) {
        wx.showToast({ title: err || '登录失败', icon: 'none' });
      });
  },

  // 未登录：点击分类导航
  onGuestCategoryTap: function(e) {
    wx.showToast({ title: '请先登录后再浏览', icon: 'none' });
  },

  // 切换角色
  onSwitchRole: function() {
    var currentRole = this.data.currentRole;
    var newRole = currentRole === 'user' ? 'merchant' : 'user';
    login.setCurrentRole(newRole);
    var switchRoleText = login.getSwitchRoleText();
    this.setData({
      currentRole: newRole,
      switchRoleText: switchRoleText
    });
    wx.showToast({
      title: newRole === 'merchant' ? '已切换为商家版本' : '已切换为用户版本',
      icon: 'none'
    });
  },

  // 退出登录
  onLogout: function() {
    var self = this;
    wx.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: function(res) {
        if (res.confirm) {
          login.logout();
          self.setData({
            isLoggedIn: false,
            userInfo: null,
            isMerchant: false,
            currentRole: 'user',
            switchRoleText: '',
            stats: { publish: 0, consult: 0, cooperate: 0 }
          });
          wx.showToast({ title: '已退出登录', icon: 'none' });
          self.calcFixedTopHeight();
        }
      }
    });
  },

  // 加载用户统计数据（模拟）
  loadUserStats: function() {
    // 后续对接后端接口
    this.setData({
      mood: '我要赚大钱！！！',
      logDate: '今天 14:30',
      logText: '发布了新需求："寻找美国海外仓合作商"',
      unreadCount: 5,
      stats: {
        publish: 12,
        consult: 8,
        cooperate: 5
      }
    });
  },

  goPage: function(e) {
    var page = e.currentTarget.dataset.page;

    // 需要登录的页面先校验
    var needLoginPages = ['myPosts', 'myLikes', 'myFavorites', 'history', 'myMessages', 'notifications', 'editProfile'];
    if (needLoginPages.indexOf(page) !== -1) {
      if (!login.checkLogin()) {
        login.requireLogin().catch(function() {});
        return;
      }
    }

    // 页面跳转映射
    var pageMap = {
      myPosts: '/pages/my-posts/my-posts',
      myLikes: '/pages/my-likes/my-likes',
      myFavorites: '/pages/my-favorites/my-favorites',
      history: '/pages/history/history',
      myMessages: '/pages/message/message',
      notifications: '/pages/notifications/notifications',
      editProfile: '/pages/edit-profile/edit-profile',
      becomeMerchant: '/pages/merchant-apply/merchant-apply'
    };

    var url = pageMap[page];
    if (url) {
      wx.navigateTo({ url: url });
    }
  }
});
