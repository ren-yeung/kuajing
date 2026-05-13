const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 用户登录/注册
 * 流程：获取openid → 查询用户表 → 无则创建
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 1. 查询用户是否已存在
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();

    if (userResult.data && userResult.data.length > 0) {
      // 用户已存在，返回用户信息（如果传了新的昵称/头像则更新）
      const user = userResult.data[0];
      const hasNewInfo = event.nickname && event.nickname !== user.nickname && event.nickname !== '微信用户';

      if (hasNewInfo) {
        await db.collection('users').doc(user._id).update({
          data: {
            nickname: event.nickname,
            avatar: event.avatar || user.avatar,
            updateTime: db.serverDate()
          }
        });
        user.nickname = event.nickname;
        user.avatar = event.avatar || user.avatar;
      }

      return {
        success: true,
        data: {
          userId: user._id,
          nickname: user.nickname,
          avatar: user.avatar || '',
          isMerchant: user.isMerchant || false,
          merchantStatus: user.merchantStatus || 'none',
          isNewUser: false
        }
      };
    }

    // 2. 新用户，创建用户记录（优先使用微信授权的用户信息）
    const nickname = event.nickname || '微信用户';
    const avatar = event.avatar || '';
    const createResult = await db.collection('users').add({
      data: {
        openid: openid,
        nickname: nickname,
        avatar: avatar,
        gender: event.gender || 0,
        phone: '',
        isMerchant: false,
        merchantStatus: 'none',
        merchantInfo: null,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      data: {
        userId: createResult._id,
        nickname: nickname,
        avatar: avatar,
        isMerchant: false,
        merchantStatus: 'none',
        isNewUser: true
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '登录失败'
    };
  }
};
