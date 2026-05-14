const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 设置管理员权限
 * 参数：targetOpenid - 要设置为管理员的用户openid
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const adminOpenid = wxContext.OPENID; // 调用者的openid
  
  // 管理员白名单（只有这些openid可以设置管理员）
  const adminWhitelist = [
    'oTvU23WDD7H9fUSxRabng2vtzfts' // 你提供的管理员openid
  ];
  
  // 检查是否是授权管理员
  if (!adminWhitelist.includes(adminOpenid)) {
    return {
      success: false,
      errMsg: '无权操作'
    };
  }
  
  const { targetOpenid } = event;
  
  if (!targetOpenid) {
    return {
      success: false,
      errMsg: '缺少目标用户openid'
    };
  }
  
  try {
    // 查找目标用户
    const userResult = await db.collection('users').where({
      openid: targetOpenid
    }).get();
    
    if (userResult.data && userResult.data.length === 0) {
      return {
        success: false,
        errMsg: '用户不存在'
      };
    }
    
    const userId = userResult.data[0]._id;
    
    // 更新为管理员
    await db.collection('users').doc(userId).update({
      data: {
        isAdmin: true
      }
    });
    
    return {
      success: true,
      message: `用户 ${targetOpenid} 已设置为管理员`
    };
    
  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '设置失败'
    };
  }
};
