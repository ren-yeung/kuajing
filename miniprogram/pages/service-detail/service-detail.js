// service-detail.js
const login = require('../../utils/login.js');

Page({
  data: {
    serviceId: null,
    service: {},
    isFollowing: false,
    isLiked: false,
    isCollected: false,
    likeCount: 0
  },

  onLoad(options) {
    const serviceId = parseInt(options.id) || 1;
    this.setData({ serviceId });
    this.loadServiceDetail(serviceId);
  },

  // 加载服务详情（模拟数据）
  loadServiceDetail(id) {
    const allServices = {
      1: {
        id: 1,
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
      2: {
        id: 2,
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
      3: {
        id: 3,
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
        views: 856,
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
      4: {
        id: 4,
        title: '海外仓储一站式服务',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        price: '1,200',
        priceUnit: '/月',
        provider: {
          name: '赵六仓储',
          avatarText: '赵',
          avatarBg: '#E1F5EE',
          avatarColor: '#0D6832',
          rating: '4.6',
          fans: 76
        },
        likes: 312,
        views: '1.5k',
        sold: 67,
        desc: '美国欧洲海外仓，一件代发，退货处理，仓储管理。',
        advantages: [
          '覆盖广：美国、欧洲多仓覆盖',
          '服务全：一件代发、退货、换标',
          '系统好：实时库存管理系统',
          '价格优：仓储费用低至¥1.5/天'
        ],
        scope: '跨境电商、大卖家的仓储需求',
        tags: ['海外仓', '一件代发', '退货处理', '仓储管理'],
        reviews: [
          { avatar: '周', name: '周九电商', rating: '⭐⭐⭐⭐⭐ 5.0', text: '海外仓服务很好，发货速度快。', date: '2024-01-22' },
          { avatar: '吴', name: '吴十贸易', rating: '⭐⭐⭐⭐ 4.0', text: '整体不错，退换货处理很专业。', date: '2024-01-19' }
        ]
      },
      5: {
        id: 5,
        title: 'TikTok海外广告投放',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        price: '5,000',
        priceUnit: '/月',
        provider: {
          name: '孙七营销',
          avatarText: '孙',
          avatarBg: '#FBEAF0',
          avatarColor: '#C4185A',
          rating: '4.8',
          fans: 203
        },
        likes: 445,
        views: '2.1k',
        sold: 78,
        desc: 'TikTok、Facebook精准投放，提升ROI，专业团队。',
        advantages: [
          'ROI高：平均ROI 1:4以上',
          '精准投放：AI算法优化广告',
          '多平台：TikTok、Facebook、Google',
          '数据透明：实时数据报告'
        ],
        scope: '跨境电商、品牌出海、独立站等',
        tags: ['TikTok', '广告投放', 'ROI优化', '精准营销'],
        reviews: [
          { avatar: '郑', name: '郑十一科技', rating: '⭐⭐⭐⭐⭐ 5.0', text: '广告投放效果很好，ROI提升明显。', date: '2024-01-25' }
        ]
      },
      6: {
        id: 6,
        title: '跨境电商培训咨询',
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        price: '1,980',
        priceUnit: '/课程',
        provider: {
          name: '周八培训',
          avatarText: '周',
          avatarBg: '#EEEDFE',
          avatarColor: '#4A1BB4',
          rating: '4.9',
          fans: 345
        },
        likes: 678,
        views: '3.8k',
        sold: 234,
        desc: '从零开始做跨境电商，全流程指导，实战案例。',
        advantages: [
          '内容全：从选品到发货全流程',
          '实战强：真实案例拆解',
          '服务好：一对一答疑',
          '更新快：课程内容持续更新'
        ],
        scope: '跨境电商新手、创业者、传统企业转型等',
        tags: ['跨境电商', '培训', '实战', '全流程'],
        reviews: [
          { avatar: '王', name: '王十二贸易', rating: '⭐⭐⭐⭐⭐ 5.0', text: '课程内容很实用，学到了很多。', date: '2024-01-28' },
          { avatar: '冯', name: '冯十三电商', rating: '⭐⭐⭐⭐⭐ 5.0', text: '老师讲得很清楚，适合新手。', date: '2024-01-26' }
        ]
      }
    };

    const service = allServices[id] || allServices[1];
    this.setData({
      service,
      likeCount: service.likes
    });
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
    wx.makePhoneCall({
      phoneNumber: '13800000000',
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
