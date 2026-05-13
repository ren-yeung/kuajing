/**
 * 登录工具函数（兼容微信新版本 SDK）
 *
 * 新版微信不再支持 wx.getUserProfile，
 * 改用 wx.login 静默登录 + 本地标记登录态。
 *
 * 用法：
 *   const login = require('../../utils/login.js');
 *   login.checkLogin()  — 同步检查是否已登录
 *   login.requireLogin() — 未登录则弹窗提示，返回 Promise
 *   login.getUserInfo() — 获取已存储的用户信息
 */

// 检查是否已登录（同步）
function checkLogin() {
  return !!wx.getStorageSync('isLoggedIn');
}

// 未登录时弹出登录提示，用户确认后执行登录
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
          doLogin().then(resolve).catch(reject);
        } else {
          reject('用户取消登录');
        }
      }
    });
  });
}

// 执行登录（仅 wx.login，不获取用户头像昵称）
function doLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (loginRes.code) {
          var existing = wx.getStorageSync('userInfo') || {};
          var userInfo = Object.assign({}, existing, {
            nickName: existing.nickName || '微信用户',
            avatarUrl: existing.avatarUrl || '',
            loginCode: loginRes.code,
            loginTime: Date.now()
          });
          wx.setStorageSync('userInfo', userInfo);
          wx.setStorageSync('isLoggedIn', true);
          resolve(userInfo);
        } else {
          reject('登录失败：未获取到 code');
        }
      },
      fail() {
        reject('网络错误，请稍后再试');
      }
    });
  });
}

// 获取已存储的用户信息
function getUserInfo() {
  return wx.getStorageSync('userInfo') || null;
}

// 退出登录
function logout() {
  wx.removeStorageSync('isLoggedIn');
  wx.removeStorageSync('userInfo');
}

module.exports = {
  checkLogin,
  requireLogin,
  doLogin,
  getUserInfo,
  logout
};
