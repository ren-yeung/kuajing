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

    // 更新浏览量
    await db.collection('demands').doc(demandId).update({
      data: {
        views: (demand.views || 0) + 1
      }
    });

    // 查询发布者信息
    let publisherInfo = null;
    try {
      const userResult = await db.collection('users').doc(demand.userId).get();
      if (userResult.data) {
        publisherInfo = {
          userId: userResult.data._id,
          nickname: userResult.data.nickname,
          avatar: userResult.data.avatar || '',
          createTime: userResult.data.createTime
        };
      }
    } catch (e) {
      // 用户信息查询失败，继续
    }

    // 查询相似需求
    let similarDemands = [];
    try {
      const similarResult = await db.collection('demands')
        .where({
          category: demand.category,
          status: 'open',
          _id: db.command.neq(demandId)
        })
        .limit(5)
        .get();
      similarDemands = similarResult.data || [];
    } catch (e) {
      // 相似需求查询失败，继续
    }

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
        views: (demand.views || 0) + 1,
        contactCount: demand.contactCount || 0,
        similarDemands: similarDemands,
        createTime: demand.createTime
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取需求详情失败'
    };
  }
};
