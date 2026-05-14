const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取服务详情
 */
exports.main = async (event, context) => {
  const { serviceId } = event;

  if (!serviceId) {
    return {
      success: false,
      errMsg: '缺少服务ID'
    };
  }

  try {
    // 查询服务详情
    const serviceResult = await db.collection('services').doc(serviceId).get();

    if (!serviceResult.data) {
      return {
        success: false,
        errMsg: '服务不存在'
      };
    }

    const service = serviceResult.data;

    // 更新浏览量
    await db.collection('services').doc(serviceId).update({
      data: {
        views: (service.views || 0) + 1
      }
    });

    // 查询商家信息
    let merchantInfo = null;
    let merchantAvatar = service.merchantAvatar || '';
    
    try {
      const merchantResult = await db.collection('users').doc(service.userId).get();
      if (merchantResult.data) {
        // 优先用 users 集合的头像
        const userAvatar = merchantResult.data.avatar || '';
        merchantAvatar = userAvatar || merchantAvatar;
        
        // 如果是云存储 fileID，转换为临时链接
        if (merchantAvatar && merchantAvatar.startsWith('cloud://')) {
          try {
            const tempFileURL = await cloud.getTempFileURL({
              fileList: [merchantAvatar]
            });
            if (tempFileURL.fileList && tempFileURL.fileList[0] && tempFileURL.fileList[0].tempFileURL) {
              merchantAvatar = tempFileURL.fileList[0].tempFileURL;
            }
          } catch (e) {
            console.error('获取商家头像临时链接失败', e);
          }
        }
        
        merchantInfo = {
          userId: merchantResult.data._id,
          nickname: merchantResult.data.nickname || service.merchantName || '匿名商家',
          avatar: merchantAvatar,
          isMerchant: merchantResult.data.isMerchant,
          rating: merchantResult.data.rating || '5.0',
          serviceCount: 0
        };
      }
    } catch (e) {
      // 商家信息查询失败，使用服务记录中的信息
      merchantInfo = {
        userId: service.userId,
        nickname: service.merchantName || '匿名商家',
        avatar: merchantAvatar,
        isMerchant: true,
        rating: '5.0',
        serviceCount: 0
      };
    }

    // 转换图片列表的 cloud:// URL 为临时链接
    // 兼容处理：images 可能是对象数组 [{url: '...'}] 或字符串数组 ['cloud://...']
    let images = (service.images || []).map(img => {
      if (typeof img === 'string') {
        return { url: img };
      }
      return { url: img.url || img };
    });
    
    if (images.length > 0) {
      // 收集所有需要转换的 cloud:// URL
      const cloudImages = [];
      const imageIndexMap = {}; // 记录每个 cloud URL 对应的索引
      
      images.forEach((img, index) => {
        if (img.url && img.url.startsWith('cloud://')) {
          cloudImages.push(img.url);
          imageIndexMap[img.url] = index;
        }
      });
      
      if (cloudImages.length > 0) {
        try {
          const tempUrls = await cloud.getTempFileURL({ fileList: cloudImages });
          if (tempUrls.fileList) {
            tempUrls.fileList.forEach((item, idx) => {
              if (item.tempFileURL) {
                const originalUrl = cloudImages[idx];
                const imgIndex = imageIndexMap[originalUrl];
                if (imgIndex !== undefined) {
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

    // 查询评价列表
    let reviews = [];
    try {
      const reviewResult = await db.collection('reviews')
        .where({ serviceId: serviceId })
        .orderBy('createTime', 'desc')
        .limit(10)
        .get();
      reviews = reviewResult.data || [];
    } catch (e) {
      // 评价查询失败，继续
    }

    return {
      success: true,
      data: {
        id: service._id,
        title: service.title,
        category: service.category,
        description: service.description,
        advantage: service.advantage || '',
        scope: service.scope || '',
        price: service.price || '面议',
        priceUnit: service.priceUnit || '元',
        phone: service.phone || '',
        images: images,
        tags: service.tags || [],
        advantages: service.advantages || [],
        merchant: merchantInfo,
        likes: service.likes || 0,
        views: (service.views || 0) + 1,
        reviews: reviews,
        createTime: service.createTime
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取服务详情失败'
    };
  }
};
