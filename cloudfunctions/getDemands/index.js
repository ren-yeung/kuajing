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
        // 格式化预算
        let budget = '';
        if (demand.budgetMin > 0 && demand.budgetMax > 0) {
          budget = `¥${demand.budgetMin.toLocaleString()}-${demand.budgetMax.toLocaleString()}`;
        } else if (demand.budgetMin > 0) {
          budget = `¥${demand.budgetMin}+`;
        } else if (demand.budgetMax > 0) {
          budget = `¥${demand.budgetMax}以内`;
        }
        
        // 头像文字
        const nickName = user.nickname || demand.nickname || '匿名';
        const avatarText = nickName.charAt(0);
        
        return {
          id: demand._id,
          title: demand.title,
          category: demand.category,
          description: demand.description,
          budgetMin: demand.budgetMin || 0,
          budgetMax: demand.budgetMax || 0,
          budget: budget,
          deadline: demand.deadline || '',
          region: demand.region || '',
          tags: demand.tags || [],
          images: demand.images || [],
          userName: nickName,
          avatar: demand.avatar || user.avatar || '',
          avatarText: avatarText,
          avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          avatarColor: '#fff',
          views: demand.views || 0,
          applyCount: demand.applyCount || 0,
          contactCount: demand.contactCount || 0,
          createTime: demand.createTime
        };
      } catch (e) {
        let budget = '';
        if (demand.budgetMin > 0 && demand.budgetMax > 0) {
          budget = `¥${demand.budgetMin.toLocaleString()}-${demand.budgetMax.toLocaleString()}`;
        } else if (demand.budgetMin > 0) {
          budget = `¥${demand.budgetMin}+`;
        } else if (demand.budgetMax > 0) {
          budget = `¥${demand.budgetMax}以内`;
        }
        
        const nickName = demand.nickname || '匿名';
        return {
          id: demand._id,
          title: demand.title,
          category: demand.category,
          description: demand.description,
          budgetMin: demand.budgetMin || 0,
          budgetMax: demand.budgetMax || 0,
          budget: budget,
          deadline: demand.deadline || '',
          region: demand.region || '',
          tags: demand.tags || [],
          images: demand.images || [],
          userName: nickName,
          avatar: demand.avatar || '',
          avatarText: nickName.charAt(0),
          avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          avatarColor: '#fff',
          views: demand.views || 0,
          applyCount: demand.applyCount || 0,
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
