// app.js — 小秘吃喝玩乐生活平台（原生 JS，无构建）
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const WK = ['日', '一', '二', '三', '四', '五', '六'];
function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())} 周${WK[d.getDay()]}`;
}
function repeatLabel(r) {
  if (!r || !r.repeat) return '';
  const map = { daily: '每天', weekday: '工作日', weekly: `每周${WK[r.repeatWeekday || 1]}`, monthly: `每月${r.repeatMonthDay}日`, yearly: '每年' };
  return map[r.repeat] || '';
}
// 提醒分类标签（7 类 + 通用）
const REMINDER_CAT_LABELS = {
  clockin: '🕘 上班打卡', clockout: '🌆 下班打卡', birthday: '🎂 生日',
  meeting: '📋 会议', travel: '🧳 出行', business_trip: '✈️ 出差',
  repayment: '💰 还钱', general: '🔔 提醒'
};
// 提醒方式（3 种）
const REMINDER_METHOD_LABELS = {
  alarm: '⏰ 闹钟', wechat: '💬 微信', sms: '📱 短信'
};
const REMINDER_METHOD_CYCLE = ['alarm', 'wechat', 'sms'];
function providerLabel(type) {
  const p = APP_CONFIG.provider;
  if (!p) return 'mock';
  if (typeof p === 'string') return p;
  return (p && p[type]) || (p && p.default) || 'mock';
}

// ---------- 登录态 ----------
const TOKEN_KEY = 'xm_token';
const API_BASE_KEY = 'xm_api_base';
function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }
// 服务器地址：浏览器访问时默认同源（如 localhost:3100，留空即可）
// App 壳（Android/iOS）内默认直连公网云端，装完即用
const CLOUD_BASE = 'https://2026-08-09-12-47-29-production.up.railway.app';
function getApiBase() {
  const v = (localStorage.getItem(API_BASE_KEY) || '').trim().replace(/\/+$/, '');
  if (v) return v;
  if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) return CLOUD_BASE;
  return '';
}
function setApiBase(v) { localStorage.setItem(API_BASE_KEY, (v || '').replace(/\/+$/, '')); }
let authMode = 'login';
let APP_CONFIG = { provider: 'mock', backend: 'json' };

async function api(method, path, body) {
  const opt = { method, headers: { 'Content-Type': 'application/json' } };
  const tk = getToken();
  if (tk) opt.headers['Authorization'] = 'Bearer ' + tk;
  if (body) opt.body = JSON.stringify(body);
  const res = await fetch(getApiBase() + path, opt);
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (res.status === 401 && path.startsWith('/api/') && !path.startsWith('/api/auth/')) {
    clearToken(); showAuth();
  }
  return data;
}

// ============================================================
// 平台数据层（本地内容池，真实平台 API 接入后替换为服务端数据）
// ============================================================
const CATEGORIES = [
  { id: 'food', name: '美食', icon: '🍜' },
  { id: 'spa', name: '足疗按摩', icon: '💆' },
  { id: 'taxi', name: '打车', icon: '🚕' },
  { id: 'scenic', name: '景点游玩', icon: '🏞️' },
  { id: 'travel', name: '旅游度假', icon: '🏖️' },
  { id: 'fitness', name: '运动健身', icon: '🏋️' },
  { id: 'ktv', name: 'KTV', icon: '🎤' },
  { id: 'movie', name: '电影演出', icon: '🎬' }
];
const CAT_NAME = {};
CATEGORIES.forEach((c) => { CAT_NAME[c.id] = c.name; });

const BANNERS = [
  { title: '夏日美食节 · 全场 5 折起', sub: '精选 200+ 家餐厅，新客立减 30 元', emoji: '🍱' },
  { title: '周末去哪玩？深圳周边游', sub: '景点门票 9.9 起，亲子情侣都合适', emoji: '🏞️' },
  { title: '下班放松 · 足疗按摩专场', sub: '养生馆新客体验价 68 元', emoji: '💆' },
  { title: 'KTV 欢唱 3 小时仅 88 元', sub: '白天场更划算，约上朋友出发', emoji: '🎤' }
];

// 商家内容池：id / cat / name / dist(米) / rating / price(人均起) / tags / emoji / addr / hot(热度1-100) / sales
const MERCHANTS = [
  // 美食
  { id: 'm1', cat: 'food', name: '川湘小馆', dist: 320, rating: 4.7, price: 58, tags: ['川菜', '湘菜', '辣'], emoji: '🌶️', addr: '科技园路 88 号', hot: 96, sales: 2300 },
  { id: 'm2', cat: 'food', name: '点都德早茶', dist: 610, rating: 4.8, price: 76, tags: ['广式早茶', '虾饺', '老字号'], emoji: '🥟', addr: '深南大道 1098 号', hot: 92, sales: 4100 },
  { id: 'm3', cat: 'food', name: '木屋烧烤', dist: 450, rating: 4.6, price: 85, tags: ['烧烤', '夜宵', '聚会'], emoji: '🍢', addr: '海岸城购物中心 B1', hot: 90, sales: 1800 },
  { id: 'm4', cat: 'food', name: '椰子鸡火锅', dist: 780, rating: 4.5, price: 92, tags: ['椰子鸡', '火锅', '清淡'], emoji: '🥥', addr: '万象天地 4 楼', hot: 85, sales: 1200 },
  { id: 'm5', cat: 'food', name: '海底捞火锅', dist: 1250, rating: 4.9, price: 118, tags: ['火锅', '服务好', '夜宵'], emoji: '🍲', addr: 'COCO Park 3 楼', hot: 98, sales: 5600 },
  // 足疗按摩
  { id: 'm6', cat: 'spa', name: '康悦足道', dist: 380, rating: 4.7, price: 128, tags: ['足疗', '全身SPA', '包间'], emoji: '🦶', addr: '创业路 66 号', hot: 88, sales: 980 },
  { id: 'm7', cat: 'spa', name: '泰式按摩 SPA', dist: 860, rating: 4.6, price: 168, tags: ['泰式', '精油SPA', '古法'], emoji: '🧖', addr: '欢乐海岸 2 层', hot: 82, sales: 760 },
  { id: 'm8', cat: 'spa', name: '中医推拿馆', dist: 540, rating: 4.8, price: 99, tags: ['推拿', '颈椎', '理疗'], emoji: '💆', addr: '海德三道 12 号', hot: 86, sales: 1350 },
  { id: 'm9', cat: 'spa', name: '采耳养生馆', dist: 700, rating: 4.5, price: 68, tags: ['采耳', '头部SPA', '放松'], emoji: '👂', addr: '花园城 1 层', hot: 74, sales: 640 },
  // 打车
  { id: 'm10', cat: 'taxi', name: '滴滴出行', dist: 0, rating: 4.8, price: 15, tags: ['快车', '拼车', '一口价'], emoji: '🚕', addr: '全城覆盖', hot: 99, sales: 99999 },
  { id: 'm11', cat: 'taxi', name: 'T3 出行', dist: 0, rating: 4.6, price: 14, tags: ['快车', '新人立减'], emoji: '🚖', addr: '全城覆盖', hot: 90, sales: 42000 },
  { id: 'm12', cat: 'taxi', name: '曹操出行', dist: 0, rating: 4.7, price: 16, tags: ['专车', '新能源'], emoji: '🚘', addr: '全城覆盖', hot: 84, sales: 31000 },
  { id: 'm13', cat: 'taxi', name: '哈啰顺风车', dist: 0, rating: 4.5, price: 20, tags: ['跨城', '便宜', '拼座'], emoji: '🚗', addr: '同城跨城', hot: 78, sales: 25000 },
  // 景点游玩
  { id: 'm14', cat: 'scenic', name: '深圳湾公园', dist: 900, rating: 4.7, price: 0, tags: ['免费', '海景', '骑行'], emoji: '🌊', addr: '滨海大道', hot: 95, sales: 50000 },
  { id: 'm15', cat: 'scenic', name: '世界之窗', dist: 3200, rating: 4.6, price: 220, tags: ['微缩景观', '夜场', '亲子'], emoji: '🗼', addr: '深南大道 9037 号', hot: 91, sales: 15000 },
  { id: 'm16', cat: 'scenic', name: '欢乐谷', dist: 4100, rating: 4.5, price: 230, tags: ['游乐场', '过山车', '夜场'], emoji: '🎢', addr: '侨城西街 18 号', hot: 88, sales: 18000 },
  { id: 'm17', cat: 'scenic', name: '海上世界', dist: 2600, rating: 4.4, price: 0, tags: ['明华轮', '夜景', '酒吧街'], emoji: '🚢', addr: '太子路 22 号', hot: 76, sales: 9000 },
  { id: 'm18', cat: 'scenic', name: '梧桐山', dist: 8500, rating: 4.6, price: 0, tags: ['爬山', '看日出', '免费'], emoji: '⛰️', addr: '罗湖区望桐路', hot: 82, sales: 12000 },
  // 旅游度假
  { id: 'm19', cat: 'travel', name: '东部华侨城', dist: 12000, rating: 4.5, price: 180, tags: ['度假区', '大侠谷', '茶溪谷'], emoji: '🏞️', addr: '盐田区大梅沙', hot: 84, sales: 7600 },
  { id: 'm20', cat: 'travel', name: '大梅沙海滨公园', dist: 9800, rating: 4.4, price: 0, tags: ['海边', '玩水', '免费预约'], emoji: '🏖️', addr: '盐田区盐梅路', hot: 87, sales: 30000 },
  { id: 'm21', cat: 'travel', name: '南澳西冲海滩', dist: 35000, rating: 4.7, price: 20, tags: ['原生态', '露营', '星空'], emoji: '🌌', addr: '大鹏新区南澳', hot: 83, sales: 5200 },
  { id: 'm22', cat: 'travel', name: '观澜湖度假区', dist: 26000, rating: 4.6, price: 320, tags: ['高尔夫', '亲子', '温泉'], emoji: '⛳', addr: '龙华区观澜', hot: 72, sales: 3800 },
  // 运动健身
  { id: 'm23', cat: 'fitness', name: '超级猩猩', dist: 480, rating: 4.8, price: 89, tags: ['团课', '单车', '燃脂'], emoji: '🦍', addr: '万象天地 5 层', hot: 90, sales: 8900 },
  { id: 'm24', cat: 'fitness', name: '一兆韦德', dist: 1200, rating: 4.5, price: 120, tags: ['器械', '游泳', '私教'], emoji: '🏋️', addr: '京基百纳 4 层', hot: 78, sales: 6600 },
  { id: 'm25', cat: 'fitness', name: '乐刻健身', dist: 650, rating: 4.6, price: 39, tags: ['24小时', '月卡', '自助'], emoji: '💪', addr: '科技园中区', hot: 80, sales: 15000 },
  { id: 'm26', cat: 'fitness', name: '岩时攀岩馆', dist: 2300, rating: 4.7, price: 98, tags: ['攀岩', '高空', '新手友好'], emoji: '🧗', addr: '华侨城创意园', hot: 70, sales: 2400 },
  // KTV
  { id: 'm27', cat: 'ktv', name: '纯K 量贩KTV', dist: 800, rating: 4.6, price: 88, tags: ['量贩', '自助餐', '下午场'], emoji: '🎤', addr: '海岸城东座 5 层', hot: 85, sales: 6800 },
  { id: 'm28', cat: 'ktv', name: '温莎KTV', dist: 1500, rating: 4.7, price: 128, tags: ['豪华包厢', '酒水畅饮'], emoji: '🎶', addr: '福田中心区', hot: 80, sales: 5200 },
  { id: 'm29', cat: 'ktv', name: '唱吧麦颂', dist: 1100, rating: 4.4, price: 66, tags: ['平价', '音响好'], emoji: '🎙️', addr: '南山大道 100 号', hot: 72, sales: 9000 },
  { id: 'm30', cat: 'ktv', name: '星聚会KTV', dist: 1900, rating: 4.5, price: 108, tags: ['聚会', '生日派对'], emoji: '🪩', addr: '宝安中心区', hot: 74, sales: 4300 },
  // 电影演出
  { id: 'm31', cat: 'movie', name: '万达影城', dist: 700, rating: 4.7, price: 45, tags: ['IMAX', '激光厅', '爆米花'], emoji: '🎬', addr: '海雅缤纷城 6 层', hot: 92, sales: 20000 },
  { id: 'm32', cat: 'movie', name: 'CGV 影城', dist: 950, rating: 4.6, price: 42, tags: ['4DX', '情侣座'], emoji: '🍿', addr: '来福士广场 4 层', hot: 86, sales: 15000 },
  { id: 'm33', cat: 'movie', name: '开心麻花剧场', dist: 4200, rating: 4.8, price: 180, tags: ['话剧', '喜剧', '现场'], emoji: '🎭', addr: '深圳湾体育中心', hot: 88, sales: 3600 },
  { id: 'm34', cat: 'movie', name: '后海汇 Livehouse', dist: 3000, rating: 4.5, price: 120, tags: ['演出', '乐队', '夜生活'], emoji: '🎸', addr: '后海大道 5 号', hot: 76, sales: 2800 }
];

// 特价优惠池
const DEALS = [
  { id: 'd1', title: '双人烧烤套餐 5 折', merchant: '木屋烧烤', cat: 'food', price: 99, orig: 198, sold: 320, badge: '限时5折' },
  { id: 'd2', title: '早茶四人餐 8 款点心', merchant: '点都德', cat: 'food', price: 128, orig: 210, sold: 560, badge: '人气TOP' },
  { id: 'd3', title: '足疗 60 分钟体验券', merchant: '康悦足道', cat: 'spa', price: 68, orig: 128, sold: 240, badge: '新客专享' },
  { id: 'd4', title: '泰式按摩 90 分钟', merchant: '泰式按摩SPA', cat: 'spa', price: 128, orig: 268, sold: 180, badge: '立减140' },
  { id: 'd5', title: '世界之窗夜场门票', merchant: '世界之窗', cat: 'scenic', price: 69, orig: 120, sold: 890, badge: '夜场特惠' },
  { id: 'd6', title: '欢乐谷日场双人票', merchant: '欢乐谷', cat: 'scenic', price: 299, orig: 460, sold: 410, badge: '双人立减' },
  { id: 'd7', title: 'KTV 下午场 3 小时', merchant: '纯K', cat: 'ktv', price: 88, orig: 216, sold: 720, badge: '超值' },
  { id: 'd8', title: 'IMAX 电影双人套票', merchant: '万达影城', cat: 'movie', price: 79, orig: 130, sold: 1500, badge: '秒杀' }
];

// 上新动态池（社交种草）
const POSTS = [
  { id: 'p1', merchant: '木屋烧烤', avatar: '🍢', cat: 'food', time: '2 小时前', title: '🔥 新品上线：炭烤澳洲和牛串', content: '选用 M7 级和牛，炭火现烤，入口爆汁。每桌限点 2 份，先到先得！', price: 39, orig: 68, groupon: '双人套餐 9 折', likes: 128, comments: [{ u: '干饭人小张', t: '刚吃完，确实爆汁，冲！' }, { u: '深圳吃货', t: '周末去试试' }] },
  { id: 'p2', merchant: '康悦足道', avatar: '🦶', cat: 'spa', time: '5 小时前', title: '✨ 全新中药足浴上线', content: '甄选 12 味草本药材，艾草+红花+老姜，祛湿驱寒，适合久坐上班族。', price: 88, orig: 158, groupon: '新客立减 30', likes: 86, comments: [{ u: '打工人小李', t: '上周体验了，颈椎舒服很多' }] },
  { id: 'p3', merchant: '欢乐谷', avatar: '🎢', cat: 'scenic', time: '昨天', title: '🎡 全新项目：天空之眼摩天轮', content: '深圳最高摩天轮已开放！128 米高空俯瞰全城，夜场灯光超梦幻，情侣打卡必去。', price: 99, orig: 150, groupon: '夜场双人立减 40', likes: 356, comments: [{ u: '阿may', t: '夜景真的绝了，已二刷' }, { u: '摄影师老王', t: '出片率极高' }] },
  { id: 'p4', merchant: '纯K', avatar: '🎤', cat: 'ktv', time: '昨天', title: '🎶 主题包厢「星空房」上新', content: '全息投影星空顶 + 环绕音响，生日聚会布置免费送，附赠果盘一份。', price: 168, orig: 328, groupon: '生日专享 5 折', likes: 95, comments: [{ u: '麦霸小陈', t: '音响是真的顶' }] },
  { id: 'p5', merchant: '超级猩猩', avatar: '🦍', cat: 'fitness', time: '2 天前', title: '💦 新课首发：燃脂搏击 45min', content: '专业拳击教练带练，一节消耗 500 大卡，暴汗排毒，新手友好零门槛。', price: 69, orig: 99, groupon: '新客首节 5 折', likes: 210, comments: [{ u: '健身狂魔', t: '一节课瘦两斤的感觉' }] },
  { id: 'p6', merchant: '万达影城', avatar: '🎬', cat: 'movie', time: '2 天前', title: '🍿 暑期档大片预售开启', content: '多部新片点映预售，IMAX 厅低至 39 元，爆米花可乐套餐同购立减 10 元。', price: 39, orig: 80, groupon: '预售特惠', likes: 430, comments: [{ u: '影迷阿强', t: '已锁定首映场' }] },
  { id: 'p7', merchant: '泰式按摩SPA', avatar: '🧖', cat: 'spa', time: '3 天前', title: '🌿 古法泰式全身舒展上新', content: '泰国老师傅手法传承，配合香茅精油，放松肌肉紧张，缓解疲劳一流。', price: 168, orig: 298, groupon: '闺蜜双人同行 8 折', likes: 74, comments: [] },
  { id: 'p8', merchant: '东部华侨城', avatar: '🏞️', cat: 'travel', time: '3 天前', title: '🏔️ 茶溪谷湿地花海开放', content: '千亩花海正值盛花期，景区新增小火车观光线路，亲子家庭套票上线。', price: 129, orig: 220, groupon: '亲子套票 6 折', likes: 150, comments: [{ u: '亲子游妈妈', t: '花海很出片，孩子玩得开心' }] }
];

// 本地状态：兴趣偏好 / 行为 / 点赞 / 评论
const PREFS_KEY = 'xm_prefs';
const BEHAV_KEY = 'xm_behav';
const LIKES_KEY = 'xm_likes';
const CMTS_KEY = 'xm_cmts';
function getPrefs() { try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '[]'); } catch (_) { return []; } }
function setPrefs(arr) { localStorage.setItem(PREFS_KEY, JSON.stringify(arr)); }
function getBehaviors() { try { return JSON.parse(localStorage.getItem(BEHAV_KEY) || '{}'); } catch (_) { return {}; } }
function trackBehavior(cat) {
  const b = getBehaviors();
  b[cat] = (b[cat] || 0) + 1;
  localStorage.setItem(BEHAV_KEY, JSON.stringify(b));
}
function getLikes() { try { return JSON.parse(localStorage.getItem(LIKES_KEY) || '{}'); } catch (_) { return {}; } }
function getCmts(postId) { try { return JSON.parse(localStorage.getItem(CMTS_KEY) || '{}')[postId] || null; } catch (_) { return null; } }
function saveCmts(postId, list) {
  const all = {};
  try { Object.assign(all, JSON.parse(localStorage.getItem(CMTS_KEY) || '{}')); } catch (_) {}
  all[postId] = list;
  localStorage.setItem(CMTS_KEY, JSON.stringify(all));
}

// ============================================================
// 对话（小秘智能体）
// ============================================================
const messagesEl = $('#messages');
function addMsg(role, html) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${role}`;
  const avatar = role === 'user' ? '🙂' : '🤖';
  wrap.innerHTML = `<div class="avatar">${avatar}</div><div class="bubble">${html}</div>`;
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrap;
}

function renderResults(results = []) {
  let html = '';
  for (const r of results) {
    if (r.plan) html += renderItineraryCard(r);
    else if ('progress' in r) html += renderGoalCard(r);
    else if (r.datetime) html += renderReminderCard(r);
    else if (r.dueDate) html += renderPlanCard(r);
    else if (r.content) html += renderDiaryCard(r);
  }
  if (!html) return;
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderReminderCard(r) {
  const rp = repeatLabel(r);
  return `<div class="card"><h4>⏰ 新提醒 ${rp ? `<span class="tag">${esc(rp)}</span>` : ''}</h4>
    <div class="meta">📌 ${esc(r.title)}</div>
    <div class="meta">🕒 ${esc(fmt(r.datetime))}${r.note ? ' · ' + esc(r.note) : ''}</div></div>`;
}
function renderGoalCard(g) {
  return `<div class="card"><h4>🎯 新目标</h4>
    <div class="meta">✅ ${esc(g.title)}</div>
    <div class="meta">进度：${g.progress || 0}%</div></div>`;
}
function renderItineraryCard(it) {
  let days = '';
  for (const d of it.plan) {
    days += `<div class="day">第 ${d.day} 天</div>`;
    for (const i of d.items) days += `<div class="pi"><span class="t">${esc(i.time)}</span>${esc(i.title)}</div>`;
  }
  return `<div class="card"><h4>🧳 ${esc(it.destination)} ${it.days} 日游</h4>
    ${it.tip ? `<div class="meta">💡 ${esc(it.tip)}</div>` : ''}
    <div class="plan">${days}</div></div>`;
}
function renderPlanCard(p) {
  return `<div class="card"><h4>📝 新计划</h4>
    <div class="meta">✅ ${esc(p.title)}</div>
    ${p.dueDate ? `<div class="meta">🕒 截止 ${esc(fmt(p.dueDate))}</div>` : ''}</div>`;
}
function renderDiaryCard(d) {
  return `<div class="card"><h4>📓 ${esc(d.title)}</h4>
    <div class="meta">${esc(fmt(d.date))}${d.mood ? ' · 心情 ' + esc(d.mood) : ''}</div>
    <div class="diary-content">${esc(d.content)}</div></div>`;
}

function renderBookingForm(form) {
  const fields = form.fields.map((f) => {
    let ctrl;
    if (f.type === 'select') {
      ctrl = `<select data-k="${f.key}">${f.options.map((o) => `<option ${o === f.value ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
    } else if (f.type === 'date') {
      ctrl = `<input type="date" data-k="${f.key}" value="${esc(f.value || '')}" />`;
    } else {
      ctrl = `<input type="text" data-k="${f.key}" placeholder="${esc(f.placeholder || '')}" value="${esc(f.value || '')}" />`;
    }
    return `<div class="field"><label>${esc(f.label)}</label>${ctrl}</div>`;
  }).join('');
  const wrap = document.createElement('div');
  const realProvider = providerLabel(form.type);
  const providerTag = realProvider && realProvider !== 'mock' ? `（通道：${esc(realProvider)}）` : '';
  wrap.innerHTML = `<div class="card"><h4>🧾 ${esc(form.title)}${providerTag}</h4>
    <div class="booking-form">${fields}
      <button class="submit" data-type="${esc(form.type)}">确认下单</button></div></div>`;
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  wrap.querySelector('.submit').addEventListener('click', async (e) => {
    const type = e.target.dataset.type;
    const detail = {};
    wrap.querySelectorAll('[data-k]').forEach((el) => { detail[el.dataset.k] = el.value; });
    e.target.disabled = true; e.target.textContent = '提交中…';
    const resp = await api('POST', '/api/booking/confirm', { type, detail });
    if (resp.ok === false) {
      e.target.textContent = '重试'; e.target.disabled = false;
      const c = document.createElement('div');
      c.className = 'card';
      c.innerHTML = `<h4>⚠️ 下单未成功</h4>
        <div class="meta">${esc(resp.message || (resp.booking && resp.booking.error) || '供应商返回错误，请稍后重试')}</div>`;
      wrap.appendChild(c);
      toast('下单失败：' + (resp.message || '供应商返回错误'), 'warn');
      return;
    }
    const booking = resp.booking;
    e.target.textContent = '已下单 ✓';
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `<h4>✅ 下单成功</h4>
      <div class="meta">订单号：${esc(booking.orderNo)}</div>
      <div class="meta">${esc(booking.summary)}</div>
      <div class="meta">${esc(booking.eta)}</div>`;
    wrap.appendChild(c);
    toast(`下单成功：${booking.orderNo}`, 'success');
  });
}

function showSuggestions(suggestions = []) {
  const qr = $('#quickReplies');
  qr.innerHTML = '';
  suggestions.forEach((s) => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = s;
    chip.addEventListener('click', () => send(s));
    qr.appendChild(chip);
  });
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[🔔🤖⏰🎯🧳🧾✅⚡🍱🏨🎂]/g, ''));
  u.lang = 'zh-CN';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function showTyping() {
  const wrap = document.createElement('div');
  wrap.className = 'msg agent typing';
  wrap.innerHTML = '<div class="avatar">🤖</div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrap;
}

async function send(text) {
  text = (text != null ? text : $('#input').value).trim();
  if (!text) return;
  $('#input').value = '';
  addMsg('user', esc(text));
  const typing = showTyping();
  try {
    const data = await api('POST', '/api/chat', { text });
    typing.remove();
    addMsg('agent', esc(data.reply || ''));
    renderResults(data.results);
    if (data.booking) renderBookingForm(data.booking);
    showSuggestions(data.suggestions || []);
    speak(data.reply || '');
  } catch (e) {
    typing.remove();
    addMsg('agent', '⚠️ 网络异常，请稍后重试');
  }
}

// ============================================================
// 我的（个人中心数据）
// ============================================================
async function loadMe(kind) {
  const data = await api('GET', '/api/me');
  const el = $('#meList');
  el.innerHTML = '';
  // 同步个人资料缓存与头像显示
  if (data.profile) {
    cachedProfile = data.profile;
    const uname = localStorage.getItem('xm_user');
    const nick = data.profile.nickname || uname || '小秘用户';
    $('#mineName').textContent = nick;
    $('#mineAvatar').textContent = data.profile.avatar || (uname ? uname.charAt(0).toUpperCase() : '🤖');
    $('#mineMeta').textContent = data.profile.memberLevel || '普通会员';
  }
  if (kind === 'reminders') renderReminders(el, data.reminders);
  else if (kind === 'goals') renderGoals(el, data.goals);
  else if (kind === 'itineraries') renderItineraries(el, data.itineraries);
  else if (kind === 'plans') renderPlans(el, data.plans);
  else if (kind === 'diary') renderDiary(el, data.diary);
  else if (kind === 'bookings') renderBookings(el, data.bookings);
  else if (kind === 'notifications') renderNotifications(el, data.notifications);
  renderMineStats(data);
}

function empty(el, text) { el.innerHTML = `<div class="empty">${text}</div>`; }

function renderReminders(el, list) {
  if (!list.length) return empty(el, '还没有提醒，去小秘页说「明天9点提醒我开会」试试 👇');
  list.forEach((r) => {
    const div = document.createElement('div');
    div.className = 'item' + (r.done ? ' done' : '');
    const cat = r.category || 'general';
    const catLabel = REMINDER_CAT_LABELS[cat] || REMINDER_CAT_LABELS.general;
    const method = r.method || 'alarm';
    const methodLabel = REMINDER_METHOD_LABELS[method] || REMINDER_METHOD_LABELS.alarm;
    div.innerHTML = `<div class="row1"><div><div class="title">${esc(r.title)}</div>
      <div class="sub">🕒 ${esc(fmt(r.datetime))} ${repeatLabel(r) ? '· ' + esc(repeatLabel(r)) : ''}</div>
      <div class="reminder-tags">
        <span class="rm-tag rm-cat">${catLabel}</span>
        <button class="rm-tag rm-method" data-act="method">${methodLabel}</button>
      </div></div>
      <div class="actions">
        <button class="btn-sm" data-act="toggle">${r.done ? '恢复' : '完成'}</button>
        <button class="btn-sm danger" data-act="del">删除</button>
      </div></div>`;
    div.querySelector('[data-act="toggle"]').onclick = async () => { await api('PATCH', '/api/reminders/' + r.id, { done: !r.done }); loadMe('reminders'); };
    div.querySelector('[data-act="del"]').onclick = async () => { await api('DELETE', '/api/reminders/' + r.id); loadMe('reminders'); };
    div.querySelector('[data-act="method"]').onclick = async () => {
      const idx = REMINDER_METHOD_CYCLE.indexOf(method);
      const next = REMINDER_METHOD_CYCLE[(idx + 1) % REMINDER_METHOD_CYCLE.length];
      await api('PATCH', '/api/reminders/' + r.id, { method: next });
      toast(`提醒方式已改为「${REMINDER_METHOD_LABELS[next]}」`, 'success');
      loadMe('reminders');
    };
    el.appendChild(div);
  });
}
function renderGoals(el, list) {
  if (!list.length) return empty(el, '还没有目标，去小秘页说「定个目标：每天读书30分钟」🎯');
  list.forEach((g) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<div class="row1"><div><div class="title">${esc(g.title)}</div>
      <div class="sub">状态：${g.status === 'active' ? '进行中' : '已完成'} · 进度 ${g.progress || 0}%</div></div>
      <div class="actions">
        <button class="btn-sm" data-act="plus">+10%</button>
        <button class="btn-sm danger" data-act="del">删除</button>
      </div></div>
      <div class="progress"><i style="width:${g.progress || 0}%"></i></div>`;
    div.querySelector('[data-act="plus"]').onclick = async () => { await api('PATCH', '/api/goals/' + g.id, { progress: (g.progress || 0) + 10 }); loadMe('goals'); };
    div.querySelector('[data-act="del"]').onclick = async () => { await api('DELETE', '/api/goals/' + g.id); loadMe('goals'); };
    el.appendChild(div);
  });
}
function renderPlans(el, list) {
  if (!list.length) return empty(el, '还没有计划，去小秘页说「帮我做个周末出游计划」📝');
  list.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'item';
    const st = p.status === 'done' ? '已完成' : (p.status === 'doing' ? '进行中' : '待开始');
    div.innerHTML = `<div class="row1"><div><div class="title">📝 ${esc(p.title)}</div>
      <div class="sub">状态：${st}${p.dueDate ? ' · 截止 ' + esc(fmt(p.dueDate)) : ''}</div></div>
      <div class="actions">
        <button class="btn-sm" data-act="toggle">${p.status === 'done' ? '恢复' : '完成'}</button>
        <button class="btn-sm danger" data-act="del">删除</button>
      </div></div>
      ${p.content ? `<div class="plan-note">${esc(p.content)}</div>` : ''}`;
    div.querySelector('[data-act="toggle"]').onclick = async () => { await api('PATCH', '/api/plans/' + p.id, { status: p.status === 'done' ? 'pending' : 'done' }); loadMe('plans'); };
    div.querySelector('[data-act="del"]').onclick = async () => { await api('DELETE', '/api/plans/' + p.id); loadMe('plans'); };
    el.appendChild(div);
  });
}
function renderDiary(el, list) {
  if (!list.length) return empty(el, '还没有日记，去小秘页说「帮我写一篇今天的生活日记」📓');
  list.forEach((d) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<div class="row1"><div><div class="title">📓 ${esc(d.title)}</div>
      <div class="sub">${d.mood ? '心情 ' + esc(d.mood) + ' · ' : ''}${esc(fmt(d.date))}</div></div>
      <button class="btn-sm danger" data-act="del">删除</button></div>
      <div class="diary-content">${esc(d.content)}</div>`;
    div.querySelector('[data-act="del"]').onclick = async () => { await api('DELETE', '/api/diary/' + d.id); loadMe('diary'); };
    el.appendChild(div);
  });
}
function renderItineraries(el, list) {
  if (!list.length) return empty(el, '还没有行程，去小秘页说「帮我规划周末去深圳游玩的行程」🧳');
  list.forEach((it) => {
    const div = document.createElement('div');
    div.className = 'item';
    let days = '';
    for (const d of it.plan) {
      days += `<div class="day">第 ${d.day} 天</div>`;
      for (const i of d.items) days += `<div class="pi"><span class="t">${esc(i.time)}</span>${esc(i.title)}</div>`;
    }
    div.innerHTML = `<div class="row1"><div><div class="title">🧳 ${esc(it.destination)} ${it.days}日游</div>
      <div class="sub">${esc(it.tip || '')}</div></div>
      <button class="btn-sm danger" data-act="del">删除</button></div>
      <div class="plan">${days}</div>`;
    div.querySelector('[data-act="del"]').onclick = async () => { await api('DELETE', '/api/itineraries/' + it.id); loadMe('itineraries'); };
    el.appendChild(div);
  });
}
function renderBookings(el, list) {
  if (!list.length) return empty(el, '还没有订单，去小秘页说「点外卖」「订酒店」一键下单 🧾');
  list.forEach((b) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<div class="title">🧾 ${esc(b.typeLabel || b.type)}</div>
      <div class="sub">订单号：${esc(b.orderNo)}</div>
      <div class="sub">${esc(b.summary)} · ${esc(b.eta)}</div>`;
    el.appendChild(div);
  });
}
function renderNotifications(el, list) {
  if (!list.length) return empty(el, '暂无通知');
  list.forEach((n) => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `<div class="title">${n.level === 'warn' ? '⏰' : '✅'} ${esc(n.text)}</div>
      <div class="sub">${esc(fmt(n.createdAt))}</div>`;
    el.appendChild(div);
  });
}

// ============================================================
// 首页（平台精选中心）
// ============================================================
function renderBanners() {
  const el = $('#homeBanner');
  el.innerHTML = BANNERS.map((b) => `
    <div class="banner">
      <div class="b-title">${esc(b.title)}</div>
      <div class="b-sub">${esc(b.sub)}</div>
      <div class="b-emoji">${b.emoji}</div>
    </div>`).join('');
}

function renderCats() {
  const el = $('#homeCats');
  el.innerHTML = CATEGORIES.map((c) => `
    <div class="cat" data-cat="${c.id}">
      <div class="c-ico">${c.icon}</div>
      <div class="c-name">${esc(c.name)}</div>
    </div>`).join('');
  el.querySelectorAll('.cat').forEach((node) => node.addEventListener('click', () => {
    trackBehavior(node.dataset.cat);
    recoMode = { kind: 'cat', cat: node.dataset.cat };
    renderPrefChips();
    renderRecoFeed();
    switchTab('reco');
    toast(`已为你筛选「${CAT_NAME[node.dataset.cat]}」内容`, 'success');
  }));
}

function merchantCardHTML(m) {
  const dist = m.dist ? (m.dist >= 1000 ? (m.dist / 1000).toFixed(1) + 'km' : m.dist + 'm') : '附近';
  return `<div class="m-card" data-id="${m.id}">
    <div class="m-img">${m.emoji}</div>
    <div class="m-body">
      <div class="m-name">${esc(m.name)}</div>
      <div class="m-meta"><span class="m-rate">★ ${m.rating}</span><span>${dist}</span></div>
      <div class="m-price">${m.price === 0 ? '免费' : '¥' + m.price + '起'}</div>
      <div class="m-tags">${m.tags.slice(0, 3).map((t) => `<span class="m-tag">${esc(t)}</span>`).join('')}</div>
    </div>
  </div>`;
}

function renderNearMerchants() {
  const el = $('#nearMerchants');
  const sorted = [...MERCHANTS].filter((m) => m.cat !== 'taxi').sort((a, b) => (a.dist || 9999) - (b.dist || 9999)).slice(0, 6);
  el.innerHTML = sorted.map(merchantCardHTML).join('');
  el.querySelectorAll('.m-card').forEach((node) => node.addEventListener('click', () => {
    const m = MERCHANTS.find((x) => x.id === node.dataset.id);
    if (!m) return;
    trackBehavior(m.cat);
    toast(`已关注「${m.name}」，推荐页会多推同类内容 💗`, 'success');
  }));
}

function renderHomeDeals() {
  const el = $('#homeDeals');
  el.innerHTML = DEALS.map((d) => `
    <div class="deal" data-id="${d.id}">
      <span class="d-badge">${esc(d.badge)}</span>
      <div class="d-title">${esc(d.title)}</div>
      <div class="d-mer">${esc(d.merchant)} · ${esc(CAT_NAME[d.cat] || '')}</div>
      <div class="d-price"><span class="d-now">${d.price}</span><span class="d-old">¥${d.orig}</span></div>
      <div class="d-sold">已售 ${d.sold}+</div>
    </div>`).join('');
  el.querySelectorAll('.deal').forEach((node) => node.addEventListener('click', () => {
    const d = DEALS.find((x) => x.id === node.dataset.id);
    if (!d) return;
    trackBehavior(d.cat);
    recoMode = { kind: 'deal', cat: d.cat };
    renderPrefChips();
    renderRecoFeed();
    switchTab('reco');
    toast('优惠已收藏，推荐页已更新 💝', 'success');
  }));
}

// 搜索
function doSearch(q) {
  q = (q || '').trim();
  if (!q) { toast('请输入关键词', 'warn'); return; }
  const kw = q.toLowerCase();
  const hits = MERCHANTS.filter((m) =>
    m.name.toLowerCase().includes(kw) ||
    m.tags.some((t) => t.toLowerCase().includes(kw)) ||
    (CAT_NAME[m.cat] || '').includes(kw)
  );
  recoMode = { kind: 'search', q };
  renderPrefChips();
  renderRecoFeed(hits);
  switchTab('reco');
  if (!hits.length) toast('没有找到相关商家，换个词试试', 'warn');
}

// ============================================================
// 推荐（个性化智能推荐）
// ============================================================
let recoMode = null; // null=个性化 | {kind:'cat'|'deal'|'search', ...}
let recoRendered = false;

function renderPrefChips() {
  const el = $('#prefChips');
  const prefs = getPrefs();
  if (recoMode) {
    let label = '';
    if (recoMode.kind === 'cat') label = CAT_NAME[recoMode.cat] || '';
    else if (recoMode.kind === 'deal') label = CAT_NAME[recoMode.cat] ? CAT_NAME[recoMode.cat] + '优惠' : '优惠';
    else label = `搜索「${recoMode.q}」`;
    el.innerHTML = `<span class="pref-chip on">🔍 ${esc(label)}</span>
      <span class="pref-chip" id="prefBack">✕ 返回个性化推荐</span>`;
    const back = $('#prefBack');
    if (back) back.onclick = () => { recoMode = null; renderPrefChips(); renderRecoFeed(); };
    return;
  }
  if (!prefs.length) {
    el.innerHTML = '<span class="pref-chip">📍 未设置偏好，默认展示附近周边的好吃好玩</span>';
    return;
  }
  el.innerHTML = prefs.map((c) => `<span class="pref-chip on">${CATEGORIES.find((x) => x.id === c)?.icon || ''} ${esc(CAT_NAME[c] || c)}</span>`).join('');
}

function recoScore(m) {
  const prefs = getPrefs();
  const beh = getBehaviors();
  let s = (m.hot || 50) / 20; // 热度 2.5-5
  if (prefs.includes(m.cat)) s += 3;
  if (beh[m.cat]) s += Math.min(beh[m.cat], 5);
  return s;
}

function renderRecoFeed(forced) {
  const el = $('#recoFeed');
  let list;
  if (recoMode) {
    if (recoMode.kind === 'cat') list = MERCHANTS.filter((m) => m.cat === recoMode.cat);
    else if (recoMode.kind === 'deal') list = MERCHANTS.filter((m) => m.cat === recoMode.cat);
    else list = forced || MERCHANTS;
  } else {
    const prefs = getPrefs();
    if (prefs.length) {
      // 千人千面：只展示勾选品类，按 偏好/行为/热度 加权排序
      list = MERCHANTS.filter((m) => prefs.includes(m.cat)).sort((a, b) => recoScore(b) - recoScore(a));
      if (!list.length) list = MERCHANTS.slice(0, 8);
    } else {
      // 默认：附近周边内容（距离优先）
      const beh = getBehaviors();
      if (Object.keys(beh).length) list = [...MERCHANTS].sort((a, b) => recoScore(b) - recoScore(a));
      else list = [...MERCHANTS].filter((m) => m.cat !== 'taxi').sort((a, b) => (a.dist || 9999) - (b.dist || 9999)).slice(0, 10);
    }
  }
  const title = $('#recoTitle');
  if (recoMode && recoMode.kind === 'search') title.textContent = `🔍 “${recoMode.q}” 的搜索结果`;
  else if (recoMode) title.textContent = '📌 筛选结果';
  else {
    const prefs = getPrefs();
    title.textContent = prefs.length ? `✨ 为你推荐（已选 ${prefs.length} 个偏好）` : '✨ 为你推荐 · 附近周边';
  }

  if (!list.length) { el.innerHTML = '<div class="empty">该分类暂无内容，去看看别的吧</div>'; return; }
  el.innerHTML = list.map((m) => {
    const dist = m.dist ? (m.dist >= 1000 ? (m.dist / 1000).toFixed(1) + 'km' : m.dist + 'm') : '附近';
    return `<div class="feed-card" data-id="${m.id}">
      <div class="fc-emoji">${m.emoji}</div>
      <div class="fc-main">
        <div class="fc-name">${esc(m.name)}<span class="fc-cat">${esc(CAT_NAME[m.cat] || '')}</span></div>
        <div class="fc-meta"><span class="fc-rate">★ ${m.rating}</span><span>${dist}</span><span>${m.sales}+ 人去过</span></div>
        <div class="fc-tags">${m.tags.map((t) => `<span class="fc-tag">${esc(t)}</span>`).join('')}</div>
        <div class="fc-addr">📍 ${esc(m.addr)}</div>
        <div class="fc-foot">
          <span class="fc-price">${m.price === 0 ? '免费' : m.price}</span>
          <button class="fc-btn" data-go="${m.id}">去看看</button>
        </div>
      </div>
    </div>`;
  }).join('');

  el.querySelectorAll('.feed-card').forEach((node) => node.addEventListener('click', (e) => {
    if (e.target.closest('.fc-btn')) return;
    const m = MERCHANTS.find((x) => x.id === node.dataset.id);
    if (m) trackBehavior(m.cat);
  }));
  el.querySelectorAll('.fc-btn').forEach((btn) => btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const m = MERCHANTS.find((x) => x.id === btn.dataset.go);
    if (!m) return;
    trackBehavior(m.cat);
    toast(`已为「${m.name}」点赞，同类内容会更多出现在推荐里 💗`, 'success');
  }));
}

// 偏好弹窗
let prefDraft = [];
function openPrefModal() {
  prefDraft = [...getPrefs()];
  renderPrefGrid();
  $('#prefModal').hidden = false;
}
function renderPrefGrid() {
  const el = $('#prefGrid');
  el.innerHTML = CATEGORIES.map((c) => `
    <div class="pref-item ${prefDraft.includes(c.id) ? 'on' : ''}" data-p="${c.id}">
      <span class="p-ico">${c.icon}</span>${esc(c.name)}
    </div>`).join('');
  el.querySelectorAll('.pref-item').forEach((node) => node.addEventListener('click', () => {
    const id = node.dataset.p;
    const i = prefDraft.indexOf(id);
    if (i >= 0) prefDraft.splice(i, 1);
    else prefDraft.push(id);
    node.classList.toggle('on');
  }));
}

// ============================================================
// 上新（新品动态社交种草）
// ============================================================
let newFilterCat = 'all';
function renderNewFeed() {
  const el = $('#newFeed');
  const likes = getLikes();
  let list = [...POSTS];
  if (newFilterCat !== 'all') list = list.filter((p) => p.cat === newFilterCat);
  if (!list.length) { el.innerHTML = '<div class="empty">该分类暂无上新，敬请期待 🎉</div>'; return; }
  el.innerHTML = list.map((p) => {
    const liked = !!likes[p.id];
    const cmts = [...(p.comments || []), ...(getCmts(p.id) || [])];
    const likeCount = p.likes + (liked ? 1 : 0);
    return `<div class="post" data-id="${p.id}">
      <div class="p-head">
        <div class="p-avatar">${p.avatar}</div>
        <div>
          <div class="p-mer">${esc(p.merchant)}</div>
          <div class="p-time">${esc(p.time)} · ${esc(CAT_NAME[p.cat] || '')}</div>
        </div>
        <span class="p-badge">新品</span>
      </div>
      <div class="p-title">${esc(p.title)}</div>
      <div class="p-content">${esc(p.content)}</div>
      <div class="p-deal">
        <span class="p-price">${p.price}</span>
        <span class="p-orig">¥${p.orig}</span>
        <span class="p-groupon">${esc(p.groupon || '')}</span>
      </div>
      <div class="p-actions">
        <button class="p-act ${liked ? 'liked' : ''}" data-like="${p.id}">${liked ? '❤️' : '🤍'} 赞 ${likeCount}</button>
        <button class="p-act" data-cmt="${p.id}">💬 评论 ${cmts.length}</button>
      </div>
      <div class="p-comments" id="cmts-${p.id}" ${cmts.length ? '' : 'hidden'}>
        ${cmts.map((c) => `<div class="cmt"><span class="cmt-u">${esc(c.u)}</span><span class="cmt-t">${esc(c.t)}</span></div>`).join('')}
        <div class="cmt-input">
          <input id="cmtIn-${p.id}" placeholder="说点什么…" maxlength="60" />
          <button data-cmtok="${p.id}">发送</button>
        </div>
      </div>
    </div>`;
  }).join('');

  el.querySelectorAll('[data-like]').forEach((btn) => btn.addEventListener('click', () => {
    const id = btn.dataset.like;
    const likesMap = getLikes();
    if (likesMap[id]) delete likesMap[id];
    else likesMap[id] = true;
    localStorage.setItem(LIKES_KEY, JSON.stringify(likesMap));
    renderNewFeed();
    toast(likesMap[id] ? '点赞成功 ❤️' : '已取消点赞', 'success');
  }));
  el.querySelectorAll('[data-cmt]').forEach((btn) => btn.addEventListener('click', () => {
    const box = $('#cmts-' + btn.dataset.cmt);
    if (box) { box.hidden = !box.hidden; }
  }));
  el.querySelectorAll('[data-cmtok]').forEach((btn) => btn.addEventListener('click', () => {
    const id = btn.dataset.cmtok;
    const input = $('#cmtIn-' + id);
    const txt = (input.value || '').trim();
    if (!txt) return;
    const list = getCmts(id) || [];
    list.push({ u: localStorage.getItem('xm_user') || '小秘用户', t: txt });
    saveCmts(id, list);
    renderNewFeed();
    const box = $('#cmts-' + id);
    if (box) box.hidden = false;
    toast('评论已发布 💬', 'success');
  }));
}

function renderNewFilter() {
  const el = $('#newFilterBar');
  el.hidden = false;
  const chips = [{ id: 'all', name: '全部' }, ...CATEGORIES].map((c) =>
    `<span class="pref-chip ${newFilterCat === c.id ? 'on' : ''}" data-f="${c.id}">${c.id === 'all' ? '🛍️ 全部' : c.icon + ' ' + c.name}</span>`).join('');
  el.innerHTML = chips;
  el.querySelectorAll('[data-f]').forEach((n) => n.addEventListener('click', () => {
    newFilterCat = n.dataset.f;
    renderNewFilter();
    renderNewFeed();
  }));
}

// ============================================================
// 我的（个人中心）
// ============================================================
function renderMineStats(data) {
  const el = $('#mineStats');
  const stats = [
    { n: (data.reminders || []).filter((r) => !r.done).length, label: '待办提醒', me: 'reminders', icon: '⏰' },
    { n: (data.itineraries || []).length, label: '我的行程', me: 'itineraries', icon: '🧳' },
    { n: (data.plans || []).filter((p) => p.status !== 'done').length, label: '进行中计划', me: 'plans', icon: '📝' },
    { n: (data.goals || []).filter((g) => g.status === 'active').length, label: '进行中目标', me: 'goals', icon: '🎯' }
  ];
  el.innerHTML = stats.map((s) => `<div class="stat" data-me="${s.me}"><div class="num">${s.n}</div><div class="lbl">${s.icon} ${s.label}</div></div>`).join('');
  el.querySelectorAll('.stat').forEach((n) => n.addEventListener('click', () => {
    const me = n.dataset.me;
    $$('#meSubtabs .subtab').forEach((x) => x.classList.remove('active'));
    const t = $(`#meSubtabs .subtab[data-me="${me}"]`);
    if (t) t.classList.add('active');
    loadMe(me);
  }));
}

function renderMineProfile() {
  // 异步拉取云端个人资料并渲染
  api('GET', '/api/me').then((data) => {
    const pr = data.profile || {};
    const uname = localStorage.getItem('xm_user');
    const nick = pr.nickname || uname || '小秘用户';
    const avatar = pr.avatar || (uname ? uname.charAt(0).toUpperCase() : '🤖');
    $('#mineName').textContent = nick;
    $('#mineAvatar').textContent = avatar;
    $('#mineMeta').textContent = pr.memberLevel || '普通会员';
    $('#homeGreet').textContent = `👋 你好，${nick}，今天想吃点什么？`;
    // 缓存到本地供编辑弹窗预填
    cachedProfile = pr;
  }).catch(() => {});
}
let cachedProfile = {};

// ---- 快捷指令管理 ----
let cachedQuickCmds = [];
function renderQuickCmds() {
  const el = $('#qcScroll');
  if (!el) return;
  api('GET', '/api/me').then((data) => {
    cachedQuickCmds = data.quickCommands || [];
    if (!cachedQuickCmds.length) {
      el.innerHTML = '<span class="qc-empty">暂无快捷指令，点「管理」添加</span>';
      return;
    }
    el.innerHTML = cachedQuickCmds.map((qc) => {
      const icon = qc.icon || '⚡';
      return `<div class="qc-chip" data-qc="${esc(qc.id)}" title="${esc(qc.trigger || qc.title)}">${icon} ${esc(qc.title)}</div>`;
    }).join('');
    el.querySelectorAll('.qc-chip').forEach((chip) => chip.addEventListener('click', () => {
      const qc = cachedQuickCmds.find((x) => x.id === chip.dataset.qc);
      if (qc && qc.trigger) send(qc.trigger);
      else if (qc) send(qc.title);
    }));
  }).catch(() => {});
}
function renderQcList() {
  const el = $('#qcList');
  if (!cachedQuickCmds.length) { el.innerHTML = '<div class="empty">暂无快捷指令，在下方添加</div>'; return; }
  el.innerHTML = cachedQuickCmds.map((qc) => {
    const actionLabel = { reminder: '⏰提醒', itinerary: '🧳行程', booking: '🧾下单', goal: '🎯目标', plan: '📝计划', diary: '📓日记' }[qc.actionType] || qc.actionType;
    return `<div class="qc-item">
      <div class="qc-item-main"><span class="qc-item-ico">${qc.icon || '⚡'}</span>
      <div><div class="qc-item-title">${esc(qc.title)}</div>
      <div class="qc-item-sub">触发词「${esc(qc.trigger || qc.title)}」· ${actionLabel}</div></div></div>
      <button class="btn-sm danger" data-del="${esc(qc.id)}">删除</button></div>`;
  }).join('');
  el.querySelectorAll('[data-del]').forEach((btn) => btn.addEventListener('click', async () => {
    await api('DELETE', '/api/quick-commands/' + btn.dataset.del);
    toast('已删除快捷指令', 'success');
    await refreshQuickCmds();
  }));
}
async function refreshQuickCmds() {
  const data = await api('GET', '/api/me');
  cachedQuickCmds = data.quickCommands || [];
  renderQcList();
  renderQuickCmds();
}
async function addQuickCommand() {
  const title = $('#qcNewTitle').value.trim();
  const trigger = $('#qcNewTrigger').value.trim();
  const actionType = $('#qcNewAction').value;
  if (!title || !trigger) { toast('请填写指令名称和触发词', 'warn'); return; }
  const iconMap = { reminder: '⏰', itinerary: '🧳', booking: '🧾', goal: '🎯', plan: '📝', diary: '📓' };
  const payload = { title, trigger, icon: iconMap[actionType] || '⚡', actionType, payload: {} };
  if (actionType === 'reminder') payload.payload = { when: '明天 09:00', title };
  if (actionType === 'itinerary') payload.payload = { destination: '', days: 2 };
  if (actionType === 'goal') payload.payload = { title };
  if (actionType === 'plan') payload.payload = { title };
  if (actionType === 'diary') payload.payload = { title };
  await api('POST', '/api/quick-commands', payload);
  $('#qcNewTitle').value = ''; $('#qcNewTrigger').value = '';
  toast('已添加快捷指令', 'success');
  await refreshQuickCmds();
}

// ---- 个人资料编辑 ----
const AVATAR_EMOJIS = ['🤖','😀','😎','🥳','🤩','😊','🦊','🐱','🐶','🐼','🦁','🐸','🐵','🦄','🌟','🌈','🌸','🍀','☕','🎮','📚','🎵','🏃','💼','🎉','👑'];
function openProfileModal() {
  const pr = cachedProfile || {};
  $('#profileNickname').value = pr.nickname || '';
  $('#profilePhone').value = pr.phone || '';
  $('#profileBio').value = pr.bio || '';
  $('#profileAvatarBig').textContent = pr.avatar || '🤖';
  const eg = $('#emojiGrid');
  eg.innerHTML = AVATAR_EMOJIS.map((e) => `<span class="emoji-pick" data-e="${e}">${e}</span>`).join('');
  eg.querySelectorAll('.emoji-pick').forEach((s) => s.addEventListener('click', () => {
    eg.querySelectorAll('.emoji-pick').forEach((x) => x.classList.remove('on'));
    s.classList.add('on');
    $('#profileAvatarBig').textContent = s.dataset.e;
  }));
  if (pr.avatar) { const cur = eg.querySelector(`[data-e="${pr.avatar}"]`); if (cur) cur.classList.add('on'); }
  $('#profileModal').hidden = false;
}
async function saveProfile() {
  const nickname = $('#profileNickname').value.trim();
  const phone = $('#profilePhone').value.trim();
  const bio = $('#profileBio').value.trim();
  const avatar = $('#profileAvatarBig').textContent;
  await api('PATCH', '/api/profile', { nickname, phone, bio, avatar });
  $('#profileModal').hidden = true;
  renderMineProfile();
  toast('个人资料已保存', 'success');
}

// ============================================================
// 通知轮询 + Toast
// ============================================================
const seenNotifications = new Set();
let unreadCount = 0;
let firstPoll = true;
async function pollNotifications() {
  try {
    const { notifications } = await api('GET', '/api/notifications');
    notifications.forEach((n) => {
      if (!seenNotifications.has(n.id)) {
        seenNotifications.add(n.id);
        if (firstPoll) return;
        unreadCount++;
        toast(n.text, n.level === 'warn' ? 'warn' : 'success');
        if (n.level === 'warn') notifySystem(n.text);
      }
    });
    firstPoll = false;
  } catch (e) {}
}
async function notifySystem(text) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) { await reg.showNotification('⏰ 小秘提醒', { body: text, icon: '/icons/icon.svg', tag: 'xm-reminder', renotify: true }); return; }
    }
    new Notification('⏰ 小秘提醒', { body: text, icon: '/icons/icon.svg' });
  } catch (_) {}
}
function toast(text, kind = '') {
  const wrap = $('#toastWrap');
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = text;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
}

// ============================================================
// 五 Tab 切换（DOM 常驻，状态独立保留）
// ============================================================
const TAB_INIT = { home: false, reco: false, xiaomi: false, new: false, mine: false };
function switchTab(tab) {
  $$('.tabbar-item').forEach((x) => x.classList.remove('active'));
  const tb = $(`.tabbar-item[data-tab="${tab}"]`);
  if (tb) tb.classList.add('active');
  $$('.page').forEach((v) => v.classList.remove('active'));
  const pg = $('#page-' + tab);
  if (pg) pg.classList.add('active');

  if (tab === 'home' && !TAB_INIT.home) { TAB_INIT.home = true; renderBanners(); renderCats(); renderNearMerchants(); renderHomeDeals(); }
  if (tab === 'reco' && !TAB_INIT.reco) { TAB_INIT.reco = true; renderPrefChips(); renderRecoFeed(); }
  if (tab === 'xiaomi' && !TAB_INIT.xiaomi) { TAB_INIT.xiaomi = true; renderQuickCmds(); }
  if (tab === 'new' && !TAB_INIT.new) { TAB_INIT.new = true; renderNewFilter(); renderNewFeed(); }
  if (tab === 'mine' && !TAB_INIT.mine) { TAB_INIT.mine = true; renderMineProfile(); loadMe($('#meSubtabs .subtab.active').dataset.me); }
}

// ============================================================
// 登录 / 启动
// ============================================================
let appStarted = false;
function showApp() {
  $('#auth').hidden = true; $('#auth').style.display = 'none';
  $('#app').hidden = false; $('#app').style.display = '';
  if (appStarted) { switchTab('home'); return; }
  appStarted = true;
  api('GET', '/api/config').then((c) => {
    if (c && c.provider) APP_CONFIG = c;
  }).catch(() => {});
  renderMineProfile();
  addMsg('agent', '你好，我是你的智能小秘 🤖\n告诉我你想办的事，或试试下面的快捷示例：');
  showSuggestions(['明天9点提醒我开会', '帮我规划周末去深圳游玩的行程', '点午餐外卖', '定个目标：每天读书30分钟']);
  switchTab('home');
  setInterval(pollNotifications, 5000);
  pollNotifications();
}
function showAuth() {
  $('#app').hidden = true; $('#app').style.display = 'none';
  $('#auth').hidden = false; $('#auth').style.display = 'flex';
}
function boot() {
  if (getToken()) showApp(); else showAuth();
}
async function doAuth() {
  const username = $('#authUser').value.trim();
  const password = $('#authPass').value;
  if (!username || !password) { $('#authMsg').textContent = '请输入用户名和密码'; return; }
  const path = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
  const data = await api('POST', path, { username, password });
  if (data.token) {
    setToken(data.token);
    localStorage.setItem('xm_user', username);
    $('#authMsg').textContent = ''; $('#authUser').value = ''; $('#authPass').value = '';
    showApp();
    toast(authMode === 'login' ? '欢迎回来 👋' : '注册成功，已登录 🎉', 'success');
  } else {
    $('#authMsg').textContent = data.error || '操作失败，请重试';
  }
}
function logout() { clearToken(); showAuth(); }

// ============================================================
// 事件绑定
// ============================================================
function bindEvents() {
  // 登录
  $$('.auth-tab').forEach((t) => t.addEventListener('click', () => {
    $$('.auth-tab').forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    authMode = t.dataset.mode;
    $('#authSubmit').textContent = authMode === 'login' ? '登录' : '注册';
    $('#authMsg').textContent = '';
  }));
  $('#authSubmit').addEventListener('click', doAuth);
  $('#authPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doAuth(); });
  $('#logoutBtn').addEventListener('click', logout);

  // 底部导航
  $$('.tabbar-item').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  // 服务器地址设置
  const settingsModal = $('#settingsModal');
  const settingsClose = $('#settingsClose');
  const settingsSave = $('#settingsSave');
  const settingsReset = $('#settingsReset');
  const apiBaseInput = $('#apiBaseInput');
  const srvTestResult = $('#srvTestResult');
  $('#settingsBtn').addEventListener('click', () => {
    apiBaseInput.value = getApiBase();
    srvTestResult.innerHTML = '';
    settingsModal.hidden = false;
  });
  settingsClose.addEventListener('click', () => { settingsModal.hidden = true; });
  settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.hidden = true; });
  settingsReset.addEventListener('click', () => { apiBaseInput.value = ''; setApiBase(''); srvTestResult.innerHTML = '<span class="ok">已恢复默认（App 内为官方云端地址）</span>'; });
  settingsSave.addEventListener('click', async () => {
    const v = apiBaseInput.value.trim().replace(/\/+$/, '');
    setApiBase(v);
    srvTestResult.innerHTML = '<span class="testing">⏳ 正在测试连接…</span>';
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 6000);
      const res = await fetch((v || '') + '/api/config', { signal: ctl.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const cfg = await res.json();
      srvTestResult.innerHTML = `<span class="ok">✅ 连接成功：${v || '同源'}（供应商 ${cfg.provider || 'mock'}）</span>`;
      toast('服务器连接成功 🎉', 'success');
    } catch (e) {
      srvTestResult.innerHTML = `<span class="err">❌ 连接失败：${e.name === 'AbortError' ? '超时，请检查地址与网络' : e.message}</span>`;
      toast('连接失败，请检查地址', 'warn');
    }
  });

  // 搜索
  $('#searchGo').addEventListener('click', () => doSearch($('#homeSearch').value));
  $('#homeSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch($('#homeSearch').value); });

  // 首页快捷动作 → 跳小秘并预填
  $$('#page-home .ha').forEach((b) => b.addEventListener('click', () => {
    const map = { reminder: '提醒我 ', itinerary: '帮我规划 ', goal: '定个目标：', plan: '帮我做个计划：', diary: '帮我写一篇今天的生活日记', booking: '点外卖 ' };
    switchTab('xiaomi');
    $('#input').value = map[b.dataset.act] || '';
    $('#input').focus();
  }));

  // 我的 subtab
  $$('#meSubtabs .subtab').forEach((t) => t.addEventListener('click', () => {
    $$('#meSubtabs .subtab').forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    loadMe(t.dataset.me);
    if (t.dataset.me === 'notifications') { unreadCount = 0; }
  }));

  // 对话发送
  $('#sendBtn').addEventListener('click', () => send());
  $('#input').addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

  // 语音输入
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const rec = new SR();
    rec.lang = 'zh-CN'; rec.interimResults = false; rec.maxAlternatives = 1;
    $('#micBtn').addEventListener('click', () => {
      if (rec._on) { rec.stop(); return; }
      try { rec.start(); } catch (e) {}
    });
    rec.onstart = () => { rec._on = true; $('#micBtn').classList.add('recording'); $('#micStatus').hidden = false; };
    rec.onend = () => { rec._on = false; $('#micBtn').classList.remove('recording'); $('#micStatus').hidden = true; };
    rec.onresult = (e) => { const t = e.results[0][0].transcript; $('#input').value = t; send(t); };
    rec.onerror = () => { rec._on = false; $('#micBtn').classList.remove('recording'); $('#micStatus').hidden = true; };
  } else {
    $('#micBtn').disabled = true; $('#micBtn').title = '当前浏览器不支持语音';
  }

  // 兴趣偏好弹窗
  $('#prefBtn').addEventListener('click', openPrefModal);
  $('#prefClose').addEventListener('click', () => { $('#prefModal').hidden = true; });
  $('#prefModal').addEventListener('click', (e) => { if (e.target === $('#prefModal')) $('#prefModal').hidden = true; });
  $('#prefReset').addEventListener('click', () => { prefDraft = []; renderPrefGrid(); });
  $('#prefSave').addEventListener('click', () => {
    setPrefs(prefDraft);
    $('#prefModal').hidden = true;
    recoMode = null;
    renderPrefChips();
    renderRecoFeed();
    toast(prefDraft.length ? `已保存 ${prefDraft.length} 个兴趣偏好，推荐已更新 ✨` : '已重置偏好，默认展示附近内容 📍', 'success');
  });

  // 上新筛选
  $('#newFilter').addEventListener('click', () => {
    const bar = $('#newFilterBar');
    bar.hidden = !bar.hidden;
    if (!bar.hidden && !bar.children.length) renderNewFilter();
  });

  // 快捷指令管理弹窗
  $('#qcManage').addEventListener('click', async () => {
    await refreshQuickCmds();
    $('#qcModal').hidden = false;
  });
  $('#qcModalClose').addEventListener('click', () => { $('#qcModal').hidden = true; });
  $('#qcModal').addEventListener('click', (e) => { if (e.target === $('#qcModal')) $('#qcModal').hidden = true; });
  $('#qcAddBtn').addEventListener('click', addQuickCommand);

  // 个人资料编辑弹窗
  $('#mineHead').addEventListener('click', (e) => {
    // 点击工具按钮时不触发
    if (e.target.closest('.mine-tools')) return;
    openProfileModal();
  });
  $('#profileClose').addEventListener('click', () => { $('#profileModal').hidden = true; });
  $('#profileCancel').addEventListener('click', () => { $('#profileModal').hidden = true; });
  $('#profileModal').addEventListener('click', (e) => { if (e.target === $('#profileModal')) $('#profileModal').hidden = true; });
  $('#profileSave').addEventListener('click', saveProfile);

  // 附近商家/更多
  $('#nearMore').addEventListener('click', () => {
    recoMode = null;
    renderPrefChips();
    renderRecoFeed();
    switchTab('reco');
    toast('已为你展示附近热门内容 📍', 'success');
  });
  $('#dealsMore').addEventListener('click', () => {
    recoMode = null;
    renderPrefChips();
    renderRecoFeed();
    switchTab('reco');
  });
}

// ============================================================
// PWA：安装引导 + Service Worker
// ============================================================
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}

bindEvents();
initPWA();
boot();
