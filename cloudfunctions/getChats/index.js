const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

/**
 * 获取聊天列表（用于消息页面）
 * 返回当前用户的所有聊天会话
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 1. 获取当前用户信息
    const userResult = await db.collection('users').where({ openid }).get();
    if (!userResult.data || userResult.data.length === 0) {
      return { success: false, errMsg: '用户不存在' };
    }
    const currentUser = userResult.data[0];

    // 2. 获取聊天列表（当前用户作为任一参与者的会话）
    const chatsResult = await db.collection('chats')
      .where({
        userId: currentUser._id
      })
      .orderBy('lastMessageTime', 'desc')
      .get();

    const chats = (chatsResult.data || []).map(chat => {
      // 格式化时间
      let timeStr = '';
      if (chat.lastMessageTime) {
        const date = new Date(chat.lastMessageTime);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        if (isToday) {
          timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
          timeStr = `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }

      // 获取对方名称和头像
      const name = chat.merchantName || '商家';
      const avatar = chat.merchantAvatar || '';
      const avatarText = name.charAt(0);
      const avatarBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

      return {
        id: chat._id,
        name: name,
        preview: chat.lastMessage || '开始聊天吧~',
        time: timeStr,
        unread: chat.unreadCount || 0,
        serviceTitle: chat.serviceTitle,
        serviceId: chat.serviceId,
        avatar: avatar,
        avatarText: avatarText,
        avatarBg: avatarBg
      };
    });

    return {
      success: true,
      data: {
        chats: chats,
        total: chats.length
      }
    };

  } catch (err) {
    return {
      success: false,
      errMsg: err.message || '获取聊天列表失败'
    };
  }
};
