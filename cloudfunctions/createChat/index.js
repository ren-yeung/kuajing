const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 创建或获取聊天会话（基于服务）
 * 用户点击"立即咨询"时调用
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { serviceId } = event;

  if (!serviceId) {
    return { success: false, errMsg: '缺少服务ID' };
  }

  try {
    // 1. 获取当前用户信息
    const userResult = await db.collection('users').where({ openid }).get();
    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在，请先登录' };
    }
    const currentUser = userResult.data[0];

    // 2. 获取服务信息
    const serviceResult = await db.collection('services').doc(serviceId).get();
    if (!serviceResult.data) {
      return { success: false, errMsg: '服务不存在' };
    }
    const service = serviceResult.data;

    // 商家ID
    const merchantId = service.userId;
    const merchantName = service.merchantName || '商家';

    // 3. 检查是否已存在聊天会话（基于用户+服务）
    const chatResult = await db.collection('chats')
      .where({
        userId: currentUser._id,
        serviceId: serviceId
      })
      .get();

    let chatId;
    let isNew = false;

    if (chatResult.data && chatResult.data.length > 0) {
      // 已存在，返回现有聊天ID
      chatId = chatResult.data[0]._id;
    } else {
      // 创建新聊天
      const newChat = await db.collection('chats').add({
        data: {
          userId: currentUser._id,
          userName: currentUser.nickname,
          userAvatar: currentUser.avatar || '',
          merchantId: merchantId,
          merchantName: merchantName,
          merchantAvatar: service.merchantAvatar || '',
          serviceId: serviceId,
          serviceTitle: service.title,
          lastMessage: '',
          lastMessageTime: db.serverDate(),
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          unreadCount: 0
        }
      });
      chatId = newChat._id;
      isNew = true;

      // 同时在商家端也创建一个聊天会话（反向）
      await db.collection('chats').add({
        data: {
          userId: merchantId,
          userName: merchantName,
          userAvatar: service.merchantAvatar || '',
          merchantId: currentUser._id,
          merchantName: currentUser.nickname,
          merchantAvatar: currentUser.avatar || '',
          serviceId: serviceId,
          serviceTitle: service.title,
          lastMessage: '',
          lastMessageTime: db.serverDate(),
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          unreadCount: 0,
          isMerchantView: true // 标记为商家端视图
        }
      });
    }

    return {
      success: true,
      data: {
        chatId,
        chatName: merchantName,
        isNew,
        peerUser: {
          id: merchantId,
          name: merchantName,
          avatar: service.merchantAvatar || ''
        }
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '创建聊天失败'
    };
  }
};
