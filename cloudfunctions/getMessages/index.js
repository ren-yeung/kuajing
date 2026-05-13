const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取消息会话列表
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 1. 获取用户ID
    const userResult = await db.collection('users').where({ openid }).get();

    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }

    const userId = userResult.data[0]._id;

    // 2. 查询会话列表
    const conversationResult = await db.collection('conversations')
      .or([
        { userId1: userId },
        { userId2: userId }
      ])
      .orderBy('lastMessageTime', 'desc')
      .get();

    // 3. 遍历获取每个会话的对方信息和最后一条消息
    const messages = await Promise.all(conversationResult.data.map(async (conv) => {
      // 获取对方用户信息
      const otherUserId = conv.userId1 === userId ? conv.userId2 : conv.userId1;
      let otherUser = null;
      try {
        const otherUserResult = await db.collection('users').doc(otherUserId).get();
        otherUser = otherUserResult.data;
      } catch (e) {
        // 用户信息查询失败
      }

      // 获取未读消息数
      const unreadCount = await db.collection('messages')
        .where({
          conversationId: conv._id,
          receiverId: userId,
          isRead: false
        })
        .count();

      return {
        id: conv._id,
        otherUserId: otherUserId,
        otherUserName: otherUser ? otherUser.nickname : '未知用户',
        otherUserAvatar: otherUser ? otherUser.avatar : '',
        lastMessage: conv.lastMessage || '',
        lastMessageTime: conv.lastMessageTime || '',
        unreadCount: unreadCount.total || 0,
        serviceId: conv.serviceId || '',
        serviceTitle: conv.serviceTitle || ''
      };
    }));

    return {
      success: true,
      data: messages
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取消息列表失败'
    };
  }
};
