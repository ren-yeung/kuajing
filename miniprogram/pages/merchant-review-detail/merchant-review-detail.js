const login = require('../../utils/login.js');

Page({
  data: {
    statusBarHeight: 0,
    navHeight: 0,

    // 详情数据
    applicationId: '',
    detail: {
      userNickname: '',
      userPhone: '',
      userAvatar: '',
      companyName: '',
      contactName: '',
      contactPhone: '',
      description: '',
      categories: [],
      businessLicense: '',
      businessLicenseUrl: '',
      status: 'pending',
      createTimeStr: '',
      updateTimeStr: '',
      rejectReason: ''
    },

    loading: true,
    showRejectInput: false,
    rejectReason: ''
  },

  onLoad(options) {
    const { id } = options;
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navHeight = statusBarHeight + 44;

    this.setData({
      statusBarHeight,
      navHeight,
      applicationId: id
    });

    this.loadDetail();
  },

  goBack() {
    wx.navigateBack();
  },

  // 加载详情
  loadDetail() {
    this.setData({ loading: true });

    wx.cloud.callFunction({
      name: 'getMerchantApplications',
      data: { status: '', page: 1, pageSize: 100 }
    }).then(res => {
      if (res.result && res.result.success) {
        const list = res.result.data.list;
        const item = list.find(i => i._id === this.data.applicationId);
        
        if (item) {
          // 格式化时间
          item.createTimeStr = this.formatTime(item.createTime);
          item.updateTimeStr = this.formatTime(item.updateTime);

          // 获取营业执照URL
          if (item.businessLicense && item.businessLicense.startsWith('cloud://')) {
            wx.cloud.getTempFileURL({
              fileList: [item.businessLicense]
            }).then(urlRes => {
              if (urlRes.fileList && urlRes.fileList[0]) {
                item.businessLicenseUrl = urlRes.fileList[0].tempFileURL;
              }
              this.setData({ detail: item, loading: false });
            }).catch(() => {
              this.setData({ detail: item, loading: false });
            });
          } else {
            this.setData({ detail: item, loading: false });
          }
        } else {
          wx.showToast({ title: '申请不存在', icon: 'none' });
          wx.navigateBack();
        }
      } else {
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    }).catch(err => {
      this.setData({ loading: false });
      console.error('加载详情失败', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    });
  },

  // 拒绝原因输入
  onRejectReasonInput(e) {
    this.setData({ rejectReason: e.detail.value });
  },

  // 显示拒绝输入框
  onReject() {
    this.setData({ showRejectInput: true });
  },

  // 取消拒绝
  onCancelReject() {
    this.setData({ showRejectInput: false, rejectReason: '' });
  },

  // 确认通过
  onApprove() {
    wx.showModal({
      title: '确认通过',
      content: '确定要通过该商家的入驻申请吗？',
      success: (res) => {
        if (res.confirm) {
          this.doReview('approve');
        }
      }
    });
  },

  // 确认拒绝
  onConfirmReject() {
    if (!this.data.rejectReason.trim()) {
      wx.showToast({ title: '请填写拒绝原因', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认拒绝',
      content: '确定要拒绝该商家的入驻申请吗？',
      success: (res) => {
        if (res.confirm) {
          this.doReview('reject', this.data.rejectReason.trim());
        }
      }
    });
  },

  // 执行审核
  doReview(action, reason = '') {
    wx.showLoading({ title: '处理中...' });

    wx.cloud.callFunction({
      name: 'reviewMerchant',
      data: {
        applicationId: this.data.applicationId,
        action,
        rejectReason: reason
      }
    }).then(res => {
      wx.hideLoading();
      if (res.result && res.result.success) {
        wx.showToast({
          title: action === 'approve' ? '已通过' : '已拒绝',
          icon: 'success'
        });
        
        // 更新本地数据
        const detail = { ...this.data.detail };
        detail.status = res.result.data.newStatus;
        detail.updateTimeStr = this.formatTime(new Date());
        if (action === 'reject') {
          detail.rejectReason = reason;
        }
        this.setData({ detail, showRejectInput: false });

        // 返回上一页并刷新
        setTimeout(() => {
          const pages = getCurrentPages();
          const prevPage = pages[pages.length - 2];
          if (prevPage && prevPage.refreshList) {
            prevPage.refreshList();
          }
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.result.errMsg || '操作失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('审核操作失败', err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    });
  },

  // 预览营业执照
  previewLicense() {
    const url = this.data.detail.businessLicenseUrl;
    if (url) {
      wx.previewImage({
        urls: [url],
        current: url
      });
    }
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});
