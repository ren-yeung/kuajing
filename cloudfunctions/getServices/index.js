const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取服务列表
 * 支持分类筛选、搜索
 */
exports.main = async (event, context) => {
  const { category, keyword, page = 1, pageSize = 10 } = event;

  try {
    // 暂时不限制状态，获取所有服务用于展示
    let whereObj = {};

    // 分类筛选
    if (category && category !== 'all') {
      whereObj.category = category;
    }

    // 搜索关键词
    if (keyword) {
      whereObj.title = db.RegExp({
        regexp: keyword,
        options: 'i'
      });
    }

    const skip = (page - 1) * pageSize;

    // 查询服务列表
    const serviceResult = await db.collection('services')
      .where(whereObj)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 查询每个服务的商家信息
    const services = await Promise.all(serviceResult.data.map(async (service) => {
      try {
        const merchantResult = await db.collection('users').doc(service.userId).get();
        const merchant = merchantResult.data;
        return {
          id: service._id,
          title: service.title,
          category: service.category,
          description: service.description,
          price: service.price || '面议',
          images: service.images || [],
          provider: merchant.nickname || '匿名商家',
          avatar: merchant.avatar || '',
          rating: service.rating || '5.0',
          likes: service.likes || 0,
          views: service.views || 0,
          createTime: service.createTime
        };
      } catch (e) {
        return {
          id: service._id,
          title: service.title,
          category: service.category,
          description: service.description,
          price: service.price || '面议',
          images: service.images || [],
          provider: '匿名商家',
          avatar: '',
          rating: '5.0',
          likes: 0,
          views: 0,
          createTime: service.createTime
        };
      }
    }));

    return {
      success: true,
      data: {
        list: services,
        page: page,
        pageSize: pageSize,
        total: services.length
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取服务列表失败'
    };
  }
};
