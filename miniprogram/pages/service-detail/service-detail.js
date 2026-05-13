// service-detail.js
const login = require('../../utils/login.js');

Page({
  data: {
    serviceId: null,
    service: null,
    isFollowing: false,
    isLiked: false,
    isCollected: false,
    likeCount: 0,
    isLoading: true
  },

  onLoad(options) {
    const serviceId = options.id;
    this.setData({ serviceId });
    this.loadServiceDetail(serviceId);
  },

  // 加载服务详情
  loadServiceDetail(serviceId) {
    this.setData({ isLoading: true });

    // 如果是示例数据ID，使用本地数据
    if (serviceId && serviceId.startsWith('mock')) {
      const mockService = this.getMockService(serviceId);
      if (mockService) {
        this.setData({
          service: mockService,
          likeCount: mockService.likes,
          isLoading: false
        });
        return;
      }
    }

    // 调用云函数获取真实数据
    wx.cloud.callFunction({
      name: 'getServiceDetail',
      data: { serviceId },
      success: (res) => {
        if (res.result && res.result.success) {
          const data = res.result.data;
          // 格式化数据
          const service = this.formatServiceData(data);
          this.setData({
            service,
            likeCount: service.likes
          });
        } else {
          // 云函数返回失败，尝试本地数据
          const mockService = this.getMockService(serviceId);
          if (mockService) {
            this.setData({ service: mockService, likeCount: mockService.likes });
          }
        }
      },
      fail: (err) => {
        console.error('获取服务详情失败', err);
        // 降级使用本地数据
        const mockService = this.getMockService(serviceId);
        if (mockService) {
          this.setData({ service: mockService, likeCount: mockService.likes });
        }
      },
      complete: () => {
        this.setData({ isLoading: false });
      }
    });
  },

  // 格式化云函数返回的数据
  formatServiceData(data) {
    const merchant = data.merchant || {};
    const avatarText = merchant.nickname ? merchant.nickname.charAt(0) : '?';
    const avatarBg = '#E6F1FB';
    const avatarColor = '#185FA5';

    return {
      id: data.id,
      title: data.title,
      category: data.category,
      description: data.description,
      price: data.price,
      priceUnit: data.priceUnit || '元',
      phone: data.phone || '',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      provider: {
        name: merchant.nickname || '匿名商家',
        avatarText: avatarText,
        avatarBg: avatarBg,
        avatarColor: avatarColor,
        rating: merchant.rating || '5.0',
        fans: merchant.serviceCount || 0
      },
      likes: data.likes || 0,
      views: data.views || 0,
      sold: Math.floor(Math.random() * 100) + 10,
      desc: data.description,
      advantages: [
        '专业服务，品质保障',
        '一对一咨询，响应及时',
        '价格透明，无隐藏费用',
        '售后跟踪，服务完善'
      ],
      scope: '跨境电商、外贸企业等',
      tags: data.category ? [data.category] : ['优质服务'],
      reviews: (data.reviews || []).map(r => ({
        avatar: r.userName ? r.userName.charAt(0) : '?',
        name: r.userName || '匿名用户',
        rating: r.rating ? '⭐'.repeat(Math.floor(r.rating)) : '⭐⭐⭐⭐⭐ 5.0',
        text: r.content || r.text || '',
        date: r.createTime ? new Date(r.createTime).toLocaleDateString() : ''
      }))
    };
  },

  // 获取本地示例服务数据
  getMockService(id) {
    const mockServices = {
      'mock1': {
        id: 'mock1',
        title: '美国专线小包物流服务',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        price: '2,800',
        priceUnit: '/件',
        provider: {
          name: '张三物流',
          avatarText: '张',
          avatarBg: '#E6F1FB',
          avatarColor: '#185FA5',
          rating: '4.8',
          fans: 156
        },
        likes: 234,
        views: '1.2k',
        sold: 89,
        desc: '专业美国专线小包物流服务，时效稳定，价格优惠。',
        advantages: [
          '时效快：5-8个工作日送达',
          '价格低：首重¥28，续重¥15/500g',
          '覆盖广：支持美国全境配送',
          '服务好：提供全程物流追踪'
        ],
        scope: '跨境电商、个人寄件、样品寄送等',
        tags: ['美国专线', '小包物流', '时效稳定', '价格优惠'],
        reviews: [
          { avatar: '李', name: '李四贸易', rating: '⭐⭐⭐⭐⭐ 5.0', text: '服务非常好，时效快，价格合理，推荐！', date: '2024-01-15' },
          { avatar: '王', name: '王五电商', rating: '⭐⭐⭐⭐ 4.0', text: '整体满意，就是客服回复有点慢。', date: '2024-01-10' }
        ]
      },
      'mock2': {
        id: 'mock2',
        title: '跨境支付结汇一站式服务',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        price: '500',
        priceUnit: '/笔',
        provider: {
          name: '李四支付',
          avatarText: '李',
          avatarBg: '#FAEDDA',
          avatarColor: '#854F0B',
          rating: '4.9',
          fans: 289
        },
        likes: 567,
        views: '3.4k',
        sold: 156,
        desc: '合规结汇，费率低，到账快，支持多平台。',
        advantages: [
          '费率低：结汇费率仅0.3%',
          '到账快：T+1到账，最快当日',
          '覆盖广：支持美元、欧元、英镑等',
          '合规安全：持有跨境支付牌照'
        ],
        scope: '跨境电商、外贸企业、个人卖家等',
        tags: ['跨境支付', '结汇', '合规', '费率低'],
        reviews: [
          { avatar: '赵', name: '赵六电商', rating: '⭐⭐⭐⭐⭐ 5.0', text: '结汇速度很快，费率也合理。', date: '2024-01-20' },
          { avatar: '钱', name: '钱七贸易', rating: '⭐⭐⭐⭐⭐ 5.0', text: '服务很专业，有问题随时解答。', date: '2024-01-18' }
        ]
      },
      'mock3': {
        id: 'mock3',
        title: '欧盟CE认证快速办理',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        price: '3,500',
        priceUnit: '/件',
        provider: {
          name: '王五认证',
          avatarText: '王',
          avatarBg: '#EAF3DE',
          avatarColor: '#3B6D11',
          rating: '4.7',
          fans: 98
        },
        likes: 189,
        views: '856',
        sold: 45,
        desc: '专业团队，快速通过，服务透明，全程跟踪。',
        advantages: [
          '速度快：最快7个工作日出证',
          '通过率高：专业团队，一次性通过',
          '价格透明：无隐藏费用',
          '服务好：一对一顾问服务'
        ],
        scope: '跨境电商、制造商、出口企业等',
        tags: ['CE认证', '欧盟', '快速办理', '合规'],
        reviews: [
          { avatar: '孙', name: '孙八制造', rating: '⭐⭐⭐⭐ 4.0', text: '认证速度还不错，就是价格有点高。', date: '2024-01-12' }
        ]
      },
      'mock4': {
        id: 'mock4',
        title: '亚马逊店铺代运营服务',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        price: '5,000',
        priceUnit: '/月',
        provider: {
          name: '赵六运营',
          avatarText: '赵',
          avatarBg: '#FCE4EC',
          avatarColor: '#AD1457',
          rating: '4.6',
          fans: 203
        },
        likes: 312,
        views: '2.1k',
        sold: 67,
        desc: '专业运营团队，提升销量，省心省力。',
        advantages: [
          '经验足：5年+运营经验',
          '销量涨：平均提升销量200%+',
          '省心：全程代运营服务',
          '数据好：ROI显著提升'
        ],
        scope: '亚马逊卖家、跨境电商企业等',
        tags: ['亚马逊', '代运营', '销量提升', '专业团队'],
        reviews: [
          { avatar: '周', name: '周九电商', rating: '⭐⭐⭐⭐⭐ 5.0', text: '运营效果很明显，销量翻倍了！', date: '2024-01-22' }
        ]
      },
      'mock5': {
        id: 'mock5',
        title: '独立站搭建一站式服务',
        gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        price: '8,800',
        priceUnit: '/次',
        provider: {
          name: '钱七建站',
          avatarText: '钱',
          avatarBg: '#E0F7FA',
          avatarColor: '#006064',
          rating: '4.9',
          fans: 156
        },
        likes: 456,
        views: '2.8k',
        sold: 89,
        desc: '精品模板，快速上线，SEO优化。',
        advantages: [
          '速度快：7天完成交付',
          '模板好：精品模板可选',
          '优化全：SEO基础优化',
          '售后棒：一年免费维护'
        ],
        scope: '品牌出海、跨境电商、独立站卖家等',
        tags: ['独立站', '建站', 'Shopify', 'WordPress'],
        reviews: [
          { avatar: '郑', name: '郑十一科技', rating: '⭐⭐⭐⭐⭐ 5.0', text: '建站服务很专业，网站效果很好！', date: '2024-01-25' }
        ]
      }
    };

    return mockServices[id] || mockServices['mock1'];
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 关注/取关
  async toggleFollow() {
    try {
      await login.requireLogin();
    } catch (e) {
      return;
    }
    const isFollowing = !this.data.isFollowing;
    this.setData({ isFollowing });
    wx.showToast({
      title: isFollowing ? '已关注' : '已取消关注',
      icon: 'none',
      duration: 1500
    });
  },

  // 点赞/取消点赞
  async toggleLike() {
    try {
      await login.requireLogin();
    } catch (e) {
      return;
    }
    const isLiked = !this.data.isLiked;
    const likeCount = isLiked ? this.data.likeCount + 1 : this.data.likeCount - 1;
    this.setData({ isLiked, likeCount });
  },

  // 分享
  shareService() {
    wx.showToast({
      title: '分享功能开发中...',
      icon: 'none',
      duration: 1500
    });
  },

  // 收藏
  async collectService() {
    try {
      await login.requireLogin();
    } catch (e) {
      return;
    }
    const isCollected = !this.data.isCollected;
    this.setData({ isCollected });
    wx.showToast({
      title: isCollected ? '已收藏' : '已取消收藏',
      icon: 'none',
      duration: 1500
    });
  },

  // 电话
  callMerchant() {
    const phone = this.data.service && this.data.service.phone;
    if (!phone) {
      wx.showToast({ title: '暂无联系电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: phone,
      fail() {}
    });
  },

  // 聊天
  async chatMerchant() {
    try {
      await login.requireLogin();
    } catch (e) {
      return;
    }
    wx.navigateTo({
      url: `/pages/chat/chat?id=${this.data.serviceId}`
    });
  },

  // 立即咨询
  async contactMerchant() {
    try {
      await login.requireLogin();
    } catch (e) {
      return;
    }
    wx.navigateTo({
      url: `/pages/chat/chat?id=${this.data.serviceId}`
    });
  }
});
