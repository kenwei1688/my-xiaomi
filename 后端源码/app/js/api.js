// ==================== 生活小秘 - API 客户端 ====================
// 自动检测后端，可用时从 API 加载数据，不可用时回退到本地 data.js

const API = {
  baseUrl: '',
  serverUrl: '',
  token: '',
  available: false,

  // 从 localStorage 恢复服务器地址与登录态
  init() {
    try {
      this.serverUrl = (localStorage.getItem('life_server') || '').trim().replace(/\/+$/, '');
      this.token = (localStorage.getItem('life_token') || '').trim();
    } catch (e) {}
    this.baseUrl = this.serverUrl;
  },

  // 设置服务器地址（如 https://your-server:3000）
  setServer(url) {
    this.serverUrl = (url || '').trim().replace(/\/+$/, '');
    this.baseUrl = this.serverUrl;
    try { localStorage.setItem('life_server', this.serverUrl); } catch (e) {}
  },

  setToken(t) {
    this.token = (t || '').trim();
    try {
      if (this.token) localStorage.setItem('life_token', this.token);
      else localStorage.removeItem('life_token');
    } catch (e) {}
  },

  clearToken() { this.setToken(''); },

  // 是否已配置云端（服务器 + 登录态）
  isCloud() { return !!(this.serverUrl && this.token); },

  // 带鉴权的通用请求（自动附加 Bearer Token；401 时清空登录态）
  async _req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    let res;
    try {
      res = await fetch(this.serverUrl + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      return { status: 0, data: null, error: String(e) };
    }
    let data = null;
    try { data = await res.json(); } catch (e) {}
    if (res.status === 401) this.clearToken();
    return { status: res.status, data };
  },

  async register(identifier, password, name) {
    const { status, data } = await this._req('POST', '/api/auth/register', { identifier, password, name });
    if (status === 200 && data && data.token) this.setToken(data.token);
    return { status, data };
  },

  async login(identifier, password) {
    const { status, data } = await this._req('POST', '/api/auth/login', { identifier, password });
    if (status === 200 && data && data.token) this.setToken(data.token);
    return { status, data };
  },

  async logout() { this.clearToken(); },

  async getMe() { return this._req('GET', '/api/me'); },

  // 从云端拉取当前用户的全部提醒（返回数组或 null）
  async cloudPullReminders() {
    const { status, data } = await this._req('GET', '/api/reminders');
    if (status === 200 && data && Array.isArray(data.reminders)) return data.reminders;
    return null;
  },

  // 全量同步提醒到云端（云端以客户端完整列表为准，幂等）
  async cloudSyncReminders(list) {
    return this._req('POST', '/api/reminders', { reminders: list });
  },

  // ===== 小目标 =====
  async cloudPullGoals() {
    const { status, data } = await this._req('GET', '/api/goals');
    if (status === 200 && data && Array.isArray(data.goals)) return data.goals;
    return null;
  },
  async cloudCreateGoal(goal) {
    return this._req('POST', '/api/goals', goal);
  },
  async cloudUpdateGoal(id, patch) {
    return this._req('PUT', '/api/goals/' + id, patch);
  },
  async cloudDeleteGoal(id) {
    return this._req('DELETE', '/api/goals/' + id);
  },

  // ===== 计划 =====
  async cloudPullPlans() {
    const { status, data } = await this._req('GET', '/api/plans');
    if (status === 200 && data && Array.isArray(data.plans)) return data.plans;
    return null;
  },
  async cloudCreatePlan(plan) {
    return this._req('POST', '/api/plans', plan);
  },
  async cloudUpdatePlan(id, patch) {
    return this._req('PUT', '/api/plans/' + id, patch);
  },
  async cloudDeletePlan(id) {
    return this._req('DELETE', '/api/plans/' + id);
  },

  // ===== 日记 =====
  async cloudPullDiary() {
    const { status, data } = await this._req('GET', '/api/diary');
    if (status === 200 && data && Array.isArray(data.diary)) return data.diary;
    return null;
  },
  async cloudCreateDiary(diary) {
    return this._req('POST', '/api/diary', diary);
  },
  async cloudUpdateDiary(id, patch) {
    return this._req('PUT', '/api/diary/' + id, patch);
  },
  async cloudDeleteDiary(id) {
    return this._req('DELETE', '/api/diary/' + id);
  },

  // 检测后端是否可用
  async check() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(this.baseUrl + '/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.available = true;
        console.log('[API] 后端已连接 ✓', data.version);
        return true;
      }
    } catch (e) {
      this.available = false;
      console.log('[API] 后端未连接，使用本地数据');
    }
    return false;
  },

  async get(path) {
    const headers = {};
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    const res = await fetch(this.baseUrl + path, { headers });
    return res.json();
  },

  async post(path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    return res.json();
  },

  // 加载全部数据并映射到前端格式
  async loadAll() {
    if (!this.available) return;

    try {
      const [
        categories, banners, merchants, deals, flashSales,
        hotSearches, interests, recommendations, newestData,
        ordersData, user, quickActions, functions, settings
      ] = await Promise.all([
        this.get('/api/categories'),
        this.get('/api/banners'),
        this.get('/api/merchants?nearby=true'),
        this.get('/api/deals'),
        this.get('/api/flash-sales'),
        this.get('/api/hot-searches'),
        this.get('/api/interests'),
        this.get('/api/recommendations'),
        this.get('/api/newest'),
        this.get('/api/orders'),
        this.get('/api/user'),
        this.get('/api/quick-actions'),
        this.get('/api/functions'),
        this.get('/api/settings'),
      ]);

      // ===== 映射分类 =====
      CATEGORIES.length = 0;
      categories.forEach(c => {
        CATEGORIES.push({
          name: c.name,
          icon: SVG[c.icon] || SVG.food,
          bg: `linear-gradient(135deg,${c.color},${c.color2})`
        });
      });

      // ===== 映射轮播 =====
      BANNERS.length = 0;
      banners.forEach(b => {
        BANNERS.push({
          title: b.title,
          subtitle: b.subtitle,
          img: pic(b.seed, 400, 200),
          tag: b.tag
        });
      });

      // ===== 映射商家 =====
      MERCHANTS.length = 0;
      const tagColors = ['#FF6B35', '#FF3B30', '#007AFF', '#34C759', '#FF9500', '#AF52DE'];
      merchants.forEach(m => {
        MERCHANTS.push({
          name: m.name,
          img: pic(m.seed, 400, 280),
          rating: m.rating,
          distance: m.distance,
          address: m.address,
          cuisine: m.category,
          avgPrice: m.avgPrice,
          soldCount: '已售' + (m.soldCount > 9999 ? (m.soldCount/10000).toFixed(1)+'万' : m.soldCount),
          tags: m.tags.map((t, i) => ({ text: t, color: tagColors[i % tagColors.length] })),
          isOpen: m.open,
          hours: m.hours
        });
      });

      // ===== 映射特价美食 =====
      DEALS.length = 0;
      deals.forEach(d => {
        const discount = Math.round(d.price / d.originalPrice * 10);
        DEALS.push({
          title: d.name,
          price: d.price,
          oldPrice: d.originalPrice,
          badge: discount <= 5 ? '5折' : discount + '折',
          sold: d.soldCount,
          img: pic(d.seed, 200, 150)
        });
      });

      // ===== 映射秒杀 =====
      FLASH_SALES.length = 0;
      flashSales.forEach(f => {
        FLASH_SALES.push({
          title: f.name,
          price: f.price,
          origPrice: f.originalPrice,
          progress: Math.round(f.soldCount / f.totalStock * 100),
          img: pic(f.seed, 150, 100)
        });
      });

      // ===== 映射热门搜索 =====
      HOT_SEARCHES.length = 0;
      hotSearches.forEach(s => HOT_SEARCHES.push(s));

      // ===== 映射兴趣偏好 =====
      INTEREST_CATEGORIES.length = 0;
      const catColorMap = {};
      categories.forEach(c => catColorMap[c.name] = { c1: c.color, c2: c.color2, icon: c.icon });
      interests.forEach(t => {
        INTEREST_CATEGORIES.push({
          id: t.icon,
          name: t.name,
          svg: SVG[t.icon] || SVG.food,
          bg: `linear-gradient(135deg,#FF6B35,#FF9A56)`,
          selected: t.selected
        });
      });

      // ===== 映射推荐流 =====
      RECOMMEND_FEED.length = 0;
      const catColors = {};
      categories.forEach(c => catColors[c.name] = c.color);
      recommendations.forEach(r => {
        RECOMMEND_FEED.push({
          type: r.category,
          typeColor: catColors[r.category] || '#FF6B35',
          title: r.title,
          subtitle: r.subtitle,
          rating: r.rating,
          distance: r.distance,
          price: r.price,
          unit: r.price >= 100 ? '/份' : '/张',
          sold: r.id * 100 + 88,
          img: pic(r.seed, 200, 150)
        });
      });

      // ===== 映射快捷指令 =====
      QUICK_ACTIONS.length = 0;
      quickActions.forEach(a => {
        QUICK_ACTIONS.push({
          name: a.name,
          svg: SVG[a.icon] || SVG.food,
          bg: `linear-gradient(135deg,${a.color},${a.color})`
        });
      });

      // ===== 映射上新动态 =====
      NEWEST_FILTERS.length = 0;
      if (newestData.filters) {
        newestData.filters.forEach(f => NEWEST_FILTERS.push(f));
      }
      NEWEST_POSTS.length = 0;
      if (newestData.feed) {
        newestData.feed.forEach(p => {
          const catColor = catColors[p.category] || '#FF6B35';
          NEWEST_POSTS.push({
            user: p.author,
            userBg: `linear-gradient(135deg,${catColor},${catColor}dd)`,
            userSvg: SVG.store || SVG.food,
            time: '刚刚上架',
            isOfficial: true,
            imgCount: 1,
            images: [pic(p.seed, 400, 300)],
            title: p.content,
            desc: p.content2,
            tags: [p.category, p.categoryTag, '新品'],
            price: p.price,
            oldPrice: p.originalPrice,
            liked: p.liked,
            likes: p.likes,
            commentCount: p.comments.length,
            showComments: false,
            comments: p.comments
          });
        });
      }

      // ===== 映射订单 =====
      ORDER_STATUSES.length = 0;
      if (ordersData.categories) {
        ordersData.categories.forEach(o => {
          ORDER_STATUSES.push({
            name: o.name,
            bg: `linear-gradient(135deg,#FF6B35,#FF9A56)`,
            svg: SVG[o.icon] || SVG.card,
            badge: o.count > 0 ? o.count : null
          });
        });
      }

      // ===== 映射功能入口 =====
      FUNC_ITEMS.length = 0;
      functions.forEach(f => {
        FUNC_ITEMS.push({
          name: f.name,
          bg: `linear-gradient(135deg,#FF6B35,#FF9A56)`,
          svg: SVG[f.icon] || SVG.star
        });
      });

      // ===== 映射设置列表 =====
      SETTINGS.length = 0;
      settings.forEach(s => {
        SETTINGS.push({
          label: s.name,
          bg: `linear-gradient(135deg,#8E8E93,#AEAEB2)`,
          svg: SVG[s.icon] || SVG.gear,
          value: ''
        });
      });

      // ===== 更新用户信息 =====
      if (user) {
        USER_PROFILE.name = user.name || USER_PROFILE.name;
        USER_PROFILE.avatar = user.avatar || USER_PROFILE.avatar;
        USER_PROFILE.level = user.level || USER_PROFILE.level;
        USER_PROFILE.levelName = user.levelName || USER_PROFILE.levelName;
        USER_PROFILE.levelProgress = user.levelProgress || USER_PROFILE.levelProgress;
        USER_PROFILE.nextLevel = user.nextLevel || USER_PROFILE.nextLevel;
        USER_PROFILE.following = user.following || USER_PROFILE.following;
        USER_PROFILE.followers = user.followers || USER_PROFILE.followers;
        USER_PROFILE.posts = user.posts || USER_PROFILE.posts;
        if (user.gender) USER_PROFILE.gender = user.gender;
        if (user.birthday) USER_PROFILE.birthday = user.birthday;
        if (user.city) USER_PROFILE.city = user.city;
        if (user.bio) USER_PROFILE.bio = user.bio;
      }

      // ===== 加载行程规划 =====
      try {
        const trips = await this.get('/api/trips');
        if (Array.isArray(trips) && trips.length > 0) {
          TRIP_PLANS.length = 0;
          trips.forEach(t => {
            TRIP_PLANS.push({
              id: t.id,
              title: t.title,
              status: t.status,
              startDate: t.startDate,
              endDate: t.endDate,
              days: t.days,
              destination: t.destination,
              budget: t.budget,
              spent: t.spent,
              coverImg: picG(t.seed || 'trip' + t.id, 400, 200, '#FF6B35', '#FF9A56'),
              progress: t.progress,
              schedule: t.schedule || [],
            });
          });
        }
      } catch(e) { console.log('[API] 行程数据使用本地'); }

      // ===== 加载提醒事项 =====
      try {
        const reminders = await this.get('/api/reminders');
        if (Array.isArray(reminders) && reminders.length > 0) {
          REMINDERS.length = 0;
          const bgMap = {
            work: 'linear-gradient(135deg,#007AFF,#5AC8FA)',
            offwork: 'linear-gradient(135deg,#34C759,#30D158)',
            travel: 'linear-gradient(135deg,#00C7BE,#30D5C8)',
            custom: 'linear-gradient(135deg,#FF9500,#FFB800)',
          };
          reminders.forEach(r => {
            REMINDERS.push({
              id: r.id,
              type: r.type,
              title: r.title,
              desc: r.desc,
              time: r.time,
              repeat: r.repeat,
              enabled: r.enabled,
              icon: r.icon || 'bell',
              bg: bgMap[r.type] || bgMap.custom,
              date: r.date,
            });
          });
        }
      } catch(e) { console.log('[API] 提醒数据使用本地'); }

      // ===== 加载小目标 =====
      try {
        const goals = await this.cloudPullGoals();
        if (goals && goals.length > 0) {
          GOALS.length = 0;
          const goalBgs = ['linear-gradient(135deg,#FF6B35,#FF9A56)','linear-gradient(135deg,#FF2D55,#FF6B6B)','linear-gradient(135deg,#34C759,#30D158)','linear-gradient(135deg,#007AFF,#5AC8FA)','linear-gradient(135deg,#AF52DE,#D65BFF)'];
          const goalIcons = ['📖','🏃','🍳','💪','🎯','✨','📚','🧘'];
          goals.forEach((g, i) => {
            GOALS.push({
              id: g.id, title: g.title, desc: g.desc || '',
              target: g.target || '', progress: g.progress || 0,
              deadline: g.deadline || '', status: g.status || 'active',
              bg: goalBgs[i % goalBgs.length], icon: goalIcons[i % goalIcons.length],
            });
          });
        }
      } catch(e) { console.log('[API] 目标数据使用本地'); }

      // ===== 加载计划 =====
      try {
        const plans = await this.cloudPullPlans();
        if (plans && plans.length > 0) {
          PLANS.length = 0;
          const planBgs = ['linear-gradient(135deg,#007AFF,#5AC8FA)','linear-gradient(135deg,#5856D6,#7B79F0)','linear-gradient(135deg,#FF9500,#FFB800)','linear-gradient(135deg,#34C759,#30D158)'];
          plans.forEach((p, i) => {
            PLANS.push({
              id: p.id, title: p.title, content: p.content || '',
              status: p.status || 'pending', dueDate: p.dueDate || '',
              bg: planBgs[i % planBgs.length], icon: '📋',
            });
          });
        }
      } catch(e) { console.log('[API] 计划数据使用本地'); }

      // ===== 加载日记 =====
      try {
        const diaries = await this.cloudPullDiary();
        if (diaries && diaries.length > 0) {
          DIARY.length = 0;
          const diaryBgs = ['linear-gradient(135deg,#FF9500,#FFB800)','linear-gradient(135deg,#00C7BE,#30D5C8)','linear-gradient(135deg,#FF6B35,#FF9A56)','linear-gradient(135deg,#AF52DE,#D65BFF)'];
          diaries.forEach((d, i) => {
            DIARY.push({
              id: d.id, title: d.title, content: d.content || '',
              mood: d.mood || '平静', date: d.date || '',
              bg: diaryBgs[i % diaryBgs.length], icon: '📖',
            });
          });
        }
      } catch(e) { console.log('[API] 日记数据使用本地'); }

      console.log('[API] 数据加载完成 ✓');
    } catch (e) {
      console.error('[API] 数据加载失败，使用本地数据:', e);
      this.available = false;
    }
  },

  // AI 对话
  async chat(message) {
    if (!this.available) return null;
    try {
      const body = { message, sessionId: 'web-' + Date.now() };
      if (this.token) body.token = this.token; // 携带登录态，AI 创建的提醒/行程落云端
      const data = await this.post('/api/ai/chat', body);
      if (data.success) return data.data;
    } catch (e) {
      console.error('[API] AI 对话失败:', e);
    }
    return null;
  },

  // 点赞
  async likePost(postId) {
    if (!this.available) return null;
    try {
      const data = await this.post(`/api/newest/${postId}/like`, {});
      return data.data;
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
      console.log('[API] 兴趣偏好已同步');
    } catch (e) {
      console.error('[API] 保存兴趣失败:', e);
    }
  }
};
