const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 44,
    scrollViewHeight: 0,
    bottomSafeHeight: 0,
    formBottomSpacer: 90,

    // 分类
    selectedCategory: '',
    categories: ['跨境网络', '物流服务', '报关清关', '支付结算', '合规认证', '培训咨询', '建站出海', '营销投流', '选品特供'],

    // 固定标签
    fixedTags: ['时效快', '价格低', '覆盖广', '服务好', '可追踪', '包清关', '专线物流', '小包服务'],
    selectedTags: [],
    customTag: '',

    // 价格单位
    priceUnits: ['元', '美元', '套', '箱', '打', '托盘', '柜', '千克', '吨', '立方米', '平方米', '票', '款', '双', '盒', '包', '卷', '节'],
    priceUnitIndex: 0,

    // 表单数据
    form: {
      title: '',
      description: '',
      price: '',
      phone: '',
      images: []
    },

    isSubmitting: false
  },

  onLoad() {
    // 检查商家是否审核通过
    const userInfo = login.getUserInfo();
    if (userInfo && userInfo.isMerchant && userInfo.merchantStatus === 'pending') {
      wx.showModal({
        title: '审核提示',
        content: '商家资料审核中，审核通过后可发布服务',
        showCancel: false,
        confirmText: '我知道了',
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }
    
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

  // 选择图片
  chooseImage() {
    const currentCount = this.data.form.images.length;
    const remainCount = 9 - currentCount;

    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFiles;
        const newImages = tempFiles.map((file, index) => ({
          url: file.tempFilePath,
          isMain: currentCount + index === 0
        }));

        this.setData({
          'form.images': [...this.data.form.images, ...newImages]
        });
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.form.images.map(img => img.url);
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.form.images];
    const deletedImage = images.splice(index, 1)[0];

    if (deletedImage.isMain && images.length > 0) {
      images[0].isMain = true;
    }

    this.setData({
      'form.images': images
    });
  },

  // 切换标签选择
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const selectedTags = [...this.data.selectedTags];
    const index = selectedTags.indexOf(tag);

    if (index !== -1) {
      selectedTags.splice(index, 1);
    } else {
      if (selectedTags.length >= 4) {
        wx.showToast({ title: '最多选择4个标签', icon: 'none' });
        return;
      }
      selectedTags.push(tag);
    }

    this.setData({ selectedTags });
  },

  // 自定义标签输入
  onTagInput(e) {
    // 限制8个字符
    const value = e.detail.value.slice(0, 8);
    this.setData({
      customTag: value
    });
  },

  // 添加自定义标签
  addCustomTag() {
    const tag = this.data.customTag.trim();
    if (!tag) return;

    const selectedTags = this.data.selectedTags;
    if (selectedTags.length >= 4) {
      wx.showToast({ title: '最多选择4个标签', icon: 'none' });
      return;
    }

    if (selectedTags.includes(tag)) {
      wx.showToast({ title: '该标签已添加', icon: 'none' });
      return;
    }

    selectedTags.push(tag);
    this.setData({
      selectedTags,
      customTag: ''
    });
  },

  // 移除标签
  removeTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const selectedTags = this.data.selectedTags.filter(t => t !== tag);
    this.setData({ selectedTags });
  },

  // 价格单位选择
  onPriceUnitChange(e) {
    this.setData({
      priceUnitIndex: parseInt(e.detail.value)
    });
  },

  // 提交表单
  submitForm() {
    const { form, selectedCategory, selectedTags, isSubmitting, priceUnits, priceUnitIndex } = this.data;

    if (isSubmitting) return;

    // 表单验证
    if (!form.title.trim()) {
      wx.showToast({ title: '请输入服务标题', icon: 'none' });
      return;
    }
    if (!selectedCategory) {
      wx.showToast({ title: '请选择服务分类', icon: 'none' });
      return;
    }
    if (!form.description.trim()) {
      wx.showToast({ title: '请输入服务描述', icon: 'none' });
      return;
    }
    if (!form.price.trim()) {
      wx.showToast({ title: '请输入服务价格', icon: 'none' });
      return;
    }
    if (!form.phone.trim()) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }

    // 获取价格单位
    const priceUnit = priceUnits[priceUnitIndex];

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '发布中...' });

    // 获取用户信息
    const userInfo = login.getUserInfo();
    if (!userInfo || !userInfo.userId) {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    // 如果有图片，先上传图片到云存储
    const uploadImages = async () => {
      const images = form.images;
      if (images.length === 0) return [];

      const uploadedUrls = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          const res = await wx.cloud.uploadFile({
            cloudPath: `services/${userInfo.userId}/${Date.now()}_${i}.png`,
            filePath: img.url
          });
          uploadedUrls.push({
            url: res.fileID,
            isMain: img.isMain
          });
        } catch (err) {
          console.error('图片上传失败', err);
        }
      }
      return uploadedUrls;
    };

    uploadImages().then((uploadedImages) => {
      // 调用云函数发布服务
      wx.cloud.callFunction({
        name: 'publishService',
        data: {
          title: form.title.trim(),
          category: selectedCategory,
          description: form.description.trim(),
          price: parseFloat(form.price),
          priceUnit: priceUnit,
          phone: form.phone.trim(),
          tags: selectedTags,
          images: uploadedImages
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
          console.error('发布服务失败', err);
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        }
      });
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showToast({ title: '图片上传失败', icon: 'none' });
    });
  }
});
