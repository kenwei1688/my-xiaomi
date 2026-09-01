// ==================== 生活小秘 - 应用主逻辑 v2.0 ====================

let currentPage = 'home';
const pageState = {};
let carouselIndex = 0;
let carouselTimer = null;
let toastTimer = null;

// SVG 包装器
function wrapSvg(inner, size) {
    return `<svg width="${size||24}" height="${size||24}" viewBox="0 0 24 24" fill="none">${inner}</svg>`;
}

// 图片背景辅助
function imgStyle(imgStr) {
    return `background-image:${imgStr};background-size:cover;background-position:center;`;
}

// ===== localStorage 持久化 =====
const STORAGE_KEY_TRIPS = 'shenghuo_trips';
const STORAGE_KEY_REMINDERS = 'shenghuo_reminders';
const STORAGE_KEY_PLANS = 'shenghuo_plans';
const STORAGE_KEY_GOALS = 'shenghuo_goals';
const STORAGE_KEY_DIARY = 'shenghuo_diary';
const STORAGE_KEY_QUICK_ACTIONS = 'shenghuo_quick_actions';

function saveTripsToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_TRIPS, JSON.stringify(TRIP_PLANS));
    } catch(e) { console.warn('[Storage] 保存行程失败:', e); }
}

function saveRemindersToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY_REMINDERS, JSON.stringify(REMINDERS));
    } catch(e) { console.warn('[Storage] 保存提醒失败:', e); }
    // 每次提醒变更都同步给原生，由原生负责系统闹钟调度
    syncRemindersToNative();
}

function savePlansToStorage() {
    try { localStorage.setItem(STORAGE_KEY_PLANS, JSON.stringify(PLANS)); } catch(e) { console.warn('[Storage] 保存计划失败:', e); }
}
function saveGoalsToStorage() {
    try { localStorage.setItem(STORAGE_KEY_GOALS, JSON.stringify(GOALS)); } catch(e) { console.warn('[Storage] 保存目标失败:', e); }
}
function saveDiaryToStorage() {
    try { localStorage.setItem(STORAGE_KEY_DIARY, JSON.stringify(DIARY)); } catch(e) { console.warn('[Storage] 保存日记失败:', e); }
}
function saveQuickActionsToStorage() {
    try { localStorage.setItem(STORAGE_KEY_QUICK_ACTIONS, JSON.stringify(QUICK_ACTIONS)); } catch(e) { console.warn('[Storage] 保存快捷指令失败:', e); }
}

// 把提醒同步给 APP 原生层（调度系统闹钟/短信/通知），并请求必要权限
let _reminderPermRequested = false;
function syncRemindersToNative() {
    if (window.AndroidBridge && window.AndroidBridge.syncReminders) {
        try {
            window.AndroidBridge.syncReminders(JSON.stringify(REMINDERS));
        } catch (e) { console.warn('[Bridge] syncReminders 失败:', e); }
        // 只要有提醒，就确保通知/短信权限已申请（仅申请一次）
        const hasReminder = REMINDERS.some(r => r.enabled !== false);
        if (hasReminder && !_reminderPermRequested && window.AndroidBridge.requestReminderPermissions) {
            try { window.AndroidBridge.requestReminderPermissions(); _reminderPermRequested = true; } catch (e) {}
        }
    }
}

// 读取原生保存的提醒设置（短信手机号 / 默认方式）
function loadReminderSettings() {
    if (window.AndroidBridge && window.AndroidBridge.getReminderSettings) {
        try {
            const raw = window.AndroidBridge.getReminderSettings();
            if (raw) return JSON.parse(raw);
        } catch (e) {}
    }
    return {};
}
function saveReminderSettingsToNative(settings) {
    if (window.AndroidBridge && window.AndroidBridge.saveReminderSettings) {
        try { window.AndroidBridge.saveReminderSettings(JSON.stringify(settings)); } catch (e) {}
    }
}

function loadFromStorage() {
    try {
        const tripsData = localStorage.getItem(STORAGE_KEY_TRIPS);
        if (tripsData) {
            const parsed = JSON.parse(tripsData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                TRIP_PLANS.length = 0;
                parsed.forEach(t => TRIP_PLANS.push(t));
                console.log('[Storage] 恢复行程数据:', parsed.length, '条');
            }
        }
        const remindersData = localStorage.getItem(STORAGE_KEY_REMINDERS);
        if (remindersData) {
            const parsed = JSON.parse(remindersData);
            if (Array.isArray(parsed) && parsed.length > 0) {
                REMINDERS.length = 0;
                parsed.forEach(r => REMINDERS.push(r));
                console.log('[Storage] 恢复提醒数据:', parsed.length, '条');
            }
        }
        const plansData = localStorage.getItem(STORAGE_KEY_PLANS);
        if (plansData) {
            const parsed = JSON.parse(plansData);
            if (Array.isArray(parsed)) { PLANS.length = 0; parsed.forEach(x => PLANS.push(x)); }
        }
        const goalsData = localStorage.getItem(STORAGE_KEY_GOALS);
        if (goalsData) {
            const parsed = JSON.parse(goalsData);
            if (Array.isArray(parsed)) { GOALS.length = 0; parsed.forEach(x => GOALS.push(x)); }
        }
        const diaryData = localStorage.getItem(STORAGE_KEY_DIARY);
        if (diaryData) {
            const parsed = JSON.parse(diaryData);
            if (Array.isArray(parsed)) { DIARY.length = 0; parsed.forEach(x => DIARY.push(x)); }
        }
        const quickActionsData = localStorage.getItem(STORAGE_KEY_QUICK_ACTIONS);
        if (quickActionsData) {
            const parsed = JSON.parse(quickActionsData);
            if (Array.isArray(parsed) && parsed.length > 0) { QUICK_ACTIONS.length = 0; parsed.forEach(x => QUICK_ACTIONS.push(x)); }
        }
    } catch(e) { console.warn('[Storage] 加载数据失败:', e); }
}

// ===== 个人中心Tab红点提示 =====
let profileBadge = false;

function showProfileBadge() {
    profileBadge = true;
    const tab = document.querySelector('.tab-item[data-tab="profile"]');
    if (tab && !tab.querySelector('.tab-badge')) {
        const badge = document.createElement('span');
        badge.className = 'tab-badge';
        badge.style.cssText = 'position:absolute;top:2px;right:50%;margin-right:-20px;width:8px;height:8px;background:#FF3B30;border-radius:50%;border:1.5px solid #fff;';
        tab.appendChild(badge);
    }
}

function clearProfileBadge() {
    profileBadge = false;
    const tab = document.querySelector('.tab-item[data-tab="profile"]');
    if (tab) {
        const badge = tab.querySelector('.tab-badge');
        if (badge) badge.remove();
    }
}

// ===== 初始化 =====
async function init() {
    // 显示加载状态
    const loadingEl = document.createElement('div');
    loadingEl.id = 'appLoading';
    loadingEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:#fff;z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
    loadingEl.innerHTML = '<div style="font-size:40px;margin-bottom:16px;">🌃</div><div style="color:#FF6B35;font-size:16px;font-weight:600;">生活小秘启动中...</div><div style="margin-top:8px;color:#999;font-size:13px;">正在连接智能服务</div>';
    document.body.appendChild(loadingEl);

    // 检测后端并加载数据
    await API.check();
    if (API.available) {
        await API.loadAll();
    }

    // 从localStorage恢复用户创建的行程/提醒（优先级最高，确保用户数据不丢失）
    loadFromStorage();

    // 移除加载状态
    loadingEl.style.transition = 'opacity 0.3s';
    loadingEl.style.opacity = '0';
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
    switchPage('home');

    // 把已存在的提醒同步给原生，恢复系统闹钟调度
    syncRemindersToNative();
    // 无原生桥接（如浏览器打开公网H5）时启用页面内兜底提醒
    ensureInPageReminders();
}

// ===== 底部导航栏 =====
function renderTabBar() {
    const tabBar = document.getElementById('tabBar');
    const tabs = [
        { id:'home', label:'首页', active:SVG.tabHomeActive, outline:SVG.tabHome },
        { id:'recommend', label:'推荐', active:SVG.tabRecommendActive, outline:SVG.tabRecommend },
        { id:'assistant', label:'小秘', active:SVG.tabAssistant, outline:SVG.tabAssistant, isAssistant:true },
        { id:'newest', label:'上新', active:SVG.tabNewestActive, outline:SVG.tabNewest },
        { id:'profile', label:'我的', active:SVG.tabProfileActive, outline:SVG.tabProfile },
    ];
    tabBar.innerHTML = tabs.map(t => `
        <div class="tab-item ${t.isAssistant?'assistant-tab':''}" data-tab="${t.id}" onclick="switchPage('${t.id}')">
            <div class="tab-icon">${t.isAssistant?t.active:t.outline}</div>
            <div class="tab-label">${t.label}</div>
        </div>
    `).join('');
}

function switchPage(pageId) {
    const cur = document.querySelector('.page.active');
    if (cur) {
        const s = cur.querySelector('.page-scroll');
        if (s) pageState[currentPage] = s.scrollTop;
    }
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageId).classList.add('active');

    const tabData = {
        home:{a:SVG.tabHomeActive,o:SVG.tabHome},
        recommend:{a:SVG.tabRecommendActive,o:SVG.tabRecommend},
        assistant:{a:SVG.tabAssistant,o:SVG.tabAssistant},
        newest:{a:SVG.tabNewestActive,o:SVG.tabNewest},
        profile:{a:SVG.tabProfileActive,o:SVG.tabProfile},
    };
    document.querySelectorAll('.tab-item').forEach(t => {
        t.classList.remove('active');
        const id = t.dataset.tab;
        const icon = t.querySelector('.tab-icon');
        if (id === pageId) {
            t.classList.add('active');
            icon.innerHTML = tabData[id].a;
        } else {
            icon.innerHTML = tabData[id].o;
        }
    });

    currentPage = pageId;
    setTimeout(() => {
        const el = document.getElementById('page-' + pageId);
        const s = el.querySelector('.page-scroll');
        if (s) s.scrollTop = pageState[pageId] !== undefined ? pageState[pageId] : 0;
    }, 50);
    if (pageId === 'assistant') scrollChatToBottom();
    // 切换到个人中心时重新渲染行程/提醒，确保数据最新
    if (pageId === 'profile') {
        renderTripPlans();
        renderReminders();
        renderPlans();
        renderGoals();
        renderDiary();
        clearProfileBadge();
    }
}

// ===== 首页：分类 =====
function renderCategories() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = CATEGORIES.map(c => `
        <div class="category-item" onclick="showToast('正在打开「${c.name}」分类')">
            <div class="cat-icon" style="background:${c.bg};">
                ${wrapSvg(c.icon, 24)}
            </div>
            <div class="cat-label">${c.name}</div>
        </div>
    `).join('');
}

// ===== 首页：轮播 =====
function renderBanners() {
    const track = document.getElementById('carouselTrack');
    const dots = document.getElementById('carouselDots');
    track.innerHTML = BANNERS.map(b => `
        <div class="carousel-slide" onclick="showToast('${b.title}')">
            <div class="slide-bg" style="${imgStyle(b.img)}">
                <div class="slide-overlay"></div>
                <div class="slide-content">
                    <span class="slide-tag">${b.tag}</span>
                    <h4>${b.title}</h4>
                    <p>${b.subtitle}</p>
                </div>
            </div>
        </div>
    `).join('');
    dots.innerHTML = BANNERS.map((_,i) => `<div class="carousel-dot ${i===0?'active':''}"></div>`).join('');
    startCarousel();
}

function startCarousel() {
    if (carouselTimer) clearInterval(carouselTimer);
    carouselTimer = setInterval(() => {
        carouselIndex = (carouselIndex + 1) % BANNERS.length;
        const track = document.getElementById('carouselTrack');
        if (track) {
            track.style.transform = `translateX(-${carouselIndex * 100}%)`;
            document.querySelectorAll('.carousel-dot').forEach((d,i) => d.classList.toggle('active', i===carouselIndex));
        }
    }, 3500);
}

// ===== 首页：商家列表 =====
function renderMerchants() {
    const list = document.getElementById('merchantList');
    list.innerHTML = MERCHANTS.map(m => `
        <div class="merchant-card" onclick="showToast('查看「${m.name}」详情')">
            <div class="merchant-img" style="${imgStyle(m.img)}">
                <div class="merchant-img-overlay"></div>
                <div class="merchant-tags">
                    ${m.tags.map(t => `<span class="merchant-tag" style="background:${t.color};">${t.text}</span>`).join('')}
                </div>
                <div class="merchant-status ${m.isOpen?'open':'closed'}">${m.isOpen?'营业中':'已打烊'}</div>
            </div>
            <div class="merchant-body">
                <div class="merchant-name">${m.name}</div>
                <div class="merchant-meta">
                    <span class="merchant-rating">${SVG.starFill} ${m.rating}</span>
                    <span class="merchant-meta-div">|</span>
                    <span class="merchant-distance">${m.distance}</span>
                    <span class="merchant-meta-div">|</span>
                    <span class="merchant-price-tag">人均¥${m.avgPrice}</span>
                    <span class="merchant-meta-div">|</span>
                    <span class="merchant-sold">${m.soldCount}</span>
                </div>
                <div class="merchant-cuisine">${m.cuisine} · ${SVG.location} <span class="merchant-addr">${m.address}</span></div>
                <div class="merchant-hours">${m.isOpen?'<span style="color:#34C759">●</span>':'<span style="color:#ccc">●</span>'} ${m.hours}</div>
                <div class="merchant-promo">
                    ${m.tags.slice(1).map(t => `<span class="promo-tag">${t.text}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

// ===== 首页：特价美食 =====
function renderDeals() {
    const c = document.getElementById('dealCards');
    c.innerHTML = DEALS.map(d => `
        <div class="deal-card" onclick="showToast('抢购「${d.title}」')">
            <div class="deal-img" style="${imgStyle(d.img)}">
                <div class="deal-badge">${d.badge}</div>
            </div>
            <div class="deal-body">
                <div class="deal-title">${d.title}</div>
                <div class="deal-sold">已售${d.sold}</div>
                <div class="deal-price">
                    <span class="deal-price-now">¥${d.price}</span>
                    <span class="deal-price-old">¥${d.oldPrice}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== 首页：限时秒杀 =====
function renderFlashSales() {
    const c = document.getElementById('flashSaleList');
    c.innerHTML = FLASH_SALES.map(f => `
        <div class="flash-item" onclick="showToast('抢购「${f.title}」')">
            <div class="flash-img" style="${imgStyle(f.img)}"></div>
            <div class="flash-body">
                <div class="flash-title">${f.title}</div>
                <div class="flash-price-row">
                    <span class="flash-price">¥${f.price}</span>
                    <span class="flash-orig">¥${f.origPrice}</span>
                </div>
                <div class="flash-progress">
                    <div class="flash-progress-bar" style="width:${f.progress}%;"></div>
                    <div class="flash-progress-text">已抢${f.progress}%</div>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== 秒杀倒计时 =====
function startFlashTimer() {
    let s = 2*3600+35*60+48;
    setInterval(() => {
        s--;
        if (s < 0) s = 2*3600+35*60+48;
        const h = String(Math.floor(s/3600)).padStart(2,'0');
        const m = String(Math.floor((s%3600)/60)).padStart(2,'0');
        const sec = String(s%60).padStart(2,'0');
        const el = document.getElementById('flashTimer');
        if (el) el.textContent = `${h}:${m}:${sec}`;
    }, 1000);
}

// ===== 搜索 =====
function toggleSearch(show) {
    const o = document.getElementById('searchOverlay');
    if (show) { o.classList.add('show'); setTimeout(()=>document.getElementById('searchInput').focus(),300); }
    else o.classList.remove('show');
}

function renderHotSearches() {
    const c = document.getElementById('searchHotTags');
    c.innerHTML = HOT_SEARCHES.map((t,i) => `
        <div class="search-hot-tag ${i<3?'hot':''}" onclick="searchTag('${t}')">${i<3?'🔥 ':''}${t}</div>
    `).join('');
}

function searchTag(t) {
    document.getElementById('searchInput').value = t;
    showToast(`搜索「${t}」`);
}

// ===== 推荐页：兴趣 =====
function renderInterestTags() {
    const c = document.getElementById('interestTags');
    const sel = INTEREST_CATEGORIES.filter(c => c.selected);
    c.innerHTML = sel.map(c => `<span class="interest-tag">${wrapSvg(c.svg,14)} ${c.name}</span>`).join('') || '<span style="color:var(--text-3);font-size:12px;">暂未选择，点击编辑</span>';
}

function renderInterestPanel() {
    const b = document.getElementById('interestPanelBody');
    b.innerHTML = INTEREST_CATEGORIES.map(c => `
        <div class="interest-option ${c.selected?'selected':''}" data-id="${c.id}" onclick="toggleInterest('${c.id}')">
            ${wrapSvg(c.svg,18)} ${c.name}
        </div>
    `).join('');
}

function toggleInterestPanel(show) {
    document.getElementById('interestPanel').classList.toggle('show', show);
}

function toggleInterest(id) {
    const c = INTEREST_CATEGORIES.find(c => c.id === id);
    c.selected = !c.selected;
    document.querySelector(`.interest-option[data-id="${id}"]`).classList.toggle('selected', c.selected);
}

function saveInterests() {
    renderInterestTags();
    renderRecommendFeed();
    toggleInterestPanel(false);
    const count = INTEREST_CATEGORIES.filter(c=>c.selected).length;
    showToast(`已保存${count}个兴趣偏好`);
    // 同步到后端
    if (API.available) {
        const selectedIds = INTEREST_CATEGORIES.filter(c => c.selected).map(c => c.id);
        API.saveInterests(selectedIds);
    }
}

// ===== 推荐页：内容流 =====
function renderRecommendFeed() {
    const feed = document.getElementById('recommendFeed');
    const sel = INTEREST_CATEGORIES.filter(c=>c.selected).map(c=>{
        const m={food:'美食',massage:'养生',travel:'旅游',fitness:'健身',ktv:'KTV',movie:'电影',attraction:'景点',car:'出行',shopping:'购物',beauty:'美容',bar:'酒吧',photo:'摄影'};
        return m[c.id];
    });
    let items = RECOMMEND_FEED;
    if (sel.length) items = RECOMMEND_FEED.filter(i => sel.some(s => i.type.includes(s)));
    if (!items.length) {
        feed.innerHTML = '<div class="empty-state" style="grid-column:span 2;"><div class="empty-icon">📭</div><div class="empty-text">暂无匹配内容<br>试试勾选更多兴趣品类</div></div>';
        return;
    }
    feed.innerHTML = items.map(i => `
        <div class="recommend-card" onclick="showToast('查看「${i.title}」')">
            <div class="rec-img" style="${imgStyle(i.img)}">
                <span class="rec-type-badge" style="background:${i.typeColor};">${i.type}</span>
            </div>
            <div class="rec-body">
                <div class="rec-title">${i.title}</div>
                <div class="rec-subtitle">${i.subtitle}</div>
                <div class="rec-meta">
                    <span class="rec-rating">${SVG.starFill} ${i.rating}</span>
                    <span class="rec-distance">${i.distance}</span>
                    <span class="rec-sold">已售${i.sold}</span>
                </div>
                <div class="rec-price">¥${i.price}<small>${i.unit}</small></div>
            </div>
        </div>
    `).join('');
}

// ===== 小秘：快捷指令 =====
function renderQuickActions() {
    const g = document.getElementById('quickActionGrid');
    g.innerHTML = QUICK_ACTIONS.map(a => `
        <div class="quick-action-item" onclick="quickAction('${a.name}')">
            <div class="qa-icon" style="background:${a.bg};">${wrapSvg(a.svg,20)}</div>
            <div class="qa-label">${a.name}</div>
        </div>
    `).join('');
}

function quickAction(name) {
    document.getElementById('chatInput').value = name;
    sendMessage();
}

// ===== 快捷指令管理（自定义增删） =====
const QA_PALETTE = [
    'linear-gradient(135deg,#FF6B35,#FF9A56)',
    'linear-gradient(135deg,#34C759,#30D158)',
    'linear-gradient(135deg,#007AFF,#5AC8FA)',
    'linear-gradient(135deg,#AF52DE,#D65BFF)',
    'linear-gradient(135deg,#FF9500,#FFB800)',
    'linear-gradient(135deg,#FF2D55,#FF6B6B)',
    'linear-gradient(135deg,#5856D6,#7B79F0)',
    'linear-gradient(135deg,#00C7BE,#30D5C8)',
];
const QA_ICON_OPTIONS = [
    { key: 'food', name: '美食' }, { key: 'star', name: '收藏' }, { key: 'store', name: '店铺' },
    { key: 'car', name: '打车' }, { key: 'plane', name: '飞机' }, { key: 'camera', name: '景点' },
    { key: 'dumbbell', name: '健身' }, { key: 'mic', name: 'KTV' }, { key: 'film', name: '电影' },
    { key: 'gift', name: '礼物' }, { key: 'calendar', name: '会议' }, { key: 'money', name: '钱包' },
];

function openQuickActionManage() {
    const items = QUICK_ACTIONS.map((a, i) => `
        <div class="qa-manage-item">
            <div class="qa-icon" style="background:${a.bg};">${wrapSvg(a.svg, 18)}</div>
            <div class="qa-manage-name">${a.name}</div>
            <div class="qa-manage-del" onclick="removeQuickAction(${i})">×</div>
        </div>
    `).join('');
    const iconOptions = QA_ICON_OPTIONS.map(o =>
        `<div class="qa-icon-pick" data-icon="${o.key}" onclick="pickQuickActionIcon(this)" title="${o.name}">${wrapSvg(SVG[o.key], 18)}</div>`).join('');
    showModal(`
        <div class="add-reminder-form" style="max-height:80vh;overflow-y:auto;">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:8px;">管理快捷指令</div>
            <div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:14px;">删除不需要的指令，或添加你自己的常用指令</div>
            <div class="qa-manage-list">${items || '<div style="text-align:center;color:var(--text-3);font-size:13px;padding:10px;">暂无快捷指令</div>'}</div>
            <div style="margin:14px 0;height:1px;background:var(--border);"></div>
            <div class="form-group">
                <label>新指令名称</label>
                <input type="text" id="qaName" placeholder="如：订外卖 / 提醒我开会" />
            </div>
            <div class="form-group">
                <label>选择图标</label>
                <div class="qa-icon-picker" id="qaIconPicker">${iconOptions}</div>
            </div>
            <button class="form-submit-btn" onclick="submitQuickAction()">添加指令</button>
        </div>
    `);
    // 默认选中第一个图标
    const first = document.querySelector('.qa-icon-pick');
    if (first) first.classList.add('selected');
}

let _pickedQaIcon = 'food';
function pickQuickActionIcon(el) {
    document.querySelectorAll('.qa-icon-pick').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    _pickedQaIcon = el.dataset.icon;
}

function submitQuickAction() {
    const name = document.getElementById('qaName').value.trim();
    if (!name) { showToast('请输入指令名称'); return; }
    const exists = QUICK_ACTIONS.find(a => a.name === name);
    if (exists) { showToast('该指令已存在'); return; }
    QUICK_ACTIONS.push({
        name: name,
        svg: SVG[_pickedQaIcon] || SVG.food,
        bg: QA_PALETTE[QUICK_ACTIONS.length % QA_PALETTE.length],
    });
    saveQuickActionsToStorage();
    closeModal();
    renderQuickActions();
    showToast('快捷指令已添加');
}

function removeQuickAction(index) {
    const a = QUICK_ACTIONS[index];
    if (!a) return;
    QUICK_ACTIONS.splice(index, 1);
    saveQuickActionsToStorage();
    renderQuickActions();
    openQuickActionManage(); // 刷新管理列表
    showToast('已删除「' + a.name + '」');
}

// ===== 小秘：聊天 =====
function initChat() {
    addBotMessage('你好呀！我是小秘，你的智能生活管家～\n有什么需要帮忙的尽管跟我说！\n\n我可以帮你：点外卖、订餐厅、订酒店、买火车票/飞机票、规划行程、买电影票、订KTV包厢等。');
}

const BOT_AVATAR = `<svg width="20" height="20" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" fill="#fff" opacity="0.95"/><circle cx="9" cy="10" r="1.2" fill="#FF6B35"/><circle cx="15" cy="10" r="1.2" fill="#FF6B35"/><path d="M9 14h6" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const USER_AVATAR = `<svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="#fff"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="#fff"/></svg>`;

function addBotMessage(text, card) {
    const ca = document.getElementById('chatArea');
    const msg = document.createElement('div');
    msg.className = 'chat-msg bot';
    let cardHtml = '';
    if (card) {
        cardHtml = `<div class="chat-card">
            <div class="chat-card-img" style="${imgStyle(card.img)}"></div>
            <div class="chat-card-body">
                <div class="chat-card-title">${card.title}</div>
                <div class="chat-card-desc">${card.desc}</div>
                <button class="chat-card-btn" onclick="showToast('${card.btn}')">${card.btn}</button>
            </div>
        </div>`;
    }
    msg.innerHTML = `
        <div class="chat-avatar" style="background:linear-gradient(135deg,#FF6B35,#FFB627);">${BOT_AVATAR}</div>
        <div>
            <div class="chat-bubble">${text.replace(/\n/g,'<br>')}</div>
            ${cardHtml}
        </div>
    `;
    ca.appendChild(msg);
    scrollChatToBottom();
}

// AI 响应渲染：支持文本 + 多卡片 + 操作按钮
function addAIResponse(response) {
    const ca = document.getElementById('chatArea');
    const msg = document.createElement('div');
    msg.className = 'chat-msg bot';

    let cardsHtml = '';
    if (response.cards && response.cards.length > 0) {
        cardsHtml = '<div class="chat-cards">';
        response.cards.forEach(card => {
            const imgStr = pic(card.seed, 200, 120);
            const tagsHtml = (card.tags || []).slice(0, 3).map(t =>
                `<span class="cc-tag">${t}</span>`
            ).join('');
            cardsHtml += `
                <div class="chat-merchant-card" onclick="showToast('查看「${card.name}」详情')">
                    <div class="cc-img" style="${imgStyle(imgStr)}"></div>
                    <div class="cc-body">
                        <div class="cc-name">${card.name}</div>
                        <div class="cc-meta">
                            <span class="cc-rating">${SVG.starFill} ${card.rating}</span>
                            <span class="cc-dist">${card.distance}</span>
                            <span class="cc-price">¥${card.avgPrice || card.price}</span>
                        </div>
                        <div class="cc-tags">${tagsHtml}</div>
                    </div>
                </div>
            `;
        });
        cardsHtml += '</div>';
    }

    let actionsHtml = '';
    if (response.actions && response.actions.length > 0) {
        actionsHtml = '<div class="chat-actions">';
        response.actions.forEach(action => {
            actionsHtml += `<button class="chat-action-btn" onclick="sendQuickMessage('${action}')">${action}</button>`;
        });
        actionsHtml += '</div>';
    }

    msg.innerHTML = `
        <div class="chat-avatar" style="background:linear-gradient(135deg,#FF6B35,#FFB627);">${BOT_AVATAR}</div>
        <div class="chat-content-wrap">
            <div class="chat-bubble">${response.reply.replace(/\n/g,'<br>')}</div>
            ${cardsHtml}
            ${actionsHtml}
        </div>
    `;
    ca.appendChild(msg);
    scrollChatToBottom();

    // ===== 自动同步行程/提醒到个人中心 =====
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
    // 提醒信息不全（如缺时间），渲染补全草稿卡
    if (response.askReminder) {
        renderReminderDraft(response.askReminder);
    }
}

// AI 创建行程后自动同步到个人中心
function handleAITripCreated(trip) {
    const newTrip = {
        id: trip.id || Date.now(),
        title: trip.title,
        status: trip.status || 'upcoming',
        startDate: trip.startDate,
        endDate: trip.endDate,
        days: trip.days,
        destination: trip.destination,
        budget: trip.budget,
        spent: trip.spent || 0,
        coverImg: picG(trip.seed || 'trip' + (trip.id || Date.now()), 400, 200, '#FF6B35', '#FF9A56'),
        progress: trip.progress || 0,
        schedule: trip.schedule || [],
    };
    // 避免重复添加
    if (!TRIP_PLANS.find(t => t.id === newTrip.id)) {
        TRIP_PLANS.unshift(newTrip);
        saveTripsToStorage();
        renderTripPlans();
        showProfileBadge();
        // 延迟提示，让用户先看到AI回复
        setTimeout(() => showToast('已自动添加行程「' + newTrip.title + '」到我的行程'), 500);
    }
}

// AI 创建提醒后自动同步到个人中心
function handleAIReminderCreated(reminder) {
    const newReminder = {
        id: reminder.id || Date.now(),
        type: reminder.type || 'custom',
        title: reminder.title,
        desc: reminder.desc || '来自小秘助手的提醒',
        time: reminder.time || '08:00',
        repeat: reminder.repeat || '仅一次',
        enabled: reminder.enabled !== false,
        icon: reminder.icon || reminderIcon(reminder.type),
        bg: reminder.bg || reminderBg(reminder.type),
        method: reminder.method || 'alarm',
        date: reminder.date,
    };
    // 避免重复添加
    if (!REMINDERS.find(r => r.id === newReminder.id)) {
        REMINDERS.push(newReminder);
        saveRemindersToStorage();
        renderReminders();
        showProfileBadge();
        afterReminderChanged(newReminder);
    }
}

// AI 删除行程后自动同步到个人中心
function handleAITripDeleted(trip) {
    const id = trip.id;
    const idx = TRIP_PLANS.findIndex(t => t.id === id);
    if (idx >= 0) {
        const title = TRIP_PLANS[idx].title;
        TRIP_PLANS.splice(idx, 1);
        saveTripsToStorage();
        renderTripPlans();
        showProfileBadge();
        setTimeout(() => showToast('已从我的行程删除「' + title + '」'), 500);
    }
}

// AI 删除全部行程
function handleAITripDeletedAll() {
    TRIP_PLANS.length = 0;
    saveTripsToStorage();
    renderTripPlans();
    showProfileBadge();
    setTimeout(() => showToast('已清空全部行程'), 500);
}

// AI 删除提醒后自动同步到个人中心
function handleAIReminderDeleted(reminder) {
    const id = reminder.id;
    const idx = REMINDERS.findIndex(r => r.id === id);
    if (idx >= 0) {
        const title = REMINDERS[idx].title;
        REMINDERS.splice(idx, 1);
        saveRemindersToStorage();
        renderReminders();
        showProfileBadge();
        setTimeout(() => showToast('已从我的提醒删除「' + title + '」'), 500);
    }
}

// AI 删除全部提醒
function handleAIReminderDeletedAll() {
    REMINDERS.length = 0;
    saveRemindersToStorage();
    renderReminders();
    showProfileBadge();
    setTimeout(() => showToast('已清空全部提醒'), 500);
}

// 快捷发送（点击操作按钮）
function sendQuickMessage(text) {
    const input = document.getElementById('chatInput');
    input.value = text;
    sendMessage();
}

function addUserMessage(text) {
    const ca = document.getElementById('chatArea');
    const msg = document.createElement('div');
    msg.className = 'chat-msg user';
    msg.innerHTML = `
        <div class="chat-avatar" style="background:linear-gradient(135deg,#007AFF,#5AC8FA);">${USER_AVATAR}</div>
        <div class="chat-bubble">${text}</div>
    `;
    ca.appendChild(msg);
    scrollChatToBottom();
}

function showTyping() {
    const ca = document.getElementById('chatArea');
    const m = document.createElement('div');
    m.className = 'chat-msg bot';
    m.id = 'typing-msg';
    m.innerHTML = `
        <div class="chat-avatar" style="background:linear-gradient(135deg,#FF6B35,#FFB627);">${BOT_AVATAR}</div>
        <div class="chat-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
    `;
    ca.appendChild(m);
    scrollChatToBottom();
}

function hideTyping() {
    const t = document.getElementById('typing-msg');
    if (t) t.remove();
}

function getReply(text) {
    // 本地回退（后端不可用时使用）
    const keys = ['外卖','餐厅','酒店','火车','飞机','行程','电影'];
    for (const k of keys) {
        if (text.includes(k)) return CHAT_REPLIES[k];
    }
    if (text.includes('K') || text.includes('KTV') || text.includes('k歌') || text.includes('唱歌')) return CHAT_REPLIES['K'];
    return CHAT_REPLIES['default'];
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    addUserMessage(text);
    input.value = '';
    showTyping();

    // 优先调用后端 AI
    if (API.available) {
        try {
            const response = await API.chat(text);
            hideTyping();
            if (response) {
                addAIResponse(response);
                return;
            }
        } catch (e) {
            console.error('[Chat] AI 请求失败，使用本地回复:', e);
        }
    }

    // 回退到本地回复（含行程/提醒本地创建/删除）
    setTimeout(() => {
        hideTyping();
        // 本地意图检测：删除行程
        if (/(删除|删掉|去掉|取消|不要|清除)(.*?)(行程|旅游|旅行|出游)|(行程|旅游|旅行).*(删除|删掉|去掉|取消|不要)/.test(text)) {
            if (TRIP_PLANS.length === 0) {
                addBotMessage('您目前还没有行程规划，无需删除。\n\n如果需要创建行程，可以直接跟我说"帮我规划XX日游"～');
                return;
            }
            const cities = ['三亚', '成都', '北京', '上海', '广州', '深圳', '杭州', '西安', '重庆', '昆明', '厦门', '丽江', '桂林', '南京', '苏州', '青岛', '大连', '哈尔滨', '长沙', '武汉', '郑州', '济南', '福州', '贵阳', '南宁', '海口', '兰州', '拉萨', '内蒙古', '青海', '西藏', '新疆', '云南', '大理', '张家界', '九寨沟', '黄山', '泰山', '华山', '中国香港', '中国澳门', '中国台湾', '香港', '澳门', '台湾'];
            let matched = [];
            for (const c of cities) { if (text.includes(c)) { matched = TRIP_PLANS.filter(t => t.destination && t.destination.includes(c)); break; } }
            if (matched.length === 0 && /(所有|全部|清空)/.test(text)) { matched = [...TRIP_PLANS]; }
            if (matched.length === 0) {
                const kw = text.replace(/删除|删掉|去掉|取消|不要|清除|的|行程|旅游|旅行|出游|帮我|请|把|那|个|条|所有|全部/g, '').trim();
                if (kw) matched = TRIP_PLANS.filter(t => t.title.includes(kw) || (t.destination && t.destination.includes(kw)));
            }
            if (matched.length === 0) {
                const list = TRIP_PLANS.map((t, i) => (i + 1) + '. ' + t.title + '（' + t.destination + '）').join('\n');
                addBotMessage('没有找到匹配的行程，您当前的行程有：\n\n' + list + '\n\n请告诉我具体要删除哪个行程，比如"删除三亚的行程"～');
                return;
            }
            const deletedTitles = [];
            for (const trip of matched) {
                const idx = TRIP_PLANS.findIndex(t => t.id === trip.id);
                if (idx >= 0) { deletedTitles.push(TRIP_PLANS[idx].title); TRIP_PLANS.splice(idx, 1); }
            }
            saveTripsToStorage();
            renderTripPlans();
            showProfileBadge();
            addBotMessage('已为您删除行程「' + deletedTitles.join('、') + '」 ✅\n\n行程已从「我的-我的行程」中移除。');
            setTimeout(() => showToast('已删除行程'), 500);
            return;
        }
        // 本地意图检测：删除提醒
        if (/(删除|删掉|去掉|取消|不要|清除|关闭)(.*?)(提醒|闹钟)|(提醒|闹钟).*(删除|删掉|去掉|取消|不要|关闭)/.test(text)) {
            if (REMINDERS.length === 0) {
                addBotMessage('您目前还没有提醒事项，无需删除。\n\n如果需要添加提醒，可以直接跟我说"提醒我明天8点开会"～');
                return;
            }
            let matched = [];
            if (/(所有|全部|清空)/.test(text)) { matched = [...REMINDERS]; }
            if (matched.length === 0 && /(上班|打卡上班|早起|起床)/.test(text)) { matched = REMINDERS.filter(r => r.type === 'work'); }
            else if (matched.length === 0 && /(下班|打卡下班)/.test(text)) { matched = REMINDERS.filter(r => r.type === 'offwork'); }
            else if (matched.length === 0 && /(生日|寿星|庆生)/.test(text)) { matched = REMINDERS.filter(r => r.type === 'birthday'); }
            else if (matched.length === 0 && /(会议|开会|例会|周会)/.test(text)) { matched = REMINDERS.filter(r => r.type === 'meeting'); }
            else if (matched.length === 0 && /(出差)/.test(text)) { matched = REMINDERS.filter(r => r.type === 'business_trip'); }
            else if (matched.length === 0 && /(还钱|还款|还贷|还花呗|信用卡|欠款)/.test(text)) { matched = REMINDERS.filter(r => r.type === 'repayment'); }
            else if (matched.length === 0 && /(出行|出发|赶飞机|赶火车|登机|航班|高铁|动车)/.test(text)) { matched = REMINDERS.filter(r => r.type === 'travel'); }
            if (matched.length === 0) {
                const kw = text.replace(/删除|删掉|去掉|取消|不要|清除|关闭|的|提醒|闹钟|帮我|请|把|那|个|条|所有|全部|上班|下班|出行|出差|生日|会议|还钱/g, '').trim();
                if (kw) matched = REMINDERS.filter(r => r.title.includes(kw) || r.desc.includes(kw));
            }
            if (matched.length === 0) {
                const list = REMINDERS.map((r, i) => (i + 1) + '. ' + r.title + '（' + r.time + '，' + r.repeat + '）').join('\n');
                addBotMessage('没有找到匹配的提醒，您当前的提醒有：\n\n' + list + '\n\n请告诉我具体要删除哪个提醒，比如"删除上班提醒"～');
                return;
            }
            const deletedTitles = [];
            for (const rem of matched) {
                const idx = REMINDERS.findIndex(r => r.id === rem.id);
                if (idx >= 0) { deletedTitles.push(REMINDERS[idx].title); REMINDERS.splice(idx, 1); }
            }
            saveRemindersToStorage();
            renderReminders();
            showProfileBadge();
            addBotMessage('已为您删除提醒「' + deletedTitles.join('、') + '」 ✅\n\n提醒已从「我的-我的提醒」中移除。');
            setTimeout(() => showToast('已删除提醒'), 500);
            return;
        }
        // 本地意图检测：规划行程
        if (/(规划行程|旅游攻略|行程安排|旅游计划|出去玩|周末去哪|旅行计划|安排一下|帮我规划|规划.*游|安排.*行程|去.*旅游|去.*玩|到.*旅游)/.test(text)) {
            const cities = ['三亚', '成都', '北京', '上海', '广州', '深圳', '杭州', '西安', '重庆', '昆明', '厦门', '丽江', '桂林', '南京', '苏州', '青岛', '大连', '长沙', '武汉', '香港', '澳门'];
            let dest = '北京';
            for (const c of cities) { if (text.includes(c)) { dest = c; break; } }
            const daysMatch = text.match(/(\d+)\s*(日游|天游|天|日)/);
            const days = daysMatch ? parseInt(daysMatch[1]) : 1;
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + days - 1);
            const endStr = endDate.toISOString().split('T')[0];
            const schedule = [];
            for (let i = 1; i <= days; i++) {
                schedule.push({ day: i, plan: '第' + i + '天行程待规划', icon: i === 1 || i === days ? 'plane' : 'pin' });
            }
            const newTrip = {
                id: Date.now(),
                title: dest + days + '日游',
                status: 'upcoming',
                startDate: startDate,
                endDate: endStr,
                days: days,
                destination: dest,
                budget: days * 1000,
                spent: 0,
                coverImg: picG('trip' + Date.now(), 400, 200, '#FF6B35', '#FF9A56'),
                progress: 0,
                schedule: schedule,
            };
            TRIP_PLANS.unshift(newTrip);
            saveTripsToStorage();
            renderTripPlans();
            showProfileBadge();
            addBotMessage('好的！帮您规划' + dest + days + '日游行程 🗺️\n\n已为您创建行程「' + newTrip.title + '」，可在「我的-我的行程」中查看！');
            setTimeout(() => showToast('已自动添加行程到我的行程'), 500);
            return;
        }
        // 本地意图检测：添加提醒（提醒关键词优先，覆盖 7 类提醒）
        if (/(提醒我|提醒一下|设个提醒|设置提醒|帮我提醒|加个提醒|上班提醒|下班提醒|出行提醒|出差提醒|生日提醒|会议提醒|还钱提醒|记得.*提醒|别忘了|设个闹钟|定个闹钟)/.test(text)) {
            let rType = 'custom', rTitle = '自定义提醒', rIcon = 'bell';
            if (/(生日|寿星|庆生|诞辰)/.test(text)) { rType = 'birthday'; rTitle = '生日提醒'; rIcon = 'gift'; }
            else if (/(会议|开会|例会|周会|评审)/.test(text)) { rType = 'meeting'; rTitle = '会议提醒'; rIcon = 'calendar'; }
            else if (/(出差)/.test(text)) { rType = 'business_trip'; rTitle = '出差提醒'; rIcon = 'briefcase'; }
            else if (/(还钱|还款|还贷|还花呗|还信用卡|欠款|债务)/.test(text)) { rType = 'repayment'; rTitle = '还钱提醒'; rIcon = 'money'; }
            else if (/(上班|打卡上班|早起|起床)/.test(text)) { rType = 'work'; rTitle = '上班提醒'; rIcon = 'clock'; }
            else if (/(下班|打卡下班)/.test(text)) { rType = 'offwork'; rTitle = '下班提醒'; rIcon = 'clock'; }
            else if (/(出行|出发|赶飞机|赶火车|登机|航班|高铁|动车)/.test(text)) { rType = 'travel'; rTitle = '出行提醒'; rIcon = 'plane'; }
            else {
                rTitle = text.replace(/提醒我|提醒一下|设个提醒|设置提醒|帮我提醒|加个提醒|记得提醒|别忘了|设个闹钟|定个闹钟|用?(闹钟|短信|微信)(提醒|通知)?|明天|今天|后天|早上|上午|下午|晚上|\d+[:：点]\d*|点/g, '').trim().substring(0, 20) || '自定义提醒';
            }
            // 提醒方式：短信 / 微信 / 闹钟
            let rMethod = 'alarm';
            if (/(短信|发短信|用短信|短信提醒)/.test(text)) rMethod = 'sms';
            else if (/(微信|用微信|发微信|微信提醒)/.test(text)) rMethod = 'wechat';
            let rTime = '';
            const tMatch = text.match(/(\d{1,2})[:：点](\d{0,2})/);
            if (tMatch) {
                let h = parseInt(tMatch[1]);
                const m = tMatch[2] ? parseInt(tMatch[2]) : 0;
                if (/(下午|傍晚|晚上)/.test(text)) { h += 12; if (h > 23) h -= 24; }
                if (h >= 0 && h <= 23 && m <= 59) rTime = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
            }
            let rRepeat = '仅一次';
            if (/(每天|每日|天天)/.test(text)) rRepeat = '每天';
            else if (/(工作日|周一到周五)/.test(text)) rRepeat = '工作日重复';
            else if (/(每周)/.test(text)) rRepeat = '每周';
            // 缺时间：引导用户补全（时间 + 方式）
            if (!rTime) {
                addBotMessage('好的！已记下「' + rTitle + '」，请问你想什么时间提醒呢？提醒方式也可以选（闹钟/短信/微信）👇');
                renderReminderDraft({
                    type: rType,
                    title: rTitle,
                    desc: text,
                    repeat: rRepeat,
                    method: rMethod,
                    time: '08:00',
                    tip: '还差一点～请设置提醒时间，并选择提醒方式（' + methodBadgeText(rMethod) + ' 已默认）：'
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
                bg: reminderBg(rType),
            };
            REMINDERS.push(newReminder);
            saveRemindersToStorage();
            renderReminders();
            showProfileBadge();
            addBotMessage('好的！已为您创建' + rTitle + ' ✅\n\n⏰ 时间：' + rTime + '\n🔄 重复：' + rRepeat + '\n' + methodBadgeText(rMethod) + '\n\n已自动添加到「我的-我的提醒」中！');
            setTimeout(() => showToast('已自动添加提醒到我的提醒'), 500);
            return;
        }
        // 普通本地回复
        const r = getReply(text);
        addBotMessage(r.text, r.card);
    }, 800);
}

// ===== 提醒方式配置 =====
const METHOD_CONFIG = {
    alarm:  { label: '闹钟', icon: '🔔', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)' },
    sms:    { label: '短信', icon: '💬', bg: 'linear-gradient(135deg,#34C759,#30D158)' },
    wechat: { label: '微信', icon: '💚', bg: 'linear-gradient(135deg,#07C160,#09BB07)' },
};
function methodBadge(method) {
    const m = METHOD_CONFIG[method] || METHOD_CONFIG.alarm;
    return `<span class="reminder-method" style="background:${m.bg};">${m.icon} ${m.label}</span>`;
}
function methodBadgeText(method) {
    const m = METHOD_CONFIG[method] || METHOD_CONFIG.alarm;
    return m.icon + ' 提醒方式：' + m.label;
}
// 生成提醒类型下拉选项（来自 data.js 的 REMINDER_TYPES 集中配置）
function reminderTypeOptions(selected) {
    return Object.keys(REMINDER_TYPES).map(k => {
        const t = REMINDER_TYPES[k];
        return `<option value="${k}" ${selected === k ? 'selected' : ''}>${t.label}</option>`;
    }).join('');
}

// ===== 提醒下次触发时间计算（与 Android 原生一致，用于浏览器兜底 & 文案） =====
function computeReminderNextMillis(r) {
    const now = Date.now();
    const parts = (r.time || '08:00').split(':');
    let h = parseInt(parts[0], 10) || 8;
    let m = parseInt(parts[1], 10) || 0;
    if (isNaN(h)) h = 8; if (isNaN(m)) m = 0;
    h = Math.max(0, Math.min(23, h)); m = Math.max(0, Math.min(59, m));
    const cal = new Date();
    if (r.date) {
        const d = r.date.split('-');
        if (d.length === 3) {
            cal.setFullYear(+d[0], +d[1] - 1, +d[2]);
            cal.setHours(h, m, 0, 0);
            return cal.getTime() > now ? cal.getTime() : -1;
        }
    }
    const repeat = r.repeat || '仅一次';
    cal.setHours(h, m, 0, 0);
    const isOneShot = !/每天|工作日|每周|每月|每年/.test(repeat);
    if (cal.getTime() <= now || !isOneShot) {
        if (repeat.includes('每天')) cal.setDate(cal.getDate() + 1);
        else if (repeat.includes('工作日')) { do { cal.setDate(cal.getDate() + 1); } while (cal.getDay() === 0 || cal.getDay() === 6); }
        else if (repeat.includes('每周')) cal.setDate(cal.getDate() + 7);
        else if (repeat.includes('每月')) cal.setMonth(cal.getMonth() + 1);
        else if (repeat.includes('每年')) cal.setFullYear(cal.getFullYear() + 1);
        else cal.setDate(cal.getDate() + 1); // 仅一次
    }
    return cal.getTime();
}

function friendlyReminderTime(r) {
    const t = computeReminderNextMillis(r);
    if (t <= 0) return '时间已过';
    const d = new Date(t);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const that = new Date(t); that.setHours(0, 0, 0, 0);
    const diff = Math.round((that - today) / 86400000);
    const day = diff === 0 ? '今天' : diff === 1 ? '明天' : diff === 2 ? '后天' :
        (d.getMonth() + 1) + '月' + d.getDate() + '日';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return day + ' ' + hh + ':' + mm;
}

// 提醒增删改后统一处理：请求权限 + 确认文案 + 浏览器兜底
let _reminderPermWarned = false;
function afterReminderChanged(r) {
    const isNative = !!(window.AndroidBridge && window.AndroidBridge.syncReminders);
    if (isNative) {
        // 申请通知/短信权限
        if (window.AndroidBridge.requestReminderPermissions) {
            try { window.AndroidBridge.requestReminderPermissions(); } catch (e) {}
        }
        // 短信提醒：检查手机号是否配置
        if (r && r.method === 'sms') {
            const s = loadReminderSettings() || {};
            if (!s.smsPhone) {
                showToast('短信提醒已保存，请在「提醒设置」填写接收手机号才能收到短信');
            }
        }
        // 权限状态引导
        if (window.AndroidBridge.getPermissionStatus) {
            try {
                const ps = JSON.parse(window.AndroidBridge.getPermissionStatus());
                if (r && r.method !== 'alarm' && !ps.notification && !_reminderPermWarned) {
                    _reminderPermWarned = true;
                    showToast('请允许「通知」权限，否则' + (r.method === 'sms' ? '短信/微信' : '微信') + '提醒不会弹出');
                }
                if (r && r.method === 'sms' && !ps.sms && !_reminderPermWarned) {
                    _reminderPermWarned = true;
                    showToast('请允许「短信」权限，否则无法发送短信提醒');
                }
            } catch (e) {}
        }
    }
    // 确认文案（让用户明确知道已设置）
    if (r) {
        showToast('已设置：' + friendlyReminderTime(r) + ' · ' + methodBadgeText(r.method));
    }
    // 无原生桥接（如手机浏览器打开公网H5）时，用页面内兜底提醒
    ensureInPageReminders();
}

// ===== 浏览器兜底提醒（无 AndroidBridge 时，页面打开期间用 setTimeout + 系统通知 + 响铃） =====
let _inPageReminderTimers = [];
let _inPageNotifAsked = false;
function ensureInPageReminders() {
    if (window.AndroidBridge && window.AndroidBridge.syncReminders) return; // 交给原生
    _inPageReminderTimers.forEach(id => clearTimeout(id));
    _inPageReminderTimers = [];
    if (typeof Notification !== 'undefined' && Notification.permission === 'default' && !_inPageNotifAsked) {
        _inPageNotifAsked = true;
        Notification.requestPermission().catch(() => {});
    }
    REMINDERS.forEach(r => {
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
        showModal(`
            <div style="padding:24px;text-align:center;">
                <div style="font-size:40px;margin-bottom:8px;">${METHOD_CONFIG[r.method] ? METHOD_CONFIG[r.method].icon : '🔔'}</div>
                <div style="font-size:18px;font-weight:700;margin-bottom:6px;">${r.title}</div>
                <div style="font-size:14px;color:var(--text-2);margin-bottom:16px;">${r.desc || ''}</div>
                <button class="form-submit-btn" onclick="closeModal()">知道了</button>
            </div>
        `);
    } catch (e) {}
    try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('生活小秘提醒 · ' + (METHOD_CONFIG[r.method] ? METHOD_CONFIG[r.method].label : '闹钟'),
                { body: r.title + '\n' + (r.desc || '') });
        }
    } catch (e) {}
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) {
            const ac = new Ctx();
            const o = ac.createOscillator(); const g = ac.createGain();
            o.connect(g); g.connect(ac.destination);
            o.type = 'sine'; o.frequency.value = 880;
            g.gain.setValueAtTime(0.001, ac.currentTime);
            g.gain.exponentialRampToValueAtTime(0.3, ac.currentTime + 0.05);
            g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2);
            o.start(); o.stop(ac.currentTime + 1.25);
        }
    } catch (e) {}
    if (!/每天|工作日|每周|每月|每年/.test(r.repeat || '仅一次')) {
        const idx = REMINDERS.findIndex(x => x.id === r.id);
        if (idx >= 0) { REMINDERS.splice(idx, 1); saveRemindersToStorage(); renderReminders(); }
    }
    ensureInPageReminders();
}

// ===== 语音输入 =====
let _recognition = null;
function startVoiceInput() {
    const input = document.getElementById('chatInput');
    // 在 APP 内优先使用原生语音（Android WebView 的 Web Speech API 不稳定/常被禁）
    if (window.__NATIVE_INFO__ && window.__NATIVE_INFO__.isApp &&
        window.AndroidBridge && window.AndroidBridge.startVoiceRecognition) {
        window.AndroidBridge.startVoiceRecognition();
        return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
        if (_recognition && _recognition._listening) { try { _recognition.stop(); } catch (e) {} return; }
        try {
            _recognition = new SR();
            _recognition.lang = 'zh-CN';
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
                // 浏览器不可用则回退到 APP 原生语音
                if (window.AndroidBridge && window.AndroidBridge.startVoiceRecognition) {
                    window.AndroidBridge.startVoiceRecognition();
                } else {
                    showToast('语音识别不可用，请手动输入');
                }
            };
            _recognition.onend = () => { _recognition._listening = false; setVoiceBtnActive(false); };
            _recognition.start();
        } catch (err) {
            setVoiceBtnActive(false);
            if (window.AndroidBridge && window.AndroidBridge.startVoiceRecognition) window.AndroidBridge.startVoiceRecognition();
            else showToast('语音识别不可用，请手动输入');
        }
        return;
    }
    // APP 内：调用 Android 原生语音识别
    if (window.AndroidBridge && window.AndroidBridge.startVoiceRecognition) {
        window.AndroidBridge.startVoiceRecognition();
    } else {
        showToast('当前环境不支持语音输入，请手动输入');
    }
}
function setVoiceBtnActive(active) {
    const b = document.getElementById('voiceBtn');
    if (b) b.classList.toggle('recording', !!active);
}
// 由 Android 原生语音识别回调（MainActivity 注入）
function onVoiceResult(text) {
    const input = document.getElementById('chatInput');
    if (input) input.value = text || '';
    if (text && text.trim()) sendMessage();
}

// ===== 提醒草稿补全（缺时间时引导用户补全） =====
function renderReminderDraft(draft) {
    if (!window.__draftReminders) window.__draftReminders = {};
    const id = 'd' + Date.now();
    window.__draftReminders[id] = draft;
    const ca = document.getElementById('chatArea');
    if (!ca) return;
    const m = document.createElement('div');
    m.className = 'chat-msg bot';
    m.id = 'draftCard_' + id;
    const methodOpts = ['alarm', 'sms', 'wechat'].map(k =>
        `<option value="${k}">${METHOD_CONFIG[k].icon} ${METHOD_CONFIG[k].label}</option>`).join('');
    m.innerHTML = `
        <div class="chat-avatar" style="background:linear-gradient(135deg,#FF6B35,#FFB627);">${BOT_AVATAR}</div>
        <div class="chat-content-wrap">
            <div class="chat-bubble">${draft.tip || '还差一点信息～请设置提醒时间，并选择提醒方式：'}</div>
            <div class="reminder-draft-card">
                <div class="rd-row">
                    <label>提醒标题</label>
                    <input type="text" id="draftTitle_${id}" value="${draft.title || ''}" placeholder="如：开会提醒" />
                </div>
                <div class="rd-row">
                    <label>提醒时间</label>
                    <input type="time" id="draftTime_${id}" value="${draft.time || '08:00'}" />
                </div>
                <div class="rd-row">
                    <label>提醒方式</label>
                    <select id="draftMethod_${id}">${methodOpts}</select>
                </div>
                <button class="form-submit-btn" onclick="confirmDraftReminder('${id}')">确认创建提醒</button>
            </div>
        </div>
    `;
    ca.appendChild(m);
    scrollChatToBottom();
}

function confirmDraftReminder(draftId) {
    const titleEl = document.getElementById('draftTitle_' + draftId);
    const timeEl = document.getElementById('draftTime_' + draftId);
    const methodEl = document.getElementById('draftMethod_' + draftId);
    const title = (titleEl && titleEl.value.trim()) || '自定义提醒';
    const time = (timeEl && timeEl.value) || '08:00';
    const method = (methodEl && methodEl.value) || 'alarm';
    const draft = window.__draftReminders ? window.__draftReminders[draftId] : null;
    if (!draft) { showToast('草稿已失效，请重新添加'); return; }
    const newReminder = {
        id: Date.now(),
        type: draft.type || 'custom',
        title: title,
        desc: draft.desc || title,
        time: time,
        repeat: draft.repeat || '仅一次',
        enabled: true,
        method: method,
        icon: reminderIcon(draft.type),
        bg: reminderBg(draft.type),
    };
    REMINDERS.push(newReminder);
    saveRemindersToStorage();
    renderReminders();
    showProfileBadge();
    if (window.__draftReminders) delete window.__draftReminders[draftId];
    const card = document.getElementById('draftCard_' + draftId);
    if (card) card.remove();
    addBotMessage('已为你创建提醒「' + title + '」 ✅\n\n⏰ 时间：' + time + '\n' + methodBadgeText(method) + '\n\n已自动添加到「我的-我的提醒」中！');
    afterReminderChanged(newReminder);
}

// ===== 滚动位置上报（供 APP 内下拉刷新判断是否应触发） =====
function isActiveScrollAtTop() {
    const p = document.querySelector('.page.active');
    if (!p) return true;
    const s = p.querySelector('.page-scroll') || p.querySelector('.chat-area');
    if (!s) return true;
    return s.scrollTop <= 0;
}
function reportScrollTop() {
    if (window.AndroidBridge && window.AndroidBridge.updateScrollState) {
        window.AndroidBridge.updateScrollState(isActiveScrollAtTop() ? 'true' : 'false');
    }
}
function bindScrollReport() {
    document.querySelectorAll('.page-scroll, .chat-area').forEach(el => {
        el.addEventListener('scroll', reportScrollTop, { passive: true });
    });
    reportScrollTop();
}

function scrollChatToBottom() {
    const ca = document.getElementById('chatArea');
    if (ca) ca.scrollTop = ca.scrollHeight;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.id === 'chatInput') sendMessage();
    if (e.key === 'Escape') { toggleSearch(false); toggleInterestPanel(false); closeModal(); }
});

// ===== 上新页 =====
function renderNewestFilters() {
    const b = document.getElementById('newestFilterBar');
    b.innerHTML = NEWEST_FILTERS.map((f,i) => `<div class="newest-filter ${i===0?'active':''}" onclick="filterNewest('${f}',this)">${f}</div>`).join('');
}

function filterNewest(filter, el) {
    document.querySelectorAll('.newest-filter').forEach(f => f.classList.remove('active'));
    el.classList.add('active');
    let items = NEWEST_POSTS;
    if (filter !== '全部') {
        items = NEWEST_POSTS.filter(p => p.tags.some(t => t.includes(filter)) || (filter==='美食'&&p.user.includes('川味')) || (filter==='养生'&&p.user.includes('SPA')) || (filter==='健身'&&p.user.includes('健身')) || (filter==='KTV'&&p.user.includes('KTV')) || (filter==='景点'&&p.user.includes('欢乐谷')) || (filter==='海鲜'&&p.user.includes('海世界')));
        if (!items.length) {
            document.getElementById('newestFeed').innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">该分类暂无新品动态</div></div>';
            return;
        }
    }
    renderNewestFeedInternal(items);
}

function renderNewestFeed() {
    renderNewestFeedInternal(NEWEST_POSTS);
}

function renderNewestFeedInternal(posts) {
    const f = document.getElementById('newestFeed');
    f.innerHTML = posts.map((p, idx) => {
        const imgClass = p.imgCount;
        return `
        <div class="newest-post" data-index="${idx}">
            <div class="post-header">
                <div class="post-avatar" style="background:${p.userBg};">${wrapSvg(p.userSvg,20)}</div>
                <div class="post-user-info">
                    <div class="post-username">${p.user}</div>
                    <div class="post-time">${p.time}</div>
                </div>
                ${p.isOfficial?'<span class="post-new-tag">官方新品</span>':''}
            </div>
            <div class="post-images ${imgClass}">
                ${p.images.map(img => `<div class="post-img" style="${imgStyle(img)}"></div>`).join('')}
            </div>
            <div class="post-content">
                <div class="post-title">${p.title}</div>
                <div class="post-desc">${p.desc}</div>
                <div class="post-tags">${p.tags.map(t=>`<span class="post-tag">${t}</span>`).join('')}</div>
                <div class="post-deal">
                    <div class="post-deal-price">
                        <span class="now">${p.price===0?'免费体验':'¥'+p.price}</span>
                        ${p.oldPrice?`<span class="old">¥${p.oldPrice}</span>`:''}
                    </div>
                    <button class="post-deal-btn" onclick="event.stopPropagation();showToast('${p.price===0?'免费体验报名成功':'抢购成功'}')">${p.price===0?'免费体验':'立即抢购'}</button>
                </div>
            </div>
            <div class="post-actions">
                <div class="post-action ${p.liked?'liked':''}" onclick="toggleLike(${idx},this)">
                    ${p.liked?SVG.heartFill:SVG.heart}
                    <span class="like-count">${p.likes}</span>
                </div>
                <div class="post-action" onclick="toggleComment(${idx})">
                    ${SVG.comment}
                    <span>${p.commentCount}</span>
                </div>
                <div class="post-action" onclick="showToast('已分享到朋友圈')">
                    ${SVG.share}
                    <span>分享</span>
                </div>
            </div>
            <div class="post-comments" style="display:${p.showComments?'block':'none'};" id="comments-${idx}">
                ${p.comments.map(c=>`<div class="post-comment"><span class="comment-user">${c.user}：</span><span class="comment-text">${c.text}</span></div>`).join('')}
            </div>
        </div>`;
    }).join('');
}

function toggleLike(idx, el) {
    const p = NEWEST_POSTS[idx];
    p.liked = !p.liked;
    p.likes += p.liked ? 1 : -1;
    el.classList.toggle('liked', p.liked);
    el.querySelector('svg').outerHTML = p.liked ? SVG.heartFill : SVG.heart;
    el.querySelector('.like-count').textContent = p.likes;
}

function toggleComment(idx) {
    const p = NEWEST_POSTS[idx];
    p.showComments = !p.showComments;
    document.getElementById('comments-'+idx).style.display = p.showComments ? 'block' : 'none';
}

// ===== 个人中心 =====
function renderOrderGrid() {
    const g = document.getElementById('orderGrid');
    const statusMap = { '待付款': 'pending', '待使用': 'pending_use', '待评价': 'pending_review', '退款/售后': 'refund' };
    g.innerHTML = ORDER_STATUSES.map(o => `
        <div class="order-item ${o.badge?'order-badge':''}" ${o.badge?`data-badge="${o.badge}"`:''} onclick="showOrderList('${statusMap[o.name] || 'all'}')">
            <div class="order-icon" style="background:${o.bg};">${wrapSvg(o.svg,20)}</div>
            <div class="order-label">${o.name}</div>
        </div>
    `).join('');
}

function renderFuncGrid() {
    const g = document.getElementById('funcGrid');
    g.innerHTML = FUNC_ITEMS.map(f => `
        <div class="func-item" onclick="showToast('打开「${f.name}」')">
            <div class="func-icon" style="background:${f.bg};">${wrapSvg(f.svg,18)}</div>
            <div class="func-label">${f.name}</div>
        </div>
    `).join('');
}

function renderSettingsList() {
    const l = document.getElementById('settingsList');
    l.innerHTML = SETTINGS.map(s => `
        <div class="setting-item" onclick="showToast('打开「${s.label}」')">
            <div class="setting-icon" style="background:${s.bg};">${wrapSvg(s.svg,16)}</div>
            <div class="setting-label">${s.label}</div>
            ${s.value?`<div class="setting-value">${s.value}</div>`:''}
            <div class="setting-arrow">${SVG.chevronRight}</div>
        </div>
    `).join('');
}

// ===== 用户资料渲染 =====
function renderUserProfile() {
    const u = USER_PROFILE;
    const avatarEl = document.getElementById('profileAvatar');
    if (avatarEl) avatarEl.textContent = u.avatar;
    setText('profileName', u.name);
    setText('profileLevel', u.level);
    setText('profileLevelName', u.levelName);
    setText('statFollowing', u.following);
    setText('statFollowers', u.followers);
    setText('statPosts', u.posts);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ===== 行程规划 =====
function renderTripPlans() {
    const list = document.getElementById('tripList');
    if (!list) return;
    // 只展示前2条（即将出发的）
    const trips = TRIP_PLANS.filter(t => t.status === 'upcoming').slice(0, 2);
    if (trips.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">暂无行程规划，点击右上角添加</div>';
        return;
    }
    list.innerHTML = trips.map(t => `
        <div class="trip-card" onclick="showTripDetail(${t.id})">
            <div class="trip-cover" style="background-image:${t.coverImg};">
                <span class="trip-status-badge trip-status-${t.status}">${t.status === 'upcoming' ? '即将出发' : '已完成'}</span>
            </div>
            <div class="trip-body">
                <div class="trip-title">${t.title}</div>
                <div class="trip-meta">
                    <span class="trip-meta-item">📅 ${t.startDate} ~ ${t.endDate}</span>
                    <span class="trip-meta-item">📍 ${t.destination}</span>
                    <span class="trip-meta-item"> ${t.days}天</span>
                </div>
                <div class="trip-progress">
                    <div class="trip-progress-track">
                        <div class="trip-progress-fill" style="width:${t.progress}%"></div>
                    </div>
                    <span class="trip-progress-text">准备 ${t.progress}%</span>
                </div>
            </div>
        </div>
    `).join('');
}

function showTripDetail(id) {
    const t = TRIP_PLANS.find(t => t.id === id);
    if (!t) return;
    const scheduleHtml = t.schedule.map(s => `
        <div class="trip-day-item">
            <div class="trip-day-num">D${s.day}</div>
            <div class="trip-day-plan">${s.plan}</div>
        </div>
    `).join('');

    showModal(`
        <div class="trip-detail-modal">
            <div class="trip-detail-header">
                <div class="trip-detail-title">${t.title}</div>
                <div class="trip-detail-meta">
                    <span>📅 ${t.startDate} ~ ${t.endDate}</span>
                    <span>📍 ${t.destination}</span>
                </div>
            </div>
            <div class="trip-detail-budget">
                <div class="trip-budget-item">
                    <div class="trip-budget-num">¥${t.budget}</div>
                    <div class="trip-budget-label">总预算</div>
                </div>
                <div class="trip-budget-item">
                    <div class="trip-budget-num">¥${t.spent}</div>
                    <div class="trip-budget-label">已花费</div>
                </div>
                <div class="trip-budget-item">
                    <div class="trip-budget-num">¥${t.budget - t.spent}</div>
                    <div class="trip-budget-label">剩余</div>
                </div>
            </div>
            <div class="trip-schedule">
                <div class="trip-schedule-title">行程安排</div>
                ${scheduleHtml}
            </div>
        </div>
    `);
}

function showAllTrips() {
    const tripsHtml = TRIP_PLANS.map(t => `
        <div class="trip-card" style="margin-bottom:12px;" onclick="closeModal();setTimeout(()=>showTripDetail(${t.id}),300)">
            <div class="trip-cover" style="background-image:${t.coverImg};height:70px;">
                <span class="trip-status-badge trip-status-${t.status}">${t.status === 'upcoming' ? '即将出发' : '已完成'}</span>
            </div>
            <div class="trip-body">
                <div class="trip-title">${t.title}</div>
                <div class="trip-meta">
                    <span class="trip-meta-item">📅 ${t.startDate}</span>
                    <span class="trip-meta-item">📍 ${t.destination}</span>
                </div>
            </div>
        </div>
    `).join('');
    showModal(`
        <div style="padding:20px;max-height:70vh;overflow-y:auto;">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">全部行程</div>
            ${tripsHtml}
            <button class="form-submit-btn" onclick="closeModal();setTimeout(addTrip,300)">+ 规划新行程</button>
        </div>
    `);
}

function addTrip() {
    showModal(`
        <div class="add-trip-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">规划新行程</div>
            <div class="form-group">
                <label>行程名称</label>
                <input type="text" id="tripTitle" placeholder="如：成都3日美食之旅" />
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>目的地</label>
                    <input type="text" id="tripDest" placeholder="如：成都" />
                </div>
                <div class="form-group">
                    <label>天数</label>
                    <input type="number" id="tripDays" placeholder="3" min="1" />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>出发日期</label>
                    <input type="date" id="tripStart" />
                </div>
                <div class="form-group">
                    <label>预算(¥)</label>
                    <input type="number" id="tripBudget" placeholder="3000" />
                </div>
            </div>
            <button class="form-submit-btn" onclick="submitTrip()">创建行程</button>
        </div>
    `);
}

function submitTrip() {
    const title = document.getElementById('tripTitle').value.trim();
    const dest = document.getElementById('tripDest').value.trim();
    const days = parseInt(document.getElementById('tripDays').value) || 1;
    const start = document.getElementById('tripStart').value || '2026-09-01';
    const budget = parseInt(document.getElementById('tripBudget').value) || 2000;

    if (!title || !dest) {
        showToast('请填写行程名称和目的地');
        return;
    }

    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + days - 1);
    const endStr = endDate.toISOString().split('T')[0];

    const schedule = [];
    for (let i = 1; i <= days; i++) {
        schedule.push({ day: i, plan: '第' + i + '天行程待规划', icon: 'pin' });
    }

    const newTrip = {
        id: Date.now(),
        title: title,
        status: 'upcoming',
        startDate: start,
        endDate: endStr,
        days: days,
        destination: dest,
        budget: budget,
        spent: 0,
        coverImg: picG('trip' + Date.now(), 400, 200, '#FF6B35', '#FF9A56'),
        progress: 0,
        schedule: schedule,
    };
    TRIP_PLANS.unshift(newTrip);
    closeModal();
    saveTripsToStorage();
    renderTripPlans();
    showToast('行程创建成功！');
}

// ===== 提醒事项 =====
function renderReminders() {
    const list = document.getElementById('reminderList');
    if (!list) return;
    if (REMINDERS.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">暂无提醒，点击右上角添加</div>';
        return;
    }
    list.innerHTML = REMINDERS.map(r => `
        <div class="reminder-card ${r.enabled ? '' : 'disabled'}" onclick="showReminderDetail(${r.id})">
            <div class="reminder-icon-box" style="background:${r.bg};">
                ${wrapSvg(SVG[r.icon] || SVG.bell, 20)}
            </div>
            <div class="reminder-content">
                <div class="reminder-title-row">
                    <span class="reminder-title">${r.title}</span>
                    <span class="reminder-time">${r.time}</span>
                </div>
                <div class="reminder-desc">${r.desc}</div>
                <div class="reminder-meta-row">
                    <span class="reminder-repeat">${r.repeat}</span>
                    ${methodBadge(r.method)}
                </div>
            </div>
            <div class="reminder-toggle ${r.enabled ? '' : 'off'}" onclick="event.stopPropagation();toggleReminder(${r.id})"></div>
        </div>
    `).join('');
}

function toggleReminder(id) {
    const r = REMINDERS.find(r => r.id === id);
    if (r) {
        r.enabled = !r.enabled;
        saveRemindersToStorage();
        renderReminders();
        afterReminderChanged(r);
    }
}

function showReminderDetail(id) {
    const r = REMINDERS.find(r => r.id === id);
    if (!r) return;
    showModal(`
        <div style="padding:20px;">
            <div style="text-align:center;margin-bottom:16px;">
                <div style="width:56px;height:56px;border-radius:16px;background:${r.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                    ${wrapSvg(SVG[r.icon] || SVG.bell, 28)}
                </div>
                <div style="font-size:18px;font-weight:700;color:var(--text-1);">${r.title}</div>
            </div>
            <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:16px;">
                <div style="font-size:13px;color:var(--text-2);margin-bottom:8px;">${r.desc}</div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3);">
                    <span>时间：${r.time}</span>
                    <span>${r.repeat}</span>
                </div>
                <div style="margin-top:10px;">${methodBadge(r.method)}</div>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="deleteReminder(${r.id})">删除提醒</button>
                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="editReminder(${r.id})">编辑</button>
                <button class="form-submit-btn" onclick="closeModal()">关闭</button>
            </div>
        </div>
    `);
}

// 编辑提醒：可修改标题/内容/时间/重复/类型/提醒方式/开关
function editReminder(id) {
    const r = REMINDERS.find(r => r.id === id);
    if (!r) return;
    const repeatOpts = ['仅一次','每天','工作日重复','每周','每月','每年'].map(v =>
        `<option value="${v}" ${r.repeat === v ? 'selected' : ''}>${v}</option>`).join('');
    const typeOpts = reminderTypeOptions(r.type);
    const methodOpts = ['alarm','sms','wechat'].map(k =>
        `<option value="${k}" ${r.method === k ? 'selected' : ''}>${METHOD_CONFIG[k].icon} ${METHOD_CONFIG[k].label}</option>`).join('');
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">编辑提醒</div>
            <div class="form-group">
                <label>提醒标题</label>
                <input type="text" id="editTitle" value="${r.title || ''}" placeholder="如：开会提醒" />
            </div>
            <div class="form-group">
                <label>提醒内容</label>
                <textarea id="editDesc" placeholder="详细描述...">${r.desc || ''}</textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>时间</label>
                    <input type="time" id="editTime" value="${r.time || '08:00'}" />
                </div>
                <div class="form-group">
                    <label>重复</label>
                    <select id="editRepeat">${repeatOpts}</select>
                </div>
            </div>
            <div class="form-group">
                <label>类型</label>
                <select id="editType">${typeOpts}</select>
            </div>
            <div class="form-group">
                <label>提醒方式</label>
                <select id="editMethod">${methodOpts}</select>
            </div>
            <div class="form-group">
                <label>状态</label>
                <select id="editEnabled">
                    <option value="1" ${r.enabled !== false ? 'selected' : ''}>开启</option>
                    <option value="0" ${r.enabled === false ? 'selected' : ''}>关闭</option>
                </select>
            </div>
            <button class="form-submit-btn" onclick="updateReminder(${r.id})">保存修改</button>
        </div>
    `);
}

function updateReminder(id) {
    const r = REMINDERS.find(r => r.id === id);
    if (!r) return;
    const title = document.getElementById('editTitle').value.trim();
    const desc = document.getElementById('editDesc').value.trim();
    const time = document.getElementById('editTime').value;
    const repeat = document.getElementById('editRepeat').value;
    const type = document.getElementById('editType').value;
    const method = document.getElementById('editMethod').value;
    const enabled = document.getElementById('editEnabled').value === '1';
    if (!title) { showToast('请填写提醒标题'); return; }
    if (!time) { showToast('请选择提醒时间'); return; }
    r.title = title;
    r.desc = desc || '点击查看详情';
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

// 提醒设置：短信接收手机号 / 默认提醒方式
function openReminderSettings() {
    const s = loadReminderSettings() || {};
    const methodOpts = ['alarm','sms','wechat'].map(k =>
        `<option value="${k}" ${s.defaultMethod === k ? 'selected' : ''}>${METHOD_CONFIG[k].icon} ${METHOD_CONFIG[k].label}</option>`).join('');
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:8px;">提醒设置</div>
            <div style="font-size:12px;color:var(--text-3);text-align:center;margin-bottom:14px;line-height:1.6;">
                闹钟提醒会全屏响铃+震动；短信提醒将发送到下方手机号；<br/>微信无开放接口，微信提醒以高优先通知+一键打开微信呈现。
            </div>
            <div class="form-group">
                <label>短信接收手机号</label>
                <input type="tel" id="setSmsPhone" value="${s.smsPhone || ''}" placeholder="用于接收短信提醒，如 13800001111" />
            </div>
            <div class="form-group">
                <label>默认提醒方式</label>
                <select id="setDefaultMethod">${methodOpts}</select>
            </div>
            <button class="form-submit-btn" onclick="saveReminderSettings()">保存设置</button>
        </div>
    `);
}

function saveReminderSettings() {
    const phone = (document.getElementById('setSmsPhone').value || '').trim();
    const defaultMethod = document.getElementById('setDefaultMethod').value;
    const s = loadReminderSettings() || {};
    s.smsPhone = phone;
    s.defaultMethod = defaultMethod;
    saveReminderSettingsToNative(s);
    if (phone && window.AndroidBridge && window.AndroidBridge.requestReminderPermissions) {
        try { window.AndroidBridge.requestReminderPermissions(); } catch (e) {}
    }
    closeModal();
    showToast('提醒设置已保存');
}

function addReminder() {
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">添加提醒</div>
            <div class="form-group">
                <label>提醒标题</label>
                <input type="text" id="remTitle" placeholder="如：开会提醒" />
            </div>
            <div class="form-group">
                <label>提醒内容</label>
                <textarea id="remDesc" placeholder="详细描述..."></textarea>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>时间</label>
                    <input type="time" id="remTime" value="08:00" />
                </div>
                <div class="form-group">
                    <label>重复</label>
                    <select id="remRepeat">
                        <option value="仅一次">仅一次</option>
                        <option value="每天">每天</option>
                        <option value="工作日重复" selected>工作日</option>
                        <option value="每周">每周</option>
                        <option value="每月">每月</option>
                        <option value="每年">每年</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>类型</label>
                <select id="remType">${reminderTypeOptions('custom')}</select>
            </div>
            <div class="form-group">
                <label>提醒方式</label>
                <select id="remMethod">
                    <option value="alarm">🔔 闹钟提醒</option>
                    <option value="sms">💬 短信提醒</option>
                    <option value="wechat">💚 微信提醒</option>
                </select>
            </div>
            <button class="form-submit-btn" onclick="submitReminder()">创建提醒</button>
        </div>
    `);
}

function submitReminder() {
    const title = document.getElementById('remTitle').value.trim();
    const desc = document.getElementById('remDesc').value.trim();
    const time = document.getElementById('remTime').value;
    const repeat = document.getElementById('remRepeat').value;
    const type = document.getElementById('remType').value;
    const method = document.getElementById('remMethod').value;

    if (!title) {
        showToast('请填写提醒标题');
        return;
    }
    if (!time) {
        showToast('请选择提醒时间');
        return;
    }

    const newReminder = {
        id: Date.now(),
        type: type,
        title: title,
        desc: desc || '点击查看详情',
        time: time,
        repeat: repeat,
        enabled: true,
        method: method,
        icon: reminderIcon(type),
        bg: reminderBg(type),
    };
    REMINDERS.push(newReminder);
    closeModal();
    saveRemindersToStorage();
    renderReminders();
    afterReminderChanged(newReminder);
}

function deleteReminder(id) {
    const idx = REMINDERS.findIndex(r => r.id === id);
    if (idx >= 0) {
        REMINDERS.splice(idx, 1);
        saveRemindersToStorage();
        closeModal();
        renderReminders();
        showToast('提醒已删除');
    }
}

// ===== 我的计划 =====
const PLAN_PALETTE = [
    { icon: 'star', bg: 'linear-gradient(135deg,#FF6B35,#FF9A56)', tagColor: '#FF6B35' },
    { icon: 'plane', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)', tagColor: '#007AFF' },
    { icon: 'store', bg: 'linear-gradient(135deg,#34C759,#30D158)', tagColor: '#34C759' },
    { icon: 'camera', bg: 'linear-gradient(135deg,#AF52DE,#D65BFF)', tagColor: '#AF52DE' },
    { icon: 'dumbbell', bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)', tagColor: '#FF2D55' },
    { icon: 'briefcase', bg: 'linear-gradient(135deg,#FF9500,#FFB800)', tagColor: '#FF9500' },
];
function planPalette(i) { return PLAN_PALETTE[i % PLAN_PALETTE.length]; }

function renderPlans() {
    const list = document.getElementById('planList');
    if (!list) return;
    const plans = PLANS.slice(0, 3);
    if (plans.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">暂无计划，点击右上角新建</div>';
        return;
    }
    list.innerHTML = plans.map(p => {
        const done = p.status === 'done';
        return `
        <div class="plan-card" onclick="showPlanDetail(${p.id})">
            <div class="plan-icon-box" style="background:${p.bg};">${wrapSvg(SVG[p.icon] || SVG.star, 20)}</div>
            <div class="plan-content">
                <div class="plan-title-row">
                    <span class="plan-title ${done ? 'done' : ''}">${p.title}</span>
                    <span class="plan-tag" style="color:${p.tagColor};background:${p.tagColor}1a;">${p.tag || '计划'}</span>
                </div>
                <div class="plan-desc">${p.desc || ''}</div>
                <div class="plan-footer">
                    <div class="plan-progress">
                        <div class="plan-progress-track"><div class="plan-progress-fill" style="width:${p.progress}%;"></div></div>
                        <span class="plan-progress-text">${done ? '已完成' : p.progress + '%'}</span>
                    </div>
                    <span class="plan-deadline">${done ? '✅ 已达成' : '截止 ' + (p.deadline || '未设置')}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

function showPlanDetail(id) {
    const p = PLANS.find(x => x.id === id);
    if (!p) return;
    const done = p.status === 'done';
    showModal(`
        <div style="padding:20px;">
            <div style="text-align:center;margin-bottom:14px;">
                <div style="width:56px;height:56px;border-radius:16px;background:${p.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">${wrapSvg(SVG[p.icon] || SVG.star, 28)}</div>
                <div style="font-size:18px;font-weight:700;">${p.title}</div>
                <div style="font-size:12px;color:var(--text-3);margin-top:4px;">${p.tag || ''} · 截止 ${p.deadline || '未设置'}</div>
            </div>
            <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:14px;font-size:14px;color:var(--text-2);">${p.desc || '暂无描述'}</div>
            <div style="margin-bottom:16px;">
                <div style="font-size:12px;color:var(--text-3);margin-bottom:6px;">完成进度 ${p.progress}%</div>
                <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${p.progress}%;background:linear-gradient(90deg,#FF6B35,#FFB627);"></div></div>
            </div>
            <div style="display:flex;gap:10px;">
                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="deletePlan(${p.id})">删除</button>
                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="editPlan(${p.id})">编辑</button>
                <button class="form-submit-btn" onclick="togglePlanDone(${p.id})">${done ? '标记进行中' : '标记完成'}</button>
            </div>
        </div>
    `);
}

function addPlan() {
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">新建计划</div>
            <div class="form-group"><label>计划名称</label><input type="text" id="planTitle" placeholder="如：国庆云南深度游" /></div>
            <div class="form-group"><label>计划描述</label><textarea id="planDesc" placeholder="简单描述计划内容..."></textarea></div>
            <div class="form-row">
                <div class="form-group"><label>分类</label><input type="text" id="planTag" placeholder="如：旅行 / 生活 / 学习" /></div>
                <div class="form-group"><label>截止日期</label><input type="date" id="planDeadline" /></div>
            </div>
            <button class="form-submit-btn" onclick="submitPlan()">创建计划</button>
        </div>
    `);
}

function submitPlan() {
    const title = document.getElementById('planTitle').value.trim();
    if (!title) { showToast('请填写计划名称'); return; }
    const palette = planPalette(PLANS.length);
    const newPlan = {
        id: Date.now(),
        title: title,
        desc: document.getElementById('planDesc').value.trim(),
        tag: document.getElementById('planTag').value.trim() || '计划',
        tagColor: palette.tagColor,
        deadline: document.getElementById('planDeadline').value || '未设置',
        status: 'active',
        progress: 0,
        icon: palette.icon,
        bg: palette.bg,
    };
    PLANS.unshift(newPlan);
    closeModal();
    savePlansToStorage();
    renderPlans();
    showToast('计划创建成功！');
}

function editPlan(id) {
    const p = PLANS.find(x => x.id === id);
    if (!p) return;
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">编辑计划</div>
            <div class="form-group"><label>计划名称</label><input type="text" id="planTitle" value="${p.title}" /></div>
            <div class="form-group"><label>计划描述</label><textarea id="planDesc">${p.desc || ''}</textarea></div>
            <div class="form-row">
                <div class="form-group"><label>分类</label><input type="text" id="planTag" value="${p.tag || ''}" /></div>
                <div class="form-group"><label>截止日期</label><input type="date" id="planDeadline" value="${p.deadline && p.deadline !== '未设置' ? p.deadline : ''}" /></div>
            </div>
            <div class="form-group"><label>完成进度（%）</label><input type="number" id="planProgress" value="${p.progress}" min="0" max="100" /></div>
            <button class="form-submit-btn" onclick="updatePlan(${p.id})">保存修改</button>
        </div>
    `);
}

function updatePlan(id) {
    const p = PLANS.find(x => x.id === id);
    if (!p) return;
    const title = document.getElementById('planTitle').value.trim();
    if (!title) { showToast('请填写计划名称'); return; }
    p.title = title;
    p.desc = document.getElementById('planDesc').value.trim();
    p.tag = document.getElementById('planTag').value.trim() || '计划';
    p.deadline = document.getElementById('planDeadline').value || '未设置';
    const prog = parseInt(document.getElementById('planProgress').value);
    p.progress = isNaN(prog) ? p.progress : Math.max(0, Math.min(100, prog));
    p.status = p.progress >= 100 ? 'done' : 'active';
    closeModal();
    savePlansToStorage();
    renderPlans();
    showToast('计划已更新');
}

function togglePlanDone(id) {
    const p = PLANS.find(x => x.id === id);
    if (!p) return;
    p.status = p.status === 'done' ? 'active' : 'done';
    if (p.status === 'done') p.progress = 100;
    closeModal();
    savePlansToStorage();
    renderPlans();
    showToast(p.status === 'done' ? '太棒了，计划已完成！' : '已标记为进行中');
}

function deletePlan(id) {
    const idx = PLANS.findIndex(x => x.id === id);
    if (idx >= 0) {
        PLANS.splice(idx, 1);
        savePlansToStorage();
        closeModal();
        renderPlans();
        showToast('计划已删除');
    }
}

// ===== 我的小目标 =====
const GOAL_PALETTE = [
    { icon: 'dumbbell', bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)' },
    { icon: 'star', bg: 'linear-gradient(135deg,#5856D6,#7B79F0)' },
    { icon: 'money', bg: 'linear-gradient(135deg,#00C7BE,#30D5C8)' },
    { icon: 'camera', bg: 'linear-gradient(135deg,#FF9500,#FFB800)' },
    { icon: 'plane', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)' },
];
function goalPalette(i) { return GOAL_PALETTE[i % GOAL_PALETTE.length]; }

function renderGoals() {
    const list = document.getElementById('goalList');
    if (!list) return;
    const goals = GOALS.slice(0, 3);
    if (goals.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">暂无目标，点击右上角新建</div>';
        return;
    }
    list.innerHTML = goals.map(g => {
        const pct = g.target > 0 ? Math.min(100, Math.round(g.current / g.target * 100)) : 0;
        const done = pct >= 100;
        return `
        <div class="goal-card" onclick="showGoalDetail(${g.id})">
            <div class="goal-icon-box" style="background:${g.bg};">${wrapSvg(SVG[g.icon] || SVG.star, 20)}</div>
            <div class="goal-content">
                <div class="goal-title-row">
                    <span class="goal-title">${g.title}</span>
                    <span class="goal-value ${done ? 'done' : ''}">${g.current}/${g.target} ${g.unit}</span>
                </div>
                <div class="goal-progress"><div class="goal-progress-fill" style="width:${pct}%;"></div></div>
                <div class="goal-footer">
                    <span class="goal-desc">${g.desc || ''}</span>
                    <span class="goal-deadline">${done ? '✅ 已达成' : '截止 ' + (g.deadline || '未设置')}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

function showGoalDetail(id) {
    const g = GOALS.find(x => x.id === id);
    if (!g) return;
    const pct = g.target > 0 ? Math.min(100, Math.round(g.current / g.target * 100)) : 0;
    showModal(`
        <div style="padding:20px;">
            <div style="text-align:center;margin-bottom:14px;">
                <div style="width:56px;height:56px;border-radius:16px;background:${g.bg};display:flex;align-items:center;justify-content:center;margin:0 auto 10px;">${wrapSvg(SVG[g.icon] || SVG.star, 28)}</div>
                <div style="font-size:18px;font-weight:700;">${g.title}</div>
                <div style="font-size:12px;color:var(--text-3);margin-top:4px;">${g.desc || ''}</div>
            </div>
            <div style="text-align:center;margin-bottom:12px;">
                <span style="font-size:32px;font-weight:800;color:var(--primary);">${g.current}</span>
                <span style="font-size:14px;color:var(--text-3);"> / ${g.target} ${g.unit} · ${pct}%</span>
            </div>
            <div style="height:10px;background:var(--border);border-radius:5px;overflow:hidden;margin-bottom:16px;"><div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#FF6B35,#FFB627);"></div></div>
            <div style="text-align:center;font-size:12px;color:var(--text-3);margin-bottom:16px;">截止 ${g.deadline || '未设置'}</div>
            <div style="display:flex;gap:10px;">
                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="deleteGoal(${g.id})">删除</button>
                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="editGoal(${g.id})">编辑进度</button>
                <button class="form-submit-btn" onclick="closeModal()">关闭</button>
            </div>
        </div>
    `);
}

function addGoal() {
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">新建小目标</div>
            <div class="form-group"><label>目标名称</label><input type="text" id="goalTitle" placeholder="如：减重 10 斤" /></div>
            <div class="form-group"><label>目标描述</label><textarea id="goalDesc" placeholder="简单描述..."></textarea></div>
            <div class="form-row">
                <div class="form-group"><label>目标值</label><input type="number" id="goalTarget" placeholder="10" min="1" /></div>
                <div class="form-group"><label>当前进度</label><input type="number" id="goalCurrent" placeholder="0" min="0" /></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>单位</label><input type="text" id="goalUnit" placeholder="斤 / 本 / 元" /></div>
                <div class="form-group"><label>截止日期</label><input type="date" id="goalDeadline" /></div>
            </div>
            <button class="form-submit-btn" onclick="submitGoal()">创建目标</button>
        </div>
    `);
}

function submitGoal() {
    const title = document.getElementById('goalTitle').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    if (!title) { showToast('请填写目标名称'); return; }
    if (isNaN(target) || target <= 0) { showToast('请填写有效的目标值'); return; }
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const palette = goalPalette(GOALS.length);
    const newGoal = {
        id: Date.now(),
        title: title,
        desc: document.getElementById('goalDesc').value.trim(),
        current: current,
        target: target,
        unit: document.getElementById('goalUnit').value.trim() || '个',
        deadline: document.getElementById('goalDeadline').value || '未设置',
        icon: palette.icon,
        bg: palette.bg,
    };
    GOALS.unshift(newGoal);
    closeModal();
    saveGoalsToStorage();
    renderGoals();
    showToast('目标创建成功！');
}

function editGoal(id) {
    const g = GOALS.find(x => x.id === id);
    if (!g) return;
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">编辑目标</div>
            <div class="form-group"><label>目标名称</label><input type="text" id="goalTitle" value="${g.title}" /></div>
            <div class="form-group"><label>目标描述</label><textarea id="goalDesc">${g.desc || ''}</textarea></div>
            <div class="form-row">
                <div class="form-group"><label>目标值</label><input type="number" id="goalTarget" value="${g.target}" min="1" /></div>
                <div class="form-group"><label>当前进度</label><input type="number" id="goalCurrent" value="${g.current}" min="0" /></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>单位</label><input type="text" id="goalUnit" value="${g.unit}" /></div>
                <div class="form-group"><label>截止日期</label><input type="date" id="goalDeadline" value="${g.deadline && g.deadline !== '未设置' ? g.deadline : ''}" /></div>
            </div>
            <button class="form-submit-btn" onclick="updateGoal(${g.id})">保存修改</button>
        </div>
    `);
}

function updateGoal(id) {
    const g = GOALS.find(x => x.id === id);
    if (!g) return;
    const title = document.getElementById('goalTitle').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    if (!title) { showToast('请填写目标名称'); return; }
    if (isNaN(target) || target <= 0) { showToast('请填写有效的目标值'); return; }
    g.title = title;
    g.desc = document.getElementById('goalDesc').value.trim();
    g.current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    g.target = target;
    g.unit = document.getElementById('goalUnit').value.trim() || '个';
    g.deadline = document.getElementById('goalDeadline').value || '未设置';
    closeModal();
    saveGoalsToStorage();
    renderGoals();
    showToast('目标已更新');
}

function deleteGoal(id) {
    const idx = GOALS.findIndex(x => x.id === id);
    if (idx >= 0) {
        GOALS.splice(idx, 1);
        saveGoalsToStorage();
        closeModal();
        renderGoals();
        showToast('目标已删除');
    }
}

// ===== 我的日记 =====
const MOODS = ['😊', '🥰', '😌', '💪', '😎', '🤔', '😢', '😴', '🤩', '😤'];
const WEATHERS = ['☀️', '🌤️', '☁️', '🌧️', '⛈️', '🌙', '❄️', '🌫️'];

function renderDiary() {
    const list = document.getElementById('diaryList');
    if (!list) return;
    const items = DIARY.slice(0, 3);
    if (items.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">还没有日记，点击右上角写一篇</div>';
        return;
    }
    list.innerHTML = items.map(d => `
        <div class="diary-card" onclick="showDiaryDetail(${d.id})">
            <div class="diary-date-box">
                <div class="diary-day">${(d.date || '').slice(8, 10) || '—'}</div>
                <div class="diary-month">${(d.date || '').slice(5, 7) || ''}月</div>
            </div>
            <div class="diary-content">
                <div class="diary-title-row">
                    <span class="diary-title">${d.title}</span>
                    <span class="diary-mood">${d.mood || ''} ${d.weather || ''}</span>
                </div>
                <div class="diary-preview">${d.content || ''}</div>
                <div class="diary-tags">${(d.tags || []).map(t => `<span class="diary-tag">#${t}</span>`).join('')}</div>
            </div>
        </div>
    `).join('');
}

function showDiaryDetail(id) {
    const d = DIARY.find(x => x.id === id);
    if (!d) return;
    showModal(`
        <div style="padding:20px;max-height:70vh;overflow-y:auto;">
            <div style="text-align:center;margin-bottom:10px;">
                <div style="font-size:32px;">${d.mood || '😊'} ${d.weather || ''}</div>
                <div style="font-size:12px;color:var(--text-3);margin-top:4px;">${d.date || ''}</div>
            </div>
            <div style="font-size:19px;font-weight:700;text-align:center;margin-bottom:12px;">${d.title}</div>
            <div style="background:var(--bg);border-radius:12px;padding:16px;font-size:15px;line-height:1.8;color:var(--text-1);margin-bottom:12px;white-space:pre-wrap;">${d.content || ''}</div>
            <div style="text-align:center;margin-bottom:16px;">${(d.tags || []).map(t => `<span class="diary-tag" style="font-size:12px;">#${t}</span>`).join(' ')}</div>
            <div style="display:flex;gap:10px;">
                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="deleteDiary(${d.id})">删除</button>
                <button class="form-submit-btn" style="background:var(--bg);color:var(--text-1);" onclick="editDiary(${d.id})">编辑</button>
                <button class="form-submit-btn" onclick="closeModal()">关闭</button>
            </div>
        </div>
    `);
}

function moodPicker(selected) {
    return MOODS.map(m => `<span class="mood-option ${m === selected ? 'selected' : ''}" onclick="selectMood(this)">${m}</span>`).join('');
}
function weatherPicker(selected) {
    return WEATHERS.map(w => `<span class="mood-option ${w === selected ? 'selected' : ''}" onclick="selectWeather(this)">${w}</span>`).join('');
}
function selectMood(el) {
    document.querySelectorAll('.mood-picker .mood-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}
function selectWeather(el) {
    document.querySelectorAll('.weather-picker .mood-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

function addDiary() {
    const today = new Date().toISOString().split('T')[0];
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:12px;">写日记</div>
            <div class="form-group"><label>日期</label><input type="date" id="diaryDate" value="${today}" /></div>
            <div class="form-group"><label>标题</label><input type="text" id="diaryTitle" placeholder="给今天起个标题" /></div>
            <div class="form-group">
                <label>心情</label>
                <div class="mood-picker">${moodPicker('😊')}</div>
            </div>
            <div class="form-group">
                <label>天气</label>
                <div class="weather-picker">${weatherPicker('☀️')}</div>
            </div>
            <div class="form-group"><label>正文</label><textarea id="diaryContent" style="height:110px;" placeholder="记录今天的点点滴滴..."></textarea></div>
            <button class="form-submit-btn" onclick="submitDiary()">保存日记</button>
        </div>
    `);
}

function submitDiary() {
    const title = document.getElementById('diaryTitle').value.trim() || '无标题';
    const content = document.getElementById('diaryContent').value.trim();
    if (!content) { showToast('写点内容再保存吧'); return; }
    const moodEl = document.querySelector('.mood-picker .mood-option.selected');
    const weatherEl = document.querySelector('.weather-picker .mood-option.selected');
    const tags = content.match(/#[\u4e00-\u9fa5A-Za-z0-9]+/g) || [];
    const newDiary = {
        id: Date.now(),
        date: document.getElementById('diaryDate').value || new Date().toISOString().split('T')[0],
        title: title,
        content: content,
        mood: moodEl ? moodEl.textContent : '😊',
        weather: weatherEl ? weatherEl.textContent : '☀️',
        tags: tags.length ? tags.map(t => t.slice(1)) : ['日记'],
    };
    DIARY.unshift(newDiary);
    closeModal();
    saveDiaryToStorage();
    renderDiary();
    showToast('日记已保存！');
}

function editDiary(id) {
    const d = DIARY.find(x => x.id === id);
    if (!d) return;
    showModal(`
        <div class="add-reminder-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:12px;">编辑日记</div>
            <div class="form-group"><label>日期</label><input type="date" id="diaryDate" value="${d.date || ''}" /></div>
            <div class="form-group"><label>标题</label><input type="text" id="diaryTitle" value="${d.title}" /></div>
            <div class="form-group"><label>心情</label><div class="mood-picker">${moodPicker(d.mood || '😊')}</div></div>
            <div class="form-group"><label>天气</label><div class="weather-picker">${weatherPicker(d.weather || '☀️')}</div></div>
            <div class="form-group"><label>正文</label><textarea id="diaryContent" style="height:110px;">${d.content || ''}</textarea></div>
            <button class="form-submit-btn" onclick="updateDiary(${d.id})">保存修改</button>
        </div>
    `);
}

function updateDiary(id) {
    const d = DIARY.find(x => x.id === id);
    if (!d) return;
    const content = document.getElementById('diaryContent').value.trim();
    if (!content) { showToast('写点内容再保存吧'); return; }
    const moodEl = document.querySelector('.mood-picker .mood-option.selected');
    const weatherEl = document.querySelector('.weather-picker .mood-option.selected');
    const tags = content.match(/#[\u4e00-\u9fa5A-Za-z0-9]+/g) || d.tags || [];
    d.date = document.getElementById('diaryDate').value || d.date;
    d.title = document.getElementById('diaryTitle').value.trim() || '无标题';
    d.content = content;
    d.mood = moodEl ? moodEl.textContent : d.mood;
    d.weather = weatherEl ? weatherEl.textContent : d.weather;
    d.tags = Array.isArray(tags) && tags.length ? tags.map(t => t[0] === '#' ? t.slice(1) : t) : d.tags;
    closeModal();
    saveDiaryToStorage();
    renderDiary();
    showToast('日记已更新');
}

function deleteDiary(id) {
    const idx = DIARY.findIndex(x => x.id === id);
    if (idx >= 0) {
        DIARY.splice(idx, 1);
        saveDiaryToStorage();
        closeModal();
        renderDiary();
        showToast('日记已删除');
    }
}

// ===== 订单列表 =====
function showOrderList(status) {
    let orders = RECENT_ORDERS;
    let title = '全部订单';
    if (status && status !== 'all') {
        orders = RECENT_ORDERS.filter(o => o.status === status);
        const statusMap = { pending: '待付款', pending_use: '待使用', pending_review: '待评价', completed: '已完成', refund: '退款' };
        title = statusMap[status] || '订单';
    }

    const ordersHtml = orders.length > 0 ? orders.map(o => {
        const statusClass = 'order-status-' + o.status;
        return `
            <div class="order-list-item">
                <div class="order-list-img" style="background-image:${pic(o.seed, 100, 100)};"></div>
                <div class="order-list-info">
                    <div class="order-list-merchant">${o.merchant}</div>
                    <div class="order-list-item-name">${o.item} × ${o.quantity}</div>
                    <div class="order-list-bottom">
                        <span class="order-list-price">¥${o.price}</span>
                        <span class="order-list-status ${statusClass}">${o.statusText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('') : '<div style="text-align:center;padding:30px;color:var(--text-3);font-size:13px;">暂无订单</div>';

    showModal(`
        <div class="order-list-modal">
            <div style="text-align:center;font-size:18px;font-weight:700;padding:16px 20px;border-bottom:1px solid var(--border);">${title}</div>
            <div class="order-filter-tabs">
                <div class="order-filter-tab ${status === 'all' || !status ? 'active' : ''}" onclick="showOrderList('all')">全部</div>
                <div class="order-filter-tab ${status === 'pending' ? 'active' : ''}" onclick="showOrderList('pending')">待付款</div>
                <div class="order-filter-tab ${status === 'pending_use' ? 'active' : ''}" onclick="showOrderList('pending_use')">待使用</div>
                <div class="order-filter-tab ${status === 'pending_review' ? 'active' : ''}" onclick="showOrderList('pending_review')">待评价</div>
                <div class="order-filter-tab ${status === 'completed' ? 'active' : ''}" onclick="showOrderList('completed')">已完成</div>
                <div class="order-filter-tab ${status === 'refund' ? 'active' : ''}" onclick="showOrderList('refund')">退款</div>
            </div>
            <div class="order-list">
                ${ordersHtml}
            </div>
        </div>
    `);
}

// ===== 资料编辑 =====
function showProfileEdit() {
    const u = USER_PROFILE;
    const avatars = ['🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐰', '🐯', '🦄', '🐲'];
    const avatarHtml = avatars.map(a => `
        <div class="avatar-option ${a === u.avatar ? 'selected' : ''}" data-avatar="${a}" onclick="selectAvatar(this)">${a}</div>
    `).join('');

    showModal(`
        <div class="profile-edit-form">
            <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px;">编辑个人资料</div>
            <div style="text-align:center;font-size:13px;color:var(--text-2);margin-bottom:10px;">选择头像</div>
            <div class="profile-avatar-picker" id="avatarPicker">${avatarHtml}</div>
            <div class="form-group">
                <label>昵称</label>
                <input type="text" id="editName" value="${u.name}" />
            </div>
            <div class="form-group">
                <label>个性签名</label>
                <input type="text" id="editBio" value="${u.bio}" />
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>性别</label>
                    <select id="editGender">
                        <option value="男" ${u.gender === '男' ? 'selected' : ''}>男</option>
                        <option value="女" ${u.gender === '女' ? 'selected' : ''}>女</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>城市</label>
                    <input type="text" id="editCity" value="${u.city}" />
                </div>
            </div>
            <div class="form-group">
                <label>生日</label>
                <input type="date" id="editBirthday" value="${u.birthday}" />
            </div>
            <button class="form-submit-btn" onclick="saveProfile()">保存</button>
        </div>
    `);
}

function selectAvatar(el) {
    document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
}

function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    if (!name) {
        showToast('昵称不能为空');
        return;
    }
    const selectedAvatar = document.querySelector('.avatar-option.selected');
    USER_PROFILE.avatar = selectedAvatar ? selectedAvatar.textContent : USER_PROFILE.avatar;
    USER_PROFILE.name = name;
    USER_PROFILE.bio = document.getElementById('editBio').value.trim() || USER_PROFILE.bio;
    USER_PROFILE.gender = document.getElementById('editGender').value;
    USER_PROFILE.city = document.getElementById('editCity').value.trim() || USER_PROFILE.city;
    USER_PROFILE.birthday = document.getElementById('editBirthday').value || USER_PROFILE.birthday;
    closeModal();
    renderUserProfile();
    showToast('资料保存成功！');
}

// ===== Toast =====
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ===== 弹窗 =====
function showModal(html) {
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') closeModal();
    if (e.target.id === 'interestPanel') toggleInterestPanel(false);
});

// ===== 启动 =====
init();
