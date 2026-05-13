const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 发送消息
 * 同时创建/更新会话
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { receiverId, content, type = 'text', conversationId, serviceId, serviceTitle } = event;

  if (!content && type === 'text') {
    return { success: false, errMsg: '消息内容不能为空' };
  }
  if (!receiverId) {
    return { success: false, errMsg: '缺少接收者ID' };
  }

  try {
    // 1. 获取发送者信息
    const senderResult = await db.collection('users').where({ openid }).get();

    if (!senderResult.data || senderResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const sender = senderResult.data[0];
    const senderId = sender._id;

    // 2. 如果没有会话ID，查找或创建会话
    let convId = conversationId;
    if (!convId) {
      // 查找是否存在会话
      const convResult = await db.collection('conversations')
        .or([
          { userId1: senderId, userId2: receiverId },
          { userId1: receiverId, userId2: senderId }
        ])
        .get();

      if (convResult.data && convResult.data.length > 0) {
        convId = convResult.data[0]._id;
      } else {
        // 创建新会话
        const newConv = await db.collection('conversations').add({
          data: {
            userId1: senderId,
            userId2: receiverId,
            serviceId: serviceId || '',
            serviceTitle: serviceTitle || '',
            lastMessage: content,
            lastMessageTime: db.serverDate(),
            createTime: db.serverDate()
          }
        });
        convId = newConv._id;
      }
    }

    // 3. 创建消息记录
    const messageResult = await db.collection('messages').add({
      data: {
        conversationId: convId,
        senderId: senderId,
        receiverId: receiverId,
        content: content,
        type: type,
        isRead: false,
        createTime: db.serverDate()
      }
    });

    // 4. 更新会话的最后消息
    await db.collection('conversations').doc(convId).update({
      data: {
        lastMessage: content,
        lastMessageTime: db.serverDate()
      }
    });

    return {
      success: true,
      data: {
        messageId: messageResult._id,
        conversationId: convId
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '发送消息失败'
    };
  }
};
