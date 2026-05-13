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
      phone: '',
      region: '',
      remark: ''
    }
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

    // 提交栏实际高度(px)：padding 24rpx*2 + 按钮 80rpx + 安全区
    const submitBarPx = (24 * 2 + 80) * windowWidth / 750 + bottomSafeHeight;
    const scrollViewHeight = windowHeight - navHeight - submitBarPx;

    // 底部留白(rpx)：90rpx基础 + iOS安全区换算成rpx
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

  // 提交表单
  submitForm() {
    const { form, selectedCategory } = this.data;

    // 表单验证
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入需求标题', icon: 'none' });
      return;
    }
    if (!form.description.trim()) {
      wx.showToast({ title: '请输入需求描述', icon: 'none' });
      return;
    }
    if (!form.phone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }
    if (!form.region.trim()) {
      wx.showToast({ title: '请输入需求地区', icon: 'none' });
      return;
    }

    // 提交数据
    const submitData = {
      ...form,
      category: selectedCategory
    };

    console.log('发布需求:', submitData);

    // 模拟提交成功
    wx.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});
