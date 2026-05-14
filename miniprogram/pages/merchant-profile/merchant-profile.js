const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 0,
    safeBottom: 0,
    bottomSafeArea: 0,
    scrollTop: 0,

    // 商家信息
    merchantInfo: {
      name: '',
      avatarText: '商',
      avatarBg: 'linear-gradient(135deg, #FF9A8B 0%, #FE6E9A 100%)',
      avatarColor: '#fff',
      description: '专业海外仓—件代发',
      isVerified: true,
      merchantStatus: 'approved',
      fans: 156,
      likes: 2323,
      deals: 89,
      rating: '4.8'
    },

    // 统计数据
    serviceCount: 0,
    orderCount: 0,
    unreadCount: 3
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navHeight = statusBarHeight + 44;
    
    const safeArea = systemInfo.safeArea;
    let bottomSafeArea = 0;
    if (safeArea) {
      bottomSafeArea = Math.max(0, systemInfo.windowHeight - safeArea.bottom);
    }

    this.setData({
      statusBarHeight,
      navHeight,
      safeBottom: bottomSafeArea,
      bottomSafeArea
    });

    this.loadMerchantInfo();
  },

  onReady() {
    // 计算固定区域高度，用于滚动区域定位
    this.calculateProfileHeight();
  },

  onPageScroll(e) {
    this.setData({ scrollTop: e.scrollTop });
  },

  // 计算固定区域高度
  calculateProfileHeight() {
    const query = wx.createSelectorQuery();
    query.select('.profile-sticky').boundingClientRect((rect) => {
      if (rect && rect.height) {
        this.setData({ profileHeight: rect.height });
      }
    }).exec();
  },

  loadMerchantInfo() {
    const userInfo = login.getUserInfo();
    if (!userInfo || !userInfo.userId) return;

    const db = wx.cloud.database();
    db.collection('users').doc(userInfo.userId).get({
      success: (res) => {
        const user = res.data;
        if (user) {
          // 优先使用商家昵称，如果为空则显示"请修改商家名称"
          let merchantNickname = user.merchantNickname;
          if (!merchantNickname || merchantNickname === '') {
            merchantNickname = '请修改商家名称';
          }
          const avatarText = merchantNickname.charAt(0).toUpperCase();
          const avatarBgs = [
            'linear-gradient(135deg, #FF9A8B 0%, #FE6E9A 100%)',
            'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
            'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)'
          ];
          const avatarBg = avatarBgs[user._id.charCodeAt(0) % avatarBgs.length];
          
          // 优先使用商家头像，否则使用用户头像
          const avatarUrl = user.merchantAvatar || user.avatar || '';

          this.setData({
            merchantInfo: {
              name: merchantNickname || '商家名称',
              avatarText: avatarText,
              avatarBg: avatarBg,
              avatarUrl: avatarUrl,
              description: user.merchantDescription || user.signature || '专业海外仓—件代发',
              isVerified: user.merchantStatus === 'approved',
              merchantStatus: user.merchantStatus || 'pending',
              fans: user.fans || 0,
              likes: user.likes || 0,
              deals: user.deals || 0,
              rating: (user.rating && user.rating > 0) ? user.rating.toFixed(1) : '4.8'
            }
          });
        }
      },
      fail: (err) => { console.error('获取用户信息失败', err); }
    });

    this.loadServiceCount();
    this.loadOrderCount();
    this.loadUnreadCount();
  },

  loadServiceCount() {
    const userInfo = login.getUserInfo();
    if (!userInfo || !userInfo.userId) return;
    const db = wx.cloud.database();
    db.collection('services').where({ userId: userInfo.userId }).count({
      success: (res) => { this.setData({ serviceCount: res.total }); }
    });
  },

  loadOrderCount() {
    const userInfo = login.getUserInfo();
    if (!userInfo || !userInfo.userId) return;
    const db = wx.cloud.database();
    db.collection('orders').where({ merchantId: userInfo.userId }).count({
      success: (res) => { this.setData({ orderCount: res.total }); }
    });
  },

  loadUnreadCount() {
    const userInfo = login.getUserInfo();
    if (!userInfo || !userInfo.userId) return;
    const db = wx.cloud.database();
    db.collection('messages').where({ toUserId: userInfo.userId, isRead: false }).count({
      success: (res) => { this.setData({ unreadCount: res.total }); }
    });
  },

  // 统计项点击
  onStatTap(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  // 菜单点击
  onMenuTap(e) {
    const type = e.currentTarget.dataset.type;
    let url = '';

    switch (type) {
      case 'my-services':
        url = '/pages/merchant-services/merchant-services'; break;
      case 'service-orders':
        url = '/pages/merchant-orders/merchant-orders'; break;
      case 'reviews':
        url = '/pages/merchant-reviews/merchant-reviews'; break;
      case 'statistics':
        url = '/pages/merchant-stats/merchant-stats'; break;
      case 'messages':
        url = '/pages/merchant-messages/merchant-messages'; break;
      case 'notifications':
        url = '/pages/merchant-notifications/merchant-notifications'; break;
      case 'edit-profile':
        url = '/pages/merchant-edit/merchant-edit'; break;
      case 'merchant-auth':
        url = '/pages/merchant-apply/merchant-apply'; break;
      case 'help':
        url = '/pages/help-feedback/help-feedback'; break;
      default:
        wx.showToast({ title: '功能开发中', icon: 'none' }); return;
    }

    wx.navigateTo({ url });
  },

  // 更多按钮
  onMoreTap() {
    wx.showActionSheet({
      itemList: ['分享', '设置'],
      success(res) {
        if (res.tapIndex === 0) {
          wx.showShareMenu();
        } else if (res.tapIndex === 1) {
          wx.showToast({ title: '设置开发中', icon: 'none' });
        }
      }
    });
  },

  // 切换到个人用户
  switchToUser() {
    login.setCurrentRole('user');
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  // TabBar跳转 - 首页（商家模式：跳转到需求广场）
  goHome() {
    wx.reLaunch({ url: '/pages/demand-square/demand-square' });
  },

  // TabBar跳转 - 我的（商家主页）
  goToProfile() {
    // 已在商家主页，不需要跳转
  },

  // TabBar跳转 - 消息
  goMessages() {
    wx.reLaunch({ url: '/pages/message/message' });
  },

  // 分享
  onShareAppMessage() {
    const userInfo = login.getUserInfo();
    return {
      title: `${this.data.merchantInfo.name}的商家主页`,
      path: `/pages/merchant-profile/merchant-profile?merchantId=${userInfo?.userId || ''}`
    };
  }
});
