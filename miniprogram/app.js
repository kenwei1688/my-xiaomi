// app.js - 生活小秘小程序入口
App({
  globalData: {
    userInfo: null,
    location: '深圳·南山',
    apiBaseUrl: '', // 后端API地址，留空则使用本地数据
    apiAvailable: false,
    // 兴趣偏好（全局共享）
    interests: [
      { id: 'food', name: '美食探店', emoji: '🍜', bg: 'linear-gradient(135deg,#FF6B35,#FF9A56)', selected: true },
      { id: 'massage', name: '足疗养生', emoji: '💆', bg: 'linear-gradient(135deg,#34C759,#30D158)', selected: true },
      { id: 'travel', name: '旅游度假', emoji: '✈️', bg: 'linear-gradient(135deg,#FF9500,#FFB800)', selected: false },
      { id: 'fitness', name: '运动健身', emoji: '💪', bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)', selected: true },
      { id: 'ktv', name: 'KTV欢唱', emoji: '🎤', bg: 'linear-gradient(135deg,#5856D6,#7B79F0)', selected: false },
      { id: 'movie', name: '电影演出', emoji: '🎬', bg: 'linear-gradient(135deg,#00C7BE,#30D5C8)', selected: true },
      { id: 'attraction', name: '景点游玩', emoji: '📷', bg: 'linear-gradient(135deg,#AF52DE,#D65BFF)', selected: true },
      { id: 'car', name: '打车出行', emoji: '🚗', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)', selected: false },
      { id: 'shopping', name: '逛街购物', emoji: '🛍️', bg: 'linear-gradient(135deg,#FF9500,#FFB800)', selected: false },
      { id: 'beauty', name: '美甲美容', emoji: '💅', bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)', selected: false },
      { id: 'bar', name: '酒吧夜店', emoji: '🍺', bg: 'linear-gradient(135deg,#5856D6,#7B79F0)', selected: false },
      { id: 'photo', name: '摄影写真', emoji: '📸', bg: 'linear-gradient(135deg,#00C7BE,#30D5C8)', selected: false },
    ],
    // 兴趣ID到推荐类型的映射
    interestTypeMap: {
      food: '美食', massage: '养生', travel: '旅游', fitness: '健身',
      ktv: 'KTV', movie: '电影', attraction: '景点', car: '出行',
      shopping: '购物', beauty: '美容', bar: '酒吧', photo: '摄影'
    }
  },

  onLaunch() {
    // 检查API可用性
    this.checkApi();
    // 获取系统信息
    const sysInfo = wx.getWindowInfo();
    this.globalData.statusBarHeight = sysInfo.statusBarHeight || 20;
    this.globalData.windowHeight = sysInfo.windowHeight || 667;
    this.globalData.windowWidth = sysInfo.windowWidth || 375;
  },

  checkApi() {
    const baseUrl = this.globalData.apiBaseUrl;
    if (!baseUrl) {
      this.globalData.apiAvailable = false;
      return;
    }
    wx.request({
      url: baseUrl + '/api/health',
      method: 'GET',
      timeout: 3000,
      success: () => {
        this.globalData.apiAvailable = true;
      },
      fail: () => {
        this.globalData.apiAvailable = false;
      }
    });
  }
});
