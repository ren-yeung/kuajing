/**
 * 登录工具函数
 * 对接云函数实现用户登录注册
 */

const CLOUD_FUNCTION = {
  login: 'login',
  getUserInfo: 'getUserInfo',
  merchantApply: 'merchantApply',
  becomeMerchant: 'becomeMerchant'
};

// 检查是否已登录（同步）
function checkLogin() {
  return !!wx.getStorageSync('isLoggedIn');
}

// 未登录时弹出登录提示，用户确认后跳转到个人页面
function requireLogin() {
  return new Promise((resolve, reject) => {
    if (checkLogin()) {
      resolve(getUserInfo());
      return;
    }
    wx.showModal({
      title: '需要登录',
      content: '登录后才能继续使用此功能',
      confirmText: '去登录',
      success(res) {
        if (res.confirm) {
          // 跳转到个人页面进行登录
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        } else {
          reject('用户取消登录');
        }
      }
    });
  });
}

// 执行登录 - 获取微信登录凭证 + 调用云函数
function doLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (!loginRes.code) {
          reject('登录失败：未获取到 code');
          return;
        }
        wx.cloud.callFunction({
          name: CLOUD_FUNCTION.login,
          data: {
            loginCode: loginRes.code
          },
          success: (res) => {
            if (res.result && res.result.success) {
              const userData = res.result.data;
              const userInfo = {
                userId: userData.userId,
                nickname: userData.nickname,
                avatar: userData.avatar,
                isMerchant: userData.isMerchant,
                merchantStatus: userData.merchantStatus,
                isAdmin: userData.isAdmin || false,
                isNewUser: userData.isNewUser,
                loginTime: Date.now()
              };
              wx.setStorageSync('userInfo', userInfo);
              wx.setStorageSync('isLoggedIn', true);
              resolve(userInfo);
            } else {
              reject(res.result.errMsg || '登录失败');
            }
          },
          fail: (err) => {
            console.error('登录云函数调用失败', err);
            reject('网络错误，请稍后再试');
          }
        });
      },
      fail() {
        reject('网络错误，请稍后再试');
      }
    });
  });
}

// 带用户信息的登录（头像+昵称）
function doLoginWithInfo(nickname, avatar) {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (!loginRes.code) {
          reject('登录失败：未获取到 code');
          return;
        }
        wx.cloud.callFunction({
          name: CLOUD_FUNCTION.login,
          data: {
            loginCode: loginRes.code,
            nickname: nickname,
            avatar: avatar
          },
          success: (res) => {
            if (res.result && res.result.success) {
              const userData = res.result.data;
              const userInfo = {
                userId: userData.userId,
                nickname: userData.nickname || nickname,
                avatar: userData.avatar || avatar,
                isMerchant: userData.isMerchant,
                merchantStatus: userData.merchantStatus,
                isAdmin: userData.isAdmin || false,
                isNewUser: userData.isNewUser,
                loginTime: Date.now()
              };
              wx.setStorageSync('userInfo', userInfo);
              wx.setStorageSync('isLoggedIn', true);
              resolve(userInfo);
            } else {
              reject(res.result.errMsg || '登录失败');
            }
          },
          fail: (err) => {
            console.error('登录云函数调用失败', err);
            reject('网络错误，请稍后再试');
          }
        });
      },
      fail() {
        reject('网络错误，请稍后再试');
      }
    });
  });
}

// 获取用户信息
function getUserInfo() {
  return wx.getStorageSync('userInfo') || null;
}

// 获取完整的用户信息（从云函数）
function fetchUserInfo() {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: CLOUD_FUNCTION.getUserInfo,
      success: (res) => {
        if (res.result && res.result.success) {
          const userData = res.result.data;
          const userInfo = {
            userId: userData.userId,
            nickname: userData.nickname,
            merchantNickname: userData.merchantNickname || '',
            avatar: userData.avatar,
            merchantAvatar: userData.merchantAvatar || '',
            isMerchant: userData.isMerchant,
            merchantStatus: userData.merchantStatus,
            isAdmin: userData.isAdmin || false,
            loginTime: Date.now()
          };
          wx.setStorageSync('userInfo', userInfo);
          resolve(userInfo);
        } else {
          reject(res.result.errMsg || '获取用户信息失败');
        }
      },
      fail: (err) => {
        reject(err.message || '网络错误');
      }
    });
  });
}

// 获取商家状态
function getMerchantStatus() {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: CLOUD_FUNCTION.becomeMerchant,
      success: (res) => {
        if (res.result && res.result.success) {
          resolve(res.result.data);
        } else {
          reject(res.result.errMsg || '获取商家状态失败');
        }
      },
      fail: (err) => {
        reject(err.message || '网络错误');
      }
    });
  });
}

// 申请成为商家
function applyMerchant(data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: CLOUD_FUNCTION.merchantApply,
      data: data,
      success: (res) => {
        if (res.result && res.result.success) {
          // 更新本地存储的商家状态
          const userInfo = getUserInfo();
          if (userInfo) {
            userInfo.merchantStatus = 'pending';
            wx.setStorageSync('userInfo', userInfo);
          }
          resolve(res.result.data);
        } else {
          reject(res.result.errMsg || '申请失败');
        }
      },
      fail: (err) => {
        reject(err.message || '网络错误');
      }
    });
  });
}

// 退出登录
function logout() {
  wx.removeStorageSync('isLoggedIn');
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('currentRole');
}

// 获取当前角色（user 或 merchant）
function getCurrentRole() {
  return wx.getStorageSync('currentRole') || 'user';
}

// 设置当前角色
function setCurrentRole(role) {
  wx.setStorageSync('currentRole', role);
}

// 切换角色
function switchRole() {
  const current = getCurrentRole();
  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.isMerchant) return Promise.reject('不是商家，无法切换');
  const newRole = current === 'user' ? 'merchant' : 'user';
  setCurrentRole(newRole);
  return Promise.resolve(newRole);
}

// 获取切换后的角色文本
function getSwitchRoleText() {
  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.isMerchant) return '';
  const current = getCurrentRole();
  return current === 'user' ? '切换商家' : '切换用户';
}

// 判断用户是否是已审核通过的商家（同步）
function getIsMerchantApproved() {
  const userInfo = getUserInfo();
  return !!(userInfo && userInfo.isMerchant && userInfo.merchantStatus === 'approved');
}

// 获取是否管理员（同步）
function getIsAdmin() {
  const userInfo = getUserInfo();
  return !!(userInfo && userInfo.isAdmin);
}

// 设置是否管理员
function setIsAdmin(isAdmin) {
  const userInfo = getUserInfo();
  if (userInfo) {
    userInfo.isAdmin = isAdmin;
    wx.setStorageSync('userInfo', userInfo);
    // 同步更新 currentRole
    if (isAdmin) {
      wx.setStorageSync('currentRole', 'admin');
    } else {
      wx.setStorageSync('currentRole', 'user');
    }
  }
}

// 切换管理员身份
function switchAdmin() {
  const userInfo = getUserInfo();
  if (!userInfo) return Promise.reject('未登录');
  const newIsAdmin = !userInfo.isAdmin;
  setIsAdmin(newIsAdmin);
  return Promise.resolve(newIsAdmin);
}

// 获取管理员切换文本
function getSwitchAdminText() {
  const userInfo = getUserInfo();
  if (!userInfo || !userInfo.isAdmin) return '';
  return userInfo.isAdmin ? '退出管理' : '';
}

module.exports = {
  checkLogin,
  requireLogin,
  doLogin,
  doLoginWithInfo,
  getUserInfo,
  fetchUserInfo,
  getMerchantStatus,
  applyMerchant,
  logout,
  getCurrentRole,
  setCurrentRole,
  switchRole,
  getSwitchRoleText,
  getIsMerchantApproved,
  getIsAdmin,
  setIsAdmin,
  switchAdmin,
  getSwitchAdminText
};
