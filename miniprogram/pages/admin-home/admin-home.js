const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    // 数据看板
    stats: {
      totalUsers: 1256,
      totalMerchants: 89,
      pendingApprovals: 12,
      todayVisits: 456
    },
    // 待办事项
    todoList: [
      { id: 1, title: '待审核商家申请', count: 8, icon: '🏪', color: '#FF6B6B' },
      { id: 2, title: '待处理反馈', count: 15, icon: '💬', color: '#4ECDC4' },
      { id: 3, title: '待发布公告', count: 2, icon: '📢', color: '#FFE66D' }
    ],
    // 快捷入口
    quickActions: [
      { id: 1, title: '商家审核', icon: '✓', color: '#07C160', page: 'merchantApprove' },
      { id: 2, title: '内容管理', icon: '📝', color: '#576B95', page: 'contentManage' },
      { id: 3, title: '用户管理', icon: '👥', color: '#FA9D3B', page: 'userManage' },
      { id: 4, title: '数据统计', icon: '📊', color: '#E54D42', page: 'dataStats' }
    ]
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

  onShow() {
    // 设置自定义tabBar：首页=0
    const that = this;
    setTimeout(function() {
      if (typeof that.getTabBar === 'function' && that.getTabBar()) {
        that.getTabBar().setData({ selected: 0 });
      }
    }, 100);

    // 加载数据
    this.loadStats();
  },

  onPullDownRefresh() {
    this.loadStats();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  },

  // 加载统计数据
  loadStats() {
    // 模拟数据（后续对接云函数）
    this.setData({
      stats: {
        totalUsers: 1256,
        totalMerchants: 89,
        pendingApprovals: 12,
        todayVisits: 456
      }
    });
  },

  // 待办事项点击
  onTodoTap(e) {
    var type = e.currentTarget.dataset.type;
    var pageMap = {
      approve: '/pages/merchant-approve/merchant-approve',
      feedback: '/pages/message/message',
      notice: '/pages/admin-notice/admin-notice'
    };
    var url = pageMap[type];
    if (url) {
      wx.navigateTo({ url: url });
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  // 快捷入口点击
  onQuickAction(e) {
    var page = e.currentTarget.dataset.page;
    var pageMap = {
      merchantApprove: '/pages/merchant-review-list/merchant-review-list',
      contentManage: '/pages/content-manage/content-manage',
      userManage: '/pages/user-manage/user-manage',
      dataStats: '/pages/data-stats/data-stats'
    };
    var url = pageMap[page];
    if (url) {
      wx.navigateTo({ url: url });
    } else {
      wx.showToast({ title: '功能开发中', icon: 'none' });
    }
  },

  // 查看更多
  onViewMore(e) {
    var type = e.currentTarget.dataset.type;
    wx.showToast({ title: '功能开发中', icon: 'none' });
  }
});
