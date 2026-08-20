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
    initChat();
    startFlashTimer();
    switchPage('home');
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

    // 回退到本地回复
    setTimeout(() => {
        hideTyping();
        const r = getReply(text);
        addBotMessage(r.text, r.card);
    }, 800);
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
    g.innerHTML = ORDER_STATUSES.map(o => `
        <div class="order-item ${o.badge?'order-badge':''}" ${o.badge?`data-badge="${o.badge}"`:''} onclick="showToast('查看「${o.name}」订单')">
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
