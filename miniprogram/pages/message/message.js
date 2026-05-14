const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    fixedTopHeight: 0,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    isAdmin: false,
    messages: [
      {
        id: 1,
        name: '张三物流',
        avatarText: '张',
        avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        time: '上午 10:30',
        preview: '您好，美国专线的价格已经发给您了...',
        unread: 3
      },
      {
        id: 2,
        name: '李四支付',
        avatarText: '李',
        avatarBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        time: '昨天',
        preview: '跨境支付结汇的费率可以再优惠...',
        unread: 1
      },
      {
        id: 3,
        name: '王五认证',
        avatarText: '王',
        avatarBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        time: '周一',
        preview: '欧盟CE认证的资料已经收到，正在...',
        unread: 0
      },
      {
        id: 4,
        name: '赵六仓储',
        avatarText: '赵',
        avatarBg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        time: '上周',
        preview: '海外仓的租金下个月会调整...',
        unread: 0
      },
      {
        id: 5,
        name: '孙七营销',
        avatarText: '孙',
        avatarBg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        time: '上周',
        preview: 'TikTok广告投放的方案已经做好了...',
        unread: 0
      },
      {
        id: 6,
        name: '周八培训',
        avatarText: '周',
        avatarBg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        time: '上周',
        preview: '跨境电商培训的下期课程安排...',
        unread: 0
      },
      {
        id: 7,
        name: '吴九法务',
        avatarText: '吴',
        avatarBg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        time: '上上周',
        preview: '您的商标注册申请已经提交...',
        unread: 2
      },
      {
        id: 8,
        name: '郑十税务',
        avatarText: '郑',
        avatarBg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
        time: '3天前',
        preview: '跨境税务筹划方案已经发送...',
        unread: 0
      },
      {
        id: 9,
        name: '褚十三设计',
        avatarText: '褚',
        avatarBg: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
        time: '6天前',
        preview: '品牌LOGO和包装设计初稿已出...',
        unread: 1
      },
      {
        id: 10,
        name: '蒋十五IT服务',
        avatarText: '蒋',
        avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        time: '一周前',
        preview: '跨境电商ERP系统对接完成...',
        unread: 0
      }
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

  goChat(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/chat/chat?id=' + id
    });
  }
});
