const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取服务详情
 */
exports.main = async (event, context) => {
  const { serviceId } = event;

  if (!serviceId) {
    return {
      success: false,
      errMsg: '缺少服务ID'
    };
  }

  try {
    // 查询服务详情
    const serviceResult = await db.collection('services').doc(serviceId).get();

    if (!serviceResult.data) {
      return {
        success: false,
        errMsg: '服务不存在'
      };
    }

    const service = serviceResult.data;

    // 更新浏览量
    await db.collection('services').doc(serviceId).update({
      data: {
        views: (service.views || 0) + 1
      }
    });

    // 查询商家信息
    let merchantInfo = null;
    try {
      const merchantResult = await db.collection('users').doc(service.userId).get();
      if (merchantResult.data) {
        merchantInfo = {
          userId: merchantResult.data._id,
          nickname: merchantResult.data.nickname,
          avatar: merchantResult.data.avatar || '',
          isMerchant: merchantResult.data.isMerchant,
          rating: merchantResult.data.rating || '5.0',
          serviceCount: 0
        };
      }
    } catch (e) {
      // 商家信息查询失败，继续
    }

    // 查询评价列表
    let reviews = [];
    try {
      const reviewResult = await db.collection('reviews')
        .where({ serviceId: serviceId })
        .orderBy('createTime', 'desc')
        .limit(10)
        .get();
      reviews = reviewResult.data || [];
    } catch (e) {
      // 评价查询失败，继续
    }

    return {
      success: true,
      data: {
        id: service._id,
        title: service.title,
        category: service.category,
        description: service.description,
        price: service.price || '面议',
        priceUnit: service.priceUnit || '元',
        phone: service.phone || '',
        images: service.images || [],
        merchant: merchantInfo,
        likes: service.likes || 0,
        views: (service.views || 0) + 1,
        reviews: reviews,
        createTime: service.createTime
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取服务详情失败'
    };
  }
};
