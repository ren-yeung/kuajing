const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取用户信息
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();

    if (userResult.data && userResult.data.length > 0) {
      const user = userResult.data[0];
      return {
        success: true,
        data: {
          userId: user._id,
          nickname: user.nickname,
          merchantNickname: user.merchantNickname || '请修改商家名称',
          avatar: user.avatar || '',
          merchantAvatar: user.merchantAvatar || '',
          phone: user.phone || '',
          isMerchant: user.isMerchant || false,
          merchantStatus: user.merchantStatus || 'none',
          isAdmin: user.isAdmin || false,
          createTime: user.createTime
        }
      };
    }

    return {
      success: false,
      errMsg: '用户不存在'
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取用户信息失败'
    };
  }
};
