const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 44,
    scrollViewHeight: 0,
    bottomSafeHeight: 0,
    formBottomSpacer: 90,
    selectedCategory: '跨境网络',
    categories: ['跨境网络', '物流服务', '支付结算', '合规认证', '培训咨询', '建站出海', '营销投流', '报关清关', '选品供货', '其他'],
    form: {
      title: '',
      description: '',
      budgetMin: '',
      budgetMax: '',
      deadline: '',
      phone: ''
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

    const submitBarPx = (24 * 2 + 80) * windowWidth / 750 + bottomSafeHeight;
    const scrollViewHeight = windowHeight - navHeight - submitBarPx;
    const formBottomSpacer = 90 + Math.round(bottomSafeHeight * 750 / windowWidth);

    this.setData({
      statusBarHeight,
      navHeight,
      scrollViewHeight,
      bottomSafeHeight,
      formBottomSpacer
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      selectedCategory: category
    });
  },

  // 输入框内容变化
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`form.${field}`]: value
    });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({
      'form.deadline': e.detail.value
    });
  },

  // 提交表单
  submitForm() {
    const { form, selectedCategory, isSubmitting } = this.data;

    if (isSubmitting) return;

    // 表单验证
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入需求标题', icon: 'none' });
      return;
    }
    if (!form.description.trim()) {
      wx.showToast({ title: '请输入需求描述', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '发布中...' });

    // 调用云函数发布需求
    wx.cloud.callFunction({
      name: 'publishDemand',
      data: {
        title: form.title.trim(),
        category: selectedCategory,
        description: form.description.trim(),
        budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : 0,
        budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : 0,
        deadline: form.deadline || '',
        phone: form.phone || ''
      },
      success: (res) => {
        wx.hideLoading();
        if (res.result && res.result.success) {
          wx.showToast({ title: '发布成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          this.setData({ isSubmitting: false });
          wx.showToast({ title: res.result.errMsg || '发布失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
        console.error('发布需求失败', err);
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  }
});
