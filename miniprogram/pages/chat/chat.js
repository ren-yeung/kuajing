const app = getApp();
const login = require('../../utils/login');

Page({
  data: {
    chatId: '',
    serviceId: '',
    chatName: '正在加载...',
    chatAvatar: '',
    messages: [],
    inputText: '',
    hasInput: false,
    showEmoji: false,
    scrollIntoView: '',
    chatTime: '',
    currentUser: null,
    peerUser: null,
    isLoading: true,
    keyboardHeight: 0,
    statusBarHeight: 0
  },

  onLoad(options) {
    const { chatId, serviceId, serviceName } = options;

    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();

    this.setData({
      chatId: chatId || '',
      serviceId: serviceId || '',
      chatName: serviceName || '聊天',
      statusBarHeight: systemInfo.statusBarHeight || 0
    });

    // 获取当前用户信息
    const userInfo = login.getUserInfo();
    if (userInfo) {
      const avatarText = userInfo.nickname ? userInfo.nickname.charAt(0) : '我';
      this.setData({
        currentUser: {
          id: userInfo._id,
          name: userInfo.nickname,
          avatar: userInfo.avatar || '',
          avatarText: avatarText,
          avatarBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      });
    }

    // 加载聊天记录
    if (chatId) {
      this.loadChat(chatId);
    } else if (serviceId) {
      // 新建聊天
      this.createNewChat(serviceId);
    }
  },

  onShow() {
    // 每次显示页面时滚动到底部
    this.scrollToBottom();
  },

  // 加载聊天记录
  loadChat(chatId) {
    wx.showLoading({ title: '加载中...' });
    
    wx.cloud.callFunction({
      name: 'getChatMessages',
      data: { chatId },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          const data = res.result.data;
          this.setData({
            messages: this.formatMessages(data.messages || []),
            chatName: data.chatName || '聊天',
            peerUser: data.peerUser || null,
            chatTime: this.formatChatTime(data.createTime)
          });
          this.scrollToBottom();
        } else {
          this.setData({ messages: [] });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('加载聊天记录失败', err);
        this.setData({ messages: [] });
      }
    });
  },

  // 创建新聊天
  createNewChat(serviceId) {
    wx.showLoading({ title: '正在创建...' });
    
    wx.cloud.callFunction({
      name: 'createChat',
      data: { serviceId },
      success: res => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          const { chatId, chatName, peerUser } = res.result.data;
          this.setData({
            chatId,
            chatName,
            peerUser
          });
          // 加载聊天记录
          this.loadChat(chatId);
        } else {
          wx.showToast({
            title: res.result?.errMsg || '创建聊天失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        wx.hideLoading();
        console.error('创建聊天失败', err);
        wx.showToast({
          title: '创建聊天失败',
          icon: 'none'
        });
      }
    });
  },

  // 格式化消息列表
  formatMessages(messages) {
    const userInfo = login.getUserInfo();
    const currentUserId = userInfo?._id || '';

    let prevTime = 0;
    return messages.map((msg, index) => {
      const isSent = msg.senderId === currentUserId;
      const createTime = msg.createTime ? new Date(msg.createTime) : null;
      const createTimeTs = createTime ? createTime.getTime() : 0;
      // 第一条消息始终显示时间分隔，后续间隔超过5分钟也显示
      const showTimeDivider = (index === 0) || (prevTime > 0 && (createTimeTs - prevTime) > 5 * 60 * 1000);
      prevTime = createTimeTs;

      return {
        id: msg._id || msg.id || Date.now(),
        type: isSent ? 'sent' : 'received',
        content: msg.content,
        mediaType: msg.type === 'image' ? 'image' : (msg.type === 'video' ? 'video' : ''),
        mediaUrl: msg.fileId || msg.mediaUrl || '',
        avatarText: isSent
          ? (userInfo?.nickname?.charAt(0) || '我')
          : (msg.senderName?.charAt(0) || '他'),
        avatarBg: isSent
          ? '#07C160'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        time: msg.createTime ? this.formatMessageTime(msg.createTime) : '',
        timeDivider: showTimeDivider ? this.formatTimeDivider(msg.createTime) : '',
        createTime: msg.createTime || 0
      };
    });
  },

  // 格式化消息间的时间分隔（微信风格）
  formatTimeDivider(time) {
    if (!time) return '';
    const date = new Date(time);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    if (date.toDateString() === now.toDateString()) {
      return timeStr;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${timeStr}`;
    } else if (date.getFullYear() === now.getFullYear()) {
      return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
    } else {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
    }
  },

  // 格式化聊天时间
  formatChatTime(time) {
    if (!time) return '刚刚';
    const date = new Date(time);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // 格式化消息时间
  formatMessageTime(time) {
    const date = new Date(time);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  },

  // 输入框变化
  onInputChange(e) {
    const value = e.detail.value;
    this.setData({
      inputText: value,
      hasInput: !!value.trim()
    });
    this.scrollToBottom();
  },

  // 输入框获得焦点，键盘弹起
  onInputFocus(e) {
    this.setData({
      keyboardHeight: e.detail.height || 0,
      showEmoji: false
    });
  },

  // 输入框失去焦点，键盘收起
  onInputBlur() {
    this.setData({
      keyboardHeight: 0,
      showEmoji: false
    });
  },

  // 切换表情面板
  toggleEmoji() {
    this.setData({
      showEmoji: !this.data.showEmoji
    });
  },

  // 选择图片/视频
  chooseMedia() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFiles = res.tempFiles;
        tempFiles.forEach(file => {
          if (file.fileType === 'video') {
            // 视频直接上传
            this.uploadAndSendMedia(file.tempFilePath, file.fileType);
          } else {
            // 图片先压缩再上传
            this.compressAndSendImage(file.tempFilePath);
          }
        });
      }
    });
  },

  // 压缩并发送图片
  compressAndSendImage(filePath) {
    wx.showLoading({ title: '处理中...' });
    
    wx.compressImage({
      src: filePath,
      quality: 80,  // 压缩质量 0-100
      success: res => {
        wx.hideLoading();
        // 使用压缩后的临时路径上传
        this.uploadAndSendMedia(res.tempFilePath, 'image');
      },
      fail: err => {
        wx.hideLoading();
        console.error('压缩失败，使用原图', err);
        // 压缩失败时使用原图
        this.uploadAndSendMedia(filePath, 'image');
      }
    });
  },

  // 上传并发送媒体
  uploadAndSendMedia(filePath, fileType) {
    wx.showLoading({ title: '发送中...' });

    // 上传文件到云存储
    const suffix = filePath.split('.').pop();
    const cloudPath = `chat/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${suffix}`;

    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: uploadRes => {
        // 发送媒体消息
        wx.cloud.callFunction({
          name: 'sendChatMessage',
          data: {
            chatId: this.data.chatId,
            content: '',
            type: fileType === 'image' ? 'image' : 'video',
            fileId: uploadRes.fileID,
            serviceId: this.data.serviceId
          },
          success: () => {
            // 添加到本地消息列表
            const newMessage = {
              id: 'temp-' + Date.now(),
              type: 'sent',
              content: '',
              mediaType: fileType,
              mediaUrl: uploadRes.fileID,
              avatarText: login.getUserInfo()?.nickname?.charAt(0) || '我',
              avatarBg: '#07C160',
              time: this.formatMessageTime(new Date())
            };
            this.setData({
              messages: [...this.data.messages, newMessage]
            });
            this.scrollToBottom();
          },
          fail: err => {
            console.error('发送媒体消息失败', err);
          }
        });
      },
      fail: err => {
        console.error('上传失败', err);
        wx.showToast({ title: '上传失败', icon: 'none' });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 发送消息
  sendMessage() {
    const content = this.data.inputText.trim();
    if (!content) {
      return;
    }
    if (!this.data.chatId) {
      wx.showToast({
        title: '请先创建聊天',
        icon: 'none'
      });
      return;
    }

    const userInfo = login.getUserInfo();
    
    const now = new Date();
    const nowTs = now.getTime();
    // 检查是否需要显示时间分隔
    const messages = this.data.messages;
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    const lastTime = lastMsg?.createTime || 0;
    const showTimeDivider = lastTime > 0 && (nowTs - lastTime) > 5 * 60 * 1000;

    // 先清空输入框并添加到本地列表
    const newMessage = {
      id: 'temp-' + Date.now(),
      type: 'sent',
      content: content,
      avatarText: userInfo?.nickname?.charAt(0) || '我',
      avatarBg: '#07C160',
      time: this.formatMessageTime(now),
      timeDivider: showTimeDivider ? this.formatTimeDivider(now) : '',
      createTime: nowTs
    };

    this.setData({
      inputText: '',
      hasInput: false,
      messages: [...this.data.messages, newMessage]
    });
    this.scrollToBottom();

    // 调用云函数发送消息
    wx.cloud.callFunction({
      name: 'sendChatMessage',
      data: {
        chatId: this.data.chatId,
        content: content,
        serviceId: this.data.serviceId
      },
      success: res => {
        if (!res.result || !res.result.success) {
          wx.showToast({
            title: res.result?.errMsg || '发送失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error('发送消息失败', err);
        wx.showToast({
          title: '发送失败',
          icon: 'none'
        });
      }
    });
  },

  // 滚动到底部
  scrollToBottom() {
    setTimeout(() => {
      this.setData({
        scrollIntoView: 'bottom'
      });
    }, this.data.keyboardHeight > 0 ? 300 : 100);
  },

  // 返回
  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({ fail: () => {
        wx.switchTab({ url: '/pages/message/message' });
      }});
    } else {
      wx.switchTab({ url: '/pages/message/message' });
    }
  },

  // 页面滚动到顶部
  onScrollUp() {
    // 可以在这里实现加载更多历史消息
  },

  // 预览图片
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.previewImage({
        current: url,
        urls: [url]
      });
    }
  }
});
