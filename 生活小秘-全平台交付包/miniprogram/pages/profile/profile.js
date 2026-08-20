// pages/profile/profile.js
const data = require('../../utils/data.js');

Page({
  data: {
    userInfo: data.userInfo,
    orderStatuses: data.orderStatuses,
    funcItems: data.funcItems,
    settings: data.settings,
    statusBarHeight: 20,
  },

  onLoad() {
    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 });
    }
  },

  // 订单点击
  onOrderTap(e) {
    const name = e.currentTarget.dataset.name;
    wx.showToast({ title: '查看「' + name + '」订单', icon: 'none' });
  },

  // 功能点击
  onFuncTap(e) {
    const name = e.currentTarget.dataset.name;
    wx.showToast({ title: '打开「' + name + '」', icon: 'none' });
  },

  // 设置点击
  onSettingTap(e) {
    const label = e.currentTarget.dataset.label;
    wx.showToast({ title: '打开「' + label + '」', icon: 'none' });
  },

  // 编辑资料
  onEditTap() {
    wx.showToast({ title: '编辑个人资料', icon: 'none' });
  },
});
