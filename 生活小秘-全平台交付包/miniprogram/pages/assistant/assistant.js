// pages/assistant/assistant.js
const data = require('../../utils/data.js');
const API = require('../../utils/api.js');

Page({
  data: {
    quickActions: data.quickActions,
    messages: [],
    inputValue: '',
    scrollToView: '',
    isTyping: false,
    statusBarHeight: 20,
  },

  onLoad() {
    const app = getApp();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight || 20 });
    // 初始化欢迎消息
    this.addBotMessage('你好呀！我是小秘，你的智能生活管家～\n有什么需要帮忙的尽管跟我说！\n\n我可以帮你：点外卖、订餐厅、订酒店、买火车票/飞机票、规划行程、买电影票、订KTV包厢等。');
    API.init();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.scrollChatToBottom();
  },

  // 输入
  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  // 快捷指令
  quickAction(e) {
    const name = e.currentTarget.dataset.name;
    this.setData({ inputValue: name });
    this.sendMessage();
  },

  // 发送消息
  sendMessage() {
    const text = this.data.inputValue.trim();
    if (!text) return;

    // 添加用户消息
    const messages = this.data.messages;
    messages.push({
      type: 'user',
      text: text,
      avatar: '😊',
      avatarBg: 'linear-gradient(135deg,#007AFF,#5AC8FA)'
    });
    this.setData({ messages, inputValue: '', isTyping: true });
    this.scrollChatToBottom();

    // 尝试调用后端AI
    API.chat(text).then(response => {
      if (response) {
        this.setData({ isTyping: false });
        this.addAIResponse(response);
      } else {
        // 本地回退
        setTimeout(() => {
          this.setData({ isTyping: false });
          const reply = this.getLocalReply(text);
          this.addBotMessage(reply.text, reply.card);
        }, 800);
      }
    });
  },

  // 本地回复
  getLocalReply(text) {
    const replies = data.chatReplies;
    const keys = ['外卖', '餐厅', '酒店', '火车', '飞机', '行程', '电影'];
    for (const k of keys) {
      if (text.includes(k)) return replies[k];
    }
    if (text.includes('K') || text.includes('KTV') || text.includes('k歌') || text.includes('唱歌')) return replies['K'];
    return replies['default'];
  },

  // 添加Bot消息
  addBotMessage(text, card) {
    const messages = this.data.messages;
    const msg = {
      type: 'bot',
      text: text,
      avatar: '🤖',
      avatarBg: 'linear-gradient(135deg,#FF6B35,#FFB627)'
    };
    if (card) {
      msg.card = card;
    }
    messages.push(msg);
    this.setData({ messages });
    this.scrollChatToBottom();
  },

  // 添加AI响应（带卡片和操作按钮）
  addAIResponse(response) {
    const messages = this.data.messages;
    const msg = {
      type: 'bot',
      text: response.reply,
      avatar: '🤖',
      avatarBg: 'linear-gradient(135deg,#FF6B35,#FFB627)',
      cards: response.cards || [],
      actions: response.actions || []
    };
    messages.push(msg);
    this.setData({ messages });
    this.scrollChatToBottom();
  },

  // 点击操作按钮
  sendQuickMessage(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({ inputValue: text });
    this.sendMessage();
  },

  // 卡片按钮点击
  onCardBtnTap(e) {
    const btn = e.currentTarget.dataset.btn;
    wx.showToast({ title: btn, icon: 'none' });
  },

  // 滚动到底部
  scrollChatToBottom() {
    setTimeout(() => {
      this.setData({ scrollToView: 'msg-bottom' });
    }, 100);
  },
});
