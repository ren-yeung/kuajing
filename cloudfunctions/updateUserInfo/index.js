const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 更新用户信息
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 1. 获取用户信息
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const user = userResult.data[0];

    // 2. 构建更新数据
    const updateData = {
      updateTime: db.serverDate()
    };

    // 可更新的字段
    if (event.nickname !== undefined) {
      updateData.nickname = event.nickname;
    }
    if (event.merchantNickname !== undefined) {
      updateData.merchantNickname = event.merchantNickname;
    }
    if (event.avatar !== undefined) {
      updateData.avatar = event.avatar;
    }
    if (event.merchantAvatar !== undefined) {
      updateData.merchantAvatar = event.merchantAvatar;
    }
    if (event.phone !== undefined) {
      updateData.phone = event.phone;
    }
    if (event.signature !== undefined) {
      updateData.signature = event.signature;
    }

    // 3. 更新用户信息
    await db.collection('users').doc(user._id).update({
      data: updateData
    });

    return {
      success: true,
      data: {
        message: '更新成功'
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '更新失败'
    };
  }
};
