const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    fixedTopHeight: 200,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    isLoggedIn: false,
    userInfo: null,
    mood: '',
    logDate: '',
    logText: '',
    unreadCount: 0,
    stats: {
      publish: 0,
      consult: 0,
      cooperate: 0
    }
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const windowHeight = systemInfo.windowHeight;
    const safeArea = systemInfo.safeArea;
    let bottomSafeHeight = 0;
    let tabBarOuterHeight = 58;

    if (safeArea) {
      bottomSafeHeight = windowHeight - safeArea.bottom;
      tabBarOuterHeight = 50 + bottomSafeHeight;
    }

    this.setData({
      statusBarHeight,
      bottomSafeHeight,
      tabBarOuterHeight
    });
  },

  onReady() {
    this.calcFixedTopHeight();
  },

  onShow() {
    // 设置自定义tabBar：我的=2
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }

    // 检查登录状态
    const userInfo = login.getUserInfo();
    if (userInfo) {
      this.setData({ isLoggedIn: true, userInfo });
      this.loadUserStats();
    }
    // 每次显示时重新计算高度（应对登录/退出场景）
    this.calcFixedTopHeight();
  },

  // 计算固定区域高度
  calcFixedTopHeight() {
    const self = this;
    wx.nextTick(() => {
      const query = wx.createSelectorQuery();
      query.select('.fixed-top').boundingClientRect(rect => {
        if (rect) {
          self.setData({ fixedTopHeight: rect.height });
        }
      }).exec();
    });
  },

  // 点击登录
  onLogin() {
    login.requireLogin()
      .then(userInfo => {
        this.setData({ isLoggedIn: true, userInfo });
        this.loadUserStats();
        wx.showToast({ title: '登录成功', icon: 'none' });
        this.calcFixedTopHeight();
      })
      .catch(err => {
        console.log('登录取消或失败：', err);
      });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          login.logout();
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            stats: { publish: 0, consult: 0, cooperate: 0 }
          });
          wx.showToast({ title: '已退出登录', icon: 'none' });
          this.calcFixedTopHeight();
        }
      }
    });
  },

  // 加载用户统计数据（模拟）
  loadUserStats() {
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

  goPage(e) {
    const page = e.currentTarget.dataset.page;

    // 需要登录的页面先校验
    const needLoginPages = ['myPosts', 'myLikes', 'myFavorites', 'history', 'myMessages', 'notifications', 'editProfile', 'becomeMerchant'];
    if (needLoginPages.includes(page)) {
      if (!login.checkLogin()) {
        login.requireLogin().catch(() => {});
        return;
      }
    }

    wx.showToast({
      title: page,
      icon: 'none'
    });
  }
});
