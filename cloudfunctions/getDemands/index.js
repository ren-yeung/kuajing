const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取需求列表
 * 支持分类筛选、搜索
 */
exports.main = async (event, context) => {
  const { category, keyword, page = 1, pageSize = 10 } = event;

  try {
    let whereObj = {
      status: 'open' // 只返回进行中的需求
    };

    // 分类筛选
    if (category && category !== 'all') {
      whereObj.category = category;
    }

    // 搜索关键词
    if (keyword) {
      whereObj.title = db.RegExp({
        regexp: keyword,
        options: 'i'
      });
    }

    const skip = (page - 1) * pageSize;

    // 查询需求列表
    const demandResult = await db.collection('demands')
      .where(whereObj)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 查询每个需求的用户信息
    const demands = await Promise.all(demandResult.data.map(async (demand) => {
      try {
        const userResult = await db.collection('users').doc(demand.userId).get();
        const user = userResult.data;
        return {
          id: demand._id,
          title: demand.title,
          category: demand.category,
          description: demand.description,
          budgetMin: demand.budgetMin || 0,
          budgetMax: demand.budgetMax || 0,
          deadline: demand.deadline || '',
          images: demand.images || [],
          publisher: user.nickname || '匿名用户',
          avatar: user.avatar || '',
          contactCount: demand.contactCount || 0,
          createTime: demand.createTime
        };
      } catch (e) {
        return {
          id: demand._id,
          title: demand.title,
          category: demand.category,
          description: demand.description,
          budgetMin: demand.budgetMin || 0,
          budgetMax: demand.budgetMax || 0,
          deadline: demand.deadline || '',
          images: demand.images || [],
          publisher: '匿名用户',
          avatar: '',
          contactCount: 0,
          createTime: demand.createTime
        };
      }
    }));

    return {
      success: true,
      data: {
        list: demands,
        page: page,
        pageSize: pageSize,
        total: demands.length
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取需求列表失败'
    };
  }
};
