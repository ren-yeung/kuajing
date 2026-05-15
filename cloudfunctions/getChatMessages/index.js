const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取聊天消息记录
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const { chatId } = event;

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

    // 验证权限（用户必须是聊天参与者）
    if (chat.userId !== currentUser._id && chat.merchantId !== currentUser._id) {
      return { success: false, errMsg: '无权访问此聊天' };
    }

    // 3. 获取消息列表
    const messagesResult = await db.collection('chat_messages')
      .where({ chatId: chatId })
      .orderBy('createTime', 'asc')
      .get();

    // 4. 获取对方用户信息
    let peerUser = null;
    const peerId = chat.userId === currentUser._id ? chat.merchantId : chat.userId;
    const peerResult = await db.collection('users').doc(peerId).get();
    if (peerResult.data) {
      peerUser = {
        id: peerResult.data._id,
        name: peerResult.data.nickname || '用户',
        avatar: peerResult.data.merchantAvatar || peerResult.data.avatar || ''
      };
    }

    // 5. 将未读消息标记为已读
    await db.collection('chat_messages')
      .where({
        chatId: chatId,
        receiverId: currentUser._id,
        isRead: false
      })
      .update({
        data: {
          isRead: true
        }
      });

    // 更新聊天未读数
    await db.collection('chats').doc(chatId).update({
      data: {
        unreadCount: 0
      }
    });

    // 转换 cloud:// URL
    const messages = (messagesResult.data || []).map(msg => {
      let content = msg.content || '';
      // 处理图片消息
      if (msg.type === 'image' && msg.imageUrl) {
        content = msg.imageUrl;
      }
      return {
        id: msg._id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        content: content,
        type: msg.type || 'text',
        createTime: msg.createTime,
        isRead: msg.isRead
      };
    });

    // 获取显示名称（对方）
    const chatName = chat.userId === currentUser._id ? chat.merchantName : chat.userName;

    return {
      success: true,
      data: {
        chatId: chat._id,
        chatName: chatName,
        serviceTitle: chat.serviceTitle,
        peerUser: peerUser,
        messages: messages,
        createTime: chat.createTime,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取聊天记录失败'
    };
  }
};
