const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 0,

    // 筛选
    currentFilter: 'all',
    stats: {
      pending: 0,
      approved: 0,
      rejected: 0
    },

    // 列表数据
    list: [],
    page: 1,
    pageSize: 10,
    loading: false,
    noMore: false
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navHeight = statusBarHeight + 44;

    this.setData({
      statusBarHeight,
      navHeight
    });

    // 检查管理员权限
    if (!this.checkAdmin()) {
      wx.showModal({
        title: '无权限',
        content: '您不是管理员，无法访问此页面',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }

    this.loadList();
    this.loadStats();
  },

  onShow() {
    // 每次显示时刷新列表
    if (this.data.list.length > 0) {
      this.refreshList();
    }
  },

  // 检查管理员权限
  checkAdmin() {
    const userInfo = login.getUserInfo();
    return userInfo && userInfo.isAdmin;
  },

  goBack() {
    wx.navigateBack();
  },

  // 切换筛选
  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    if (filter === this.data.currentFilter) return;

    this.setData({
      currentFilter: filter,
      list: [],
      page: 1,
      noMore: false
    });

    this.loadList();
  },

  // 加载列表
  loadList() {
    if (this.data.loading || this.data.noMore) return;

    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'getMerchantApplications',
      data: {
        status: this.data.currentFilter === 'all' ? '' : this.data.currentFilter,
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        this.setData({ loading: false });

        if (res.result && res.result.success) {
          const { list, totalPages } = res.result.data;
          
          // 格式化时间
          list.forEach(item => {
            item.createTimeStr = this.formatTime(item.createTime);
          });

          this.setData({
            list: this.data.page === 1 ? list : [...this.data.list, ...list],
            noMore: this.data.page >= totalPages
          });
        } else {
          wx.showToast({
            title: res.result.errMsg || '加载失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        this.setData({ loading: false });
        console.error('加载申请列表失败', err);
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 刷新列表
  refreshList() {
    this.setData({
      page: 1,
      noMore: false
    });
    this.loadList();
    this.loadStats();
  },

  // 加载统计数据
  loadStats() {
    Promise.all([
      this.getStatusCount('pending'),
      this.getStatusCount('approved'),
      this.getStatusCount('rejected')
    ]).then(([pending, approved, rejected]) => {
      this.setData({
        stats: { pending, approved, rejected }
      });
    });
  },

  // 获取指定状态的数量
  getStatusCount(status) {
    return new Promise((resolve) => {
      wx.cloud.callFunction({
        name: 'getMerchantApplications',
        data: { status, page: 1, pageSize: 1 }
      }).then(res => {
        resolve(res.result && res.result.success ? res.result.data.total : 0);
      }).catch(() => {
        resolve(0);
      });
    });
  },

  // 加载更多
  onLoadMore() {
    if (this.data.noMore || this.data.loading) return;
    
    this.setData({ page: this.data.page + 1 });
    this.loadList();
  },

  // 跳转详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/merchant-review-detail/merchant-review-detail?id=${id}`
    });
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});
