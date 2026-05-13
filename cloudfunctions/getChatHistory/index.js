const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取聊天记录
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { conversationId, page = 1, pageSize = 20 } = event;

  if (!conversationId) {
    return { success: false, errMsg: '缺少会话ID' };
  }

  try {
    // 1. 获取用户ID
    const userResult = await db.collection('users').where({ openid }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const userId = userResult.data[0]._id;

    // 2. 标记消息已读
    await db.collection('messages')
      .where({
        conversationId: conversationId,
        receiverId: userId,
        isRead: false
      })
      .update({
        data: {
          isRead: true
        }
      });

    // 3. 查询聊天记录（倒序）
    const skip = (page - 1) * pageSize;

    const messagesResult = await db.collection('messages')
      .where({ conversationId: conversationId })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    // 4. 获取每个消息的发送者信息
    const messages = await Promise.all((messagesResult.data || []).map(async (msg) => {
      let senderInfo = null;
      try {
        const senderResult = await db.collection('users').doc(msg.senderId).get();
        senderInfo = senderResult.data;
      } catch (e) {
        // 发送者信息查询失败
      }

      return {
        id: msg._id,
        content: msg.content,
        type: msg.type,
        isSelf: msg.senderId === userId,
        senderName: senderInfo ? senderInfo.nickname : '未知',
        senderAvatar: senderInfo ? senderInfo.avatar : '',
        createTime: msg.createTime
      };
    }));

    // 反转数组，按时间正序
    messages.reverse();

    return {
      success: true,
      data: {
        list: messages,
        page: page,
        pageSize: pageSize
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取聊天记录失败'
    };
  }
};
