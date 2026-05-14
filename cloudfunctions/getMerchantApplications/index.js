const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取商家申请列表（管理员用）
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const { status, page = 1, pageSize = 10 } = event;

  try {
    // 构建查询条件
    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    // 查询申请记录
    const countResult = await db.collection('merchant_applications')
      .where(where)
      .count();

    const total = countResult.total;

    // 分页查询
    const skip = (page - 1) * pageSize;
    const listResult = await db.collection('merchant_applications')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 获取用户信息补充
    const applications = await Promise.all(listResult.data.map(async (app) => {
      // 获取用户信息
      const userResult = await db.collection('users').where({
        openid: app.openid
      }).get();

      const userInfo = userResult.data && userResult.data.length > 0 ? userResult.data[0] : null;

      return {
        _id: app._id,
        userId: app.userId,
        companyName: app.companyName,
        contactName: app.contactName,
        contactPhone: app.contactPhone,
        description: app.description || '',
        categories: app.categories || [],
        businessLicense: app.businessLicense,
        status: app.status,
        createTime: app.createTime,
        updateTime: app.updateTime,
        reviewerOpenid: app.reviewerOpenid || '',
        rejectReason: app.rejectReason || '',
        // 用户补充信息
        userNickname: userInfo ? userInfo.nickname : '',
        userAvatar: userInfo ? userInfo.avatar || '' : '',
        userPhone: userInfo ? userInfo.phone || '' : ''
      };
    }));

    return {
      success: true,
      data: {
        list: applications,
        total: total,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取申请列表失败'
    };
  }
};
