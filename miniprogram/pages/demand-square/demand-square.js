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
      const mockData = this.getMockDemands();
      console.log('设置mock数据，数量:', mockData.length);
      // 先用示例数据立即渲染
      this.setData({
        demands: mockData
      }, () => {
        console.log('setData完成，当前demands数量:', this.data.demands.length);
        // setData完成后才调用云函数
        this.loadDemands();
      });
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
  loadDemands() {
    const { isLoading, hasMore, page, selectedCategoryId, demands, activeTab } = this.data;
    if (isLoading || !hasMore) return;

    this.setData({ isLoading: true });

    // 尝试调用云函数获取真实数据
    wx.cloud.callFunction({
      name: 'getDemands',
      data: {
        category: selectedCategoryId === 0 ? '' : this.getCategoryName(selectedCategoryId),
        tab: activeTab,
        page: page,
        pageSize: 10
      },
      success: (res) => {
        let newDemands = [];
        if (res.result && res.result.success && res.result.data && Array.isArray(res.result.data.list)) {
          newDemands = res.result.data.list;
        }

        // 如果没有获取到真实数据，使用mock数据并按分类过滤
        if (newDemands.length === 0) {
          console.log('云函数返回空数据，使用mock数据');
          var mockData = this.getMockDemands();
          // 按分类过滤
          if (selectedCategoryId === 0) {
            // 全部：不过滤
            this.setData({
              demands: mockData,
              hasMore: false
            });
          } else {
            var categoryName = this.getCategoryName(selectedCategoryId);
            var filteredData = mockData.filter(function(item) {
              return item.category === categoryName;
            });
            this.setData({
              demands: filteredData,
              hasMore: false
            });
          }
        } else {
          this.setData({
            demands: page === 1 ? newDemands : demands.concat(newDemands),
            hasMore: newDemands.length >= 10,
            page: page + 1
          });
        }
        wx.stopPullDownRefresh();
      },
      fail: (err) => {
        console.error('获取需求列表失败', err);
        // 失败时使用mock数据并按分类过滤
        var mockData = this.getMockDemands();
        if (selectedCategoryId === 0) {
          this.setData({
            demands: mockData,
            hasMore: false
          });
        } else {
          var categoryName = this.getCategoryName(selectedCategoryId);
          var filteredData = mockData.filter(function(item) {
            return item.category === categoryName;
          });
          this.setData({
            demands: filteredData,
            hasMore: false
          });
        }
        wx.stopPullDownRefresh();
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 获取示例数据
  getMockDemands() {
    return [
      {
        id: 'mock1',
        title: '急需美国海外仓一件代发服务',
        description: '寻找美国加州地区的海外仓，需要提供一件代发、退货处理、FBA中转等服务，月单量500+，长期合作。',
        userName: '陈小明',
        avatarText: '陈',
        avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        avatarColor: '#fff',
        postTime: '2小时前发布',
        tags: ['海外仓', '一件代发', '美国'],
        category: '物流服务',
        budget: '¥10,000-30,000',
        deadline: '2026-06-30',
        views: 234,
        applyCount: 8,
        status: 'pending',
        statusText: '招募中',
        statusClass: 'pending'
      },
      {
        id: 'mock2',
        title: '求推荐靠谱的欧洲VAT税务代理',
        description: '公司在德国和法国都有VAT税号，需要找一家专业的税务代理公司，处理季度申报和税务合规问题。',
        userName: '李华',
        avatarText: '李',
        avatarBg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        avatarColor: '#fff',
        postTime: '5小时前发布',
        tags: ['VAT税务', '欧洲', '合规'],
        category: '合规认证',
        budget: '¥5,000-15,000',
        deadline: '2026-07-15',
        views: 156,
        applyCount: 5,
        status: 'pending',
        statusText: '招募中',
        statusClass: 'pending'
      },
      {
        id: 'mock3',
        title: 'TikTok Shop店铺运营指导',
        description: '刚入驻TikTok Shop美国站，对平台规则和运营策略不太熟悉，希望找有经验的服务商提供指导。',
        userName: '王小美',
        avatarText: '王',
        avatarBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        avatarColor: '#fff',
        postTime: '1天前发布',
        tags: ['TikTok', '运营指导', '美国'],
        category: '培训咨询',
        budget: '¥3,000-8,000',
        deadline: '2026-06-01',
        views: 389,
        applyCount: 12,
        status: 'processing',
        statusText: '处理中',
        statusClass: 'processing'
      },
      {
        id: 'mock4',
        title: '需要欧盟CE认证和RoHS检测',
        description: '新产品准备进入欧盟市场，需要办理CE认证和RoHS检测，产品是智能穿戴设备，希望快速出证。',
        userName: '张大伟',
        avatarText: '张',
        avatarBg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        avatarColor: '#fff',
        postTime: '2天前发布',
        tags: ['CE认证', 'RoHS', '欧盟'],
        category: '合规认证',
        budget: '¥8,000-20,000',
        deadline: '2026-08-01',
        views: 267,
        applyCount: 6,
        status: 'completed',
        statusText: '已截止',
        statusClass: 'completed'
      },
      {
        id: 'mock5',
        title: '跨境电商企业培训需求',
        description: '公司团队需要系统性的跨境电商培训，包括平台运营、海外营销、供应链管理等内容，希望上门培训。',
        userName: '刘洋',
        avatarText: '刘',
        avatarBg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        avatarColor: '#fff',
        postTime: '3天前发布',
        tags: ['培训', '团队提升', '上门服务'],
        category: '培训咨询',
        budget: '¥15,000-50,000',
        deadline: '2026-07-30',
        views: 445,
        applyCount: 9,
        status: 'pending',
        statusText: '招募中',
        statusClass: 'pending'
      },
      {
        id: 'mock6',
        title: '亚马逊产品Listing优化服务',
        description: '需要专业团队优化现有产品的Listing，包括标题、关键词、五点描述、A+内容等，提升转化率。',
        userName: '赵雨萱',
        avatarText: '赵',
        avatarBg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        avatarColor: '#333',
        postTime: '4小时前发布',
        tags: ['亚马逊', 'Listing优化', '运营'],
        category: '营销投流',
        budget: '¥2,000-5,000',
        deadline: '2026-05-30',
        views: 178,
        applyCount: 4,
        status: 'pending',
        statusText: '招募中',
        statusClass: 'pending'
      },
      {
        id: 'mock7',
        title: '日本亚马逊FBA头程物流',
        description: '每月发2-3批货到日本亚马逊仓库，需要靠谱的物流服务商，时效要求15天内，清关稳定。',
        userName: '周建国',
        avatarText: '周',
        avatarBg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        avatarColor: '#333',
        postTime: '6小时前发布',
        tags: ['FBA头程', '日本', '物流'],
        category: '物流服务',
        budget: '¥8,000-15,000/月',
        deadline: '长期合作',
        views: 312,
        applyCount: 7,
        status: 'pending',
        statusText: '招募中',
        statusClass: 'pending'
      },
      {
        id: 'mock8',
        title: '独立站Shopify建站与推广',
        description: '想建立自己的独立站销售自有品牌产品，需要从建站到Google Ads投放的一站式服务。',
        userName: '孙浩然',
        avatarText: '孙',
        avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        avatarColor: '#fff',
        postTime: '1天前发布',
        tags: ['Shopify', '独立站', 'Google Ads'],
        category: '建站出海',
        budget: '¥20,000-50,000',
        deadline: '2026-06-15',
        views: 523,
        applyCount: 15,
        status: 'pending',
        statusText: '招募中',
        statusClass: 'pending'
      },
      {
        id: 'mock9',
        title: '英国脱欧后VAT合规咨询',
        description: '英国脱欧后VAT政策变化较大，需要专业的税务顾问解读最新政策，帮忙规划合规方案。',
        userName: '吴晓东',
        avatarText: '吴',
        avatarBg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        avatarColor: '#333',
        postTime: '2天前发布',
        tags: ['英国VAT', '合规咨询', '税务'],
        category: '合规认证',
        budget: '¥3,000-8,000',
        deadline: '2026-06-20',
        views: 198,
        applyCount: 3,
        status: 'pending',
        statusText: '招募中',
        statusClass: 'pending'
      },
      {
        id: 'mock10',
        title: '海外红人营销推广服务',
        description: '寻找Instagram和YouTube上的垂类红人合作，推广3C数码配件产品，要求粉丝画像符合目标人群。',
        userName: '郑文博',
        avatarText: '郑',
        avatarBg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
        avatarColor: '#333',
        postTime: '3天前发布',
        tags: ['红人营销', 'Instagram', 'YouTube'],
        category: '营销投流',
        budget: '¥10,000-30,000',
        deadline: '2026-07-01',
        views: 421,
        applyCount: 11,
        status: 'pending',
        statusText: '招募中',
        statusClass: 'pending'
      }
    ];
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

  // 发布需求
  publishDemand() {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    wx.navigateTo({
      url: '/pages/publish-need/publish-need'
    });
  }
});
