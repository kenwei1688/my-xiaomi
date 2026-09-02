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
let currentPage = "home";
const pageState = {};
let carouselIndex = 0;
let carouselTimer = null;
let toastTimer = null;
function wrapSvg(inner, size) {
  return '<svg width="'.concat(size || 24, '" height="').concat(size || 24, '" viewBox="0 0 24 24" fill="none">').concat(inner, "</svg>");
}
function imgStyle(imgStr) {
  return "background-image:".concat(imgStr, ";background-size:cover;background-position:center;");
}
const STORAGE_KEY_TRIPS = "shenghuo_trips";
const STORAGE_KEY_REMINDERS = "shenghuo_reminders";
const STORAGE_KEY_PLANS = "shenghuo_plans";
const STORAGE_KEY_GOALS = "shenghuo_goals";
const STORAGE_KEY_DIARY = "shenghuo_diary";
const STORAGE_KEY_QUICK_ACTIONS = "shenghuo_quick_actions";
function saveTripsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(TRIP_PLANS));
  } catch (e) {
    console.warn("[Storage] 保存行程失败:", e);
  }
}
function saveRemindersToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(REMINDERS));
  } catch (e) {
    console.warn("[Storage] 保存提醒失败:", e);
  }
  syncRemindersToNative();
}
function savePlansToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(PLANS));
  } catch (e) {
    console.warn("[Storage] 保存计划失败:", e);
  }
}
function saveGoalsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(GOALS));
  } catch (e) {
    console.warn("[Storage] 保存目标失败:", e);
  }
}
function saveDiaryToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_DIARY, JSON.stringify(DIARY));
  } catch (e) {
    console.warn("[Storage] 保存日记失败:", e);
  }
}
function saveQuickActionsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY_QUICK_ACTIONS, JSON.stringify(QUICK_ACTIONS));
  } catch (e) {
    console.warn("[Storage] 保存快捷指令失败:", e);
  }
}
let _reminderPermRequested = false;
function syncRemindersToNative() {
  if (window.AndroidBridge && window.AndroidBridge.syncReminders) {
    try {
      window.AndroidBridge.syncReminders(JSON.stringify(REMINDERS));
    } catch (e) {
      console.warn("[Bridge] syncReminders 失败:", e);
    }
    const hasReminder = REMINDERS.some((r) => r.enabled !== false);
    if (hasReminder && !_reminderPermRequested && window.AndroidBridge.requestReminderPermissions) {
      try {
        window.AndroidBridge.requestReminderPermissions();
        _reminderPermRequested = true;
      } catch (e) {
      }
    }
  }
}
function loadReminderSettings() {
  if (window.AndroidBridge && window.AndroidBridge.getReminderSettings) {
    try {
      const raw = window.AndroidBridge.getReminderSettings();
      if (raw) return JSON.parse(raw);
    } catch (e) {
    }
  }
  return {};
}
function saveReminderSettingsToNative(settings) {
  if (window.AndroidBridge && window.AndroidBridge.saveReminderSettings) {
    try {
      window.AndroidBridge.saveReminderSettings(JSON.stringify(settings));
    } catch (e) {
    }
  }
}
function loadFromStorage() {
  try {
    const tripsData = localStorage.getItem(STORAGE_KEY_TRIPS);
    if (tripsData) {
      const parsed = JSON.parse(tripsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        TRIP_PLANS.length = 0;
        parsed.forEach((t) => TRIP_PLANS.push(t));
        console.log("[Storage] 恢复行程数据:", parsed.length, "条");
      }
    }
    const remindersData = localStorage.getItem(STORAGE_KEY_REMINDERS);
    if (remindersData) {
      const parsed = JSON.parse(remindersData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        REMINDERS.length = 0;
        parsed.forEach((r) => REMINDERS.push(r));
        console.log("[Storage] 恢复提醒数据:", parsed.length, "条");
      }
    }
    const plansData = localStorage.getItem(STORAGE_KEY_PLANS);
    if (plansData) {
      const parsed = JSON.parse(plansData);
      if (Array.isArray(parsed)) {
        PLANS.length = 0;
        parsed.forEach((x) => PLANS.push(x));
      }
    }
    const goalsData = localStorage.getItem(STORAGE_KEY_GOALS);
    if (goalsData) {
      const parsed = JSON.parse(goalsData);
      if (Array.isArray(parsed)) {
        GOALS.length = 0;
        parsed.forEach((x) => GOALS.push(x));
      }
    }
    const diaryData = localStorage.getItem(STORAGE_KEY_DIARY);
    if (diaryData) {
      const parsed = JSON.parse(diaryData);
      if (Array.isArray(parsed)) {
        DIARY.length = 0;
        parsed.forEach((x) => DIARY.push(x));
      }
    }
    const quickActionsData = localStorage.getItem(STORAGE_KEY_QUICK_ACTIONS);
    if (quickActionsData) {
      const parsed = JSON.parse(quickActionsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        QUICK_ACTIONS.length = 0;
        parsed.forEach((x) => QUICK_ACTIONS.push(x));
      }
    }
  } catch (e) {
    console.warn("[Storage] 加载数据失败:", e);
  }
}
let profileBadge = false;
function showProfileBadge() {
  profileBadge = true;
  const tab = document.querySelector('.tab-item[data-tab="profile"]');
  if (tab && !tab.querySelector(".tab-badge")) {
    const badge = document.createElement("span");
    badge.className = "tab-badge";
    badge.style.cssText = "position:absolute;top:2px;right:50%;margin-right:-20px;width:8px;height:8px;background:#FF3B30;border-radius:50%;border:1.5px solid #fff;";
    tab.appendChild(badge);
  }
}
function clearProfileBadge() {
  profileBadge = false;
  const tab = document.querySelector('.tab-item[data-tab="profile"]');
  if (tab) {
    const badge = tab.querySelector(".tab-badge");
    if (badge) badge.remove();
  }
}
function init() {
  return __async(this, null, function* () {
    const loadingEl = document.createElement("div");
    loadingEl.id = "appLoading";
    loadingEl.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;";
    loadingEl.innerHTML = '<div style="font-size:40px;margin-bottom:16px;">🌃</div><div style="color:#FF6B35;font-size:16px;font-weight:600;">生活小秘启动中...</div><div style="margin-top:8px;color:#999;font-size:13px;">正在连接智能服务</div>';
    document.body.appendChild(loadingEl);
    yield API.check();
    if (API.available) {
      yield API.loadAll();
    }
    loadFromStorage();
    loadingEl.style.transition = "opacity 0.3s";
    loadingEl.style.opacity = "0";
    setTimeout(() => loadingEl.remove(), 300);
    renderTabBar();
    renderCategories();
    renderBanners();
    renderMerchants();
    renderDeals();
    renderFlashSales();
    renderHotSearches();
    renderInterestTags();
    renderInterestPanel();
    renderRecommendFeed();
    renderQuickActions();
    renderNewestFilters();
    renderNewestFeed();
    renderOrderGrid();
    renderFuncGrid();
    renderSettingsList();
    renderTripPlans();
    renderReminders();
    renderPlans();
    renderGoals();
    renderDiary();
    renderUserProfile();
    initChat();
    bindScrollReport();
    startFlashTimer();
    switchPage("home");
    syncRemindersToNative();
    ensureInPageReminders();
  });
}
function renderTabBar() {
  const tabBar = document.getElementById("tabBar");
  const tabs = [
    { id: "home", label: "首页", active: SVG.tabHomeActive, outline: SVG.tabHome },
    { id: "recommend", label: "推荐", active: SVG.tabRecommendActive, outline: SVG.tabRecommend },
    { id: "assistant", label: "小秘", active: SVG.tabAssistant, outline: SVG.tabAssistant, isAssistant: true },
    { id: "newest", label: "上新", active: SVG.tabNewestActive, outline: SVG.tabNewest },
    { id: "profile", label: "我的", active: SVG.tabProfileActive, outline: SVG.tabProfile }
  ];
  tabBar.innerHTML = tabs.map((t) => '\n        <div class="tab-item '.concat(t.isAssistant ? "assistant-tab" : "", '" data-tab="').concat(t.id, '" onclick="switchPage(\'').concat(t.id, '\')">\n            <div class="tab-icon">').concat(t.isAssistant ? t.active : t.outline, '</div>\n            <div class="tab-label">').concat(t.label, "</div>\n        </div>\n    ")).join("");
}
function switchPage(pageId) {
  const cur = document.querySelector(".page.active");
  if (cur) {
    const s = cur.querySelector(".page-scroll");
    if (s) pageState[currentPage] = s.scrollTop;
  }
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + pageId).classList.add("active");
  const tabData = {
    home: { a: SVG.tabHomeActive, o: SVG.tabHome },
    recommend: { a: SVG.tabRecommendActive, o: SVG.tabRecommend },
    assistant: { a: SVG.tabAssistant, o: SVG.tabAssistant },
    newest: { a: SVG.tabNewestActive, o: SVG.tabNewest },
    profile: { a: SVG.tabProfileActive, o: SVG.tabProfile }
  };
  document.querySelectorAll(".tab-item").forEach((t) => {
    t.classList.remove("active");
    const id = t.dataset.tab;
    const icon = t.querySelector(".tab-icon");
    if (id === pageId) {
      t.classList.add("active");
      icon.innerHTML = tabData[id].a;
    } else {
      icon.innerHTML = tabData[id].o;
    }
  });
  currentPage = pageId;
  setTimeout(() => {
    const el = document.getElementById("page-" + pageId);
    const s = el.querySelector(".page-scroll");
    if (s) s.scrollTop = pageState[pageId] !== void 0 ? pageState[pageId] : 0;
  }, 50);
  if (pageId === "assistant") scrollChatToBottom();
  if (pageId === "profile") {
    renderTripPlans();
    renderReminders();
    renderPlans();
    renderGoals();
    renderDiary();
    clearProfileBadge();
  }
}
function renderCategories() {
  const grid = document.getElementById("categoryGrid");
  grid.innerHTML = CATEGORIES.map((c) => '\n        <div class="category-item" onclick="showToast(\'正在打开「'.concat(c.name, '」分类\')">\n            <div class="cat-icon" style="background:').concat(c.bg, ';">\n                ').concat(wrapSvg(c.icon, 24), '\n            </div>\n            <div class="cat-label">').concat(c.name, "</div>\n        </div>\n    ")).join("");
}
function renderBanners() {
  const track = document.getElementById("carouselTrack");
  const dots = document.getElementById("carouselDots");
  track.innerHTML = BANNERS.map((b) => '\n        <div class="carousel-slide" onclick="showToast(\''.concat(b.title, '\')">\n            <div class="slide-bg" style="').concat(imgStyle(b.img), '">\n                <div class="slide-overlay"></div>\n                <div class="slide-content">\n                    <span class="slide-tag">').concat(b.tag, "</span>\n                    <h4>").concat(b.title, "</h4>\n                    <p>").concat(b.subtitle, "</p>\n                </div>\n            </div>\n        </div>\n    ")).join("");
  dots.innerHTML = BANNERS.map((_, i) => '<div class="carousel-dot '.concat(i === 0 ? "active" : "", '"></div>')).join("");
  startCarousel();
}
function startCarousel() {
  if (carouselTimer) clearInterval(carouselTimer);
  carouselTimer = setInterval(() => {
    carouselIndex = (carouselIndex + 1) % BANNERS.length;
    const track = document.getElementById("carouselTrack");
    if (track) {
      track.style.transform = "translateX(-".concat(carouselIndex * 100, "%)");
      document.querySelectorAll(".carousel-dot").forEach((d, i) => d.classList.toggle("active", i === carouselIndex));
    }
  }, 3500);
}
function renderMerchants() {
  const list = document.getElementById("merchantList");
  list.innerHTML = MERCHANTS.map((m) => '\n        <div class="merchant-card" onclick="showToast(\'查看「'.concat(m.name, '」详情\')">\n            <div class="merchant-img" style="').concat(imgStyle(m.img), '">\n                <div class="merchant-img-overlay"></div>\n                <div class="merchant-tags">\n                    ').concat(m.tags.map((t) => '<span class="merchant-tag" style="background:'.concat(t.color, ';">').concat(t.text, "</span>")).join(""), '\n                </div>\n                <div class="merchant-status ').concat(m.isOpen ? "open" : "closed", '">').concat(m.isOpen ? "营业中" : "已打烊", '</div>\n            </div>\n            <div class="merchant-body">\n                <div class="merchant-name">').concat(m.name, '</div>\n                <div class="merchant-meta">\n                    <span class="merchant-rating">').concat(SVG.starFill, " ").concat(m.rating, '</span>\n                    <span class="merchant-meta-div">|</span>\n                    <span class="merchant-distance">').concat(m.distance, '</span>\n                    <span class="merchant-meta-div">|</span>\n                    <span class="merchant-price-tag">人均¥').concat(m.avgPrice, '</span>\n                    <span class="merchant-meta-div">|</span>\n                    <span class="merchant-sold">').concat(m.soldCount, '</span>\n                </div>\n                <div class="merchant-cuisine">').concat(m.cuisine, " · ").concat(SVG.location, ' <span class="merchant-addr">').concat(m.address, '</span></div>\n                <div class="merchant-hours">').concat(m.isOpen ? '<span style="color:#34C759">●</span>' : '<span style="color:#ccc">●</span>', " ").concat(m.hours, '</div>\n                <div class="merchant-promo">\n                    ').concat(m.tags.slice(1).map((t) => '<span class="promo-tag">'.concat(t.text, "</span>")).join(""), "\n                </div>\n            </div>\n        </div>\n    ")).join("");
}
function renderDeals() {
  const c = document.getElementById("dealCards");
  c.innerHTML = DEALS.map((d) => '\n        <div class="deal-card" onclick="showToast(\'抢购「'.concat(d.title, '」\')">\n            <div class="deal-img" style="').concat(imgStyle(d.img), '">\n                <div class="deal-badge">').concat(d.badge, '</div>\n            </div>\n            <div class="deal-body">\n                <div class="deal-title">').concat(d.title, '</div>\n                <div class="deal-sold">已售').concat(d.sold, '</div>\n                <div class="deal-price">\n                    <span class="deal-price-now">¥').concat(d.price, '</span>\n                    <span class="deal-price-old">¥').concat(d.oldPrice, "</span>\n                </div>\n            </div>\n        </div>\n    ")).join("");
}
function renderFlashSales() {
  const c = document.getElementById("flashSaleList");
  c.innerHTML = FLASH_SALES.map((f) => '\n        <div class="flash-item" onclick="showToast(\'抢购「'.concat(f.title, '」\')">\n            <div class="flash-img" style="').concat(imgStyle(f.img), '"></div>\n            <div class="flash-body">\n                <div class="flash-title">').concat(f.title, '</div>\n                <div class="flash-price-row">\n                    <span class="flash-price">¥').concat(f.price, '</span>\n                    <span class="flash-orig">¥').concat(f.origPrice, '</span>\n                </div>\n                <div class="flash-progress">\n                    <div class="flash-progress-bar" style="width:').concat(f.progress, '%;"></div>\n                    <div class="flash-progress-text">已抢').concat(f.progress, "%</div>\n                </div>\n            </div>\n        </div>\n    ")).join("");
}
function startFlashTimer() {
  let s = 2 * 3600 + 35 * 60 + 48;
  setInterval(() => {
    s--;
    if (s < 0) s = 2 * 3600 + 35 * 60 + 48;
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor(s % 3600 / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    const el = document.getElementById("flashTimer");
    if (el) el.textContent = "".concat(h, ":").concat(m, ":").concat(sec);
  }, 1e3);
}
function toggleSearch(show) {
  const o = document.getElementById("searchOverlay");
  if (show) {
    o.classList.add("show");
    setTimeout(() => document.getElementById("searchInput").focus(), 300);
  } else o.classList.remove("show");
}
function renderHotSearches() {
  const c = document.getElementById("searchHotTags");
  c.innerHTML = HOT_SEARCHES.map((t, i) => '\n        <div class="search-hot-tag '.concat(i < 3 ? "hot" : "", '" onclick="searchTag(\'').concat(t, "')\">").concat(i < 3 ? "🔥 " : "").concat(t, "</div>\n    ")).join("");
}
function searchTag(t) {
  document.getElementById("searchInput").value = t;
  showToast("搜索「".concat(t, "」"));
}
function renderInterestTags() {
  const c = document.getElementById("interestTags");
  const sel = INTEREST_CATEGORIES.filter((c2) => c2.selected);
  c.innerHTML = sel.map((c2) => '<span class="interest-tag">'.concat(wrapSvg(c2.svg, 14), " ").concat(c2.name, "</span>")).join("") || '<span style="color:var(--text-3);font-size:12px;">暂未选择，点击编辑</span>';
}
function renderInterestPanel() {
  const b = document.getElementById("interestPanelBody");
  b.innerHTML = INTEREST_CATEGORIES.map((c) => '\n        <div class="interest-option '.concat(c.selected ? "selected" : "", '" data-id="').concat(c.id, '" onclick="toggleInterest(\'').concat(c.id, "')\">\n            ").concat(wrapSvg(c.svg, 18), " ").concat(c.name, "\n        </div>\n    ")).join("");
}
function toggleInterestPanel(show) {
  document.getElementById("interestPanel").classList.toggle("show", show);
}
function toggleInterest(id) {
  const c = INTEREST_CATEGORIES.find((c2) => c2.id === id);
  c.selected = !c.selected;
  document.querySelector('.interest-option[data-id="'.concat(id, '"]')).classList.toggle("selected", c.selected);
}
function saveInterests() {
  renderInterestTags();
  renderRecommendFeed();
  toggleInterestPanel(false);
  const count = INTEREST_CATEGORIES.filter((c) => c.selected).length;
  showToast("已保存".concat(count, "个兴趣偏好"));
  if (API.available) {
    const selectedIds = INTEREST_CATEGORIES.filter((c) => c.selected).map((c) => c.id);
    API.saveInterests(selectedIds);
  }
}
function renderRecommendFeed() {
  const feed = document.getElementById("recommendFeed");
  const sel = INTEREST_CATEGORIES.filter((c) => c.selected).map((c) => {
    const m = { food: "美食", massage: "养生", travel: "旅游", fitness: "健身", ktv: "KTV", movie: "电影", attraction: "景点", car: "出行", shopping: "购物", beauty: "美容", bar: "酒吧", photo: "摄影" };
    return m[c.id];
  });
  let items = RECOMMEND_FEED;
  if (sel.length) items = RECOMMEND_FEED.filter((i) => sel.some((s) => i.type.includes(s)));
  if (!items.length) {
    feed.innerHTML = '<div class="empty-state" style="grid-column:span 2;"><div class="empty-icon">📭</div><div class="empty-text">暂无匹配内容<br>试试勾选更多兴趣品类</div></div>';
    return;
  }
  feed.innerHTML = items.map((i) => '\n        <div class="recommend-card" onclick="showToast(\'查看「'.concat(i.title, '」\')">\n            <div class="rec-img" style="').concat(imgStyle(i.img), '">\n                <span class="rec-type-badge" style="background:').concat(i.typeColor, ';">').concat(i.type, '</span>\n            </div>\n            <div class="rec-body">\n                <div class="rec-title">').concat(i.title, '</div>\n                <div class="rec-subtitle">').concat(i.subtitle, '</div>\n                <div class="rec-meta">\n                    <span class="rec-rating">').concat(SVG.starFill, " ").concat(i.rating, '</span>\n                    <span class="rec-distance">').concat(i.distance, '</span>\n                    <span class="rec-sold">已售').concat(i.sold, '</span>\n                </div>\n                <div class="rec-price">¥').concat(i.price, "<small>").concat(i.unit, "</small></div>\n            </div>\n        </div>\n    ")).join("");
}
function renderQuickActions() {
  const g = document.getElementById("quickActionGrid");
  g.innerHTML = QUICK_ACTIONS.map((a) => '\n        <div class="quick-action-item" onclick="quickAction(\''.concat(a.name, '\')">\n            <div class="qa-icon" style="background:').concat(a.bg, ';">').concat(wrapSvg(a.svg, 20), '</div>\n            <div class="qa-label">').concat(a.name, "</div>\n        </div>\n    ")).join("");
}
function quickAction(name) {
  document.getElementById("chatInput").value = name;
  sendMessage();
}
const QA_PALETTE = [
  "linear-gradient(135deg,#FF6B35,#FF9A56)",
  "linear-gradient(135deg,#34C759,#30D158)",
  "linear-gradient(135deg,#007AFF,#5AC8FA)",
  "linear-gradient(135deg,#AF52DE,#D65BFF)",
  "linear-gradient(135deg,#FF9500,#FFB800)",
  "linear-gradient(135deg,#FF2D55,#FF6B6B)",
  "linear-gradient(135deg,#5856D6,#7B79F0)",
  "linear-gradient(135deg,#00C7BE,#30D5C8)"
];
const QA_ICON_OPTIONS = [
  { key: "food", name: "美食" },
  { key: "star", name: "收藏" },
  { key: "store", name: "店铺" },
  { key: "car", name: "打车" },
  { key: "plane", name: "飞机" },
  { key: "camera", name: "景点" },
  { key: "dumbbell", name: "健身" },
  { key: "mic", name: "KTV" },
  { key: "film", name: "电影" },
  { key: "gift", name: "礼物" },
  { key: "calendar", name: "会议" },
  { key: "money", name: "钱包" }
];
function openQuickActionManage() {
  const items = QUICK_ACTIONS.map((a, i) => '\n        <div class="qa-manage-item">\n            <div class="qa-icon" style="background:'.concat(a.bg, ';">').concat(wrapSvg(a.svg, 18), '</div>\n            <div class="qa-manage-name">').concat(a.name, '</div>\n            <div class="qa-manage-del" onclick="removeQuickAction(').concat(i, ')">×</div>\n        </div>\n    ')).join("");
  const iconOptions = QA_ICON_OPTIONS.map((o) => '<div class="qa-icon-pick" data-icon="'.concat(o.key, '" onclick="pickQuickActionIcon(this)" title="').concat(o.name, '">').concat(wrapSvg(SVG[o.key], 18), "</div>")).join("");
  showModal('\n        <div class="add-reminder-form" style="max-height:80vh;overflow-y:auto;">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:8px;">管理快捷指令</div>\n            <div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:14px;">删除不需要的指令，或添加你自己的常用指令</div>\n            <div class="qa-manage-list">'.concat(items || '<div style="text-align:center;color:var(--text-3);font-size:13px;padding:10px;">暂无快捷指令</div>', '</div>\n            <div style="margin:14px 0;height:1px;background:var(--border);"></div>\n            <div class="form-group">\n                <label>新指令名称</label>\n                <input type="text" id="qaName" placeholder="如：订外卖 / 提醒我开会" />\n            </div>\n            <div class="form-group">\n                <label>选择图标</label>\n                <div class="qa-icon-picker" id="qaIconPicker">').concat(iconOptions, '</div>\n            </div>\n            <button class="form-submit-btn" onclick="submitQuickAction()">添加指令</button>\n        </div>\n    '));
  const first = document.querySelector(".qa-icon-pick");
  if (first) first.classList.add("selected");
}
let _pickedQaIcon = "food";
function pickQuickActionIcon(el) {
  document.querySelectorAll(".qa-icon-pick").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
  _pickedQaIcon = el.dataset.icon;
}
function submitQuickAction() {
  const name = document.getElementById("qaName").value.trim();
  if (!name) {
    showToast("请输入指令名称");
    return;
  }
  const exists = QUICK_ACTIONS.find((a) => a.name === name);
  if (exists) {
    showToast("该指令已存在");
    return;
  }
  QUICK_ACTIONS.push({
    name,
    svg: SVG[_pickedQaIcon] || SVG.food,
    bg: QA_PALETTE[QUICK_ACTIONS.length % QA_PALETTE.length]
  });
  saveQuickActionsToStorage();
  closeModal();
  renderQuickActions();
  showToast("快捷指令已添加");
}
function removeQuickAction(index) {
  const a = QUICK_ACTIONS[index];
  if (!a) return;
  QUICK_ACTIONS.splice(index, 1);
  saveQuickActionsToStorage();
  renderQuickActions();
  openQuickActionManage();
  showToast("已删除「" + a.name + "」");
}
function initChat() {
  addBotMessage("你好呀！我是小秘，你的智能生活管家～\n有什么需要帮忙的尽管跟我说！\n\n我可以帮你：点外卖、订餐厅、订酒店、买火车票/飞机票、规划行程、买电影票、订KTV包厢等。");
}
const BOT_AVATAR = '<svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" fill="#fff" opacity="0.95"/><circle cx="9" cy="10" r="1.2" fill="#FF6B35"/><circle cx="15" cy="10" r="1.2" fill="#FF6B35"/><path d="M9 14h6" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round"/></svg>';
const USER_AVATAR = '<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#fff"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#fff"/></svg>';
function addBotMessage(text, card) {
  const ca = document.getElementById("chatArea");
  const msg = document.createElement("div");
  msg.className = "chat-msg bot";
  let cardHtml = "";
  if (card) {
    cardHtml = '<div class="chat-card">\n            <div class="chat-card-img" style="'.concat(imgStyle(card.img), '"></div>\n            <div class="chat-card-body">\n                <div class="chat-card-title">').concat(card.title, '</div>\n                <div class="chat-card-desc">').concat(card.desc, '</div>\n                <button class="chat-card-btn" onclick="showToast(\'').concat(card.btn, "')\">").concat(card.btn, "</button>\n            </div>\n        </div>");
  }
  msg.innerHTML = '\n        <div class="chat-avatar" style="background:linear-gradient(135deg,#FF6B35,#FFB627);">'.concat(BOT_AVATAR, '</div>\n        <div>\n            <div class="chat-bubble">').concat(text.replace(/\n/g, "<br>"), "</div>\n            ").concat(cardHtml, "\n        </div>\n    ");
  ca.appendChild(msg);
  scrollChatToBottom();
}
function addAIResponse(response) {
  const ca = document.getElementById("chatArea");
  const msg = document.createElement("div");
  msg.className = "chat-msg bot";
  let cardsHtml = "";
  if (response.cards && response.cards.length > 0) {
    cardsHtml = '<div class="chat-cards">';
    response.cards.forEach((card) => {
      const imgStr = pic(card.seed, 200, 120);
      const tagsHtml = (card.tags || []).slice(0, 3).map(
        (t) => '<span class="cc-tag">'.concat(t, "</span>")
      ).join("");
      cardsHtml += '\n                <div class="chat-merchant-card" onclick="showToast(\'查看「'.concat(card.name, '」详情\')">\n                    <div class="cc-img" style="').concat(imgStyle(imgStr), '"></div>\n                    <div class="cc-body">\n                        <div class="cc-name">').concat(card.name, '</div>\n                        <div class="cc-meta">\n                            <span class="cc-rating">').concat(SVG.starFill, " ").concat(card.rating, '</span>\n                            <span class="cc-dist">').concat(card.distance, '</span>\n                            <span class="cc-price">¥').concat(card.avgPrice || card.price, '</span>\n                        </div>\n                        <div class="cc-tags">').concat(tagsHtml, "</div>\n                    </div>\n                </div>\n            ");
    });
    cardsHtml += "</div>";
  }
  let actionsHtml = "";
  if (response.actions && response.actions.length > 0) {
    actionsHtml = '<div class="chat-actions">';
    response.actions.forEach((action) => {
      actionsHtml += '<button class="chat-action-btn" onclick="sendQuickMessage(\''.concat(action, "')\">").concat(action, "</button>");
    });
    actionsHtml += "</div>";
  }
  msg.innerHTML = '\n        <div class="chat-avatar" style="background:linear-gradient(135deg,#FF6B35,#FFB627);">'.concat(BOT_AVATAR, '</div>\n        <div class="chat-content-wrap">\n            <div class="chat-bubble">').concat(response.reply.replace(/\n/g, "<br>"), "</div>\n            ").concat(cardsHtml, "\n            ").concat(actionsHtml, "\n        </div>\n    ");
  ca.appendChild(msg);
  scrollChatToBottom();
  if (response.tripCreated) {
    handleAITripCreated(response.tripCreated);
  }
  if (response.reminderCreated) {
    handleAIReminderCreated(response.reminderCreated);
  }
  if (response.tripDeleted) {
    handleAITripDeleted(response.tripDeleted);
  }
  if (response.tripDeletedAll) {
    handleAITripDeletedAll();
  }
  if (response.reminderDeleted) {
    handleAIReminderDeleted(response.reminderDeleted);
  }
  if (response.reminderDeletedAll) {
    handleAIReminderDeletedAll();
  }
  if (response.askReminder) {
    renderReminderDraft(response.askReminder);
  }
}
function handleAITripCreated(trip) {
  const newTrip = {
    id: trip.id || Date.now(),
    title: trip.title,
    status: trip.status || "upcoming",
    startDate: trip.startDate,
    endDate: trip.endDate,
    days: trip.days,
    destination: trip.destination,
    budget: trip.budget,
    spent: trip.spent || 0,
    coverImg: picG(trip.seed || "trip" + (trip.id || Date.now()), 400, 200, "#FF6B35", "#FF9A56"),
    progress: trip.progress || 0,
    schedule: trip.schedule || []
  };
  if (!TRIP_PLANS.find((t) => t.id === newTrip.id)) {
    TRIP_PLANS.unshift(newTrip);
    saveTripsToStorage();
    renderTripPlans();
    showProfileBadge();
    setTimeout(() => showToast("已自动添加行程「" + newTrip.title + "」到我的行程"), 500);
  }
}
function handleAIReminderCreated(reminder) {
  const newReminder = {
    id: reminder.id || Date.now(),
    type: reminder.type || "custom",
    title: reminder.title,
    desc: reminder.desc || "来自小秘助手的提醒",
    time: reminder.time || "08:00",
    repeat: reminder.repeat || "仅一次",
    enabled: reminder.enabled !== false,
    icon: reminder.icon || reminderIcon(reminder.type),
    bg: reminder.bg || reminderBg(reminder.type),
    method: reminder.method || "alarm",
    date: reminder.date
  };
  if (!REMINDERS.find((r) => r.id === newReminder.id)) {
    REMINDERS.push(newReminder);
    saveRemindersToStorage();
    renderReminders();
    showProfileBadge();
    afterReminderChanged(newReminder);
  }
}
function handleAITripDeleted(trip) {
  const id = trip.id;
  const idx = TRIP_PLANS.findIndex((t) => t.id === id);
  if (idx >= 0) {
    const title = TRIP_PLANS[idx].title;
    TRIP_PLANS.splice(idx, 1);
    saveTripsToStorage();
    renderTripPlans();
    showProfileBadge();
    setTimeout(() => showToast("已从我的行程删除「" + title + "」"), 500);
  }
}
function handleAITripDeletedAll() {
  TRIP_PLANS.length = 0;
  saveTripsToStorage();
  renderTripPlans();
  showProfileBadge();
  setTimeout(() => showToast("已清空全部行程"), 500);
}
function handleAIReminderDeleted(reminder) {
  const id = reminder.id;
  const idx = REMINDERS.findIndex((r) => r.id === id);
  if (idx >= 0) {
    const title = REMINDERS[idx].title;
    REMINDERS.splice(idx, 1);
    saveRemindersToStorage();
    renderReminders();
    showProfileBadge();
    setTimeout(() => showToast("已从我的提醒删除「" + title + "」"), 500);
  }
}
function handleAIReminderDeletedAll() {
  REMINDERS.length = 0;
  saveRemindersToStorage();
  renderReminders();
  showProfileBadge();
  setTimeout(() => showToast("已清空全部提醒"), 500);
}
function sendQuickMessage(text) {
  const input = document.getElementById("chatInput");
  input.value = text;
  sendMessage();
}
function addUserMessage(text) {
  const ca = document.getElementById("chatArea");
  const msg = document.createElement("div");
  msg.className = "chat-msg user";
  msg.innerHTML = '\n        <div class="chat-avatar" style="background:linear-gradient(135deg,#007AFF,#5AC8FA);">'.concat(USER_AVATAR, '</div>\n        <div class="chat-bubble">').concat(text, "</div>\n    ");
  ca.appendChild(msg);
  scrollChatToBottom();
}
function showTyping() {
  const ca = document.getElementById("chatArea");
  const m = document.createElement("div");
  m.className = "chat-msg bot";
  m.id = "typing-msg";
  m.innerHTML = '\n        <div class="chat-avatar" style="background:linear-gradient(135deg,#FF6B35,#FFB627);">'.concat(BOT_AVATAR, '</div>\n        <div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>\n    ');
  ca.appendChild(m);
  scrollChatToBottom();
}
function hideTyping() {
  const t = document.getElementById("typing-msg");
  if (t) t.remove();
}
function getReply(text) {
  const keys = ["外卖", "餐厅", "酒店", "火车", "飞机", "行程", "电影"];
  for (const k of keys) {
    if (text.includes(k)) return CHAT_REPLIES[k];
  }
  if (text.includes("K") || text.includes("KTV") || text.includes("k歌") || text.includes("唱歌")) return CHAT_REPLIES["K"];
  return CHAT_REPLIES["default"];
}
function sendMessage() {
  return __async(this, null, function* () {
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;
    addUserMessage(text);
    input.value = "";
    showTyping();
    if (API.available) {
      try {
        const response = yield API.chat(text);
        hideTyping();
        if (response) {
          addAIResponse(response);
          return;
        }
      } catch (e) {
        console.error("[Chat] AI 请求失败，使用本地回复:", e);
      }
    }
    setTimeout(() => {
      hideTyping();
      if (/(删除|删掉|去掉|取消|不要|清除)(.*?)(行程|旅游|旅行|出游)|(行程|旅游|旅行).*(删除|删掉|去掉|取消|不要)/.test(text)) {
        if (TRIP_PLANS.length === 0) {
          addBotMessage('您目前还没有行程规划，无需删除。\n\n如果需要创建行程，可以直接跟我说"帮我规划XX日游"～');
          return;
        }
        const cities = ["三亚", "成都", "北京", "上海", "广州", "深圳", "杭州", "西安", "重庆", "昆明", "厦门", "丽江", "桂林", "南京", "苏州", "青岛", "大连", "哈尔滨", "长沙", "武汉", "郑州", "济南", "福州", "贵阳", "南宁", "海口", "兰州", "拉萨", "内蒙古", "青海", "西藏", "新疆", "云南", "大理", "张家界", "九寨沟", "黄山", "泰山", "华山", "中国香港", "中国澳门", "中国台湾", "香港", "澳门", "台湾"];
        let matched = [];
        for (const c of cities) {
          if (text.includes(c)) {
            matched = TRIP_PLANS.filter((t) => t.destination && t.destination.includes(c));
            break;
          }
        }
        if (matched.length === 0 && /(所有|全部|清空)/.test(text)) {
          matched = [...TRIP_PLANS];
        }
        if (matched.length === 0) {
          const kw = text.replace(/删除|删掉|去掉|取消|不要|清除|的|行程|旅游|旅行|出游|帮我|请|把|那|个|条|所有|全部/g, "").trim();
          if (kw) matched = TRIP_PLANS.filter((t) => t.title.includes(kw) || t.destination && t.destination.includes(kw));
        }
        if (matched.length === 0) {
          const list = TRIP_PLANS.map((t, i) => i + 1 + ". " + t.title + "（" + t.destination + "）").join("\n");
          addBotMessage("没有找到匹配的行程，您当前的行程有：\n\n" + list + '\n\n请告诉我具体要删除哪个行程，比如"删除三亚的行程"～');
          return;
        }
        const deletedTitles = [];
        for (const trip of matched) {
          const idx = TRIP_PLANS.findIndex((t) => t.id === trip.id);
          if (idx >= 0) {
            deletedTitles.push(TRIP_PLANS[idx].title);
            TRIP_PLANS.splice(idx, 1);
          }
        }
        saveTripsToStorage();
        renderTripPlans();
        showProfileBadge();
        addBotMessage("已为您删除行程「" + deletedTitles.join("、") + "」 ✅\n\n行程已从「我的-我的行程」中移除。");
        setTimeout(() => showToast("已删除行程"), 500);
        return;
      }
      if (/(删除|删掉|去掉|取消|不要|清除|关闭)(.*?)(提醒|闹钟)|(提醒|闹钟).*(删除|删掉|去掉|取消|不要|关闭)/.test(text)) {
        if (REMINDERS.length === 0) {
          addBotMessage('您目前还没有提醒事项，无需删除。\n\n如果需要添加提醒，可以直接跟我说"提醒我明天8点开会"～');
          return;
        }
        let matched = [];
        if (/(所有|全部|清空)/.test(text)) {
          matched = [...REMINDERS];
        }
        if (matched.length === 0 && /(上班|打卡上班|早起|起床)/.test(text)) {
          matched = REMINDERS.filter((r2) => r2.type === "work");
        } else if (matched.length === 0 && /(下班|打卡下班)/.test(text)) {
          matched = REMINDERS.filter((r2) => r2.type === "offwork");
        } else if (matched.length === 0 && /(生日|寿星|庆生)/.test(text)) {
          matched = REMINDERS.filter((r2) => r2.type === "birthday");
        } else if (matched.length === 0 && /(会议|开会|例会|周会)/.test(text)) {
          matched = REMINDERS.filter((r2) => r2.type === "meeting");
        } else if (matched.length === 0 && /(出差)/.test(text)) {
          matched = REMINDERS.filter((r2) => r2.type === "business_trip");
        } else if (matched.length === 0 && /(还钱|还款|还贷|还花呗|信用卡|欠款)/.test(text)) {
          matched = REMINDERS.filter((r2) => r2.type === "repayment");
        } else if (matched.length === 0 && /(出行|出发|赶飞机|赶火车|登机|航班|高铁|动车)/.test(text)) {
          matched = REMINDERS.filter((r2) => r2.type === "travel");
        }
        if (matched.length === 0) {
          const kw = text.replace(/删除|删掉|去掉|取消|不要|清除|关闭|的|提醒|闹钟|帮我|请|把|那|个|条|所有|全部|上班|下班|出行|出差|生日|会议|还钱/g, "").trim();
          if (kw) matched = REMINDERS.filter((r2) => r2.title.includes(kw) || r2.desc.includes(kw));
        }
        if (matched.length === 0) {
          const list = REMINDERS.map((r2, i) => i + 1 + ". " + r2.title + "（" + r2.time + "，" + r2.repeat + "）").join("\n");
          addBotMessage("没有找到匹配的提醒，您当前的提醒有：\n\n" + list + '\n\n请告诉我具体要删除哪个提醒，比如"删除上班提醒"～');
          return;
        }
        const deletedTitles = [];
        for (const rem of matched) {
          const idx = REMINDERS.findIndex((r2) => r2.id === rem.id);
          if (idx >= 0) {
            deletedTitles.push(REMINDERS[idx].title);
            REMINDERS.splice(idx, 1);
          }
        }
        saveRemindersToStorage();
        renderReminders();
        showProfileBadge();
        addBotMessage("已为您删除提醒「" + deletedTitles.join("、") + "」 ✅\n\n提醒已从「我的-我的提醒」中移除。");
        setTimeout(() => showToast("已删除提醒"), 500);
        return;
      }
      if (/(规划行程|旅游攻略|行程安排|旅游计划|出去玩|周末去哪|旅行计划|安排一下|帮我规划|规划.*游|安排.*行程|去.*旅游|去.*玩|到.*旅游)/.test(text)) {
        const cities = ["三亚", "成都", "北京", "上海", "广州", "深圳", "杭州", "西安", "重庆", "昆明", "厦门", "丽江", "桂林", "南京", "苏州", "青岛", "大连", "长沙", "武汉", "香港", "澳门"];
        let dest = "北京";
        for (const c of cities) {
          if (text.includes(c)) {
            dest = c;
            break;
          }
        }
        const daysMatch = text.match(/(\d+)\s*(日游|天游|天|日)/);
        const days = daysMatch ? parseInt(daysMatch[1]) : 1;
        const startDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days - 1);
        const endStr = endDate.toISOString().split("T")[0];
        const schedule = [];
        for (let i = 1; i <= days; i++) {
          schedule.push({ day: i, plan: "第" + i + "天行程待规划", icon: i === 1 || i === days ? "plane" : "pin" });
        }
        const newTrip = {
          id: Date.now(),
          title: dest + days + "日游",
          status: "upcoming",
          startDate,
          endDate: endStr,
          days,
          destination: dest,
          budget: days * 1e3,
          spent: 0,
          coverImg: picG("trip" + Date.now(), 400, 200, "#FF6B35", "#FF9A56"),
          progress: 0,
          schedule
        };
        TRIP_PLANS.unshift(newTrip);
        saveTripsToStorage();
        renderTripPlans();
        showProfileBadge();
        addBotMessage("好的！帮您规划" + dest + days + "日游行程 🗺️\n\n已为您创建行程「" + newTrip.title + "」，可在「我的-我的行程」中查看！");
        setTimeout(() => showToast("已自动添加行程到我的行程"), 500);
        return;
      }
      if (/(提醒我|提醒一下|设个提醒|设置提醒|帮我提醒|加个提醒|上班提醒|下班提醒|出行提醒|出差提醒|生日提醒|会议提醒|还钱提醒|记得.*提醒|别忘了|设个闹钟|定个闹钟)/.test(text)) {
        let rType = "custom", rTitle = "自定义提醒", rIcon = "bell";
        if (/(生日|寿星|庆生|诞辰)/.test(text)) {
          rType = "birthday";
          rTitle = "生日提醒";
          rIcon = "gift";
        } else if (/(会议|开会|例会|周会|评审)/.test(text)) {
          rType = "meeting";
          rTitle = "会议提醒";
          rIcon = "calendar";
        } else if (/(出差)/.test(text)) {
          rType = "business_trip";
          rTitle = "出差提醒";
          rIcon = "briefcase";
        } else if (/(还钱|还款|还贷|还花呗|还信用卡|欠款|债务)/.test(text)) {
          rType = "repayment";
          rTitle = "还钱提醒";
          rIcon = "money";
        } else if (/(上班|打卡上班|早起|起床)/.test(text)) {
          rType = "work";
          rTitle = "上班提醒";
          rIcon = "clock";
        } else if (/(下班|打卡下班)/.test(text)) {
          rType = "offwork";
          rTitle = "下班提醒";
          rIcon = "clock";
        } else if (/(出行|出发|赶飞机|赶火车|登机|航班|高铁|动车)/.test(text)) {
          rType = "travel";
          rTitle = "出行提醒";
          rIcon = "plane";
        } else {
          rTitle = text.replace(/提醒我|提醒一下|设个提醒|设置提醒|帮我提醒|加个提醒|记得提醒|别忘了|设个闹钟|定个闹钟|用?(闹钟|短信|微信)(提醒|通知)?|明天|今天|后天|早上|上午|下午|晚上|\d+[:：点]\d*|点/g, "").trim().substring(0, 20) || "自定义提醒";
        }
        let rMethod = "alarm";
        if (/(短信|发短信|用短信|短信提醒)/.test(text)) rMethod = "sms";
        else if (/(微信|用微信|发微信|微信提醒)/.test(text)) rMethod = "wechat";
        let rTime = "";
        const tMatch = text.match(/(\d{1,2})[:：点](\d{0,2})/);
        if (tMatch) {
          let h = parseInt(tMatch[1]);
          const m = tMatch[2] ? parseInt(tMatch[2]) : 0;
          if (/(下午|傍晚|晚上)/.test(text)) {
            h += 12;
            if (h > 23) h -= 24;
          }
          if (h >= 0 && h <= 23 && m <= 59) rTime = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
        }
        let rRepeat = "仅一次";
        if (/(每天|每日|天天)/.test(text)) rRepeat = "每天";
        else if (/(工作日|周一到周五)/.test(text)) rRepeat = "工作日重复";
        else if (/(每周)/.test(text)) rRepeat = "每周";
        if (!rTime) {
          addBotMessage("好的！已记下「" + rTitle + "」，请问你想什么时间提醒呢？提醒方式也可以选（闹钟/短信/微信）👇");
          renderReminderDraft({
            type: rType,
            title: rTitle,
            desc: text,
            repeat: rRepeat,
            method: rMethod,
            time: "08:00",
            tip: "还差一点～请设置提醒时间，并选择提醒方式（" + methodBadgeText(rMethod) + " 已默认）："
          });
          return;
        }
        const newReminder = {
          id: Date.now(),
          type: rType,
          title: rTitle,
          desc: text,
          time: rTime,
          repeat: rRepeat,
          enabled: true,
          method: rMethod,
          icon: rIcon,
          bg: reminderBg(rType)
        };
        REMINDERS.push(newReminder);
        saveRemindersToStorage();
        renderReminders();
        showProfileBadge();
        addBotMessage("好的！已为您创建" + rTitle + " ✅\n\n⏰ 时间：" + rTime + "\n🔄 重复：" + rRepeat + "\n" + methodBadgeText(rMethod) + "\n\n已自动添加到「我的-我的提醒」中！");
        setTimeout(() => showToast("已自动添加提醒到我的提醒"), 500);
        return;
      }
      const r = getReply(text);
      addBotMessage(r.text, r.card);
    }, 800);
  });
}
const METHOD_CONFIG = {
  alarm: { label: "闹钟", icon: "🔔", bg: "linear-gradient(135deg,#007AFF,#5AC8FA)" },
  sms: { label: "短信", icon: "💬", bg: "linear-gradient(135deg,#34C759,#30D158)" },
  wechat: { label: "微信", icon: "💚", bg: "linear-gradient(135deg,#07C160,#09BB07)" }
};
function methodBadge(method) {
  const m = METHOD_CONFIG[method] || METHOD_CONFIG.alarm;
  return '<span class="reminder-method" style="background:'.concat(m.bg, ';">').concat(m.icon, " ").concat(m.label, "</span>");
}
function methodBadgeText(method) {
  const m = METHOD_CONFIG[method] || METHOD_CONFIG.alarm;
  return m.icon + " 提醒方式：" + m.label;
}
function reminderTypeOptions(selected) {
  return Object.keys(REMINDER_TYPES).map((k) => {
    const t = REMINDER_TYPES[k];
    return '<option value="'.concat(k, '" ').concat(selected === k ? "selected" : "", ">").concat(t.label, "</option>");
  }).join("");
}
function computeReminderNextMillis(r) {
  const now = Date.now();
  const parts = (r.time || "08:00").split(":");
  let h = parseInt(parts[0], 10) || 8;
  let m = parseInt(parts[1], 10) || 0;
  if (isNaN(h)) h = 8;
  if (isNaN(m)) m = 0;
  h = Math.max(0, Math.min(23, h));
  m = Math.max(0, Math.min(59, m));
  const cal = /* @__PURE__ */ new Date();
  if (r.date) {
    const d = r.date.split("-");
    if (d.length === 3) {
      cal.setFullYear(+d[0], +d[1] - 1, +d[2]);
      cal.setHours(h, m, 0, 0);
      return cal.getTime() > now ? cal.getTime() : -1;
    }
  }
  const repeat = r.repeat || "仅一次";
  cal.setHours(h, m, 0, 0);
  const isOneShot = !/每天|工作日|每周|每月|每年/.test(repeat);
  if (cal.getTime() <= now || !isOneShot) {
    if (repeat.includes("每天")) cal.setDate(cal.getDate() + 1);
    else if (repeat.includes("工作日")) {
      do {
        cal.setDate(cal.getDate() + 1);
      } while (cal.getDay() === 0 || cal.getDay() === 6);
    } else if (repeat.includes("每周")) cal.setDate(cal.getDate() + 7);
    else if (repeat.includes("每月")) cal.setMonth(cal.getMonth() + 1);
    else if (repeat.includes("每年")) cal.setFullYear(cal.getFullYear() + 1);
    else cal.setDate(cal.getDate() + 1);
  }
  return cal.getTime();
}
function friendlyReminderTime(r) {
  const t = computeReminderNextMillis(r);
  if (t <= 0) return "时间已过";
  const d = new Date(t);
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(t);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((that - today) / 864e5);
  const day = diff === 0 ? "今天" : diff === 1 ? "明天" : diff === 2 ? "后天" : d.getMonth() + 1 + "月" + d.getDate() + "日";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return day + " " + hh + ":" + mm;
}
let _reminderPermWarned = false;
function afterReminderChanged(r) {
  const isNative = !!(window.AndroidBridge && window.AndroidBridge.syncReminders);
  if (isNative) {
    if (window.AndroidBridge.requestReminderPermissions) {
      try {
        window.AndroidBridge.requestReminderPermissions();
      } catch (e) {
      }
    }
    if (r && r.method === "sms") {
      const s = loadReminderSettings() || {};
      if (!s.smsPhone) {
        showToast("短信提醒已保存，请在「提醒设置」填写接收手机号才能收到短信");
      }
    }
    if (window.AndroidBridge.getPermissionStatus) {
      try {
        const ps = JSON.parse(window.AndroidBridge.getPermissionStatus());
        if (r && r.method !== "alarm" && !ps.notification && !_reminderPermWarned) {
          _reminderPermWarned = true;
          showToast("请允许「通知」权限，否则" + (r.method === "sms" ? "短信/微信" : "微信") + "提醒不会弹出");
        }
        if (r && r.method === "sms" && !ps.sms && !_reminderPermWarned) {
          _reminderPermWarned = true;
          showToast("请允许「短信」权限，否则无法发送短信提醒");
        }
      } catch (e) {
      }
    }
  }
  if (r) {
    showToast("已设置：" + friendlyReminderTime(r) + " · " + methodBadgeText(r.method));
  }
  ensureInPageReminders();
}
let _inPageReminderTimers = [];
let _inPageNotifAsked = false;
function ensureInPageReminders() {
  if (window.AndroidBridge && window.AndroidBridge.syncReminders) return;
  _inPageReminderTimers.forEach((id) => clearTimeout(id));
  _inPageReminderTimers = [];
  if (typeof Notification !== "undefined" && Notification.permission === "default" && !_inPageNotifAsked) {
    _inPageNotifAsked = true;
    Notification.requestPermission().catch(() => {
    });
  }
  REMINDERS.forEach((r) => {
    if (r.enabled === false) return;
    const t = computeReminderNextMillis(r);
    if (t > Date.now()) {
      const delay = Math.min(t - Date.now(), 2147483647);
      const id = setTimeout(() => fireInPageReminder(r), delay);
      _inPageReminderTimers.push(id);
    }
  });
}
function fireInPageReminder(r) {
  try {
    showModal('\n            <div style="padding:24px;text-align:center;">\n                <div style="font-size:40px;margin-bottom:8px;">'.concat(METHOD_CONFIG[r.method] ? METHOD_CONFIG[r.method].icon : "🔔", '</div>\n                <div style="font-size:18px;font-weight:700;margin-bottom:6px;">').concat(r.title, '</div>\n                <div style="font-size:14px;color:var(--text-2);margin-bottom:16px;">').concat(r.desc || "", '</div>\n                <button class="form-submit-btn" onclick="closeModal()">知道了</button>\n            </div>\n        '));
  } catch (e) {
  }
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(
        "生活小秘提醒 · " + (METHOD_CONFIG[r.method] ? METHOD_CONFIG[r.method].label : "闹钟"),
        { body: r.title + "\n" + (r.desc || "") }
      );
    }
  } catch (e) {
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      const ac = new Ctx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g);
      g.connect(ac.destination);
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.setValueAtTime(1e-3, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.3, ac.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(1e-3, ac.currentTime + 1.2);
      o.start();
      o.stop(ac.currentTime + 1.25);
    }
  } catch (e) {
  }
  if (!/每天|工作日|每周|每月|每年/.test(r.repeat || "仅一次")) {
    const idx = REMINDERS.findIndex((x) => x.id === r.id);
    if (idx >= 0) {
      REMINDERS.splice(idx, 1);
      saveRemindersToStorage();
      renderReminders();
    }
  }
  ensureInPageReminders();
}
let _recognition = null;
function startVoiceInput() {
  const input = document.getElementById("chatInput");
  if (window.__NATIVE_INFO__ && window.__NATIVE_INFO__.isApp && window.AndroidBridge && window.AndroidBridge.startVoiceRecognition) {
    window.AndroidBridge.startVoiceRecognition();
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    if (_recognition && _recognition._listening) {
      try {
        _recognition.stop();
      } catch (e) {
      }
      return;
    }
    try {
      _recognition = new SR();
      _recognition.lang = "zh-CN";
      _recognition.interimResults = false;
      _recognition.maxAlternatives = 1;
      _recognition._listening = true;
      setVoiceBtnActive(true);
      _recognition.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (input) input.value = text;
        _recognition._listening = false;
        setVoiceBtnActive(false);
        if (text && text.trim()) sendMessage();
      };
      _recognition.onerror = () => {
        _recognition._listening = false;
        setVoiceBtnActive(false);
        if (window.AndroidBridge && window.AndroidBridge.startVoiceRecognition) {
          window.AndroidBridge.startVoiceRecognition();
        } else {
          showToast("语音识别不可用，请手动输入");
        }
      };
      _recognition.onend = () => {
        _recognition._listening = false;
        setVoiceBtnActive(false);
      };
      _recognition.start();
    } catch (err) {
      setVoiceBtnActive(false);
      if (window.AndroidBridge && window.AndroidBridge.startVoiceRecognition) window.AndroidBridge.startVoiceRecognition();
      else showToast("语音识别不可用，请手动输入");
    }
    return;
  }
  if (window.AndroidBridge && window.AndroidBridge.startVoiceRecognition) {
    window.AndroidBridge.startVoiceRecognition();
  } else {
    showToast("当前环境不支持语音输入，请手动输入");
  }
}
function setVoiceBtnActive(active) {
  const b = document.getElementById("voiceBtn");
  if (b) b.classList.toggle("recording", !!active);
}
function onVoiceResult(text) {
  const input = document.getElementById("chatInput");
  if (input) input.value = text || "";
  if (text && text.trim()) sendMessage();
}
function renderReminderDraft(draft) {
  if (!window.__draftReminders) window.__draftReminders = {};
  const id = "d" + Date.now();
  window.__draftReminders[id] = draft;
  const ca = document.getElementById("chatArea");
  if (!ca) return;
  const m = document.createElement("div");
  m.className = "chat-msg bot";
  m.id = "draftCard_" + id;
  const methodOpts = ["alarm", "sms", "wechat"].map((k) => '<option value="'.concat(k, '">').concat(METHOD_CONFIG[k].icon, " ").concat(METHOD_CONFIG[k].label, "</option>")).join("");
  m.innerHTML = '\n        <div class="chat-avatar" style="background:linear-gradient(135deg,#FF6B35,#FFB627);">'.concat(BOT_AVATAR, '</div>\n        <div class="chat-content-wrap">\n            <div class="chat-bubble">').concat(draft.tip || "还差一点信息～请设置提醒时间，并选择提醒方式：", '</div>\n            <div class="reminder-draft-card">\n                <div class="rd-row">\n                    <label>提醒标题</label>\n                    <input type="text" id="draftTitle_').concat(id, '" value="').concat(draft.title || "", '" placeholder="如：开会提醒" />\n                </div>\n                <div class="rd-row">\n                    <label>提醒时间</label>\n                    <input type="time" id="draftTime_').concat(id, '" value="').concat(draft.time || "08:00", '" />\n                </div>\n                <div class="rd-row">\n                    <label>提醒方式</label>\n                    <select id="draftMethod_').concat(id, '">').concat(methodOpts, '</select>\n                </div>\n                <button class="form-submit-btn" onclick="confirmDraftReminder(\'').concat(id, "')\">确认创建提醒</button>\n            </div>\n        </div>\n    ");
  ca.appendChild(m);
  scrollChatToBottom();
}
function confirmDraftReminder(draftId) {
  const titleEl = document.getElementById("draftTitle_" + draftId);
  const timeEl = document.getElementById("draftTime_" + draftId);
  const methodEl = document.getElementById("draftMethod_" + draftId);
  const title = titleEl && titleEl.value.trim() || "自定义提醒";
  const time = timeEl && timeEl.value || "08:00";
  const method = methodEl && methodEl.value || "alarm";
  const draft = window.__draftReminders ? window.__draftReminders[draftId] : null;
  if (!draft) {
    showToast("草稿已失效，请重新添加");
    return;
  }
  const newReminder = {
    id: Date.now(),
    type: draft.type || "custom",
    title,
    desc: draft.desc || title,
    time,
    repeat: draft.repeat || "仅一次",
    enabled: true,
    method,
    icon: reminderIcon(draft.type),
    bg: reminderBg(draft.type)
  };
  REMINDERS.push(newReminder);
  saveRemindersToStorage();
  renderReminders();
  showProfileBadge();
  if (window.__draftReminders) delete window.__draftReminders[draftId];
  const card = document.getElementById("draftCard_" + draftId);
  if (card) card.remove();
  addBotMessage("已为你创建提醒「" + title + "」 ✅\n\n⏰ 时间：" + time + "\n" + methodBadgeText(method) + "\n\n已自动添加到「我的-我的提醒」中！");
  afterReminderChanged(newReminder);
}
function isActiveScrollAtTop() {
  const p = document.querySelector(".page.active");
  if (!p) return true;
  const s = p.querySelector(".page-scroll") || p.querySelector(".chat-area");
  if (!s) return true;
  return s.scrollTop <= 0;
}
function reportScrollTop() {
  if (window.AndroidBridge && window.AndroidBridge.updateScrollState) {
    window.AndroidBridge.updateScrollState(isActiveScrollAtTop() ? "true" : "false");
  }
}
function bindScrollReport() {
  document.querySelectorAll(".page-scroll, .chat-area").forEach((el) => {
    el.addEventListener("scroll", reportScrollTop, { passive: true });
  });
  reportScrollTop();
}
function scrollChatToBottom() {
  const ca = document.getElementById("chatArea");
  if (ca) ca.scrollTop = ca.scrollHeight;
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement.id === "chatInput") sendMessage();
  if (e.key === "Escape") {
    toggleSearch(false);
    toggleInterestPanel(false);
    closeModal();
  }
});
function renderNewestFilters() {
  const b = document.getElementById("newestFilterBar");
  b.innerHTML = NEWEST_FILTERS.map((f, i) => '<div class="newest-filter '.concat(i === 0 ? "active" : "", '" onclick="filterNewest(\'').concat(f, "',this)\">").concat(f, "</div>")).join("");
}
function filterNewest(filter, el) {
  document.querySelectorAll(".newest-filter").forEach((f) => f.classList.remove("active"));
  el.classList.add("active");
  let items = NEWEST_POSTS;
  if (filter !== "全部") {
    items = NEWEST_POSTS.filter((p) => p.tags.some((t) => t.includes(filter)) || filter === "美食" && p.user.includes("川味") || filter === "养生" && p.user.includes("SPA") || filter === "健身" && p.user.includes("健身") || filter === "KTV" && p.user.includes("KTV") || filter === "景点" && p.user.includes("欢乐谷") || filter === "海鲜" && p.user.includes("海世界"));
    if (!items.length) {
      document.getElementById("newestFeed").innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">该分类暂无新品动态</div></div>';
      return;
    }
  }
  renderNewestFeedInternal(items);
}
function renderNewestFeed() {
  renderNewestFeedInternal(NEWEST_POSTS);
}
function renderNewestFeedInternal(posts) {
  const f = document.getElementById("newestFeed");
  f.innerHTML = posts.map((p, idx) => {
    const imgClass = p.imgCount;
    return '\n        <div class="newest-post" data-index="'.concat(idx, '">\n            <div class="post-header">\n                <div class="post-avatar" style="background:').concat(p.userBg, ';">').concat(wrapSvg(p.userSvg, 20), '</div>\n                <div class="post-user-info">\n                    <div class="post-username">').concat(p.user, '</div>\n                    <div class="post-time">').concat(p.time, "</div>\n                </div>\n                ").concat(p.isOfficial ? '<span class="post-new-tag">官方新品</span>' : "", '\n            </div>\n            <div class="post-images ').concat(imgClass, '">\n                ').concat(p.images.map((img) => '<div class="post-img" style="'.concat(imgStyle(img), '"></div>')).join(""), '\n            </div>\n            <div class="post-content">\n                <div class="post-title">').concat(p.title, '</div>\n                <div class="post-desc">').concat(p.desc, '</div>\n                <div class="post-tags">').concat(p.tags.map((t) => '<span class="post-tag">'.concat(t, "</span>")).join(""), '</div>\n                <div class="post-deal">\n                    <div class="post-deal-price">\n                        <span class="now">').concat(p.price === 0 ? "免费体验" : "¥" + p.price, "</span>\n                        ").concat(p.oldPrice ? '<span class="old">¥'.concat(p.oldPrice, "</span>") : "", '\n                    </div>\n                    <button class="post-deal-btn" onclick="event.stopPropagation();showToast(\'').concat(p.price === 0 ? "免费体验报名成功" : "抢购成功", "')\">").concat(p.price === 0 ? "免费体验" : "立即抢购", '</button>\n                </div>\n            </div>\n            <div class="post-actions">\n                <div class="post-action ').concat(p.liked ? "liked" : "", '" onclick="toggleLike(').concat(idx, ',this)">\n                    ').concat(p.liked ? SVG.heartFill : SVG.heart, '\n                    <span class="like-count">').concat(p.likes, '</span>\n                </div>\n                <div class="post-action" onclick="toggleComment(').concat(idx, ')">\n                    ').concat(SVG.comment, "\n                    <span>").concat(p.commentCount, '</span>\n                </div>\n                <div class="post-action" onclick="showToast(\'已分享到朋友圈\')">\n                    ').concat(SVG.share, '\n                    <span>分享</span>\n                </div>\n            </div>\n            <div class="post-comments" style="display:').concat(p.showComments ? "block" : "none", ';" id="comments-').concat(idx, '">\n                ').concat(p.comments.map((c) => '<div class="post-comment"><span class="comment-user">'.concat(c.user, '：</span><span class="comment-text">').concat(c.text, "</span></div>")).join(""), "\n            </div>\n        </div>");
  }).join("");
}
function toggleLike(idx, el) {
  const p = NEWEST_POSTS[idx];
  p.liked = !p.liked;
  p.likes += p.liked ? 1 : -1;
  el.classList.toggle("liked", p.liked);
  el.querySelector("svg").outerHTML = p.liked ? SVG.heartFill : SVG.heart;
  el.querySelector(".like-count").textContent = p.likes;
}
function toggleComment(idx) {
  const p = NEWEST_POSTS[idx];
  p.showComments = !p.showComments;
  document.getElementById("comments-" + idx).style.display = p.showComments ? "block" : "none";
}
function renderOrderGrid() {
  const g = document.getElementById("orderGrid");
  const statusMap = { "待付款": "pending", "待使用": "pending_use", "待评价": "pending_review", "退款/售后": "refund" };
  g.innerHTML = ORDER_STATUSES.map((o) => '\n        <div class="order-item '.concat(o.badge ? "order-badge" : "", '" ').concat(o.badge ? 'data-badge="'.concat(o.badge, '"') : "", " onclick=\"showOrderList('").concat(statusMap[o.name] || "all", '\')">\n            <div class="order-icon" style="background:').concat(o.bg, ';">').concat(wrapSvg(o.svg, 20), '</div>\n            <div class="order-label">').concat(o.name, "</div>\n        </div>\n    ")).join("");
}
function renderFuncGrid() {
  const g = document.getElementById("funcGrid");
  g.innerHTML = FUNC_ITEMS.map((f) => '\n        <div class="func-item" onclick="showToast(\'打开「'.concat(f.name, '」\')">\n            <div class="func-icon" style="background:').concat(f.bg, ';">').concat(wrapSvg(f.svg, 18), '</div>\n            <div class="func-label">').concat(f.name, "</div>\n        </div>\n    ")).join("");
}
function renderSettingsList() {
  const l = document.getElementById("settingsList");
  l.innerHTML = SETTINGS.map((s) => '\n        <div class="setting-item" onclick="showToast(\'打开「'.concat(s.label, '」\')">\n            <div class="setting-icon" style="background:').concat(s.bg, ';">').concat(wrapSvg(s.svg, 16), '</div>\n            <div class="setting-label">').concat(s.label, "</div>\n            ").concat(s.value ? '<div class="setting-value">'.concat(s.value, "</div>") : "", '\n            <div class="setting-arrow">').concat(SVG.chevronRight, "</div>\n        </div>\n    ")).join("");
}
function renderUserProfile() {
  const u = USER_PROFILE;
  const avatarEl = document.getElementById("profileAvatar");
  if (avatarEl) avatarEl.textContent = u.avatar;
  setText("profileName", u.name);
  setText("profileLevel", u.level);
  setText("profileLevelName", u.levelName);
  setText("statFollowing", u.following);
  setText("statFollowers", u.followers);
  setText("statPosts", u.posts);
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function renderTripPlans() {
  const list = document.getElementById("tripList");
  if (!list) return;
  const trips = TRIP_PLANS.filter((t) => t.status === "upcoming").slice(0, 2);
  if (trips.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">暂无行程规划，点击右上角添加</div>';
    return;
  }
  list.innerHTML = trips.map((t) => '\n        <div class="trip-card" onclick="showTripDetail('.concat(t.id, ')">\n            <div class="trip-cover" style="background-image:').concat(t.coverImg, ';">\n                <span class="trip-status-badge trip-status-').concat(t.status, '">').concat(t.status === "upcoming" ? "即将出发" : "已完成", '</span>\n            </div>\n            <div class="trip-body">\n                <div class="trip-title">').concat(t.title, '</div>\n                <div class="trip-meta">\n                    <span class="trip-meta-item">📅 ').concat(t.startDate, " ~ ").concat(t.endDate, '</span>\n                    <span class="trip-meta-item">📍 ').concat(t.destination, '</span>\n                    <span class="trip-meta-item"> ').concat(t.days, '天</span>\n                </div>\n                <div class="trip-progress">\n                    <div class="trip-progress-track">\n                        <div class="trip-progress-fill" style="width:').concat(t.progress, '%"></div>\n                    </div>\n                    <span class="trip-progress-text">准备 ').concat(t.progress, "%</span>\n                </div>\n            </div>\n        </div>\n    ")).join("");
}
function showTripDetail(id) {
  const t = TRIP_PLANS.find((t2) => t2.id === id);
  if (!t) return;
  const scheduleHtml = t.schedule.map((s) => '\n        <div class="trip-day-item">\n            <div class="trip-day-num">D'.concat(s.day, '</div>\n            <div class="trip-day-plan">').concat(s.plan, "</div>\n        </div>\n    ")).join("");
  showModal('\n        <div class="trip-detail-modal">\n            <div class="trip-detail-header">\n                <div class="trip-detail-title">'.concat(t.title, '</div>\n                <div class="trip-detail-meta">\n                    <span>📅 ').concat(t.startDate, " ~ ").concat(t.endDate, "</span>\n                    <span>📍 ").concat(t.destination, '</span>\n                </div>\n            </div>\n            <div class="trip-detail-budget">\n                <div class="trip-budget-item">\n                    <div class="trip-budget-num">¥').concat(t.budget, '</div>\n                    <div class="trip-budget-label">总预算</div>\n                </div>\n                <div class="trip-budget-item">\n                    <div class="trip-budget-num">¥').concat(t.spent, '</div>\n                    <div class="trip-budget-label">已花费</div>\n                </div>\n                <div class="trip-budget-item">\n                    <div class="trip-budget-num">¥').concat(t.budget - t.spent, '</div>\n                    <div class="trip-budget-label">剩余</div>\n                </div>\n            </div>\n            <div class="trip-schedule">\n                <div class="trip-schedule-title">行程安排</div>\n                ').concat(scheduleHtml, "\n            </div>\n        </div>\n    "));
}
function showAllTrips() {
  const tripsHtml = TRIP_PLANS.map((t) => '\n        <div class="trip-card" style="margin-bottom:12px;" onclick="closeModal();setTimeout(()=>showTripDetail('.concat(t.id, '),300)">\n            <div class="trip-cover" style="background-image:').concat(t.coverImg, ';height:70px;">\n                <span class="trip-status-badge trip-status-').concat(t.status, '">').concat(t.status === "upcoming" ? "即将出发" : "已完成", '</span>\n            </div>\n            <div class="trip-body">\n                <div class="trip-title">').concat(t.title, '</div>\n                <div class="trip-meta">\n                    <span class="trip-meta-item">📅 ').concat(t.startDate, '</span>\n                    <span class="trip-meta-item">📍 ').concat(t.destination, "</span>\n                </div>\n            </div>\n        </div>\n    ")).join("");
  showModal('\n        <div style="padding:20px;max-height:70vh;overflow-y:auto;">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">全部行程</div>\n            '.concat(tripsHtml, '\n            <button class="form-submit-btn" onclick="closeModal();setTimeout(addTrip,300)">+ 规划新行程</button>\n        </div>\n    '));
}
function addTrip() {
  showModal('\n        <div class="add-trip-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">规划新行程</div>\n            <div class="form-group">\n                <label>行程名称</label>\n                <input type="text" id="tripTitle" placeholder="如：成都3日美食之旅" />\n            </div>\n            <div class="form-row">\n                <div class="form-group">\n                    <label>目的地</label>\n                    <input type="text" id="tripDest" placeholder="如：成都" />\n                </div>\n                <div class="form-group">\n                    <label>天数</label>\n                    <input type="number" id="tripDays" placeholder="3" min="1" />\n                </div>\n            </div>\n            <div class="form-row">\n                <div class="form-group">\n                    <label>出发日期</label>\n                    <input type="date" id="tripStart" />\n                </div>\n                <div class="form-group">\n                    <label>预算(¥)</label>\n                    <input type="number" id="tripBudget" placeholder="3000" />\n                </div>\n            </div>\n            <button class="form-submit-btn" onclick="submitTrip()">创建行程</button>\n        </div>\n    ');
}
function submitTrip() {
  const title = document.getElementById("tripTitle").value.trim();
  const dest = document.getElementById("tripDest").value.trim();
  const days = parseInt(document.getElementById("tripDays").value) || 1;
  const start = document.getElementById("tripStart").value || "2026-09-01";
  const budget = parseInt(document.getElementById("tripBudget").value) || 2e3;
  if (!title || !dest) {
    showToast("请填写行程名称和目的地");
    return;
  }
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + days - 1);
  const endStr = endDate.toISOString().split("T")[0];
  const schedule = [];
  for (let i = 1; i <= days; i++) {
    schedule.push({ day: i, plan: "第" + i + "天行程待规划", icon: "pin" });
  }
  const newTrip = {
    id: Date.now(),
    title,
    status: "upcoming",
    startDate: start,
    endDate: endStr,
    days,
    destination: dest,
    budget,
    spent: 0,
    coverImg: picG("trip" + Date.now(), 400, 200, "#FF6B35", "#FF9A56"),
    progress: 0,
    schedule
  };
  TRIP_PLANS.unshift(newTrip);
  closeModal();
  saveTripsToStorage();
  renderTripPlans();
  showToast("行程创建成功！");
}
function renderReminders() {
  const list = document.getElementById("reminderList");
  if (!list) return;
  if (REMINDERS.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">暂无提醒，点击右上角添加</div>';
    return;
  }
  list.innerHTML = REMINDERS.map((r) => '\n        <div class="reminder-card '.concat(r.enabled ? "" : "disabled", '" onclick="showReminderDetail(').concat(r.id, ')">\n            <div class="reminder-icon-box" style="background:').concat(r.bg, ';">\n                ').concat(wrapSvg(SVG[r.icon] || SVG.bell, 20), '\n            </div>\n            <div class="reminder-content">\n                <div class="reminder-title-row">\n                    <span class="reminder-title">').concat(r.title, '</span>\n                    <span class="reminder-time">').concat(r.time, '</span>\n                </div>\n                <div class="reminder-desc">').concat(r.desc, '</div>\n                <div class="reminder-meta-row">\n                    <span class="reminder-repeat">').concat(r.repeat, "</span>\n                    ").concat(methodBadge(r.method), '\n                </div>\n            </div>\n            <div class="reminder-toggle ').concat(r.enabled ? "" : "off", '" onclick="event.stopPropagation();toggleReminder(').concat(r.id, ')"></div>\n        </div>\n    ')).join("");
}
function toggleReminder(id) {
  const r = REMINDERS.find((r2) => r2.id === id);
  if (r) {
    r.enabled = !r.enabled;
    saveRemindersToStorage();
    renderReminders();
    afterReminderChanged(r);
  }
}
function showReminderDetail(id) {
  const r = REMINDERS.find((r2) => r2.id === id);
  if (!r) return;
  showModal('\n        <div style="padding:20px;">\n            <div style="text-align:center;margin-bottom:16px;">\n                <div style="width:56px;height:56px;border-radius:16px;background:'.concat(r.bg, ';display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">\n                    ').concat(wrapSvg(SVG[r.icon] || SVG.bell, 28), '\n                </div>\n                <div style="font-size:18px;font-weight:700;color:var(--text-1);">').concat(r.title, '</div>\n            </div>\n            <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:16px;">\n                <div style="font-size:13px;color:var(--text-2);margin-bottom:8px;">').concat(r.desc, '</div>\n                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3);">\n                    <span>时间：').concat(r.time, "</span>\n                    <span>").concat(r.repeat, '</span>\n                </div>\n                <div style="margin-top:10px;">').concat(methodBadge(r.method), '</div>\n            </div>\n            <div style="display:flex;gap:10px;">\n                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="deleteReminder(').concat(r.id, ')">删除提醒</button>\n                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="editReminder(').concat(r.id, ')">编辑</button>\n                <button class="form-submit-btn" onclick="closeModal()">关闭</button>\n            </div>\n        </div>\n    '));
}
function editReminder(id) {
  const r = REMINDERS.find((r2) => r2.id === id);
  if (!r) return;
  const repeatOpts = ["仅一次", "每天", "工作日重复", "每周", "每月", "每年"].map((v) => '<option value="'.concat(v, '" ').concat(r.repeat === v ? "selected" : "", ">").concat(v, "</option>")).join("");
  const typeOpts = reminderTypeOptions(r.type);
  const methodOpts = ["alarm", "sms", "wechat"].map((k) => '<option value="'.concat(k, '" ').concat(r.method === k ? "selected" : "", ">").concat(METHOD_CONFIG[k].icon, " ").concat(METHOD_CONFIG[k].label, "</option>")).join("");
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">编辑提醒</div>\n            <div class="form-group">\n                <label>提醒标题</label>\n                <input type="text" id="editTitle" value="'.concat(r.title || "", '" placeholder="如：开会提醒" />\n            </div>\n            <div class="form-group">\n                <label>提醒内容</label>\n                <textarea id="editDesc" placeholder="详细描述...">').concat(r.desc || "", '</textarea>\n            </div>\n            <div class="form-row">\n                <div class="form-group">\n                    <label>时间</label>\n                    <input type="time" id="editTime" value="').concat(r.time || "08:00", '" />\n                </div>\n                <div class="form-group">\n                    <label>重复</label>\n                    <select id="editRepeat">').concat(repeatOpts, '</select>\n                </div>\n            </div>\n            <div class="form-group">\n                <label>类型</label>\n                <select id="editType">').concat(typeOpts, '</select>\n            </div>\n            <div class="form-group">\n                <label>提醒方式</label>\n                <select id="editMethod">').concat(methodOpts, '</select>\n            </div>\n            <div class="form-group">\n                <label>状态</label>\n                <select id="editEnabled">\n                    <option value="1" ').concat(r.enabled !== false ? "selected" : "", '>开启</option>\n                    <option value="0" ').concat(r.enabled === false ? "selected" : "", '>关闭</option>\n                </select>\n            </div>\n            <button class="form-submit-btn" onclick="updateReminder(').concat(r.id, ')">保存修改</button>\n        </div>\n    '));
}
function updateReminder(id) {
  const r = REMINDERS.find((r2) => r2.id === id);
  if (!r) return;
  const title = document.getElementById("editTitle").value.trim();
  const desc = document.getElementById("editDesc").value.trim();
  const time = document.getElementById("editTime").value;
  const repeat = document.getElementById("editRepeat").value;
  const type = document.getElementById("editType").value;
  const method = document.getElementById("editMethod").value;
  const enabled = document.getElementById("editEnabled").value === "1";
  if (!title) {
    showToast("请填写提醒标题");
    return;
  }
  if (!time) {
    showToast("请选择提醒时间");
    return;
  }
  r.title = title;
  r.desc = desc || "点击查看详情";
  r.time = time;
  r.repeat = repeat;
  r.type = type;
  r.method = method;
  r.enabled = enabled;
  r.icon = reminderIcon(type);
  r.bg = reminderBg(type);
  closeModal();
  saveRemindersToStorage();
  renderReminders();
  afterReminderChanged(r);
}
function openReminderSettings() {
  const s = loadReminderSettings() || {};
  const methodOpts = ["alarm", "sms", "wechat"].map((k) => '<option value="'.concat(k, '" ').concat(s.defaultMethod === k ? "selected" : "", ">").concat(METHOD_CONFIG[k].icon, " ").concat(METHOD_CONFIG[k].label, "</option>")).join("");
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:8px;">提醒设置</div>\n            <div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:14px;line-height:1.6;">\n                闹钟提醒会全屏响铃+震动；短信提醒将发送到下方手机号；<br/>微信无开放接口，微信提醒以高优先通知+一键打开微信呈现。\n            </div>\n            <div class="form-group">\n                <label>短信接收手机号</label>\n                <input type="tel" id="setSmsPhone" value="'.concat(s.smsPhone || "", '" placeholder="用于接收短信提醒，如 13800001111" />\n            </div>\n            <div class="form-group">\n                <label>默认提醒方式</label>\n                <select id="setDefaultMethod">').concat(methodOpts, '</select>\n            </div>\n            <button class="form-submit-btn" onclick="saveReminderSettings()">保存设置</button>\n        </div>\n    '));
}
function saveReminderSettings() {
  const phone = (document.getElementById("setSmsPhone").value || "").trim();
  const defaultMethod = document.getElementById("setDefaultMethod").value;
  const s = loadReminderSettings() || {};
  s.smsPhone = phone;
  s.defaultMethod = defaultMethod;
  saveReminderSettingsToNative(s);
  if (phone && window.AndroidBridge && window.AndroidBridge.requestReminderPermissions) {
    try {
      window.AndroidBridge.requestReminderPermissions();
    } catch (e) {
    }
  }
  closeModal();
  showToast("提醒设置已保存");
}
function addReminder() {
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">添加提醒</div>\n            <div class="form-group">\n                <label>提醒标题</label>\n                <input type="text" id="remTitle" placeholder="如：开会提醒" />\n            </div>\n            <div class="form-group">\n                <label>提醒内容</label>\n                <textarea id="remDesc" placeholder="详细描述..."></textarea>\n            </div>\n            <div class="form-row">\n                <div class="form-group">\n                    <label>时间</label>\n                    <input type="time" id="remTime" value="08:00" />\n                </div>\n                <div class="form-group">\n                    <label>重复</label>\n                    <select id="remRepeat">\n                        <option value="仅一次">仅一次</option>\n                        <option value="每天">每天</option>\n                        <option value="工作日重复" selected>工作日</option>\n                        <option value="每周">每周</option>\n                        <option value="每月">每月</option>\n                        <option value="每年">每年</option>\n                    </select>\n                </div>\n            </div>\n            <div class="form-group">\n                <label>类型</label>\n                <select id="remType">'.concat(reminderTypeOptions("custom"), '</select>\n            </div>\n            <div class="form-group">\n                <label>提醒方式</label>\n                <select id="remMethod">\n                    <option value="alarm">🔔 闹钟提醒</option>\n                    <option value="sms">💬 短信提醒</option>\n                    <option value="wechat">💚 微信提醒</option>\n                </select>\n            </div>\n            <button class="form-submit-btn" onclick="submitReminder()">创建提醒</button>\n        </div>\n    '));
}
function submitReminder() {
  const title = document.getElementById("remTitle").value.trim();
  const desc = document.getElementById("remDesc").value.trim();
  const time = document.getElementById("remTime").value;
  const repeat = document.getElementById("remRepeat").value;
  const type = document.getElementById("remType").value;
  const method = document.getElementById("remMethod").value;
  if (!title) {
    showToast("请填写提醒标题");
    return;
  }
  if (!time) {
    showToast("请选择提醒时间");
    return;
  }
  const newReminder = {
    id: Date.now(),
    type,
    title,
    desc: desc || "点击查看详情",
    time,
    repeat,
    enabled: true,
    method,
    icon: reminderIcon(type),
    bg: reminderBg(type)
  };
  REMINDERS.push(newReminder);
  closeModal();
  saveRemindersToStorage();
  renderReminders();
  afterReminderChanged(newReminder);
}
function deleteReminder(id) {
  const idx = REMINDERS.findIndex((r) => r.id === id);
  if (idx >= 0) {
    REMINDERS.splice(idx, 1);
    saveRemindersToStorage();
    closeModal();
    renderReminders();
    showToast("提醒已删除");
  }
}
const PLAN_PALETTE = [
  { icon: "star", bg: "linear-gradient(135deg,#FF6B35,#FF9A56)", tagColor: "#FF6B35" },
  { icon: "plane", bg: "linear-gradient(135deg,#007AFF,#5AC8FA)", tagColor: "#007AFF" },
  { icon: "store", bg: "linear-gradient(135deg,#34C759,#30D158)", tagColor: "#34C759" },
  { icon: "camera", bg: "linear-gradient(135deg,#AF52DE,#D65BFF)", tagColor: "#AF52DE" },
  { icon: "dumbbell", bg: "linear-gradient(135deg,#FF2D55,#FF6B6B)", tagColor: "#FF2D55" },
  { icon: "briefcase", bg: "linear-gradient(135deg,#FF9500,#FFB800)", tagColor: "#FF9500" }
];
function planPalette(i) {
  return PLAN_PALETTE[i % PLAN_PALETTE.length];
}
function renderPlans() {
  const list = document.getElementById("planList");
  if (!list) return;
  const plans = PLANS.slice(0, 3);
  if (plans.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">暂无计划，点击右上角新建</div>';
    return;
  }
  list.innerHTML = plans.map((p) => {
    const done = p.status === "done";
    return '\n        <div class="plan-card" onclick="showPlanDetail('.concat(p.id, ')">\n            <div class="plan-icon-box" style="background:').concat(p.bg, ';">').concat(wrapSvg(SVG[p.icon] || SVG.star, 20), '</div>\n            <div class="plan-content">\n                <div class="plan-title-row">\n                    <span class="plan-title ').concat(done ? "done" : "", '">').concat(p.title, '</span>\n                    <span class="plan-tag" style="color:').concat(p.tagColor, ";background:").concat(p.tagColor, '1a;">').concat(p.tag || "计划", '</span>\n                </div>\n                <div class="plan-desc">').concat(p.desc || "", '</div>\n                <div class="plan-footer">\n                    <div class="plan-progress">\n                        <div class="plan-progress-track"><div class="plan-progress-fill" style="width:').concat(p.progress, '%;"></div></div>\n                        <span class="plan-progress-text">').concat(done ? "已完成" : p.progress + "%", '</span>\n                    </div>\n                    <span class="plan-deadline">').concat(done ? "✅ 已达成" : "截止 " + (p.deadline || "未设置"), "</span>\n                </div>\n            </div>\n        </div>");
  }).join("");
}
function showPlanDetail(id) {
  const p = PLANS.find((x) => x.id === id);
  if (!p) return;
  const done = p.status === "done";
  showModal('\n        <div style="padding:20px;">\n            <div style="text-align:center;margin-bottom:14px;">\n                <div style="width:56px;height:56px;border-radius:16px;background:'.concat(p.bg, ';display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">').concat(wrapSvg(SVG[p.icon] || SVG.star, 28), '</div>\n                <div style="font-size:18px;font-weight:700;">').concat(p.title, '</div>\n                <div style="font-size:12px;color:var(--text-3);margin-top:4px;">').concat(p.tag || "", " · 截止 ").concat(p.deadline || "未设置", '</div>\n            </div>\n            <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:14px;font-size:14px;color:var(--text-2);">').concat(p.desc || "暂无描述", '</div>\n            <div style="margin-bottom:16px;">\n                <div style="font-size:12px;color:var(--text-3);margin-bottom:6px;">完成进度 ').concat(p.progress, '%</div>\n                <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="height:100%;width:').concat(p.progress, '%;background:linear-gradient(90deg,#FF6B35,#FFB627);"></div></div>\n            </div>\n            <div style="display:flex;gap:10px;">\n                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="deletePlan(').concat(p.id, ')">删除</button>\n                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="editPlan(').concat(p.id, ')">编辑</button>\n                <button class="form-submit-btn" onclick="togglePlanDone(').concat(p.id, ')">').concat(done ? "标记进行中" : "标记完成", "</button>\n            </div>\n        </div>\n    "));
}
function addPlan() {
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">新建计划</div>\n            <div class="form-group"><label>计划名称</label><input type="text" id="planTitle" placeholder="如：国庆云南深度游" /></div>\n            <div class="form-group"><label>计划描述</label><textarea id="planDesc" placeholder="简单描述计划内容..."></textarea></div>\n            <div class="form-row">\n                <div class="form-group"><label>分类</label><input type="text" id="planTag" placeholder="如：旅行 / 生活 / 学习" /></div>\n                <div class="form-group"><label>截止日期</label><input type="date" id="planDeadline" /></div>\n            </div>\n            <button class="form-submit-btn" onclick="submitPlan()">创建计划</button>\n        </div>\n    ');
}
function submitPlan() {
  const title = document.getElementById("planTitle").value.trim();
  if (!title) {
    showToast("请填写计划名称");
    return;
  }
  const palette = planPalette(PLANS.length);
  const newPlan = {
    id: Date.now(),
    title,
    desc: document.getElementById("planDesc").value.trim(),
    tag: document.getElementById("planTag").value.trim() || "计划",
    tagColor: palette.tagColor,
    deadline: document.getElementById("planDeadline").value || "未设置",
    status: "active",
    progress: 0,
    icon: palette.icon,
    bg: palette.bg
  };
  PLANS.unshift(newPlan);
  closeModal();
  savePlansToStorage();
  renderPlans();
  showToast("计划创建成功！");
}
function editPlan(id) {
  const p = PLANS.find((x) => x.id === id);
  if (!p) return;
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">编辑计划</div>\n            <div class="form-group"><label>计划名称</label><input type="text" id="planTitle" value="'.concat(p.title, '" /></div>\n            <div class="form-group"><label>计划描述</label><textarea id="planDesc">').concat(p.desc || "", '</textarea></div>\n            <div class="form-row">\n                <div class="form-group"><label>分类</label><input type="text" id="planTag" value="').concat(p.tag || "", '" /></div>\n                <div class="form-group"><label>截止日期</label><input type="date" id="planDeadline" value="').concat(p.deadline && p.deadline !== "未设置" ? p.deadline : "", '" /></div>\n            </div>\n            <div class="form-group"><label>完成进度（%）</label><input type="number" id="planProgress" value="').concat(p.progress, '" min="0" max="100" /></div>\n            <button class="form-submit-btn" onclick="updatePlan(').concat(p.id, ')">保存修改</button>\n        </div>\n    '));
}
function updatePlan(id) {
  const p = PLANS.find((x) => x.id === id);
  if (!p) return;
  const title = document.getElementById("planTitle").value.trim();
  if (!title) {
    showToast("请填写计划名称");
    return;
  }
  p.title = title;
  p.desc = document.getElementById("planDesc").value.trim();
  p.tag = document.getElementById("planTag").value.trim() || "计划";
  p.deadline = document.getElementById("planDeadline").value || "未设置";
  const prog = parseInt(document.getElementById("planProgress").value);
  p.progress = isNaN(prog) ? p.progress : Math.max(0, Math.min(100, prog));
  p.status = p.progress >= 100 ? "done" : "active";
  closeModal();
  savePlansToStorage();
  renderPlans();
  showToast("计划已更新");
}
function togglePlanDone(id) {
  const p = PLANS.find((x) => x.id === id);
  if (!p) return;
  p.status = p.status === "done" ? "active" : "done";
  if (p.status === "done") p.progress = 100;
  closeModal();
  savePlansToStorage();
  renderPlans();
  showToast(p.status === "done" ? "太棒了，计划已完成！" : "已标记为进行中");
}
function deletePlan(id) {
  const idx = PLANS.findIndex((x) => x.id === id);
  if (idx >= 0) {
    PLANS.splice(idx, 1);
    savePlansToStorage();
    closeModal();
    renderPlans();
    showToast("计划已删除");
  }
}
const GOAL_PALETTE = [
  { icon: "dumbbell", bg: "linear-gradient(135deg,#FF2D55,#FF6B6B)" },
  { icon: "star", bg: "linear-gradient(135deg,#5856D6,#7B79F0)" },
  { icon: "money", bg: "linear-gradient(135deg,#00C7BE,#30D5C8)" },
  { icon: "camera", bg: "linear-gradient(135deg,#FF9500,#FFB800)" },
  { icon: "plane", bg: "linear-gradient(135deg,#007AFF,#5AC8FA)" }
];
function goalPalette(i) {
  return GOAL_PALETTE[i % GOAL_PALETTE.length];
}
function renderGoals() {
  const list = document.getElementById("goalList");
  if (!list) return;
  const goals = GOALS.slice(0, 3);
  if (goals.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">暂无目标，点击右上角新建</div>';
    return;
  }
  list.innerHTML = goals.map((g) => {
    const pct = g.target > 0 ? Math.min(100, Math.round(g.current / g.target * 100)) : 0;
    const done = pct >= 100;
    return '\n        <div class="goal-card" onclick="showGoalDetail('.concat(g.id, ')">\n            <div class="goal-icon-box" style="background:').concat(g.bg, ';">').concat(wrapSvg(SVG[g.icon] || SVG.star, 20), '</div>\n            <div class="goal-content">\n                <div class="goal-title-row">\n                    <span class="goal-title">').concat(g.title, '</span>\n                    <span class="goal-value ').concat(done ? "done" : "", '">').concat(g.current, "/").concat(g.target, " ").concat(g.unit, '</span>\n                </div>\n                <div class="goal-progress"><div class="goal-progress-fill" style="width:').concat(pct, '%;"></div></div>\n                <div class="goal-footer">\n                    <span class="goal-desc">').concat(g.desc || "", '</span>\n                    <span class="goal-deadline">').concat(done ? "✅ 已达成" : "截止 " + (g.deadline || "未设置"), "</span>\n                </div>\n            </div>\n        </div>");
  }).join("");
}
function showGoalDetail(id) {
  const g = GOALS.find((x) => x.id === id);
  if (!g) return;
  const pct = g.target > 0 ? Math.min(100, Math.round(g.current / g.target * 100)) : 0;
  showModal('\n        <div style="padding:20px;">\n            <div style="text-align:center;margin-bottom:14px;">\n                <div style="width:56px;height:56px;border-radius:16px;background:'.concat(g.bg, ';display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">').concat(wrapSvg(SVG[g.icon] || SVG.star, 28), '</div>\n                <div style="font-size:18px;font-weight:700;">').concat(g.title, '</div>\n                <div style="font-size:12px;color:var(--text-3);margin-top:4px;">').concat(g.desc || "", '</div>\n            </div>\n            <div style="text-align:center;margin-bottom:12px;">\n                <span style="font-size:32px;font-weight:800;color:var(--primary);">').concat(g.current, '</span>\n                <span style="font-size:14px;color:var(--text-3);"> / ').concat(g.target, " ").concat(g.unit, " · ").concat(pct, '%</span>\n            </div>\n            <div style="height:10px;background:var(--border);border-radius:5px;overflow:hidden;margin-bottom:16px;"><div style="height:100%;width:').concat(pct, '%;background:linear-gradient(90deg,#FF6B35,#FFB627);"></div></div>\n            <div style="text-align:center;font-size:12px;color:var(--text-3);margin-bottom:16px;">截止 ').concat(g.deadline || "未设置", '</div>\n            <div style="display:flex;gap:10px;">\n                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="deleteGoal(').concat(g.id, ')">删除</button>\n                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="editGoal(').concat(g.id, ')">编辑进度</button>\n                <button class="form-submit-btn" onclick="closeModal()">关闭</button>\n            </div>\n        </div>\n    '));
}
function addGoal() {
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">新建小目标</div>\n            <div class="form-group"><label>目标名称</label><input type="text" id="goalTitle" placeholder="如：减重 10 斤" /></div>\n            <div class="form-group"><label>目标描述</label><textarea id="goalDesc" placeholder="简单描述..."></textarea></div>\n            <div class="form-row">\n                <div class="form-group"><label>目标值</label><input type="number" id="goalTarget" placeholder="10" min="1" /></div>\n                <div class="form-group"><label>当前进度</label><input type="number" id="goalCurrent" placeholder="0" min="0" /></div>\n            </div>\n            <div class="form-row">\n                <div class="form-group"><label>单位</label><input type="text" id="goalUnit" placeholder="斤 / 本 / 元" /></div>\n                <div class="form-group"><label>截止日期</label><input type="date" id="goalDeadline" /></div>\n            </div>\n            <button class="form-submit-btn" onclick="submitGoal()">创建目标</button>\n        </div>\n    ');
}
function submitGoal() {
  const title = document.getElementById("goalTitle").value.trim();
  const target = parseFloat(document.getElementById("goalTarget").value);
  if (!title) {
    showToast("请填写目标名称");
    return;
  }
  if (isNaN(target) || target <= 0) {
    showToast("请填写有效的目标值");
    return;
  }
  const current = parseFloat(document.getElementById("goalCurrent").value) || 0;
  const palette = goalPalette(GOALS.length);
  const newGoal = {
    id: Date.now(),
    title,
    desc: document.getElementById("goalDesc").value.trim(),
    current,
    target,
    unit: document.getElementById("goalUnit").value.trim() || "个",
    deadline: document.getElementById("goalDeadline").value || "未设置",
    icon: palette.icon,
    bg: palette.bg
  };
  GOALS.unshift(newGoal);
  closeModal();
  saveGoalsToStorage();
  renderGoals();
  showToast("目标创建成功！");
}
function editGoal(id) {
  const g = GOALS.find((x) => x.id === id);
  if (!g) return;
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">编辑目标</div>\n            <div class="form-group"><label>目标名称</label><input type="text" id="goalTitle" value="'.concat(g.title, '" /></div>\n            <div class="form-group"><label>目标描述</label><textarea id="goalDesc">').concat(g.desc || "", '</textarea></div>\n            <div class="form-row">\n                <div class="form-group"><label>目标值</label><input type="number" id="goalTarget" value="').concat(g.target, '" min="1" /></div>\n                <div class="form-group"><label>当前进度</label><input type="number" id="goalCurrent" value="').concat(g.current, '" min="0" /></div>\n            </div>\n            <div class="form-row">\n                <div class="form-group"><label>单位</label><input type="text" id="goalUnit" value="').concat(g.unit, '" /></div>\n                <div class="form-group"><label>截止日期</label><input type="date" id="goalDeadline" value="').concat(g.deadline && g.deadline !== "未设置" ? g.deadline : "", '" /></div>\n            </div>\n            <button class="form-submit-btn" onclick="updateGoal(').concat(g.id, ')">保存修改</button>\n        </div>\n    '));
}
function updateGoal(id) {
  const g = GOALS.find((x) => x.id === id);
  if (!g) return;
  const title = document.getElementById("goalTitle").value.trim();
  const target = parseFloat(document.getElementById("goalTarget").value);
  if (!title) {
    showToast("请填写目标名称");
    return;
  }
  if (isNaN(target) || target <= 0) {
    showToast("请填写有效的目标值");
    return;
  }
  g.title = title;
  g.desc = document.getElementById("goalDesc").value.trim();
  g.current = parseFloat(document.getElementById("goalCurrent").value) || 0;
  g.target = target;
  g.unit = document.getElementById("goalUnit").value.trim() || "个";
  g.deadline = document.getElementById("goalDeadline").value || "未设置";
  closeModal();
  saveGoalsToStorage();
  renderGoals();
  showToast("目标已更新");
}
function deleteGoal(id) {
  const idx = GOALS.findIndex((x) => x.id === id);
  if (idx >= 0) {
    GOALS.splice(idx, 1);
    saveGoalsToStorage();
    closeModal();
    renderGoals();
    showToast("目标已删除");
  }
}
const MOODS = ["😊", "🥰", "😌", "💪", "😎", "🤔", "😢", "😴", "🤩", "😤"];
const WEATHERS = ["☀️", "🌤️", "☁️", "🌧️", "⛈️", "🌙", "❄️", "🌫️"];
function renderDiary() {
  const list = document.getElementById("diaryList");
  if (!list) return;
  const items = DIARY.slice(0, 3);
  if (items.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">还没有日记，点击右上角写一篇</div>';
    return;
  }
  list.innerHTML = items.map((d) => '\n        <div class="diary-card" onclick="showDiaryDetail('.concat(d.id, ')">\n            <div class="diary-date-box">\n                <div class="diary-day">').concat((d.date || "").slice(8, 10) || "—", '</div>\n                <div class="diary-month">').concat((d.date || "").slice(5, 7) || "", '月</div>\n            </div>\n            <div class="diary-content">\n                <div class="diary-title-row">\n                    <span class="diary-title">').concat(d.title, '</span>\n                    <span class="diary-mood">').concat(d.mood || "", " ").concat(d.weather || "", '</span>\n                </div>\n                <div class="diary-preview">').concat(d.content || "", '</div>\n                <div class="diary-tags">').concat((d.tags || []).map((t) => '<span class="diary-tag">#'.concat(t, "</span>")).join(""), "</div>\n            </div>\n        </div>\n    ")).join("");
}
function showDiaryDetail(id) {
  const d = DIARY.find((x) => x.id === id);
  if (!d) return;
  showModal('\n        <div style="padding:20px;max-height:70vh;overflow-y:auto;">\n            <div style="text-align:center;margin-bottom:10px;">\n                <div style="font-size:32px;">'.concat(d.mood || "😊", " ").concat(d.weather || "", '</div>\n                <div style="font-size:12px;color:var(--text-3);margin-top:4px;">').concat(d.date || "", '</div>\n            </div>\n            <div style="font-size:19px;font-weight:700;text-align:center;margin-bottom:12px;">').concat(d.title, '</div>\n            <div style="background:var(--bg);border-radius:12px;padding:16px;font-size:15px;line-height:1.8;color:var(--text-1);margin-bottom:12px;white-space:pre-wrap;">').concat(d.content || "", '</div>\n            <div style="text-align:center;margin-bottom:16px;">').concat((d.tags || []).map((t) => '<span class="diary-tag" style="font-size:12px;">#'.concat(t, "</span>")).join(" "), '</div>\n            <div style="display:flex;gap:10px;">\n                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="deleteDiary(').concat(d.id, ')">删除</button>\n                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="editDiary(').concat(d.id, ')">编辑</button>\n                <button class="form-submit-btn" onclick="closeModal()">关闭</button>\n            </div>\n        </div>\n    '));
}
function moodPicker(selected) {
  return MOODS.map((m) => '<span class="mood-option '.concat(m === selected ? "selected" : "", '" onclick="selectMood(this)">').concat(m, "</span>")).join("");
}
function weatherPicker(selected) {
  return WEATHERS.map((w) => '<span class="mood-option '.concat(w === selected ? "selected" : "", '" onclick="selectWeather(this)">').concat(w, "</span>")).join("");
}
function selectMood(el) {
  document.querySelectorAll(".mood-picker .mood-option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
}
function selectWeather(el) {
  document.querySelectorAll(".weather-picker .mood-option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
}
function addDiary() {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:12px;">写日记</div>\n            <div class="form-group"><label>日期</label><input type="date" id="diaryDate" value="'.concat(today, '" /></div>\n            <div class="form-group"><label>标题</label><input type="text" id="diaryTitle" placeholder="给今天起个标题" /></div>\n            <div class="form-group">\n                <label>心情</label>\n                <div class="mood-picker">').concat(moodPicker("😊"), '</div>\n            </div>\n            <div class="form-group">\n                <label>天气</label>\n                <div class="weather-picker">').concat(weatherPicker("☀️"), '</div>\n            </div>\n            <div class="form-group"><label>正文</label><textarea id="diaryContent" style="height:110px;" placeholder="记录今天的点点滴滴..."></textarea></div>\n            <button class="form-submit-btn" onclick="submitDiary()">保存日记</button>\n        </div>\n    '));
}
function submitDiary() {
  const title = document.getElementById("diaryTitle").value.trim() || "无标题";
  const content = document.getElementById("diaryContent").value.trim();
  if (!content) {
    showToast("写点内容再保存吧");
    return;
  }
  const moodEl = document.querySelector(".mood-picker .mood-option.selected");
  const weatherEl = document.querySelector(".weather-picker .mood-option.selected");
  const tags = content.match(/#[\u4e00-\u9fa5A-Za-z0-9]+/g) || [];
  const newDiary = {
    id: Date.now(),
    date: document.getElementById("diaryDate").value || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    title,
    content,
    mood: moodEl ? moodEl.textContent : "😊",
    weather: weatherEl ? weatherEl.textContent : "☀️",
    tags: tags.length ? tags.map((t) => t.slice(1)) : ["日记"]
  };
  DIARY.unshift(newDiary);
  closeModal();
  saveDiaryToStorage();
  renderDiary();
  showToast("日记已保存！");
}
function editDiary(id) {
  const d = DIARY.find((x) => x.id === id);
  if (!d) return;
  showModal('\n        <div class="add-reminder-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:12px;">编辑日记</div>\n            <div class="form-group"><label>日期</label><input type="date" id="diaryDate" value="'.concat(d.date || "", '" /></div>\n            <div class="form-group"><label>标题</label><input type="text" id="diaryTitle" value="').concat(d.title, '" /></div>\n            <div class="form-group"><label>心情</label><div class="mood-picker">').concat(moodPicker(d.mood || "😊"), '</div></div>\n            <div class="form-group"><label>天气</label><div class="weather-picker">').concat(weatherPicker(d.weather || "☀️"), '</div></div>\n            <div class="form-group"><label>正文</label><textarea id="diaryContent" style="height:110px;">').concat(d.content || "", '</textarea></div>\n            <button class="form-submit-btn" onclick="updateDiary(').concat(d.id, ')">保存修改</button>\n        </div>\n    '));
}
function updateDiary(id) {
  const d = DIARY.find((x) => x.id === id);
  if (!d) return;
  const content = document.getElementById("diaryContent").value.trim();
  if (!content) {
    showToast("写点内容再保存吧");
    return;
  }
  const moodEl = document.querySelector(".mood-picker .mood-option.selected");
  const weatherEl = document.querySelector(".weather-picker .mood-option.selected");
  const tags = content.match(/#[\u4e00-\u9fa5A-Za-z0-9]+/g) || d.tags || [];
  d.date = document.getElementById("diaryDate").value || d.date;
  d.title = document.getElementById("diaryTitle").value.trim() || "无标题";
  d.content = content;
  d.mood = moodEl ? moodEl.textContent : d.mood;
  d.weather = weatherEl ? weatherEl.textContent : d.weather;
  d.tags = Array.isArray(tags) && tags.length ? tags.map((t) => t[0] === "#" ? t.slice(1) : t) : d.tags;
  closeModal();
  saveDiaryToStorage();
  renderDiary();
  showToast("日记已更新");
}
function deleteDiary(id) {
  const idx = DIARY.findIndex((x) => x.id === id);
  if (idx >= 0) {
    DIARY.splice(idx, 1);
    saveDiaryToStorage();
    closeModal();
    renderDiary();
    showToast("日记已删除");
  }
}
function showOrderList(status) {
  let orders = RECENT_ORDERS;
  let title = "全部订单";
  if (status && status !== "all") {
    orders = RECENT_ORDERS.filter((o) => o.status === status);
    const statusMap = { pending: "待付款", pending_use: "待使用", pending_review: "待评价", completed: "已完成", refund: "退款" };
    title = statusMap[status] || "订单";
  }
  const ordersHtml = orders.length > 0 ? orders.map((o) => {
    const statusClass = "order-status-" + o.status;
    return '\n            <div class="order-list-item">\n                <div class="order-list-img" style="background-image:'.concat(pic(o.seed, 100, 100), ';"></div>\n                <div class="order-list-info">\n                    <div class="order-list-merchant">').concat(o.merchant, '</div>\n                    <div class="order-list-item-name">').concat(o.item, " × ").concat(o.quantity, '</div>\n                    <div class="order-list-bottom">\n                        <span class="order-list-price">¥').concat(o.price, '</span>\n                        <span class="order-list-status ').concat(statusClass, '">').concat(o.statusText, "</span>\n                    </div>\n                </div>\n            </div>\n        ");
  }).join("") : '<div style="text-align:center;padding:30px;color:var(--text-3);font-size:13px;">暂无订单</div>';
  showModal('\n        <div class="order-list-modal">\n            <div style="text-align:center;font-size:18px;font-weight:700;padding:16px 20px;border-bottom:1px solid var(--border);">'.concat(title, '</div>\n            <div class="order-filter-tabs">\n                <div class="order-filter-tab ').concat(status === "all" || !status ? "active" : "", '" onclick="showOrderList(\'all\')">全部</div>\n                <div class="order-filter-tab ').concat(status === "pending" ? "active" : "", '" onclick="showOrderList(\'pending\')">待付款</div>\n                <div class="order-filter-tab ').concat(status === "pending_use" ? "active" : "", '" onclick="showOrderList(\'pending_use\')">待使用</div>\n                <div class="order-filter-tab ').concat(status === "pending_review" ? "active" : "", '" onclick="showOrderList(\'pending_review\')">待评价</div>\n                <div class="order-filter-tab ').concat(status === "completed" ? "active" : "", '" onclick="showOrderList(\'completed\')">已完成</div>\n                <div class="order-filter-tab ').concat(status === "refund" ? "active" : "", '" onclick="showOrderList(\'refund\')">退款</div>\n            </div>\n            <div class="order-list">\n                ').concat(ordersHtml, "\n            </div>\n        </div>\n    "));
}
function showProfileEdit() {
  const u = USER_PROFILE;
  const avatars = ["🦊", "🐱", "🐶", "🐼", "🐨", "🦁", "🐰", "🐯", "🦄", "🐲"];
  const avatarHtml = avatars.map((a) => '\n        <div class="avatar-option '.concat(a === u.avatar ? "selected" : "", '" data-avatar="').concat(a, '" onclick="selectAvatar(this)">').concat(a, "</div>\n    ")).join("");
  showModal('\n        <div class="profile-edit-form">\n            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">编辑个人资料</div>\n            <div style="text-align:center;font-size:13px;color:var(--text-2);margin-bottom:10px;">选择头像</div>\n            <div class="profile-avatar-picker" id="avatarPicker">'.concat(avatarHtml, '</div>\n            <div class="form-group">\n                <label>昵称</label>\n                <input type="text" id="editName" value="').concat(u.name, '" />\n            </div>\n            <div class="form-group">\n                <label>个性签名</label>\n                <input type="text" id="editBio" value="').concat(u.bio, '" />\n            </div>\n            <div class="form-row">\n                <div class="form-group">\n                    <label>性别</label>\n                    <select id="editGender">\n                        <option value="男" ').concat(u.gender === "男" ? "selected" : "", '>男</option>\n                        <option value="女" ').concat(u.gender === "女" ? "selected" : "", '>女</option>\n                    </select>\n                </div>\n                <div class="form-group">\n                    <label>城市</label>\n                    <input type="text" id="editCity" value="').concat(u.city, '" />\n                </div>\n            </div>\n            <div class="form-group">\n                <label>生日</label>\n                <input type="date" id="editBirthday" value="').concat(u.birthday, '" />\n            </div>\n            <button class="form-submit-btn" onclick="saveProfile()">保存</button>\n        </div>\n    '));
}
function selectAvatar(el) {
  document.querySelectorAll(".avatar-option").forEach((o) => o.classList.remove("selected"));
  el.classList.add("selected");
}
function saveProfile() {
  const name = document.getElementById("editName").value.trim();
  if (!name) {
    showToast("昵称不能为空");
    return;
  }
  const selectedAvatar = document.querySelector(".avatar-option.selected");
  USER_PROFILE.avatar = selectedAvatar ? selectedAvatar.textContent : USER_PROFILE.avatar;
  USER_PROFILE.name = name;
  USER_PROFILE.bio = document.getElementById("editBio").value.trim() || USER_PROFILE.bio;
  USER_PROFILE.gender = document.getElementById("editGender").value;
  USER_PROFILE.city = document.getElementById("editCity").value.trim() || USER_PROFILE.city;
  USER_PROFILE.birthday = document.getElementById("editBirthday").value || USER_PROFILE.birthday;
  closeModal();
  renderUserProfile();
  showToast("资料保存成功！");
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2e3);
}
function showModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modalOverlay").classList.add("show");
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
}
document.addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") closeModal();
  if (e.target.id === "interestPanel") toggleInterestPanel(false);
});
init();
