// pages/recommend/recommend.js
const data = require('../../utils/data.js');
const API = require('../../utils/api.js');

Page({
  data: {
    feed: data.recommendFeed,
    interests: [],
    selectedInterests: [],
    showInterestPanel: false,
    panelInterests: [],
    filteredFeed: [],
    statusBarHeight: 20,
  },

  onLoad() {
    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 });
    this.loadInterests();
    this.filterFeed();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    // 重新加载兴趣（可能从其他页面修改）
    this.loadInterests();
    this.filterFeed();
  },

  loadInterests() {
    const app = getApp();
    const interests = app.globalData.interests;
    const selected = interests.filter(i => i.selected);
    this.setData({
      interests: interests,
      selectedInterests: selected,
      panelInterests: interests.map(i => ({ ...i }))
    });
  },

  // 打开兴趣编辑面板
  openInterestPanel() {
    this.setData({
      showInterestPanel: true,
      panelInterests: this.data.interests.map(i => ({ ...i }))
    });
  },

  closeInterestPanel() {
    this.setData({ showInterestPanel: false });
  },

  // 切换兴趣选中
  toggleInterest(e) {
    const id = e.currentTarget.dataset.id;
    const panelInterests = this.data.panelInterests;
    const idx = panelInterests.findIndex(i => i.id === id);
    if (idx > -1) {
      panelInterests[idx].selected = !panelInterests[idx].selected;
      this.setData({ panelInterests });
    }
  },

  // 保存兴趣
  saveInterests() {
    const app = getApp();
    const selectedIds = this.data.panelInterests.filter(i => i.selected).map(i => i.id);
    // 更新全局兴趣
    app.globalData.interests.forEach(i => {
      i.selected = selectedIds.includes(i.id);
    });
    this.loadInterests();
    this.filterFeed();
    this.setData({ showInterestPanel: false });
    wx.showToast({ title: '已保存' + selectedIds.length + '个兴趣偏好', icon: 'none' });
    // 同步后端
    API.init();
    API.saveInterests(selectedIds);
  },

  // 根据兴趣筛选推荐内容
  filterFeed() {
    const app = getApp();
    const interestMap = app.globalData.interestTypeMap;
    const selectedTypes = this.data.interests
      .filter(i => i.selected)
      .map(i => interestMap[i.id]);

    let items = data.recommendFeed;
    if (selectedTypes.length > 0) {
      items = data.recommendFeed.filter(i =>
        selectedTypes.some(s => i.type.includes(s))
      );
    }
    this.setData({ filteredFeed: items });
  },

  // 推荐卡片点击
  onRecTap(e) {
    const title = e.currentTarget.dataset.title;
    wx.showToast({ title: '查看「' + title + '」', icon: 'none' });
  },
});
