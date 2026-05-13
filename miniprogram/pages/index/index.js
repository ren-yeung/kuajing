Page({
  data: {
    statusBarHeight: 0,
    navHeight: 0,
    fixedTopHeight: 0,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    fabBottom: 80,       // 悬浮按钮距底部距离（px）
    fabMinBottom: 20,    // 最低位置（紧贴服务卡片顶部区域下方）
    fabMaxBottom: 600,   // 最高位置（初始化后再精确计算）
    isDragging: false,
    touchStartY: 0,
    startBottom: 0,
    activeTab: 'recommend',
    categories: [
      { id: 1, name: '跨境网络', icon: '🌐', bgColor: '#E6F1FB' },
      { id: 2, name: '物流服务', icon: '📦', bgColor: '#EAF3DE' },
      { id: 3, name: '报关清关', icon: '🛃', bgColor: '#FFF3E0' },
      { id: 4, name: '支付结算', icon: '💰', bgColor: '#FBEAF0' },
      { id: 5, name: '合规认证', icon: '📋', bgColor: '#EEEDFE' },
      { id: 6, name: '培训咨询', icon: '🎓', bgColor: '#FAEDDA' },
      { id: 7, name: '建站出海', icon: '🖥️', bgColor: '#E8F0FE' },
      { id: 8, name: '营销投流', icon: '📢', bgColor: '#FCE4EC' },
      { id: 9, name: '选品特供', icon: '🔍', bgColor: '#E0F7FA' },
      { id: 10, name: '更多', icon: '•••', bgColor: '#E1F5EE' }
    ],
    services: [
      {
        id: 1,
        title: '美国专线小包物流服务',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        provider: '张三物流',
        avatarText: '张',
        avatarBg: '#E6F1FB',
        avatarColor: '#185FA5',
        rating: '4.8',
        desc: '专业美国专线，时效稳定，服务优质',
        likes: 234,
        views: '1.2k'
      },
      {
        id: 2,
        title: '跨境支付结汇一站式服务',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        provider: '李四支付',
        avatarText: '李',
        avatarBg: '#FAEEDA',
        avatarColor: '#854F0B',
        rating: '4.9',
        desc: '合规结汇，费率低，到账快',
        likes: 567,
        views: '3.4k'
      },
      {
        id: 3,
        title: '欧盟CE认证快速办理',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        provider: '王五认证',
        avatarText: '王',
        avatarBg: '#EAF3DE',
        avatarColor: '#3B6D11',
        rating: '4.7',
        desc: '专业团队，快速通过，服务透明',
        likes: 189,
        views: '856'
      },
      {
        id: 4,
        title: '海外仓储一站式服务',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        provider: '赵六仓储',
        avatarText: '赵',
        avatarBg: '#E1F5EE',
        avatarColor: '#0D6832',
        rating: '4.6',
        desc: '美国欧洲海外仓，一件代发，退货处理',
        likes: 312,
        views: '1.5k'
      },
      {
        id: 5,
        title: 'TikTok海外广告投放',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        provider: '孙七营销',
        avatarText: '孙',
        avatarBg: '#FBEAF0',
        avatarColor: '#C4185A',
        rating: '4.8',
        desc: 'TikTok、Facebook精准投放，提升ROI',
        likes: 445,
        views: '2.1k'
      },
      {
        id: 6,
        title: '跨境电商培训咨询',
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        provider: '周八培训',
        avatarText: '周',
        avatarBg: '#EEEDFE',
        avatarColor: '#4A1BB4',
        rating: '4.9',
        desc: '从零开始做跨境电商，全流程指导',
        likes: 678,
        views: '3.8k'
      }
    ]
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navContentHeight = 44;
    const windowHeight = systemInfo.windowHeight;
    const safeArea = systemInfo.safeArea;
    const windowWidth = systemInfo.windowWidth;
    const rpxToPx = windowWidth / 750;   // rpx → px 转换比
    let bottomSafeHeight = 0;
    let tabBarOuterHeight = 58;

    if (safeArea) {
      bottomSafeHeight = windowHeight - safeArea.bottom;
      tabBarOuterHeight = 50 + bottomSafeHeight;
    }

    this.setData({
      statusBarHeight: statusBarHeight,
      navHeight: statusBarHeight + navContentHeight,
      fixedTopHeight: 370,
      bottomSafeHeight: bottomSafeHeight,
      tabBarOuterHeight: tabBarOuterHeight,
      rpxToPx: rpxToPx,
      fabBottom: tabBarOuterHeight + 10 + 30 * rpxToPx   // iOS/安卓自适应：tab高度 + 10px间距 + 往上30rpx
    });
  },

  onReady() {
    const self = this;
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('.fixed-top').boundingClientRect((rect) => {
        if (rect) {
          const systemInfo = wx.getSystemInfoSync();
          const windowHeight = systemInfo.windowHeight;
          const tabBarOuterHeight = self.data.tabBarOuterHeight;
          const rpxToPx = self.data.rpxToPx;
          const buttonHeight = 50;
          const margin = 10 + 30 * rpxToPx;  // 最下方边界上调 30rpx

          const fabMinBottom = tabBarOuterHeight + margin;
          const fabMaxBottom = windowHeight - rect.height - buttonHeight - margin;

          self.setData({
            fixedTopHeight: rect.height,
            fabMinBottom: Math.max(fabMinBottom, 0),
            fabMaxBottom: Math.max(fabMaxBottom, fabMinBottom + buttonHeight),
            fabBottom: Math.min(self.data.fabBottom, Math.max(fabMaxBottom, fabMinBottom))
          });
        }
      }).exec();
    }, 300);
  },

  // ========== 悬浮按钮拖动 ==========
  onFabTouchStart(e) {
    const touch = e.touches[0];
    this.setData({
      isDragging: true,
      touchStartY: touch.clientY,
      startBottom: this.data.fabBottom
    });
  },

  onFabTouchMove(e) {
    if (!this.data.isDragging) return;
    const touch = e.touches[0];
    const deltaY = this.data.touchStartY - touch.clientY;
    let newBottom = this.data.startBottom + deltaY;
    newBottom = Math.max(this.data.fabMinBottom, Math.min(newBottom, this.data.fabMaxBottom));
    this.setData({ fabBottom: newBottom });
  },

  onFabTouchEnd(e) {
    const startY = this.data.touchStartY;
    this.setData({ isDragging: false });
    // 移动距离很小则触发点击
    if (e.changedTouches && e.changedTouches.length > 0) {
      const endY = e.changedTouches[0].clientY;
      if (Math.abs(startY - endY) < 5) {
        this.publishService();
      }
    }
  },

  // 切换标签（我的需求）
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    
    if (tab === 'my') {
      console.log('加载我的需求');
    }
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    console.log('选择分类:', categoryId);
  },

  // 查看更多
  viewMore() {
    wx.navigateTo({
      url: '/pages/service-list/service-list'
    });
  },

  // 跳转服务详情
  goServiceDetail(e) {
    const serviceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?id=${serviceId}`
    });
  },

  // 联系服务
  contactService(e) {
    const serviceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/chat/chat?serviceId=${serviceId}`
    });
  },

  // 发布服务/需求
  publishService() {
    wx.showActionSheet({
      itemList: ['发布服务', '发布需求'],
      success(res) {
        if (res.tapIndex === 0) {
          wx.navigateTo({
            url: '/pages/publish-service/publish-service'
          });
        } else {
          wx.navigateTo({
            url: '/pages/publish-need/publish-need'
          });
        }
      }
    });
  },

  // 跳转搜索页
  goSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  }
});
