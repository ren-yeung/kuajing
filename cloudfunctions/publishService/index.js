const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 发布服务（商家）
 * 需要验证用户是否为商家身份
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { title, category, description, price, images, serviceFlow, deliveryCycle } = event;

  // 参数校验
  if (!title) {
    return { success: false, errMsg: '请填写服务标题' };
  }
  if (!category) {
    return { success: false, errMsg: '请选择服务分类' };
  }
  if (!description) {
    return { success: false, errMsg: '请填写服务描述' };
  }

  try {
    // 1. 验证商家身份
    const userResult = await db.collection('users').where({ openid }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在，请先登录' };
    }

    const user = userResult.data[0];

    if (!user.isMerchant || user.merchantStatus !== 'approved') {
      return { success: false, errMsg: '您还不是认证商家，无法发布服务' };
    }

    // 2. 创建服务记录
    const result = await db.collection('services').add({
      data: {
        userId: user._id,
        merchantName: user.nickname,
        title: title,
        category: category,
        description: description,
        price: price || '',
        images: images || [],
        serviceFlow: serviceFlow || '',
        deliveryCycle: deliveryCycle || '',
        status: 'pending', // 待审核
        rating: '5.0',
        likes: 0,
        views: 0,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      data: {
        serviceId: result._id,
        message: '服务发布成功，等待审核'
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '发布服务失败'
    };
  }
};
