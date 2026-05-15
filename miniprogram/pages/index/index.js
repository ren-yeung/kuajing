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

  // 格式化时间（X小时前、X天前等）
  formatTimeAgo(createTime) {
    if (!createTime) return '刚刚';
    
    const now = new Date().getTime();
    let createTimeMs;
    
    if (createTime instanceof Date) {
      createTimeMs = createTime.getTime();
    } else if (typeof createTime === 'string') {
      createTimeMs = new Date(createTime).getTime();
    } else if (createTime.seconds) {
      createTimeMs = createTime.seconds * 1000 + (createTime.nanoseconds || 0) / 1000000;
    } else {
      return '刚刚';
    }
    
    const diff = now - createTimeMs;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 2592000000) return Math.floor(diff / 86400000) + '天前';
    return Math.floor(diff / 2592000000) + '个月前';
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
          newDemands = res.result.data.list.map(d => ({
            ...d,
            postTime: this.formatTimeAgo(d.createTime)
          }));
        }

        // 只使用从数据库获取的真实数据
        this.setData({
          demands: demandPage === 1 ? newDemands : demands.concat(newDemands),
          demandHasMore: newDemands.length >= 10,
          demandPage: demandPage + 1
        });
        wx.stopPullDownRefresh();
      },
      fail: (err) => {
        console.error('获取需求列表失败', err);
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

    // 调用云函数重新加载需求数据
    this.loadDemands();
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
    
    // 检查商家是否审核通过
    const userInfo = login.getUserInfo();
    if (userInfo && userInfo.isMerchant && userInfo.merchantStatus === 'pending') {
      wx.showModal({
        title: '审核提示',
        content: '商家资料审核中，审核通过后可访问',
        showCancel: false,
        confirmText: '我知道了'
      });
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
      success: async (res) => {
        if (res.result && res.result.success) {
          let newServices = res.result.data.list || [];
          
          // 前端强制转换所有 cloud:// 头像为临时链接，并截断描述为15字
          for (let i = 0; i < newServices.length; i++) {
            const service = newServices[i];
            if (service.avatar && service.avatar.startsWith('cloud://')) {
              try {
                const urlRes = await wx.cloud.getTempFileURL({ fileList: [service.avatar] });
                if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
                  newServices[i].avatar = urlRes.fileList[0].tempFileURL;
                }
              } catch (e) {
                console.log('服务头像转换失败:', e);
              }
            }
            // 截断描述为15字
            if (service.description) {
              newServices[i].desc = service.description.length > 15 
                ? service.description.substring(0, 15) + '...' 
                : service.description;
            }
          }
          
          this.setData({
            services: page === 1 ? newServices : services.concat(newServices),
            hasMore: newServices.length >= 10,
            page: page + 1
          });
        } else {
          // 如果云函数返回空或失败，显示空列表
          this.setData({
            services: []
          });
        }
        wx.stopPullDownRefresh();
      },
      fail: (err) => {
        console.error('获取服务列表失败', err);
        this.setData({
          services: []
        });
        wx.stopPullDownRefresh();
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 根据分类ID获取分类名称
  getCategoryName(categoryId) {
    if (!categoryId || categoryId === 1) return '';  // id=1是"全部"，返回空字符串表示全部
    const categoryMap = {
      2: '跨境网络',
      3: '物流服务',
      4: '报关清关',
      5: '支付结算',
      6: '合规认证',
      7: '培训咨询',
      8: '建站出海',
      9: '营销投流',
      10: '选品特供'
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
      success: async (res) => {
        if (res.result && res.result.success) {
          let newServices = res.result.data.list || [];
          
          // 前端强制转换所有 cloud:// 头像为临时链接
          for (let i = 0; i < newServices.length; i++) {
            const service = newServices[i];
            if (service.avatar && service.avatar.startsWith('cloud://')) {
              try {
                const urlRes = await wx.cloud.getTempFileURL({ fileList: [service.avatar] });
                if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
                  newServices[i].avatar = urlRes.fileList[0].tempFileURL;
                }
              } catch (e) {
                console.log('商家服务头像转换失败:', e);
              }
            }
            // 截断描述为15字
            if (service.description) {
              newServices[i].desc = service.description.length > 15
                ? service.description.substring(0, 15) + '...'
                : service.description;
            }
          }
          
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

    // 重新调用云函数加载数据
    this.loadServices();
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
    // 从服务列表中找到对应的服务
    const service = this.data.services.find(s => s.id === serviceId) || 
                    this.data.merchantServices.find(s => s.id === serviceId);
    const serviceName = service ? encodeURIComponent(service.title) : '';
    wx.navigateTo({
      url: `/pages/chat/chat?serviceId=${serviceId}&serviceName=${serviceName}`
    });
  },

  // 发布需求/服务
  publishService() {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    
    const currentRole = this.data.currentRole;
    
    if (currentRole === 'merchant') {
      // 商家版：跳转发布服务
      wx.navigateTo({
        url: '/pages/publish-service/publish-service'
      });
    } else {
      // 用户版：跳转发布需求
      wx.navigateTo({
        url: '/pages/publish-need/publish-need'
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
