const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 管理员审核商家申请
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { applicationId, action, rejectReason } = event;

  // 参数校验
  if (!applicationId) {
    return { success: false, errMsg: '缺少申请ID' };
  }
  if (!action || !['approve', 'reject'].includes(action)) {
    return { success: false, errMsg: '无效的审核操作' };
  }
  if (action === 'reject' && !rejectReason) {
    return { success: false, errMsg: '请填写拒绝原因' };
  }

  try {
    // 1. 获取申请记录
    const appResult = await db.collection('merchant_applications').doc(applicationId).get();

    if (!appResult.data) {
      return { success: false, errMsg: '申请记录不存在' };
    }

    const application = appResult.data;

    // 2. 检查申请状态
    if (application.status !== 'pending') {
      return { success: false, errMsg: '该申请已审核过' };
    }

    // 3. 获取用户信息
    const userResult = await db.collection('users').where({
      openid: application.openid
    }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const user = userResult.data[0];

    // 4. 执行审核操作
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const statusText = action === 'approve' ? '审核通过' : '审核拒绝';

    // 更新申请记录
    await db.collection('merchant_applications').doc(applicationId).update({
      data: {
        status: newStatus,
        reviewTime: db.serverDate(),
        reviewerOpenid: openid,
        rejectReason: action === 'reject' ? rejectReason : '',
        updateTime: db.serverDate()
      }
    });

    // 更新用户状态 - 分步更新避免 null/undefined 字段问题
    await db.collection('users').doc(user._id).update({
      data: {
        merchantStatus: newStatus,
        updateTime: db.serverDate(),
        // 审核拒绝时重置 rejectedCount（通过后不再限制）
        rejectedCount: action === 'approve' ? 0 : undefined
      }
    });

    // 如果审核通过，单独设置商家信息
    if (action === 'approve') {
      // 先设置基础字段
      await db.collection('users').doc(user._id).update({
        data: {
          isMerchant: true,
          merchantNickname: user.merchantNickname || '请修改商家名称'
        }
      });

      // 构建完整的 merchantInfo 对象，确保所有字段都有值
      const merchantInfo = {
        companyName: application.companyName || '',
        contactName: application.contactName || '',
        contactPhone: application.contactPhone || '',
        description: application.description || '',
        categories: Array.isArray(application.categories) ? application.categories : []
      };

      // 只有当 businessLicense 存在时才加入
      if (application.businessLicense && application.businessLicense.length > 0) {
        merchantInfo.businessLicense = application.businessLicense;
      }

      // 单独更新 merchantInfo（确保是完整对象而非 null）
      await db.collection('users').doc(user._id).update({
        data: {
          merchantInfo: merchantInfo
        }
      });
    }

    return {
      success: true,
      data: {
        message: `${statusText}成功`,
        newStatus: newStatus
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || `${statusText}失败`
    };
  }
};
