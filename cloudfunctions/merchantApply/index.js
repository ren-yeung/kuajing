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

    // 2. 检查是否已有申请（允许被拒绝的用户重新提交，最多3次）
    if (user.isMerchant && (user.merchantStatus === 'pending' || user.merchantStatus === 'approved')) {
      const statusText = {
        pending: '您的申请正在审核中，请耐心等待',
        approved: '您已是认证商家，无需重复申请'
      };
      return { success: false, errMsg: statusText[user.merchantStatus] || '无法提交申请' };
    }

    // 检查被拒绝次数，超过3次不允许再提交
    if (user.merchantStatus === 'rejected') {
      const rejectedCount = user.rejectedCount || 0;
      if (rejectedCount >= 3) {
        return { success: false, errMsg: '您提交次数过多，请联系客服' };
      }
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
    // 构建 merchantInfo 对象（确保所有字段都有值，避免写入 null/undefined）
    const merchantInfo = {
      companyName: companyName || '',
      contactName: (contactName && typeof contactName === 'string') ? contactName : '',
      contactPhone: (contactPhone && typeof contactPhone === 'string') ? contactPhone : '',
      description: (description && typeof description === 'string') ? description : '',
      categories: Array.isArray(categories) ? categories : []
    };
    
    // 只有当 businessLicense 存在且非空时才加入
    if (businessLicense && typeof businessLicense === 'string' && businessLicense.length > 0) {
      merchantInfo.businessLicense = businessLicense;
    }

    // 构建更新数据
    const updateData = {
      isMerchant: true,
      merchantStatus: 'pending',
      merchantNickname: user.merchantNickname || '请修改商家名称',
      merchantInfo: merchantInfo,
      updateTime: db.serverDate()
    };

    // 如果之前是被拒绝状态，增加 rejectedCount；否则重置为0
    if (user.merchantStatus === 'rejected') {
      updateData.rejectedCount = (user.rejectedCount || 0) + 1;
    } else {
      updateData.rejectedCount = 0;
    }

    await db.collection('users').doc(user._id).update({
      data: updateData
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
