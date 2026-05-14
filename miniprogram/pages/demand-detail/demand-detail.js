// demand-detail.js
const login = require('../../utils/login.js');

Page({
  data: {
    isLoading: true,
    navHeight: 44,
    demandId: '',
    demand: {
      id: '',
      title: '',
      category: '',
      description: '',
      budget: '',
      budgetMin: 0,
      budgetMax: 0,
      deadline: '',
      status: '报名中',
      statusBg: '#e6f1fb',
      statusColor: '#185fa5',
      views: 0,
      applyCount: 0,
      tags: [],
      userName: '',
      userAvatarText: '',
      userAvatarBg: '',
      userAvatarColor: '',
      postTime: '',
      phone: '',
      region: '',
      remark: '',
      merchants: []
    },
    isCollected: false,
    hasApplied: false,
    isOwnDemand: false,
    canAccept: false
  },

  onLoad(options) {
    // 计算导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navHeight = statusBarHeight + 44;
    this.setData({ navHeight });

    if (options.id) {
      this.setData({ demandId: options.id });
      this.loadDemandDetail(options.id);
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },

  // 加载需求详情
  async loadDemandDetail(id) {
    this.setData({ isLoading: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'getDemandDetail',
        data: { demandId: id }
      });

      if (res.result && res.result.success && res.result.data) {
        const data = res.result.data;

        // 格式化预算
        let budget = '';
        if (data.budgetMin > 0 && data.budgetMax > 0) {
          budget = `¥${data.budgetMin.toLocaleString()}-${data.budgetMax.toLocaleString()}`;
        } else if (data.budgetMin > 0) {
          budget = `¥${data.budgetMin}+`;
        } else if (data.budgetMax > 0) {
          budget = `¥${data.budgetMax}以内`;
        }

        // 处理发布者信息
        const publisher = data.publisher || {};
        const nickName = publisher.nickname || '匿名';
        let avatar = publisher.avatar || '';
        const avatarText = nickName.charAt(0);

        // 如果是云存储 fileID，转换为临时链接
        if (avatar && avatar.startsWith('cloud://')) {
          try {
            const urlRes = await wx.cloud.getTempFileURL({ fileList: [avatar] });
            if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
              avatar = urlRes.fileList[0].tempFileURL;
            } else {
              avatar = '';
            }
          } catch (e) {
            avatar = '';
          }
        }

        // 检查是否是自己的需求
        const userInfo = login.getUserInfo();
        const isOwnDemand = userInfo && publisher.userId === userInfo._id;

        // 计算相对时间
        const postTime = this.formatPostTime(data.createTime);

        // 处理状态显示
        let status = '报名中';
        let statusBg = '#e6f1fb';
        let statusColor = '#185fa5';
        if (data.status === 'closed') {
          status = '已截止';
          statusBg = '#f5f5f5';
          statusColor = '#999';
        } else if (data.status === 'full') {
          status = '报名已满';
          statusBg = '#fff7e6';
          statusColor = '#fa8c16';
        }

        this.setData({
          isLoading: false,
          demand: {
            id: data.id,
            title: data.title,
            category: data.category,
            description: data.description,
            budget: budget,
            budgetMin: data.budgetMin,
            budgetMax: data.budgetMax,
            deadline: data.deadline,
            region: data.region,
            tags: data.tags || [],
            images: data.images || [],
            userName: nickName,
            userAvatar: avatar,
            userAvatarText: avatarText,
            userAvatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            userAvatarColor: 'white',
            phone: data.phone || '',
            remark: data.remark || '',
            views: data.views,
            applyCount: data.applyCount || 0,
            contactCount: data.contactCount || 0,
            postTime: postTime,
            createTime: data.createTime,
            status: status,
            statusBg: statusBg,
            statusColor: statusColor,
            merchants: data.merchants || []
          },
          isOwnDemand: isOwnDemand,
          canAccept: isOwnDemand
        });
      } else {
        this.setData({ isLoading: false });
        wx.showToast({ title: '获取详情失败', icon: 'none' });
      }
    } catch (err) {
      console.error('获取需求详情失败', err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '获取详情失败', icon: 'none' });
    }
  },

  // 计算相对时间
  formatPostTime(createTime) {
    if (!createTime) return '';
    const now = Date.now();
    const createDate = createTime instanceof Date ? createTime.getTime() : new Date(createTime).getTime();
    const diff = now - createDate;
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return '1个月前';
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 收藏需求
  collectDemand() {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    this.setData({ isCollected: !this.data.isCollected });
    wx.showToast({
      title: this.data.isCollected ? '已收藏' : '已取消收藏',
      icon: 'none'
    });
  },

  // 分享需求
  shareDemand() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    wx.showToast({ title: '点击右上角分享', icon: 'none' });
  },

  // 联系发布者
  contactPublisher() {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    
    const demand = this.data.demand;
    wx.showModal({
      title: '联系发布者',
      content: `发布者：${demand.userName}\n联系电话：${demand.phone}\n\n确认拨打？`,
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: demand.phone.replace(/\*/g, '0'),
            fail: () => {
              wx.showToast({ title: '拨打失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 报名需求
  applyDemand() {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }

    if (this.data.hasApplied) {
      wx.showToast({ title: '您已报名该需求', icon: 'none' });
      return;
    }

    // 检查是否已满（最多10人）
    const demand = this.data.demand;
    if (demand.applyCount >= 10 || demand.status === '已满' || demand.status === 'closed' || demand.status === 'full') {
      wx.showToast({ title: '报名人数已满', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认报名',
      content: '确定报名该需求吗？报名后发布者可以看到您的联系方式。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' });
          
          wx.cloud.callFunction({
            name: 'applyDemand',
            data: { demandId: this.data.demandId },
            success: (res) => {
              wx.hideLoading();
              if (res.result && res.result.success) {
                const resultData = res.result.data;
                this.setData({
                  hasApplied: true,
                  'demand.applyCount': resultData.applyCount,
                  'demand.status': resultData.status === 'full' ? '报名已满' : (resultData.status === 'closed' ? '已截止' : '报名中')
                });
                wx.showToast({ title: '报名成功', icon: 'none' });
              } else {
                wx.showToast({ title: res.result.errMsg || '报名失败', icon: 'none' });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('报名失败', err);
              wx.showToast({ title: '报名失败，请重试', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 联系商家
  contactMerchant(e) {
    if (!login.checkLogin()) {
      login.requireLogin().catch(() => {});
      return;
    }
    
    const merchantId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '联系商家',
      content: '确定获取该商家联系方式吗？',
      success: (res) => {
        if (res.confirm) {
          // 实际应该调用云函数获取联系方式
          wx.showToast({ title: '请联系平台获取', icon: 'none' });
        }
      }
    });
  },

  // 接受商家报名（仅需求发布者可用）
  acceptMerchant(e) {
    const merchantId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    if (!this.data.isOwnDemand) {
      wx.showToast({ title: '仅发布者可操作', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认接受',
      content: '确定接受该商家的报名吗？接受后对方可以看到您的联系方式。',
      success: (res) => {
        if (res.confirm) {
          // 更新本地数据
          const merchants = this.data.demand.merchants;
          merchants[index].accepted = true;
          this.setData({ ['demand.merchants']: merchants });
          wx.showToast({ title: '已接受', icon: 'none' });
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: this.data.demand.title,
      path: `/pages/demand-detail/demand-detail?id=${this.data.demandId}`
    };
  },

  onShareTimeline() {
    return {
      title: this.data.demand.title
    };
  }
});
