// utils/api.js - API 客户端模块

const data = require('./data.js');

const API = {
  baseUrl: '',
  available: false,

  // 初始化
  init() {
    const app = getApp();
    this.baseUrl = app.globalData.apiBaseUrl;
    this.available = app.globalData.apiAvailable;
  },

  // GET 请求
  get(path) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.baseUrl + path,
        method: 'GET',
        success: (res) => resolve(res.data),
        fail: reject
      });
    });
  },

  // POST 请求
  post(path, body) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.baseUrl + path,
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: body,
        success: (res) => resolve(res.data),
        fail: reject
      });
    });
  },

  // AI 对话
  async chat(message) {
    if (!this.available) return null;
    try {
      const res = await this.post('/api/ai/chat', { message, sessionId: 'mini-' + Date.now() });
      if (res.success) return res.data;
    } catch (e) {
      console.error('[API] AI 对话失败:', e);
    }
    return null;
  },

  // 点赞
  async likePost(postId) {
    if (!this.available) return null;
    try {
      const res = await this.post('/api/newest/' + postId + '/like', {});
      return res.data;
    } catch (e) {
      console.error('[API] 点赞失败:', e);
    }
    return null;
  },

  // 保存兴趣
  async saveInterests(selectedIds) {
    if (!this.available) return;
    try {
      await this.post('/api/interests', { selectedIds });
    } catch (e) {
      console.error('[API] 保存兴趣失败:', e);
    }
  }
};

module.exports = API;
