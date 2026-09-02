var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
const API = {
  baseUrl: "",
  available: false,
  // 检测后端是否可用
  check() {
    return __async(this, null, function* () {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = yield fetch(this.baseUrl + "/api/health", { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = yield res.json();
          this.available = true;
          console.log("[API] 后端已连接 ✓", data.version);
          return true;
        }
      } catch (e) {
        this.available = false;
        console.log("[API] 后端未连接，使用本地数据");
      }
      return false;
    });
  },
  get(path) {
    return __async(this, null, function* () {
      const res = yield fetch(this.baseUrl + path);
      return res.json();
    });
  },
  post(path, body) {
    return __async(this, null, function* () {
      const res = yield fetch(this.baseUrl + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      return res.json();
    });
  },
  // 加载全部数据并映射到前端格式
  loadAll() {
    return __async(this, null, function* () {
      if (!this.available) return;
      try {
        const [
          categories,
          banners,
          merchants,
          deals,
          flashSales,
          hotSearches,
          interests,
          recommendations,
          newestData,
          ordersData,
          user,
          quickActions,
          functions,
          settings
        ] = yield Promise.all([
          this.get("/api/categories"),
          this.get("/api/banners"),
          this.get("/api/merchants?nearby=true"),
          this.get("/api/deals"),
          this.get("/api/flash-sales"),
          this.get("/api/hot-searches"),
          this.get("/api/interests"),
          this.get("/api/recommendations"),
          this.get("/api/newest"),
          this.get("/api/orders"),
          this.get("/api/user"),
          this.get("/api/quick-actions"),
          this.get("/api/functions"),
          this.get("/api/settings")
        ]);
        CATEGORIES.length = 0;
        categories.forEach((c) => {
          CATEGORIES.push({
            name: c.name,
            icon: SVG[c.icon] || SVG.food,
            bg: "linear-gradient(135deg,".concat(c.color, ",").concat(c.color2, ")")
          });
        });
        BANNERS.length = 0;
        banners.forEach((b) => {
          BANNERS.push({
            title: b.title,
            subtitle: b.subtitle,
            img: pic(b.seed, 400, 200),
            tag: b.tag
          });
        });
        MERCHANTS.length = 0;
        const tagColors = ["#FF6B35", "#FF3B30", "#007AFF", "#34C759", "#FF9500", "#AF52DE"];
        merchants.forEach((m) => {
          MERCHANTS.push({
            name: m.name,
            img: pic(m.seed, 400, 280),
            rating: m.rating,
            distance: m.distance,
            address: m.address,
            cuisine: m.category,
            avgPrice: m.avgPrice,
            soldCount: "已售" + (m.soldCount > 9999 ? (m.soldCount / 1e4).toFixed(1) + "万" : m.soldCount),
            tags: m.tags.map((t, i) => ({ text: t, color: tagColors[i % tagColors.length] })),
            isOpen: m.open,
            hours: m.hours
          });
        });
        DEALS.length = 0;
        deals.forEach((d) => {
          const discount = Math.round(d.price / d.originalPrice * 10);
          DEALS.push({
            title: d.name,
            price: d.price,
            oldPrice: d.originalPrice,
            badge: discount <= 5 ? "5折" : discount + "折",
            sold: d.soldCount,
            img: pic(d.seed, 200, 150)
          });
        });
        FLASH_SALES.length = 0;
        flashSales.forEach((f) => {
          FLASH_SALES.push({
            title: f.name,
            price: f.price,
            origPrice: f.originalPrice,
            progress: Math.round(f.soldCount / f.totalStock * 100),
            img: pic(f.seed, 150, 100)
          });
        });
        HOT_SEARCHES.length = 0;
        hotSearches.forEach((s) => HOT_SEARCHES.push(s));
        INTEREST_CATEGORIES.length = 0;
        const catColorMap = {};
        categories.forEach((c) => catColorMap[c.name] = { c1: c.color, c2: c.color2, icon: c.icon });
        interests.forEach((t) => {
          INTEREST_CATEGORIES.push({
            id: t.icon,
            name: t.name,
            svg: SVG[t.icon] || SVG.food,
            bg: "linear-gradient(135deg,#FF6B35,#FF9A56)",
            selected: t.selected
          });
        });
        RECOMMEND_FEED.length = 0;
        const catColors = {};
        categories.forEach((c) => catColors[c.name] = c.color);
        recommendations.forEach((r) => {
          RECOMMEND_FEED.push({
            type: r.category,
            typeColor: catColors[r.category] || "#FF6B35",
            title: r.title,
            subtitle: r.subtitle,
            rating: r.rating,
            distance: r.distance,
            price: r.price,
            unit: r.price >= 100 ? "/份" : "/张",
            sold: r.id * 100 + 88,
            img: pic(r.seed, 200, 150)
          });
        });
        QUICK_ACTIONS.length = 0;
        quickActions.forEach((a) => {
          QUICK_ACTIONS.push({
            name: a.name,
            svg: SVG[a.icon] || SVG.food,
            bg: "linear-gradient(135deg,".concat(a.color, ",").concat(a.color, ")")
          });
        });
        NEWEST_FILTERS.length = 0;
        if (newestData.filters) {
          newestData.filters.forEach((f) => NEWEST_FILTERS.push(f));
        }
        NEWEST_POSTS.length = 0;
        if (newestData.feed) {
          newestData.feed.forEach((p) => {
            const catColor = catColors[p.category] || "#FF6B35";
            NEWEST_POSTS.push({
              user: p.author,
              userBg: "linear-gradient(135deg,".concat(catColor, ",").concat(catColor, "dd)"),
              userSvg: SVG.store || SVG.food,
              time: "刚刚上架",
              isOfficial: true,
              imgCount: 1,
              images: [pic(p.seed, 400, 300)],
              title: p.content,
              desc: p.content2,
              tags: [p.category, p.categoryTag, "新品"],
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
        ORDER_STATUSES.length = 0;
        if (ordersData.categories) {
          ordersData.categories.forEach((o) => {
            ORDER_STATUSES.push({
              name: o.name,
              bg: "linear-gradient(135deg,#FF6B35,#FF9A56)",
              svg: SVG[o.icon] || SVG.card,
              badge: o.count > 0 ? o.count : null
            });
          });
        }
        FUNC_ITEMS.length = 0;
        functions.forEach((f) => {
          FUNC_ITEMS.push({
            name: f.name,
            bg: "linear-gradient(135deg,#FF6B35,#FF9A56)",
            svg: SVG[f.icon] || SVG.star
          });
        });
        SETTINGS.length = 0;
        settings.forEach((s) => {
          SETTINGS.push({
            label: s.name,
            bg: "linear-gradient(135deg,#8E8E93,#AEAEB2)",
            svg: SVG[s.icon] || SVG.gear,
            value: ""
          });
        });
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
        try {
          const trips = yield this.get("/api/trips");
          if (Array.isArray(trips) && trips.length > 0) {
            TRIP_PLANS.length = 0;
            trips.forEach((t) => {
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
                coverImg: picG(t.seed || "trip" + t.id, 400, 200, "#FF6B35", "#FF9A56"),
                progress: t.progress,
                schedule: t.schedule || []
              });
            });
          }
        } catch (e) {
          console.log("[API] 行程数据使用本地");
        }
        try {
          const reminders = yield this.get("/api/reminders");
          if (Array.isArray(reminders) && reminders.length > 0) {
            REMINDERS.length = 0;
            reminders.forEach((r) => {
              REMINDERS.push({
                id: r.id,
                type: r.type,
                title: r.title,
                desc: r.desc,
                time: r.time,
                repeat: r.repeat,
                enabled: r.enabled,
                icon: r.icon || reminderIcon(r.type),
                bg: r.bg || reminderBg(r.type),
                date: r.date
              });
            });
          }
        } catch (e) {
          console.log("[API] 提醒数据使用本地");
        }
        console.log("[API] 数据加载完成 ✓");
      } catch (e) {
        console.error("[API] 数据加载失败，使用本地数据:", e);
        this.available = false;
      }
    });
  },
  // AI 对话
  chat(message) {
    return __async(this, null, function* () {
      if (!this.available) return null;
      try {
        const data = yield this.post("/api/ai/chat", { message, sessionId: "web-" + Date.now() });
        if (data.success) return data.data;
      } catch (e) {
        console.error("[API] AI 对话失败:", e);
      }
      return null;
    });
  },
  // 点赞
  likePost(postId) {
    return __async(this, null, function* () {
      if (!this.available) return null;
      try {
        const data = yield this.post("/api/newest/".concat(postId, "/like"), {});
        return data.data;
      } catch (e) {
        console.error("[API] 点赞失败:", e);
      }
      return null;
    });
  },
  // 保存兴趣
  saveInterests(selectedIds) {
    return __async(this, null, function* () {
      if (!this.available) return;
      try {
        yield this.post("/api/interests", { selectedIds });
        console.log("[API] 兴趣偏好已同步");
      } catch (e) {
        console.error("[API] 保存兴趣失败:", e);
      }
    });
  }
};
