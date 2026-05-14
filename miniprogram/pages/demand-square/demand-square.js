// demand-square.js
const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 0,
    fixedTopHeight: 0,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    fabBottom: 80,
    activeTab: 'all',
    selectedCategoryId: 0, // 0 表示全部
    categories: [
      { id: 0, name: '全部', icon: '📋', bgColor: '#E6F1FB' },
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
    demands: [],
    isLoading: false,
    page: 1,
    hasMore: true
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navContentHeight = 44;
    const windowHeight = systemInfo.windowHeight;
    const safeArea = systemInfo.safeArea;
    const windowWidth = systemInfo.windowWidth;
    const rpxToPx = windowWidth / 750;
    let bottomSafeHeight = 0;
    let tabBarOuterHeight = 58;

    if (safeArea) {
      bottomSafeHeight = windowHeight - safeArea.bottom;
      tabBarOuterHeight = 50 + bottomSafeHeight;
    }

    this.setData({
      statusBarHeight: statusBarHeight,
      navHeight: statusBarHeight + navContentHeight,
      fixedTopHeight: 320,
      bottomSafeHeight: bottomSafeHeight,
      tabBarOuterHeight: tabBarOuterHeight,
      rpxToPx: rpxToPx,
      fabBottom: tabBarOuterHeight + 10 + 30 * rpxToPx
    });
  },

  onReady() {
    this.calcFixedTopHeight();
    this.splitCategories();
  },

  // 将分类分成两行（每行5个）
  splitCategories: function() {
    var categories = this.data.categories;
    var categoriesRow1 = categories.slice(0, 5);
    var categoriesRow2 = categories.slice(5, 10);
    this.setData({
      categoriesRow1: categoriesRow1,
      categoriesRow2: categoriesRow2
    });
  },

  onShow() {
    // 设置自定义tabBar：商家模式下需求广场是首页=0
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      var currentRole = login.getCurrentRole();
      // 商家模式下需求广场作为首页，selected=0
      // 用户模式下，selected 根据实际 tab 位置（demand-square 在列表中是 index 1）
      var selected = currentRole === 'merchant' ? 0 : 1;
      this.getTabBar().setData({ selected: selected });
    }

    // 重新计算悬浮按钮位置
    this.calcFabBottom();

    this.calcFixedTopHeight();
    if (this.data.demands.length === 0) {
      // 直接调用云函数获取真实数据，不使用示例数据
      this.loadDemands();
    }
  },

  // 计算悬浮按钮底部距离
  calcFabBottom() {
    const systemInfo = wx.getSystemInfoSync();
    const safeArea = systemInfo.safeArea;
    let bottomSafeHeight = 0;
    let tabBarOuterHeight = 58;

    if (safeArea) {
      bottomSafeHeight = systemInfo.windowHeight - safeArea.bottom;
      tabBarOuterHeight = 50 + bottomSafeHeight;
    }

    this.setData({
      bottomSafeHeight: bottomSafeHeight,
      tabBarOuterHeight: tabBarOuterHeight,
      fabBottom: tabBarOuterHeight + 10
    });
  },

  onPullDownRefresh() {
    this.refreshDemands();
  },

  // 刷新需求列表
  refreshDemands() {
    this.setData({ page: 1, hasMore: true, demands: [] });
    this.loadDemands();
  },

  // 加载需求列表
  async loadDemands() {
    const { isLoading, hasMore, page, selectedCategoryId, demands, activeTab } = this.data;
    if (isLoading || !hasMore) return;

    this.setData({ isLoading: true });

    // 尝试调用云函数获取真实数据
    try {
      const res = await wx.cloud.callFunction({
        name: 'getDemands',
        data: {
          category: selectedCategoryId === 0 ? '' : this.getCategoryName(selectedCategoryId),
          tab: activeTab,
          page: page,
          pageSize: 10
        }
      });

      let newDemands = [];
      if (res.result && res.result.success && res.result.data && Array.isArray(res.result.data.list)) {
        newDemands = res.result.data.list;
        
        // 前端强制转换所有 cloud:// 头像为临时链接
        for (let i = 0; i < newDemands.length; i++) {
          const demand = newDemands[i];
          if (demand.avatar && demand.avatar.startsWith('cloud://')) {
            try {
              const urlRes = await wx.cloud.getTempFileURL({ fileList: [demand.avatar] });
              if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
                console.log('头像转换成功:', i, demand.avatar);
                newDemands[i].avatar = urlRes.fileList[0].tempFileURL;
              }
            } catch (e) {
              console.log('头像转换失败:', i, e);
            }
          }
        }
      }

      // 只使用从数据库获取的真实数据
      this.setData({
        demands: page === 1 ? newDemands : demands.concat(newDemands),
        hasMore: newDemands.length >= 10,
        page: page + 1
      });
    } catch (err) {
      console.error('获取需求列表失败', err);
    }
    
    wx.stopPullDownRefresh();
    this.setData({ isLoading: false });
  },

  // 根据分类ID获取分类名称
  getCategoryName(categoryId) {
    if (!categoryId) return '';
    const categoryMap = {
      1: '跨境网络',
      2: '物流服务',
      3: '报关清关',
      4: '支付结算',
      5: '合规认证',
      6: '培训咨询',
      7: '建站出海',
      8: '营销投流',
      9: '选品特供',
      10: '更多'
    };
    return categoryMap[categoryId] || '';
  },

  // 计算固定区域高度
  calcFixedTopHeight() {
    const self = this;
    wx.nextTick(() => {
      const query = wx.createSelectorQuery();
      query.select('.fixed-top').boundingClientRect((rect) => {
        if (rect) {
          self.setData({
            fixedTopHeight: rect.height
          });
        }
      }).exec();
    });
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      page: 1,
      hasMore: true,
      demands: []
    });
    this.loadDemands();
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      selectedCategoryId: categoryId,
      page: 1,
      hasMore: true,
      demands: []
    });
    this.loadDemands();
  },

  // 加载更多
  loadMore() {
    this.loadDemands();
  },

  // 跳转搜索页
  goSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 跳转需求详情
  goDemandDetail(e) {
    const demandId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/demand-detail/demand-detail?id=${demandId}`
    });
  },

  // 报名需求
  applyDemand(e) {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    const demandId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '报名确认',
      content: '确定要报名此需求吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '报名成功',
            icon: 'success',
            duration: 1500
          });
        }
      }
    });
  },

  // 发布需求/发布服务
  publishDemand() {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    const currentRole = login.getCurrentRole();
    // 商家版跳转到发布服务页面，用户版跳转到发布需求页面
    if (currentRole === 'merchant') {
      wx.navigateTo({
        url: '/pages/publish-service/publish-service'
      });
    } else {
      wx.navigateTo({
        url: '/pages/publish-need/publish-need'
      });
    }
  },

  // 头像加载失败时清除该头像
  onAvatarError(e) {
    const index = e.currentTarget.dataset.index;
    console.log('头像加载失败', index);
  },

  // 头像加载成功
  onAvatarLoad(e) {
    const index = e.currentTarget.dataset.index;
    console.log('头像加载成功', index);
  },
});
