// pages/newest/newest.js
const data = require('../../utils/data.js');

Page({
  data: {
    filters: data.newestFilters,
    activeFilter: '全部',
    posts: [],
    statusBarHeight: 20,
  },

  onLoad() {
    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 });
    this.setData({ posts: data.newestPosts.map(p => ({ ...p })) });
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  // 筛选
  onFilterTap(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ activeFilter: filter });

    let items = data.newestPosts.map(p => ({ ...p }));
    if (filter !== '全部') {
      items = items.filter(p =>
        p.tags.some(t => t.includes(filter)) ||
        (filter === '美食' && p.user.includes('川味')) ||
        (filter === '养生' && p.user.includes('SPA')) ||
        (filter === '健身' && p.user.includes('健身')) ||
        (filter === 'KTV' && p.user.includes('KTV')) ||
        (filter === '景点' && p.user.includes('欢乐谷')) ||
        (filter === '海鲜' && p.user.includes('海世界'))
      );
    }
    this.setData({ posts: items });
  },

  // 点赞
  toggleLike(e) {
    const idx = e.currentTarget.dataset.index;
    const posts = this.data.posts;
    posts[idx].liked = !posts[idx].liked;
    posts[idx].likes += posts[idx].liked ? 1 : -1;
    this.setData({ posts });
  },

  // 展开/收起评论
  toggleComment(e) {
    const idx = e.currentTarget.dataset.index;
    const key = 'posts[' + idx + '].showComments';
    this.setData({ [key]: !this.data.posts[idx].showComments });
  },

  // 抢购
  onBuyTap(e) {
    const idx = e.currentTarget.dataset.index;
    const post = this.data.posts[idx];
    if (post.price === 0) {
      wx.showToast({ title: '免费体验报名成功', icon: 'none' });
    } else {
      wx.showToast({ title: '抢购成功', icon: 'none' });
    }
  },

  // 分享
  onShareTap() {
    wx.showToast({ title: '已分享到朋友圈', icon: 'none' });
  },
});
