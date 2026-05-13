const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 商家入驻申请
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { companyName, contactName, contactPhone, businessLicense, description, categories } = event;

  // 参数校验
  if (!companyName) {
    return { success: false, errMsg: '请填写公司名称' };
  }
  if (!contactPhone) {
    return { success: false, errMsg: '请填写联系电话' };
  }
  if (!businessLicense) {
    return { success: false, errMsg: '请上传营业执照' };
  }

  try {
    // 1. 获取用户信息
    const userResult = await db.collection('users').where({ openid }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在，请先登录' };
    }

    const user = userResult.data[0];

    // 2. 检查是否已有申请
    if (user.isMerchant && user.merchantStatus !== 'none') {
      const statusText = {
        pending: '您的申请正在审核中，请耐心等待',
        approved: '您已是认证商家，无需重复申请',
        rejected: '您的申请已被拒绝，请联系客服'
      };
      return { success: false, errMsg: statusText[user.merchantStatus] || '无法提交申请' };
    }

    // 3. 创建商家申请记录
    await db.collection('merchant_applications').add({
      data: {
        userId: user._id,
        openid: openid,
        companyName: companyName,
        contactName: contactName || '',
        contactPhone: contactPhone,
        businessLicense: businessLicense,
        description: description || '',
        categories: categories || [],
        status: 'pending',
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    // 4. 更新用户状态
    await db.collection('users').doc(user._id).update({
      data: {
        merchantStatus: 'pending',
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      data: {
        message: '申请已提交，等待审核'
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '提交申请失败'
    };
  }
};
