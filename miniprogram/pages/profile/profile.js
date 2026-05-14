const login = require('../../utils/login.js');

// 9个分类（去掉"全部"）
var GUEST_CATEGORIES = [
  { id: 2, name: '跨境网络', icon: '🌐', bgColor: '#E6F1FB' },
  { id: 3, name: '物流服务', icon: '📦', bgColor: '#EAF3DE' },
  { id: 4, name: '报关清关', icon: '🛃', bgColor: '#FFF3E0' },
  { id: 5, name: '支付结算', icon: '💰', bgColor: '#FBEAF0' },
  { id: 6, name: '合规认证', icon: '📋', bgColor: '#EEEDFE' },
  { id: 7, name: '培训咨询', icon: '🎓', bgColor: '#FAEDDA' },
  { id: 8, name: '建站出海', icon: '🖥️', bgColor: '#E8F0FE' },
  { id: 9, name: '营销投流', icon: '📢', bgColor: '#FCE4EC' },
  { id: 10, name: '选品特供', icon: '🔍', bgColor: '#E0F7FA' }
];

Page({
  data: {
    statusBarHeight: 0,
    fixedTopHeight: 0,
    bottomSafeHeight: 0,
    tabBarOuterHeight: 58,
    isLoggedIn: false,
    userInfo: null,
    isMerchant: false,
    currentRole: 'user',
    switchRoleText: '',
    mood: '',
    logDate: '',
    logText: '',
    merchantLogText: '',
    unreadCount: 0,
    menuScrollTop: 0,
    avatarUrl: '',
    nickname: '',
    pendingAvatar: '',
    pendingNickname: '',
    stats: {
      publish: 0,
      consult: 0,
      cooperate: 0
    },
    // 商家信息
    merchantInfo: {
      name: '',
      avatarText: '商',
      avatarBg: 'linear-gradient(135deg, #FF9A8B 0%, #FE6E9A 100%)',
      avatarColor: '#fff',
      description: '专业服务商',
      isVerified: false,
      fans: 0,
      likes: 0,
      deals: 0,
      rating: '5.0'
    },
    guestCategories: GUEST_CATEGORIES,
    guestGridHeight: 0
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

    // 同步获取登录状态，避免页面闪烁
    var userInfo = login.getUserInfo();
    var isLoggedIn = !!userInfo;
    var isMerchant = userInfo ? (userInfo.isMerchant || false) : false;
    var currentRole = login.getCurrentRole();
    var switchRoleText = login.getSwitchRoleText();

    this.setData({
      statusBarHeight: statusBarHeight,
      bottomSafeHeight: bottomSafeHeight,
      tabBarOuterHeight: tabBarOuterHeight,
      // 初始化时就设置登录状态
      isLoggedIn: isLoggedIn,
      userInfo: userInfo,
      isMerchant: isMerchant,
      currentRole: currentRole,
      switchRoleText: switchRoleText,
      avatarUrl: userInfo ? userInfo.avatar : ''
    });

    if (isLoggedIn) {
      // 根据角色加载不同数据
      if (currentRole === 'merchant') {
        this.loadMerchantInfo();
      } else {
        this.loadUserStats();
      }
    }
  },

  onReady() {
    this.calcFixedTopHeight();
    this.calcGuestGridHeight();
  },

  onShow() {
    // 设置自定义tabBar：我的=2（首页=0，消息=1，我的=2）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }

    // 重置滚动位置
    this.setData({ menuScrollTop: 0 });

    // 同步更新登录状态（应对登录/退出变化）
    var userInfo = login.getUserInfo();
    var isLoggedIn = !!userInfo;

    if (isLoggedIn) {
      var isMerchant = userInfo.isMerchant || false;
      var currentRole = login.getCurrentRole();
      var switchRoleText = login.getSwitchRoleText();
      var avatarUrl = userInfo.avatar;

      this.setData({
        isLoggedIn: true,
        userInfo: userInfo,
        isMerchant: isMerchant,
        currentRole: currentRole,
        switchRoleText: switchRoleText,
        avatarUrl: avatarUrl
      });

      // 异步转换云存储头像URL
      if (avatarUrl && avatarUrl.startsWith('cloud://')) {
        wx.cloud.getTempFileURL({
          fileList: [avatarUrl],
          success: (res) => {
            if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
              avatarUrl = res.fileList[0].tempFileURL;
              userInfo.avatar = avatarUrl;
              this.setData({
                userInfo: userInfo,
                avatarUrl: avatarUrl
              });
            }
          }
        });
      }
      this.loadUserStats();
      // 如果是商家模式，加载商家信息
      if (currentRole === 'merchant') {
        this.loadMerchantInfo();
      }
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: null,
        isMerchant: false
      });
      this.calcGuestGridHeight();
    }

    // 重新计算固定区域高度（应对模式切换）
    var self = this;
    setTimeout(function() {
      self.calculateEstimatedHeight();
    }, 200);
  },

  // 计算固定区域高度（根据模式动态计算）
  calcFixedTopHeight() {
    var self = this;
    // 延迟执行，确保DOM更新完成
    setTimeout(function() {
      var query = wx.createSelectorQuery();
      query.select('.fixed-top').boundingClientRect(function(rect) {
        if (rect && rect.height > 0) {
          self.setData({ fixedTopHeight: rect.height });
        } else {
          // DOM测量失败，使用预计算高度
          self.calculateEstimatedHeight();
        }
      }).exec();
    }, 150);
  },

  // 根据模式预计算高度
  calculateEstimatedHeight: function() {
    var self = this;
    
    setTimeout(function() {
      var query = wx.createSelectorQuery().in(self);
      query.select('.fixed-top').boundingClientRect(function(rect) {
        if (rect && rect.height > 0) {
          self.setData({ fixedTopHeight: rect.height });
        }
      }).exec();
    }, 100);
  },

  // 计算分类网格高度（用于调整滚动区域高度）
  calcGuestGridHeight() {
    var self = this;
    setTimeout(function() {
      var query = wx.createSelectorQuery();
      query.select('.guest-grid').boundingClientRect(function(rect) {
        if (rect) {
          self.setData({ guestGridHeight: rect.height });
        }
      }).exec();
    }, 100);
  },

  // 选择微信头像
  onChooseAvatar: function(e) {
    var avatarUrl = e.detail.avatarUrl;
    this.setData({ pendingAvatar: avatarUrl, avatarUrl: avatarUrl });
  },

  // 选择本地图片作为头像
  onChooseLocalImage: function() {
    var self = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var tempFilePath = res.tempFilePaths[0];
        
        // 立即显示选择的图片
        self.setData({ avatarUrl: tempFilePath });
        
        // 如果已登录，上传到云存储并更新
        if (self.data.isLoggedIn && self.data.userInfo) {
          wx.showLoading({ title: '上传头像...' });
          var timestamp = Date.now();
          
          wx.saveFile({
            tempFilePath: tempFilePath,
            success: function(saveRes) {
              wx.cloud.uploadFile({
                cloudPath: 'avatars/' + timestamp + '.png',
                filePath: saveRes.savedFilePath,
                success: function(uploadRes) {
                  wx.hideLoading();
                  var newAvatarUrl = uploadRes.fileID;
                  
                  // 更新本地存储的用户信息
                  var userInfo = self.data.userInfo;
                  userInfo.avatar = newAvatarUrl;
                  wx.setStorageSync('userInfo', userInfo);
                  self.setData({ userInfo: userInfo });
                  
                  // 转换为临时URL显示
                  wx.cloud.getTempFileURL({
                    fileList: [newAvatarUrl],
                    success: function(urlRes) {
                      if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
                        userInfo.avatar = urlRes.fileList[0].tempFileURL;
                        self.setData({ userInfo: userInfo, avatarUrl: urlRes.fileList[0].tempFileURL });
                      }
                    }
                  });
                  
                  wx.showToast({ title: '头像更新成功', icon: 'none' });
                },
                fail: function(err) {
                  wx.hideLoading();
                  console.error('头像上传失败', err);
                  wx.showToast({ title: '头像上传失败', icon: 'none' });
                }
              });
            },
            fail: function(err) {
              wx.hideLoading();
              console.error('头像保存失败', err);
              wx.showToast({ title: '头像处理失败', icon: 'none' });
            }
          });
        } else {
          // 未登录，保存待上传
          self.setData({ pendingAvatar: tempFilePath });
        }
      }
    });
  },

  // 昵称输入
  onNicknameInput: function(e) {
    this.setData({ pendingNickname: e.detail.value });
  },

  // 昵称输入完成
  onNicknameBlur: function(e) {
    this.setData({ pendingNickname: e.detail.value });
  },

  // 点击确认登录
  onLogin: function() {
    var self = this;
    var pendingAvatar = this.data.pendingAvatar;
    var pendingNickname = this.data.pendingNickname;

    if (!pendingAvatar) {
      wx.showToast({ title: '请先选择头像', icon: 'none' });
      return;
    }
    if (!pendingNickname || pendingNickname.trim() === '') {
      wx.showToast({ title: '请先输入昵称', icon: 'none' });
      return;
    }

    this.setData({ nickname: pendingNickname.trim(), avatarUrl: pendingAvatar });

    // 如果是微信临时路径，需要上传到云存储
    if (pendingAvatar.startsWith('http://tmp') || pendingAvatar.startsWith('wxfile://')) {
      wx.showLoading({ title: '上传头像...' });
      var timestamp = Date.now();
      
      // 先保存到本地，再用本地路径上传
      wx.saveFile({
        tempFilePath: pendingAvatar,
        success: function(saveRes) {
          var localPath = saveRes.savedFilePath;
          wx.cloud.uploadFile({
            cloudPath: 'avatars/' + timestamp + '.png',
            filePath: localPath,
            success: function(uploadRes) {
              wx.hideLoading();
              console.log('头像上传成功:', uploadRes.fileID);
              self.doLoginProcess(pendingNickname.trim(), uploadRes.fileID);
            },
            fail: function(err) {
              wx.hideLoading();
              console.error('头像上传失败', err);
              wx.showToast({ title: '头像上传失败', icon: 'none' });
              self.doLoginProcess(pendingNickname.trim(), pendingAvatar);
            }
          });
        },
        fail: function(err) {
          wx.hideLoading();
          console.error('头像保存失败', err);
          wx.showToast({ title: '头像处理失败', icon: 'none' });
          self.doLoginProcess(pendingNickname.trim(), pendingAvatar);
        }
      });
    } else {
      this.doLoginProcess(pendingNickname.trim(), pendingAvatar);
    }
  },

  // 实际执行登录流程
  doLoginProcess: function(nickname, avatar) {
    var self = this;
    login.doLoginWithInfo(nickname, avatar)
      .then(function(userInfo) {
        var isMerchant = userInfo.isMerchant || false;
        var currentRole = login.getCurrentRole();
        var switchRoleText = login.getSwitchRoleText();
        
        // 如果是云存储fileID，需要转换为临时URL
        var avatarUrl = userInfo.avatar;
        if (avatarUrl && avatarUrl.startsWith('cloud://')) {
          wx.cloud.getTempFileURL({
            fileList: [avatarUrl],
            success: function(res) {
              if (res.fileList && res.fileList[0] && res.fileList[0].tempFileURL) {
                avatarUrl = res.fileList[0].tempFileURL;
              }
              self.finishLogin(userInfo, isMerchant, currentRole, switchRoleText, avatarUrl);
            },
            fail: function() {
              self.finishLogin(userInfo, isMerchant, currentRole, switchRoleText, avatarUrl);
            }
          });
        } else {
          self.finishLogin(userInfo, isMerchant, currentRole, switchRoleText, avatarUrl);
        }
      })
      .catch(function(err) {
        wx.showToast({ title: err || '登录失败', icon: 'none' });
      });
  },

  // 登录完成后设置数据
  finishLogin: function(userInfo, isMerchant, currentRole, switchRoleText, avatarUrl) {
    // 同步更新 userInfo.avatar（用于页面显示）
    userInfo.avatar = avatarUrl;
    this.setData({
      isLoggedIn: true,
      userInfo: userInfo,
      isMerchant: isMerchant,
      currentRole: currentRole,
      switchRoleText: switchRoleText,
      nickname: userInfo.nickname,
      avatarUrl: avatarUrl
    });
    this.loadUserStats();
    wx.showToast({ title: '登录成功', icon: 'none' });
    this.calcFixedTopHeight();
  },

  // 未登录：点击分类导航
  onGuestCategoryTap: function(e) {
    wx.showToast({ title: '请先登录后再浏览', icon: 'none' });
  },

  // 切换角色（不跳转页面，只刷新当前页面状态）
  onSwitchRole: function() {
    var currentRole = this.data.currentRole;
    var newRole = currentRole === 'user' ? 'merchant' : 'user';
    var userInfo = login.getUserInfo();
    var switchRoleText = login.getSwitchRoleText();
    
    // 更新存储和页面状态
    login.setCurrentRole(newRole);
    
    if (newRole === 'merchant') {
      // 切换到商家模式
      this.setData({
        currentRole: 'merchant',
        switchRoleText: switchRoleText
      });
      this.loadMerchantInfo();
      wx.showToast({ title: '已切换为商家模式', icon: 'none' });
    } else {
      // 切换到用户模式
      this.setData({
        currentRole: 'user',
        switchRoleText: switchRoleText
      });
      this.loadUserStats();
      wx.showToast({ title: '已切换为用户模式', icon: 'none' });
    }
    
    // 重置滚动位置
    this.setData({ menuScrollTop: 0 });
  },

  // 退出登录
  onLogout: function() {
    var self = this;
    wx.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: function(res) {
        if (res.confirm) {
          login.logout();
          self.setData({
            isLoggedIn: false,
            userInfo: null,
            isMerchant: false,
            currentRole: 'user',
            switchRoleText: '',
            stats: { publish: 0, consult: 0, cooperate: 0 }
          });
          wx.showToast({ title: '已退出登录', icon: 'none' });
          self.calcFixedTopHeight();
        }
      }
    });
  },

  // 加载用户统计数据（模拟）
  loadUserStats: function() {
    // 后续对接后端接口
    this.setData({
      mood: '我要赚大钱！！！',
      logDate: '今天 14:30',
      logText: '发布了新需求："寻找美国海外仓合作商"',
      unreadCount: 5,
      stats: {
        publish: 12,
        consult: 8,
        cooperate: 5
      }
    });
  },

  // 加载商家信息
  loadMerchantInfo: function() {
    var userInfo = login.getUserInfo();
    if (!userInfo) return;

    // 模拟商家数据（后续对接后端）
    var avatarText = userInfo.nickname ? userInfo.nickname.charAt(0).toUpperCase() : '商';
    var avatarBgs = [
      'linear-gradient(135deg, #FF9A8B 0%, #FE6E9A 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)'
    ];
    var avatarBg = avatarBgs[userInfo.userId ? userInfo.userId.charCodeAt(0) % avatarBgs.length : 0];

    this.setData({
      merchantInfo: {
        name: userInfo.nickname || '商家名称',
        avatarText: avatarText,
        avatarBg: avatarBg,
        avatarColor: '#fff',
        description: userInfo.merchantDescription || userInfo.signature || '专业服务商',
        isVerified: userInfo.merchantStatus === 'approved',
        fans: userInfo.fans || 156,
        likes: userInfo.likes || 2323,
        deals: userInfo.deals || 89,
        rating: (userInfo.rating && userInfo.rating > 0) ? userInfo.rating.toFixed(1) : '4.8'
      },
      logDate: '今天 14:30',
      merchantLogText: '今日新增3个意向客户'
    });
  },

  // 统计项点击（商家模式）
  onStatTap: function(e) {
    var type = e.currentTarget.dataset.type;
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goPage: function(e) {
    var page = e.currentTarget.dataset.page;

    // 需要登录的页面先校验
    var needLoginPages = ['myPosts', 'myLikes', 'myFavorites', 'history', 'myMessages', 'notifications', 'editProfile'];
    if (needLoginPages.indexOf(page) !== -1) {
      if (!login.checkLogin()) {
        login.requireLogin().catch(function() {});
        return;
      }
    }

    // 页面跳转映射
    var pageMap = {
      myPosts: '/pages/my-posts/my-posts',
      myLikes: '/pages/my-likes/my-likes',
      myFavorites: '/pages/my-favorites/my-favorites',
      history: '/pages/history/history',
      myMessages: '/pages/message/message',
      notifications: '/pages/notifications/notifications',
      editProfile: '/pages/edit-profile/edit-profile',
      becomeMerchant: '/pages/merchant-apply/merchant-apply'
    };

    var url = pageMap[page];
    if (url) {
      wx.navigateTo({ url: url });
    }
  }
});
