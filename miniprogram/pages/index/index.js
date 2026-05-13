const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 0,
    fixedTopHeight: 0,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    fabBottom: 80,
    fabMinBottom: 20,
    fabMaxBottom: 600,
    isDragging: false,
    touchStartY: 0,
    startBottom: 0,
    
    // 当前角色
    currentRole: 'user',
    
    // 服务广场相关
    activeTab: 'recommend',
    selectedCategoryId: 1,
    categories: [
      { id: 1, name: '全部', icon: '🏠', bgColor: '#E1F5EE' },
      { id: 2, name: '跨境网络', icon: '🌐', bgColor: '#E6F1FB' },
      { id: 3, name: '物流服务', icon: '📦', bgColor: '#EAF3DE' },
      { id: 4, name: '报关清关', icon: '🛃', bgColor: '#FFF3E0' },
      { id: 5, name: '支付结算', icon: '💰', bgColor: '#FBEAF0' },
      { id: 6, name: '合规认证', icon: '📋', bgColor: '#EEEDFE' },
      { id: 7, name: '培训咨询', icon: '🎓', bgColor: '#FAEDDA' },
      { id: 8, name: '建站出海', icon: '🖥️', bgColor: '#E8F0FE' },
      { id: 9, name: '营销投流', icon: '📢', bgColor: '#FCE4EC' },
      { id: 10, name: '选品特供', icon: '🔍', bgColor: '#E0F7FA' }
    ],

    // 商家需求分类（10个分类，图标+文字网格）
    demandCategories: [
      { id: 0, name: '全部', icon: '🏠', bgColor: '#E1F5EE' },
      { id: 1, name: '跨境网络', icon: '🌐', bgColor: '#E6F1FB' },
      { id: 2, name: '物流服务', icon: '📦', bgColor: '#EAF3DE' },
      { id: 3, name: '报关清关', icon: '🛃', bgColor: '#FFF3E0' },
      { id: 4, name: '支付结算', icon: '💰', bgColor: '#FBEAF0' },
      { id: 5, name: '合规认证', icon: '📋', bgColor: '#EEEDFE' },
      { id: 6, name: '培训咨询', icon: '🎓', bgColor: '#FAEDDA' },
      { id: 7, name: '建站出海', icon: '🖥️', bgColor: '#E8F0FE' },
      { id: 8, name: '营销投流', icon: '📢', bgColor: '#FCE4EC' },
      { id: 9, name: '选品特供', icon: '🔍', bgColor: '#E0F7FA' }
    ],
    services: [],
    isLoading: false,
    page: 1,
    hasMore: true,
    
    // 需求广场相关
    demandActiveTab: 'all',
    selectedDemandCategoryId: 0, // 默认选中"全部"分类
    demands: [],
    demandPage: 1,
    demandHasMore: true,
    
    // 商家版本服务广场相关
    merchantActiveTab: 'recommend', // recommend-推荐需求, my-我的服务
    merchantServices: [],
    merchantPage: 1,
    merchantHasMore: true
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

    // 获取当前角色
    const currentRole = login.getCurrentRole();

    this.setData({
      statusBarHeight: statusBarHeight,
      navHeight: statusBarHeight + navContentHeight,
      fixedTopHeight: 0,
      bottomSafeHeight: bottomSafeHeight,
      tabBarOuterHeight: tabBarOuterHeight,
      rpxToPx: rpxToPx,
      fabBottom: tabBarOuterHeight + 10 + 30 * rpxToPx,
      currentRole: currentRole
    });
  },

  onReady() {
    this.calcFixedTopHeight();
  },

  onShow() {
    // 更新tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }

    // 获取当前角色
    const currentRole = login.getCurrentRole();
    const prevRole = this.data.currentRole;
    
    this.setData({ currentRole: currentRole });

    // 只在首次加载或角色切换时计算固定区域高度
    if (!this.data._fixedTopHeightCached || prevRole !== currentRole) {
      this.calcFixedTopHeight();
      this.data._fixedTopHeightCached = true;
    }

    // 根据角色加载对应内容
    if (currentRole === 'merchant') {
      // 商家版本：显示需求广场
      if (this.data.demands.length === 0 || prevRole !== currentRole) {
        this.refreshDemands();
      }
    } else {
      // 用户版本：显示服务广场
      if (this.data.services.length === 0 || prevRole !== currentRole) {
        this.refreshServices();
      }
    }
  },

  onPullDownRefresh() {
    if (this.data.currentRole === 'merchant') {
      this.refreshDemands();
    } else {
      this.refreshServices();
    }
  },

  // 滚动到底部加载更多
  onReachBottom() {
    if (this.data.currentRole === 'merchant') {
      this.loadMoreDemands();
    } else {
      this.loadServices();
    }
  },

  // ========== 需求广场相关方法 ==========

  // 刷新需求列表
  refreshDemands() {
    this.setData({ demandPage: 1, demandHasMore: true, demands: [] });
    this.loadDemands();
  },

  // 加载需求列表
  loadDemands() {
    const { isLoading, demandHasMore, demandPage, selectedDemandCategoryId, demands, demandActiveTab } = this.data;
    if (isLoading || !demandHasMore) return;

    this.setData({ isLoading: true });

    wx.cloud.callFunction({
      name: 'getDemands',
      data: {
        category: selectedDemandCategoryId === 0 ? '' : this.getCategoryName(selectedDemandCategoryId),
        tab: demandActiveTab,
        page: demandPage,
        pageSize: 10
      },
      success: (res) => {
        let newDemands = [];
        if (res.result && res.result.success && res.result.data && Array.isArray(res.result.data.list)) {
          newDemands = res.result.data.list;
        }

        // 如果云函数返回空数据，使用mock数据并按分类筛选
        if (newDemands.length === 0) {
          console.log('云函数返回空需求，使用示例数据');
          newDemands = this.getMockDemands();
          // 本地按分类筛选
          if (selectedDemandCategoryId !== 0) {
            newDemands = newDemands.filter(d => d.categoryId === selectedDemandCategoryId);
          }
        }

        this.setData({
          demands: demandPage === 1 ? newDemands : demands.concat(newDemands),
          demandHasMore: newDemands.length >= 10,
          demandPage: demandPage + 1
        });
        wx.stopPullDownRefresh();
      },
      fail: (err) => {
        console.error('获取需求列表失败', err);
        // 失败时使用mock数据
        if (this.data.demands.length === 0) {
          this.setData({ demands: this.getMockDemands() });
        }
        wx.stopPullDownRefresh();
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 加载更多需求
  loadMoreDemands() {
    this.loadDemands();
  },

  // 获取需求示例数据
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
        categoryId: 2,  // 物流服务
        categoryName: '物流服务',
        budget: '¥10,000-30,000',
        deadline: '2026-06-30',
        views: 234,
        applyCount: 8,
        status: 'pending'
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
        tags: ['VAT申报', '欧洲', '合规'],
        categoryId: 5,  // 合规认证
        categoryName: '合规认证',
        budget: '¥5,000-15,000',
        deadline: '2026-07-15',
        views: 156,
        applyCount: 5,
        status: 'pending'
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
        categoryId: 8,  // 营销投流
        categoryName: '营销投流',
        budget: '¥3,000-8,000',
        deadline: '2026-06-01',
        views: 389,
        applyCount: 12,
        status: 'processing'
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
        categoryId: 5,  // 合规认证
        categoryName: '合规认证',
        budget: '¥8,000-20,000',
        deadline: '2026-08-01',
        views: 267,
        applyCount: 6,
        status: 'completed'
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
        tags: ['企业培训', '上门服务', '团队提升'],
        categoryId: 6,  // 培训咨询
        categoryName: '培训咨询',
        budget: '¥15,000-50,000',
        deadline: '2026-07-30',
        views: 445,
        applyCount: 9,
        status: 'pending'
      },
      {
        id: 'mock6',
        title: '亚马逊店铺代运营合作',
        description: '寻找专业亚马逊代运营团队，负责店铺日常运营、Listing优化、广告投放等工作。',
        userName: '周伟',
        avatarText: '周',
        avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        avatarColor: '#fff',
        postTime: '4小时前发布',
        tags: ['亚马逊', '代运营', '跨境电商'],
        categoryId: 8,  // 营销投流
        categoryName: '营销投流',
        budget: '¥8,000-20,000/月',
        deadline: '2026-06-15',
        views: 312,
        applyCount: 7,
        status: 'pending'
      },
      {
        id: 'mock7',
        title: '独立站建站+SEO优化方案',
        description: '需要搭建一个面向欧美市场的独立站，要求支持多语言、多货币支付，并做好SEO优化。',
        userName: '吴芳',
        avatarText: '吴',
        avatarBg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        avatarColor: '#fff',
        postTime: '1天前发布',
        tags: ['独立站', '建站', 'SEO优化'],
        categoryId: 7,  // 建站出海
        categoryName: '建站出海',
        budget: '¥20,000-50,000',
        deadline: '2026-08-30',
        views: 456,
        applyCount: 11,
        status: 'pending'
      },
      {
        id: 'mock8',
        title: '美国专线物流渠道对接',
        description: '寻求稳定的美国专线物流渠道，需要FBA头程、海运拼箱、空运小包等多种服务。',
        userName: '郑强',
        avatarText: '郑',
        avatarBg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        avatarColor: '#fff',
        postTime: '6小时前发布',
        tags: ['美国专线', 'FBA头程', '海运'],
        categoryId: 2,  // 物流服务
        categoryName: '物流服务',
        budget: '面议',
        deadline: '2026-07-01',
        views: 189,
        applyCount: 4,
        status: 'pending'
      }
    ];
  },

  // 切换需求Tab
  switchDemandTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      demandActiveTab: tab,
      demandPage: 1,
      demandHasMore: true,
      demands: []
    });
    this.loadDemands();
  },

  // 选择需求分类
  selectDemandCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      selectedDemandCategoryId: categoryId,
      demandPage: 1,
      demandHasMore: true,
      demands: []
    });

    // 直接从本地筛选mock数据
    const allDemands = this.getMockDemands();
    if (categoryId === 0) {
      // 全部：显示所有
      this.setData({ demands: allDemands });
    } else {
      // 按分类筛选
      const filteredDemands = allDemands.filter(d => d.categoryId === categoryId);
      this.setData({ demands: filteredDemands });
    }
  },

  // 跳转需求详情
  goDemandDetail(e) {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
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
    wx.showModal({
      title: '报名确认',
      content: '确定要报名此需求吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '报名成功', icon: 'success', duration: 1500 });
        }
      }
    });
  },

  // ========== 服务广场相关方法 ==========
  refreshServices() {
    this.setData({ page: 1, hasMore: true, services: [] });
    this.loadServices();
  },

  // 加载服务列表
  loadServices() {
    const { isLoading, hasMore, page, selectedCategoryId, services } = this.data;
    if (isLoading || !hasMore) return;

    this.setData({ isLoading: true });

    // 调用云函数获取服务列表
    wx.cloud.callFunction({
      name: 'getServices',
      data: {
        category: this.getCategoryName(selectedCategoryId),
        page: page,
        pageSize: 10
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const newServices = res.result.data.list || [];
          const totalServices = page === 1 ? newServices : services.concat(newServices);

          // 智能混合真实数据与示例数据
          let finalServices = totalServices;
          if (page === 1) {
            if (totalServices.length === 0) {
              // 没有任何真实数据，显示5个示例
              finalServices = this.getMockServices();
            } else if (totalServices.length <= 5) {
              // 真实数据 ≤ 5条，补充示例凑满5条
              finalServices = this.fillMockServices(totalServices);
            }
            // 真实数据 > 5条，只显示真实数据
          }

          this.setData({
            services: finalServices,
            hasMore: newServices.length >= 10,
            page: page + 1
          });
        } else {
          // 如果云函数返回空或失败，使用示例数据
          this.setData({
            services: this.getMockServices()
          });
        }
        wx.stopPullDownRefresh();
      },
      fail: (err) => {
        console.error('获取服务列表失败', err);
        // 使用示例数据作为降级方案
        this.setData({
          services: this.getMockServices()
        });
        wx.stopPullDownRefresh();
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 获取示例数据（降级方案）
  getMockServices() {
    return [
      {
        id: 'mock1',
        title: '美国专线小包物流服务',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        provider: '张三物流',
        avatarText: '张',
        avatarBg: '#E6F1FB',
        avatarColor: '#185FA5',
        rating: '4.8',
        desc: '专业美国专线，时效稳定，服务优质',
        likes: 234,
        views: '1.2k',
        categoryId: 2,
        categoryName: '物流服务',
        isMock: true
      },
      {
        id: 'mock2',
        title: '跨境支付结汇一站式服务',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        provider: '李四支付',
        avatarText: '李',
        avatarBg: '#FAEEDA',
        avatarColor: '#854F0B',
        rating: '4.9',
        desc: '合规结汇，费率低，到账快',
        likes: 567,
        views: '3.4k',
        categoryId: 4,
        categoryName: '支付结算',
        isMock: true
      },
      {
        id: 'mock3',
        title: '欧盟CE认证快速办理',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        provider: '王五认证',
        avatarText: '王',
        avatarBg: '#EAF3DE',
        avatarColor: '#3B6D11',
        rating: '4.7',
        desc: '专业团队，快速通过，服务透明',
        likes: 189,
        views: '856',
        categoryId: 5,
        categoryName: '合规认证',
        isMock: true
      },
      {
        id: 'mock4',
        title: '亚马逊店铺代运营服务',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        provider: '赵六运营',
        avatarText: '赵',
        avatarBg: '#FCE4EC',
        avatarColor: '#AD1457',
        rating: '4.6',
        desc: '专业运营团队，提升销量，省心省力',
        likes: 312,
        views: '2.1k',
        categoryId: 8,
        categoryName: '营销投流',
        isMock: true
      },
      {
        id: 'mock5',
        title: '独立站搭建一站式服务',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        provider: '钱七建站',
        avatarText: '钱',
        avatarBg: '#E0F7FA',
        avatarColor: '#006064',
        rating: '4.9',
        desc: '精品模板，快速上线，SEO优化',
        likes: 456,
        views: '2.8k',
        categoryId: 7,
        categoryName: '建站出海',
        isMock: true
      },
      {
        id: 'mock6',
        title: '亚马逊店铺代运营服务',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        provider: '赵六运营',
        avatarText: '赵',
        avatarBg: '#FCE4EC',
        avatarColor: '#AD1457',
        rating: '4.6',
        desc: '专业运营团队，提升销量，省心省力',
        likes: 312,
        views: '2.1k',
        categoryId: 8,
        categoryName: '营销投流',
        isMock: true
      },
      {
        id: 'mock7',
        title: '亚马逊店铺代运营服务',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        provider: '赵六运营',
        avatarText: '赵',
        avatarBg: '#FCE4EC',
        avatarColor: '#AD1457',
        rating: '4.6',
        desc: '专业运营团队，提升销量，省心省力',
        likes: 312,
        views: '2.1k',
        categoryId: 8,
        categoryName: '营销投流',
        isMock: true
      }
    ];
  },

  // 补充示例数据到5条
  fillMockServices(realServices) {
    const mockServices = this.getMockServices();
    const fillCount = 5 - realServices.length;
    if (fillCount <= 0) return realServices;

    // 从示例数据中取需要的数量补充
    const fillServices = mockServices.slice(0, fillCount);
    return [...realServices, ...fillServices];
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
          const systemInfo = wx.getSystemInfoSync();
          const windowHeight = systemInfo.windowHeight;
          const tabBarOuterHeight = self.data.tabBarOuterHeight;
          const rpxToPx = self.data.rpxToPx;
          const buttonHeight = 50;
          const margin = 10 + 30 * rpxToPx;

          const fabMinBottom = tabBarOuterHeight + margin;
          // fabMaxBottom = 屏幕高度 - 固定区域高度 - 按钮高度 - 边距（限制在服务卡片区域内）
          const fabMaxBottom = windowHeight - rect.height - buttonHeight - margin;

          self.setData({
            fixedTopHeight: rect.height,
            fabMinBottom: Math.max(fabMinBottom, 0),
            fabMaxBottom: Math.max(fabMaxBottom, fabMinBottom + buttonHeight),
            fabBottom: Math.min(self.data.fabBottom, Math.max(fabMaxBottom, fabMinBottom))
          });
        }
      }).exec();
    });
  },

  // 悬浮按钮拖动
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
    if (e.changedTouches && e.changedTouches.length > 0) {
      const endY = e.changedTouches[0].clientY;
      if (Math.abs(startY - endY) < 5) {
        this.publishService();
      }
    }
  },

  // 切换标签（用户版和商家版共用）
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    
    if (this.data.currentRole === 'merchant') {
      // 商家版本：切换推荐需求/我的服务
      this.setData({ merchantActiveTab: tab });
      if (tab === 'my') {
        console.log('加载我的服务');
        this.loadMerchantServices();
      }
    } else {
      // 用户版本：切换推荐服务/我的需求
      this.setData({ activeTab: tab });
      if (tab === 'my') {
        console.log('加载我的需求');
      }
    }
  },
  
  // 加载商家自己的服务列表
  loadMerchantServices() {
    const { isLoading, merchantHasMore, merchantPage, merchantServices } = this.data;
    if (isLoading || !merchantHasMore) return;

    this.setData({ isLoading: true });

    wx.cloud.callFunction({
      name: 'getServices',
      data: {
        page: merchantPage,
        pageSize: 10,
        isMyService: true // 标识获取商家自己的服务
      },
      success: (res) => {
        if (res.result && res.result.success) {
          const newServices = res.result.data.list || [];
          this.setData({
            merchantServices: merchantPage === 1 ? newServices : merchantServices.concat(newServices),
            merchantHasMore: newServices.length >= 10,
            merchantPage: merchantPage + 1
          });
        } else {
          // 使用空数据或提示
          this.setData({ merchantServices: [] });
        }
      },
      fail: (err) => {
        console.error('获取商家服务失败', err);
        this.setData({ merchantServices: [] });
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      selectedCategoryId: categoryId,
      page: 1,
      hasMore: true,
      services: []
    });

    // 直接从本地筛选mock数据
    const allServices = this.getMockServices();
    if (categoryId === 1) {
      // 全部：显示所有
      this.setData({ services: allServices });
    } else {
      // 按分类筛选（需要将id减1来匹配服务数据的categoryId）
      const filteredServices = allServices.filter(s => s.categoryId === categoryId - 1);
      this.setData({ services: filteredServices });
    }
  },

  // 查看更多
  viewMore() {
    wx.navigateTo({
      url: '/pages/service-list/service-list'
    });
  },

  // 跳转服务详情
  goServiceDetail(e) {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    const serviceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?id=${serviceId}`
    });
  },

  // 联系服务
  contactService(e) {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    const serviceId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/chat/chat?serviceId=${serviceId}`
    });
  },

  // 发布服务/需求
  publishService() {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    
    const currentRole = this.data.currentRole;
    
    if (currentRole === 'merchant') {
      // 商家版本：显示选择菜单
      wx.showActionSheet({
        itemList: ['发布需求', '发布服务'],
        success(res) {
          if (res.tapIndex === 0) {
            // 发布需求
            wx.navigateTo({
              url: '/pages/publish-need/publish-need'
            });
          } else {
            // 发布服务 - 跳转到新的发布服务页面
            wx.navigateTo({
              url: '/pages/publish-service/publish-service'
            });
          }
        }
      });
    } else {
      // 用户版本：显示选择菜单（已通过商家审核的用户显示"发布服务"）
      const isApprovedMerchant = login.getIsMerchantApproved ? login.getIsMerchantApproved() : false;
      const itemList = isApprovedMerchant 
        ? ['发布需求', '发布服务'] 
        : ['发布需求', '成为商家'];
      
      wx.showActionSheet({
        itemList: itemList,
        success(res) {
          if (res.tapIndex === 0) {
            // 发布需求
            wx.navigateTo({
              url: '/pages/publish-need/publish-need'
            });
          } else if (isApprovedMerchant) {
            // 已审核商家：发布服务 - 跳转到新的发布服务页面
            wx.navigateTo({
              url: '/pages/publish-service/publish-service'
            });
          } else {
            // 未审核用户：成为商家
            wx.navigateTo({
              url: '/pages/merchant-apply/merchant-apply'
            });
          }
        }
      });
    }
  },

  // 跳转搜索页
  goSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  }
});
