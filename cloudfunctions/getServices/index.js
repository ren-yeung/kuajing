const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取服务列表
 * 支持分类筛选、搜索
 */
exports.main = async (event, context) => {
  const { category, keyword, page = 1, pageSize = 10 } = event;

  try {
    // 暂时不限制状态，获取所有服务用于展示
    let whereObj = {};

    // 分类筛选（只有当 category 有值时才添加筛选条件）
    if (category && category !== 'all' && category.trim() !== '') {
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

    // 查询服务列表
    const serviceResult = await db.collection('services')
      .where(whereObj)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 查询每个服务的商家信息
    const services = await Promise.all(serviceResult.data.map(async (service) => {
      try {
        const merchantResult = await db.collection('users').doc(service.userId).get();
        const merchant = merchantResult.data;
        
        // 获取头像（优先用 users 集合的）
        let avatar = service.merchantAvatar || merchant.avatar || '';
        
        // 如果是云存储 fileID，转换为临时链接
        if (avatar && avatar.startsWith('cloud://')) {
          try {
            const tempFileURL = await cloud.getTempFileURL({
              fileList: [avatar]
            });
            if (tempFileURL.fileList && tempFileURL.fileList[0] && tempFileURL.fileList[0].tempFileURL) {
              avatar = tempFileURL.fileList[0].tempFileURL;
            }
          } catch (e) {
            console.error('获取商家头像临时链接失败', e);
          }
        }
        
        // 转换图片列表的 cloud:// URL 为临时链接
        let images = (service.images || []).map(img => {
          if (img.url && img.url.startsWith('cloud://')) {
            return img;
          }
          return img;
        });
        if (images.length > 0) {
          const cloudImages = images.filter(img => img.url && img.url.startsWith('cloud://')).map(img => img.url);
          if (cloudImages.length > 0) {
            try {
              const tempUrls = await cloud.getTempFileURL({ fileList: cloudImages });
              if (tempUrls.fileList) {
                tempUrls.fileList.forEach((item, index) => {
                  if (item.tempFileURL) {
                    const originalUrl = cloudImages[index];
                    const imgIndex = images.findIndex(img => img.url === originalUrl);
                    if (imgIndex !== -1) {
                      images[imgIndex].url = item.tempFileURL;
                    }
                  }
                });
              }
            } catch (e) {
              console.error('获取图片临时链接失败', e);
            }
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
        
        return {
          id: service._id,
          title: service.title,
          category: service.category,
          description: service.description,
          price: service.price || '面议',
          priceUnit: service.priceUnit || '元',
          images: images,
          provider: merchant.nickname || service.merchantName || '匿名商家',
          avatar: avatar,
          avatarText: (merchant.nickname || service.merchantName || '匿名').charAt(0),
          avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          avatarColor: '#fff',
          rating: service.rating || '5.0',
          likes: service.likes || 0,
          views: service.views || 0,
          createTime: service.createTime,
          postTime: formatPostTime(service.createTime)
        };
      } catch (e) {
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
        
        return {
          id: service._id,
          title: service.title,
          category: service.category,
          description: service.description,
          price: service.price || '面议',
          priceUnit: service.priceUnit || '元',
          images: service.images || [],
          provider: service.merchantName || '匿名商家',
          avatar: service.merchantAvatar || '',
          avatarText: (service.merchantName || '匿名').charAt(0),
          avatarBg: '#E6F1FB',
          avatarColor: '#185FA5',
          avatarText: (service.merchantName || '匿名').charAt(0),
          avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          avatarColor: '#fff',
          rating: '5.0',
          likes: 0,
          views: 0,
          createTime: service.createTime,
          postTime: formatPostTime(service.createTime)
        };
      }
    }));

    return {
      success: true,
      data: {
        list: services,
        page: page,
        pageSize: pageSize,
        total: services.length
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取服务列表失败'
    };
  }
};
