const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 发送聊天消息（基于服务咨询）
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { chatId, content, serviceId } = event;

  if (!content || !content.trim()) {
    return { success: false, errMsg: '消息内容不能为空' };
  }

  if (!chatId) {
    return { success: false, errMsg: '缺少聊天ID' };
  }

  try {
    // 1. 获取当前用户信息
    const userResult = await db.collection('users').where({ openid }).get();
    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }
    const currentUser = userResult.data[0];

    // 2. 获取聊天会话信息
    const chatResult = await db.collection('chats').doc(chatId).get();
    if (!chatResult.data) {
      return { success: false, errMsg: '聊天不存在' };
    }
    const chat = chatResult.data;

    // 3. 确定接收者
    const receiverId = chat.userId === currentUser._id ? chat.merchantId : chat.userId;
    const senderName = currentUser.nickname || '用户';
    const senderAvatar = currentUser.merchantAvatar || currentUser.avatar || '';

    // 4. 创建消息记录
    const messageResult = await db.collection('chat_messages').add({
      data: {
        chatId: chatId,
        senderId: currentUser._id,
        senderName: senderName,
        senderAvatar: senderAvatar,
        receiverId: receiverId,
        content: content.trim(),
        type: 'text',
        isRead: false,
        createTime: db.serverDate()
      }
    });

    // 5. 更新聊天的最后消息
    await db.collection('chats').doc(chatId).update({
      data: {
        lastMessage: content.trim(),
        lastMessageTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    // 6. 更新对方聊天的未读数
    const peerChatResult = await db.collection('chats')
      .where({
        userId: receiverId,
        serviceId: chat.serviceId
      })
      .get();

    if (peerChatResult.data && peerChatResult.data.length > 0) {
      const peerChatId = peerChatResult.data[0]._id;
      await db.collection('chats').doc(peerChatId).update({
        data: {
          lastMessage: content.trim(),
          lastMessageTime: db.serverDate(),
          updateTime: db.serverDate(),
          unreadCount: (peerChatResult.data[0].unreadCount || 0) + 1
        }
      });
    }

    return {
      success: true,
      data: {
        messageId: messageResult._id,
        chatId: chatId
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '发送消息失败'
    };
  }
};
