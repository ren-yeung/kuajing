const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 报名需求
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { demandId } = event;

  if (!demandId) {
    return { success: false, errMsg: '缺少需求ID' };
  }

  if (!openid) {
    return { success: false, errMsg: '用户未登录' };
  }

  try {
    // 1. 验证用户身份
    const userResult = await db.collection('users').where({ openid }).get();
    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在，请先登录' };
    }
    const user = userResult.data[0];

    // 2. 获取需求信息
    const demandResult = await db.collection('demands').doc(demandId).get();
    if (!demandResult.data) {
      return { success: false, errMsg: '需求不存在' };
    }
    const demand = demandResult.data;

    // 3. 检查需求状态
    if (demand.status === 'closed') {
      return { success: false, errMsg: '该需求已截止报名' };
    }
    if (demand.status === 'full') {
      return { success: false, errMsg: '报名人数已满' };
    }

    // 4. 检查是否已达10人上限
    const applyCount = demand.applyCount || 0;
    if (applyCount >= 10) {
      // 更新状态为已满
      await db.collection('demands').doc(demandId).update({
        data: { status: 'full' }
      });
      return { success: false, errMsg: '报名人数已满（最多10人）' };
    }

    // 5. 检查是否已报名
    const existingApply = await db.collection('demand_applications')
      .where({
        demandId: demandId,
        userId: user._id
      })
      .get();
    
    if (existingApply.data && existingApply.data.length > 0) {
      return { success: false, errMsg: '您已报名该需求' };
    }

    // 6. 检查是否是自己的需求
    if (demand.userId === user._id) {
      return { success: false, errMsg: '不能报名自己的需求' };
    }

    // 7. 创建报名记录
    await db.collection('demand_applications').add({
      data: {
        demandId: demandId,
        userId: user._id,
        nickname: user.nickname,
        avatar: user.avatar || '',
        phone: user.phone || '',
        applyTime: db.serverDate(),
        status: 'pending' // pending/accepted/rejected
      }
    });

    // 8. 更新需求的报名数量
    const newApplyCount = applyCount + 1;
    let newStatus = demand.status;
    
    // 如果达到10人，自动更新为已满状态
    if (newApplyCount >= 10) {
      newStatus = 'full';
    }

    await db.collection('demands').doc(demandId).update({
      data: {
        applyCount: newApplyCount,
        status: newStatus
      }
    });

    return {
      success: true,
      data: {
        applyCount: newApplyCount,
        status: newStatus,
        message: '报名成功'
      }
    };

  } catch (err) {
    console.error('报名失败', err);
    return {
      success: false,
      errMsg: err.message || '报名失败'
    };
  }
};
