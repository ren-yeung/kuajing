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
      // 格式化预算
      let budget = '';
      if (demand.budgetMin > 0 && demand.budgetMax > 0) {
        budget = `¥${demand.budgetMin.toLocaleString()}-${demand.budgetMax.toLocaleString()}`;
      } else if (demand.budgetMin > 0) {
        budget = `¥${demand.budgetMin}+`;
      } else if (demand.budgetMax > 0) {
        budget = `¥${demand.budgetMax}以内`;
      }

      // 获取昵称和头像（优先用 demand 中保存的，否则从 users 集合查询）
      let nickName = demand.nickname;
      let avatar = demand.avatar;

      if (!nickName || !avatar) {
        try {
          const userResult = await db.collection('users').doc(demand.userId).get();
          if (userResult.data) {
            nickName = nickName || userResult.data.nickname || '匿名';
            avatar = avatar || userResult.data.avatar || '';
          } else {
            nickName = nickName || '匿名';
          }
        } catch (e) {
          nickName = nickName || '匿名';
        }
      }

      // 计算相对时间
      const formatPostTime = (createTime) => {
        if (!createTime) return '';
        const now = Date.now();
        const createDate = createTime instanceof Date ? createTime.getTime() : new Date(createTime).getTime();
        const diff = now - createDate;
        const hours = Math.floor(diff / (60 * 60 * 1000));
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        if (hours < 1) return '刚刚';
        if (hours < 24) return `${hours}小时前`;
        if (days < 30) return `${days}天前`;
        return '1个月前';
      };

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
        avatar: avatar,
        avatarText: avatarText,
        avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        avatarColor: '#fff',
        views: demand.views || 0,
        applyCount: demand.applyCount || 0,
        contactCount: demand.contactCount || 0,
        createTime: demand.createTime,
        postTime: formatPostTime(demand.createTime)
      };
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
