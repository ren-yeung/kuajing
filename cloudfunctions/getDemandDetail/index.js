const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取需求详情
 */
exports.main = async (event, context) => {
  const { demandId } = event;

  if (!demandId) {
    return {
      success: false,
      errMsg: '缺少需求ID'
    };
  }

  try {
    // 查询需求详情
    const demandResult = await db.collection('demands').doc(demandId).get();

    if (!demandResult.data) {
      return {
        success: false,
        errMsg: '需求不存在'
      };
    }

    const demand = demandResult.data;
    const newViews = (demand.views || 0) + 1;

    // 异步更新浏览量（不等待）
    db.collection('demands').doc(demandId).update({
      data: { views: newViews }
    }).catch(() => {});

    // 获取用户信息（优先用 demand 中保存的，否则从 users 集合查询）
    let nickname = demand.nickname;
    let avatar = demand.avatar;
    
    if (!nickname || !avatar) {
      try {
        const userResult = await db.collection('users').doc(demand.userId).get();
        if (userResult.data) {
          nickname = nickname || userResult.data.nickname || '匿名用户';
          avatar = avatar || userResult.data.avatar || '';
        } else {
          nickname = nickname || '匿名用户';
        }
      } catch (e) {
        nickname = nickname || '匿名用户';
      }
    }

    // 如果 avatar 是云存储 fileID，转换为临时链接
    if (avatar && avatar.startsWith('cloud://')) {
      try {
        const tempFileURL = await cloud.getTempFileURL({
          fileList: [avatar]
        });
        if (tempFileURL.fileList && tempFileURL.fileList[0] && tempFileURL.fileList[0].tempFileURL) {
          avatar = tempFileURL.fileList[0].tempFileURL;
        }
      } catch (e) {
        console.error('获取头像临时链接失败', e);
      }
    }

    const publisherInfo = {
      userId: demand.userId,
      nickname: nickname,
      avatar: avatar
    };

    return {
      success: true,
      data: {
        id: demand._id,
        title: demand.title,
        category: demand.category,
        description: demand.description,
        budgetMin: demand.budgetMin || 0,
        budgetMax: demand.budgetMax || 0,
        deadline: demand.deadline || '',
        images: demand.images || [],
        publisher: publisherInfo,
        views: newViews,
        contactCount: demand.contactCount || 0,
        createTime: demand.createTime,
        tags: demand.tags || [],
        region: demand.region || '',
        status: demand.status || 'open',
        applyCount: demand.applyCount || 0
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取需求详情失败'
    };
  }
};
