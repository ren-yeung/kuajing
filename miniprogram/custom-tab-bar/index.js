Component({
  data: {
    selected: 0,
    messageCount: 0
  },

  lifetimes: {
    ready() {
      // 初始化选中状态
      this.initSelected();
    }
  },

  methods: {
    // 根据当前页面初始化选中状态
    initSelected() {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const route = currentPage ? currentPage.route : '';
      const currentRole = wx.getStorageSync('currentRole') || 'user';
      
      let selected = 0;
      if (currentRole === 'admin') {
        if (route.includes('admin-home')) selected = 0;
        else if (route.includes('message')) selected = 1;
        else if (route.includes('profile')) selected = 2;
      } else {
        if (route.includes('index')) selected = 0;
        else if (route.includes('message')) selected = 1;
        else if (route.includes('profile')) selected = 2;
      }
      
      this.setData({ selected });
    },

    switchTab(e) {
      const index = parseInt(e.currentTarget.dataset.index);
      const currentRole = wx.getStorageSync('currentRole') || 'user';
      
      let url;
      if (currentRole === 'admin') {
        if (index === 0) url = '/pages/admin-home/admin-home';
        else if (index === 1) url = '/pages/message/message';
        else if (index === 2) url = '/pages/profile/profile';
      } else {
        if (index === 0) url = '/pages/index/index';
        else if (index === 1) url = '/pages/message/message';
        else if (index === 2) url = '/pages/profile/profile';
      }
      
      // 使用switchTab跳转到tabBar页面
      if (url) {
        wx.switchTab({ url: url });
      }
    }
  }
});
