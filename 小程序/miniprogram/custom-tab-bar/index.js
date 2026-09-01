// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/home/home', text: '首页', emoji: '🏠', emojiActive: '🏠' },
      { pagePath: '/pages/recommend/recommend', text: '推荐', emoji: '🌟', emojiActive: '🌟' },
      { pagePath: '/pages/assistant/assistant', text: '小秘', emoji: '🤖', emojiActive: '🤖', isCenter: true },
      { pagePath: '/pages/newest/newest', text: '上新', emoji: '🆕', emojiActive: '🆕' },
      { pagePath: '/pages/profile/profile', text: '我的', emoji: '👤', emojiActive: '👤' },
    ]
  },

  methods: {
    switchTab(e) {
      const idx = e.currentTarget.dataset.index;
      const path = this.data.list[idx].pagePath;
      this.setData({ selected: idx });
      wx.switchTab({ url: path });
    }
  }
});
