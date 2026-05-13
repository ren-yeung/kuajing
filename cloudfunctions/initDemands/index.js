const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 初始化示例需求数据
 * 运行一次即可
 */
exports.main = async (event, context) => {
  try {
    // 先检查是否已有数据
    const existingDemands = await db.collection('demands').count();
    
    if (existingDemands.total > 0) {
      return {
        success: true,
        message: `数据库已有 ${existingDemands.total} 条数据，无需重复初始化`,
        total: existingDemands.total
      };
    }

    // 创建示例用户
    const userResult = await db.collection('users').add({
      data: {
        nickname: '跨境老王',
        avatar: '',
        createTime: db.serverDate()
      }
    });
    const userId = userResult._id;

    // 示例需求数据
    const mockDemands = [
      {
        title: '亚马逊产品Listing优化服务',
        category: '运营服务',
        description: '需要专业团队优化现有Listing，包括标题、关键词、图片、描述等，提升搜索排名和转化率。',
        budgetMin: 2000,
        budgetMax: 5000,
        deadline: '2026-06-15',
        images: [],
        status: 'open',
        userId: userId,
        contactCount: 12,
        createTime: db.serverDate()
      },
      {
        title: '日本FBA头程物流合作',
        category: '物流服务',
        description: '寻求靠谱的日本FBA头程物流服务商，要求价格优惠、时效稳定、清关能力强。',
        budgetMin: 5000,
        budgetMax: 20000,
        deadline: '2026-06-30',
        images: [],
        status: 'open',
        userId: userId,
        contactCount: 8,
        createTime: db.serverDate()
      },
      {
        title: '独立站Shopify建站服务',
        category: '建站服务',
        description: '需要搭建一个以服装为主的Shopify独立站，包含主题定制、支付对接、基础SEO设置。',
        budgetMin: 8000,
        budgetMax: 15000,
        deadline: '2026-07-15',
        images: [],
        status: 'open',
        userId: userId,
        contactCount: 23,
        createTime: db.serverDate()
      },
      {
        title: '英国VAT注册及申报服务',
        category: '合规服务',
        description: '新开英国站，需要办理VAT注册并提供季度申报服务，最好有HMRC认可资质。',
        budgetMin: 3000,
        budgetMax: 8000,
        deadline: '2026-06-20',
        images: [],
        status: 'open',
        userId: userId,
        contactCount: 5,
        createTime: db.serverDate()
      },
      {
        title: '亚马逊红人营销合作',
        category: '营销服务',
        description: '寻找适合家居类目的YouTube和Instagram红人，要求粉丝真实、互动率高、能做产品测评。',
        budgetMin: 10000,
        budgetMax: 30000,
        deadline: '2026-07-31',
        images: [],
        status: 'open',
        userId: userId,
        contactCount: 18,
        createTime: db.serverDate()
      }
    ];

    // 批量插入数据
    const tasks = mockDemands.map(demand => {
      return db.collection('demands').add({
        data: demand
      });
    });

    const results = await Promise.all(tasks);

    return {
      success: true,
      message: '成功创建示例需求数据',
      total: results.length
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '初始化数据失败'
    };
  }
};
