// pages/home/home.js
const data = require('../../utils/data.js');

Page({
  data: {
    location: '深圳·南山',
    categories: data.categories,
    banners: data.banners,
    merchants: data.merchants,
    deals: data.deals,
    flashSales: data.flashSales,
    hotSearches: data.hotSearches,
    showSearch: false,
    searchValue: '',
    flashTimer: '02:35:48',
    currentBanner: 0,
    statusBarHeight: 20,
  },

  onLoad() {
    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 });
    this.startFlashTimer();
  },

  onShow() {
    // 更新tabbar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onUnload() {
    if (this._flashTimer) clearInterval(this._flashTimer);
  },

  // 秒杀倒计时
  startFlashTimer() {
    let s = 2 * 3600 + 35 * 60 + 48;
    this._flashTimer = setInterval(() => {
      s--;
      if (s < 0) s = 2 * 3600 + 35 * 60 + 48;
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      this.setData({ flashTimer: h + ':' + m + ':' + sec });
    }, 1000);
  },

  // 搜索
  toggleSearch() {
    this.setData({ showSearch: !this.data.showSearch });
  },

  onSearchInput(e) {
    this.setData({ searchValue: e.detail.value });
  },

  searchTag(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ searchValue: tag });
    wx.showToast({ title: '搜索「' + tag + '」', icon: 'none' });
  },

  doSearch() {
    if (!this.data.searchValue.trim()) return;
    wx.showToast({ title: '搜索「' + this.data.searchValue + '」', icon: 'none' });
    this.setData({ showSearch: false });
  },

  // 轮播切换
  onBannerChange(e) {
    this.setData({ currentBanner: e.detail.current });
  },

  // 分类点击
  onCategoryTap(e) {
    const name = e.currentTarget.dataset.name;
    wx.showToast({ title: '正在打开「' + name + '」', icon: 'none' });
  },

  // 商家点击
  onMerchantTap(e) {
    const name = e.currentTarget.dataset.name;
    wx.showToast({ title: '查看「' + name + '」详情', icon: 'none' });
  },

  // 特价点击
  onDealTap(e) {
    const title = e.currentTarget.dataset.title;
    wx.showToast({ title: '抢购「' + title + '」', icon: 'none' });
  },

  // 秒杀点击
  onFlashTap(e) {
    const title = e.currentTarget.dataset.title;
    wx.showToast({ title: '抢购「' + title + '」', icon: 'none' });
  },

  // 轮播点击
  onBannerTap(e) {
    const title = e.currentTarget.dataset.title;
    wx.showToast({ title: title, icon: 'none' });
  },
});
