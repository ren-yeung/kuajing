const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 0,
    scrollViewHeight: 0,
    bottomSafeHeight: 0,
    formBottomSpacer: 90,
    selectedCategories: [],
    selectedMap: {},
    availableCategories: ['跨境网络', '物流服务', '报关清关', '支付结算', '合规认证', '培训咨询', '建站出海', '营销投流', '选品特供'],
    form: {
      companyName: '',
      contactName: '',
      contactPhone: '',
      description: '',
      businessLicense: ''
    },
    isSubmitting: false
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navHeight = statusBarHeight + 44;
    const windowHeight = systemInfo.windowHeight;
    const windowWidth = systemInfo.windowWidth;
    const safeArea = systemInfo.safeArea;
    let bottomSafeHeight = 0;

    if (safeArea) {
      bottomSafeHeight = windowHeight - safeArea.bottom;
    }

    const submitBarHeight = (24 * 2 + 80) * windowWidth / 750 + bottomSafeHeight;
    const scrollViewHeight = windowHeight - navHeight - submitBarHeight;
    const formBottomSpacer = Math.max(16, Math.round(20 + bottomSafeHeight * 750 / windowWidth));

    this.setData({
      statusBarHeight,
      navHeight,
      scrollViewHeight,
      bottomSafeHeight,
      formBottomSpacer
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`form.${field}`]: value
    });
  },

  // 选择服务分类（最多3个）
  toggleCategory(e) {
    const category = e.currentTarget.dataset.category;
    let selectedCategories = this.data.selectedCategories.slice();
    let selectedMap = { ...this.data.selectedMap };
    const index = selectedCategories.indexOf(category);

    if (index > -1) {
      // 已选中则取消
      selectedCategories.splice(index, 1);
      delete selectedMap[category];
    } else {
      // 未选中，检查是否已达上限
      if (selectedCategories.length >= 3) {
        wx.showToast({ title: '最多选择3个服务分类', icon: 'none' });
        return;
      }
      selectedCategories.push(category);
      selectedMap[category] = true;
    }

    this.setData({ selectedCategories, selectedMap });
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        
        // 上传图片到云存储
        const cloudPath = `business_license/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: (uploadRes) => {
            wx.hideLoading();
            this.setData({
              'form.businessLicense': uploadRes.fileID
            });
            wx.showToast({ title: '上传成功', icon: 'success' });
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('上传失败', err);
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      }
    });
  },

  // 提交申请
  submitForm() {
    const { form, selectedCategories, isSubmitting } = this.data;

    if (isSubmitting) return;

    // 表单验证
    if (!form.companyName.trim()) {
      wx.showToast({ title: '请输入公司名称', icon: 'none' });
      return;
    }
    if (!form.contactPhone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }
    if (!form.businessLicense) {
      wx.showToast({ title: '请上传营业执照', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '提交中...' });

    // 调用云函数提交商家申请
    wx.cloud.callFunction({
      name: 'merchantApply',
      data: {
        companyName: form.companyName.trim(),
        contactName: form.contactName.trim(),
        contactPhone: form.contactPhone.trim(),
        businessLicense: form.businessLicense,
        description: form.description.trim(),
        categories: selectedCategories
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          // 提交成功后，直接更新本地用户状态为商家（跳过审核）
          const userInfo = login.getUserInfo();
          if (userInfo) {
            userInfo.isMerchant = true;
            userInfo.merchantStatus = 'approved';
            wx.setStorageSync('userInfo', userInfo);
          }
          
          wx.showModal({
            title: '入驻成功',
            content: '恭喜您已成为跨境服务圈商家！可在"我的"页面切换商家版本。',
            showCancel: false,
            success: () => {
              wx.navigateBack();
            }
          });
        } else {
          this.setData({ isSubmitting: false });
          wx.showToast({ title: res.result.errMsg || '提交失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('提交申请失败', err);
        // 即使云函数调用失败，也允许本地直接成为商家（开发阶段降级方案）
        const userInfo = login.getUserInfo();
        if (userInfo) {
          userInfo.isMerchant = true;
          userInfo.merchantStatus = 'approved';
          wx.setStorageSync('userInfo', userInfo);
          
          wx.showModal({
            title: '入驻成功',
            content: '恭喜您已成为跨境服务圈商家！',
            showCancel: false,
            success: () => {
              wx.navigateBack();
            }
          });
        } else {
          this.setData({ isSubmitting: false });
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        }
      }
    });
  }
});
