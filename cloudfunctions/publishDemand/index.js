const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 发布需求
 * 所有登录用户都可以发布需求
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { title, category, description, budgetMin, budgetMax, deadline, images, tags, region, phone, avatar, nickname } = event;

  // 参数校验
  if (!title) {
    return { success: false, errMsg: '请填写需求标题' };
  }
  if (!category) {
    return { success: false, errMsg: '请选择需求分类' };
  }
  if (!description) {
    return { success: false, errMsg: '请填写需求描述' };
  }

  try {
    // 1. 验证用户身份
    const userResult = await db.collection('users').where({ openid }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在，请先登录' };
    }

    const user = userResult.data[0];

    // 2. 创建需求记录
    const result = await db.collection('demands').add({
      data: {
        userId: user._id,
        nickname: nickname || user.nickname,
        avatar: avatar || user.avatar || '',
        title: title,
        category: category,
        description: description,
        budgetMin: budgetMin || 0,
        budgetMax: budgetMax || 0,
        deadline: deadline || '',
        region: region || '',
        tags: tags || [],
        phone: phone || '',
        images: images || [],
        status: 'open', // 进行中
        views: 0,
        applyCount: 0,
        contactCount: 0,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      data: {
        demandId: result._id,
        message: '需求发布成功'
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '发布需求失败'
    };
  }
};
