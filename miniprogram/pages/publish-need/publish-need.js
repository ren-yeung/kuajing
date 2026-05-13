Page({
  data: {
    statusBarHeight: 0,
    navHeight: 44,
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
    const scrollViewHeight = systemInfo.windowHeight - navHeight - 80;
    this.setData({
      statusBarHeight,
      navHeight,
      scrollViewHeight
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

    // 这里调用后端API提交数据
    // wx.request({
    //   url: 'https://your-api.com/publish-need',
    //   method: 'POST',
    //   data: submitData,
    //   success: (res) => {
    //     wx.showToast({ title: '发布成功', icon: 'success' });
    //     setTimeout(() => wx.navigateBack(), 1500);
    //   }
    // });

    // 模拟提交成功
    wx.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});
