const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取商家入驻状态/成为商家
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 1. 获取用户信息
    const userResult = await db.collection('users').where({ openid }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const user = userResult.data[0];

    return {
      success: true,
      data: {
        isMerchant: user.isMerchant || false,
        merchantStatus: user.merchantStatus || 'none',
        merchantInfo: user.merchantInfo || null
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取商家状态失败'
    };
  }
};
