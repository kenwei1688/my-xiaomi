// app.js — 小秘智能体前端逻辑（原生 JS，无构建）
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

// 取某品类当前生效的供应商名（兼容 /api/config 返回的对象或字符串）
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
// 服务器地址：默认同源（浏览器访问 localhost:3100 时留空即可）
// App 壳（Android/iOS）内使用时，在「设置」里填写电脑局域网 IP，如 http://192.168.1.3:3100
function getApiBase() { return (localStorage.getItem(API_BASE_KEY) || '').replace(/\/+$/, ''); }
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

// ---------- 对话 ----------
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
  if (!$('#speakToggle').checked) return;
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[🔔🤖⏰🎯🧳🧾✅⚡🍱🏨🎂]/g, ''));
  u.lang = 'zh-CN';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// 小秘"正在输入"气泡（等待接口返回时展示，提升响应感知）
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

// ---------- 我的 ----------
async function loadMe(kind) {
  const data = await api('GET', '/api/me');
  const el = $('#meList');
  el.innerHTML = '';
  if (kind === 'reminders') renderReminders(el, data.reminders);
  else if (kind === 'goals') renderGoals(el, data.goals);
  else if (kind === 'itineraries') renderItineraries(el, data.itineraries);
  else if (kind === 'plans') renderPlans(el, data.plans);
  else if (kind === 'diary') renderDiary(el, data.diary);
  else if (kind === 'bookings') renderBookings(el, data.bookings);
  else if (kind === 'notifications') renderNotifications(el, data.notifications);
}

function empty(el, text) { el.innerHTML = `<div class="empty">${text}</div>`; }

function renderReminders(el, list) {
  if (!list.length) return empty(el, '还没有提醒，去对话里说一句「明天9点提醒我开会」试试 👇');
  list.forEach((r) => {
    const div = document.createElement('div');
    div.className = 'item' + (r.done ? ' done' : '');
    div.innerHTML = `<div class="row1"><div><div class="title">${esc(r.title)}</div>
      <div class="sub">🕒 ${esc(fmt(r.datetime))} ${repeatLabel(r) ? '· ' + esc(repeatLabel(r)) : ''}</div></div>
      <div class="actions">
        <button class="btn-sm" data-act="toggle">${r.done ? '恢复' : '完成'}</button>
        <button class="btn-sm danger" data-act="del">删除</button>
      </div></div>`;
    div.querySelector('[data-act="toggle"]').onclick = async () => { await api('PATCH', '/api/reminders/' + r.id, { done: !r.done }); loadMe('reminders'); };
    div.querySelector('[data-act="del"]').onclick = async () => { await api('DELETE', '/api/reminders/' + r.id); loadMe('reminders'); };
    el.appendChild(div);
  });
}
function renderGoals(el, list) {
  if (!list.length) return empty(el, '还没有目标，去对话里说「定个目标：每天读书30分钟」🎯');
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
  if (!list.length) return empty(el, '还没有计划，去对话里说「帮我做个周末出游计划」📝');
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
  if (!list.length) return empty(el, '还没有日记，去对话里说「帮我写一篇今天的生活日记」📓');
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
  if (!list.length) return empty(el, '还没有行程，去对话里说「帮我规划去成都3天行程」🧳');
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
  if (!list.length) return empty(el, '还没有订单，去对话里说「点外卖」「订酒店」一键下单 🧾');
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

// ---------- 首页 ----------
async function loadHome() {
  const data = await api('GET', '/api/me');
  const uname = localStorage.getItem('xm_user');
  $('#homeGreet').textContent = uname ? `👋 你好，${uname}，我是你的智能小秘` : '👋 你好，我是你的智能小秘';
  const stats = [
    { n: (data.reminders || []).filter((r) => !r.done).length, label: '待办提醒', icon: '⏰' },
    { n: (data.goals || []).filter((g) => g.status === 'active').length, label: '进行中目标', icon: '🎯' },
    { n: (data.itineraries || []).length, label: '行程', icon: '🧳' },
    { n: (data.plans || []).filter((p) => p.status !== 'done').length, label: '待执行计划', icon: '📝' },
    { n: (data.diary || []).length, label: '日记', icon: '📓' },
    { n: (data.bookings || []).length, label: '订单', icon: '🧾' }
  ];
  $('#homeStats').innerHTML = stats.map((s) => `<div class="stat"><div class="num">${s.n}</div><div class="lbl">${s.icon} ${s.label}</div></div>`).join('');

  const upcoming = (data.reminders || []).filter((r) => !r.done).sort((a, b) => new Date(a.datetime) - new Date(b.datetime)).slice(0, 5);
  const rel = $('#homeReminders');
  if (!upcoming.length) rel.innerHTML = '<div class="empty">暂无提醒，点上方「加提醒」试试</div>';
  else rel.innerHTML = upcoming.map((r) => `<div class="hitem"><div class="ht">${esc(r.title)}</div><div class="hs">🕒 ${esc(fmt(r.datetime))}${repeatLabel(r) ? ' · ' + esc(repeatLabel(r)) : ''}</div></div>`).join('');

  const its = (data.itineraries || []).slice(0, 3);
  const itl = $('#homeItineraries');
  if (!its.length) itl.innerHTML = '<div class="empty">还没有行程，点「规划行程」🧳</div>';
  else itl.innerHTML = its.map((it) => `<div class="hitem"><div class="ht">🧳 ${esc(it.destination)} ${it.days}日游</div><div class="hs">${esc(it.tip || '')}</div></div>`).join('');

  const pls = (data.plans || []).filter((p) => p.status !== 'done').slice(0, 3);
  const pll = $('#homePlans');
  if (!pls.length) pll.innerHTML = '<div class="empty">还没有计划，点「做计划」📝</div>';
  else pll.innerHTML = pls.map((p) => `<div class="hitem"><div class="ht">📝 ${esc(p.title)}</div><div class="hs">${p.dueDate ? '截止 ' + esc(fmt(p.dueDate)) : '待开始'}</div></div>`).join('');

  const dys = (data.diary || []).slice(0, 3);
  const dyl = $('#homeDiary');
  if (!dys.length) dyl.innerHTML = '<div class="empty">还没有日记，点「写日记」📓</div>';
  else dyl.innerHTML = dys.map((d) => `<div class="hitem"><div class="ht">📓 ${esc(d.title)}</div><div class="hs">${esc(fmt(d.date))}</div></div>`).join('');

  renderProviderStatus();
}

function renderProviderStatus() {
  const el = $('#providerStatus');
  if (!el) return;
  const p = APP_CONFIG.provider;
  const st = APP_CONFIG.status;
  if (!p || typeof p !== 'object') { el.innerHTML = '<span class="pchip mock">模拟通道 mock（未接真实平台）</span>'; return; }
  const items = [['外卖', 'food'], ['酒店', 'hotel'], ['火车票', 'train'], ['飞机票', 'flight']];
  el.innerHTML = items.map(([name, key]) => {
    const v = p[key] || 'mock';
    if (v === 'mock') return `<span class="pchip mock">${name} · 模拟</span>`;
    const ready = st && st[key] && st[key].configured;
    return `<span class="pchip real">${name} · ${esc(v)}${ready ? ' ✓已配置' : ' ⚠未配密钥'}</span>`;
  }).join('');
}

// ---------- 日历 ----------
let calMonth = new Date();
let lastMe = null;
async function loadCalendar() {
  lastMe = await api('GET', '/api/me');
  renderCalendar(lastMe);
}
function renderCalendar(data) {
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  $('#calTitle').textContent = `${y}年${m + 1}月`;
  const first = new Date(y, m, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const map = {};
  (data.reminders || []).forEach((r) => {
    const dt = new Date(r.datetime);
    if (dt.getFullYear() === y && dt.getMonth() === m) {
      const k = dt.getDate(); (map[k] = map[k] || []).push({ type: 'reminder', title: r.title });
    }
  });
  (data.itineraries || []).forEach((it) => {
    const base = new Date(it.createdAt);
    const span = Math.max(1, Number(it.days) || 1);
    for (let i = 0; i < span; i++) {
      const dt = new Date(base); dt.setDate(base.getDate() + i);
      if (dt.getFullYear() === y && dt.getMonth() === m) {
        const k = dt.getDate();
        (map[k] = map[k] || []).push({ type: 'trip', title: it.destination + (i === 0 ? ' ' + it.days + '日游' : ' · 第' + (i + 1) + '天') });
      }
    }
  });
  (data.plans || []).forEach((pl) => {
    if (!pl.dueDate || pl.status === 'done') return;
    const dt = new Date(pl.dueDate);
    if (dt.getFullYear() === y && dt.getMonth() === m) {
      const k = dt.getDate();
      (map[k] = map[k] || []).push({ type: 'plan', title: '计划·' + pl.title });
    }
  });
  (data.diary || []).forEach((d) => {
    const dt = new Date(d.date);
    if (dt.getFullYear() === y && dt.getMonth() === m) {
      const k = dt.getDate();
      (map[k] = map[k] || []).push({ type: 'diary', title: '日记·' + d.title });
    }
  });

  const today = new Date();
  const grid = $('#calGrid');
  grid.innerHTML = cells.map((c) => {
    if (c === null) return '<div class="cal-cell empty"></div>';
    const isToday = c === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    const items = map[c] || [];
    const dots = items.map((i) => `<i class="dot ${i.type}"></i>`).join('');
    return `<div class="cal-cell${isToday ? ' today' : ''}" data-day="${c}"><span class="dnum">${c}</span><div class="dots">${dots}</div></div>`;
  }).join('');

  grid.querySelectorAll('.cal-cell[data-day]').forEach((cell) => {
    cell.addEventListener('click', () => {
      const d = parseInt(cell.dataset.day, 10);
      const items = map[d] || [];
      const det = $('#calDetail');
      if (!items.length) det.innerHTML = `<div class="empty">${y}年${m + 1}月${d}日 暂无安排</div>`;
      else det.innerHTML = items.map((i) => `<div class="hitem"><div class="ht">${i.type === 'reminder' ? '⏰' : '🧳'} ${esc(i.title)}</div></div>`).join('');
    });
  });
}

// ---------- 指令 ----------
async function loadCmds() {
  const { quickCommands } = await api('GET', '/api/quick-commands');
  const el = $('#cmdList');
  el.innerHTML = '';
  if (!quickCommands.length) return empty(el, '还没有快捷指令，点「新建指令」添加 ⚡');
  const actionName = { booking: '下单', itinerary: '行程', reminder: '提醒', goal: '目标', plan: '计划', diary: '日记', message: '消息' };
  quickCommands.forEach((q) => {
    const div = document.createElement('div');
    div.className = 'cmd-card';
    div.innerHTML = `<div class="emoji">${esc(q.icon || '⚡')}</div>
      <div class="info"><div class="t">${esc(q.title)}</div>
      <div class="tr">口令：「${esc(q.trigger)}」 · 类型：${actionName[q.actionType] || q.actionType}</div></div>
      <button class="btn-sm danger" data-del="${q.id}">删除</button>`;
    div.querySelector('[data-del]').onclick = async () => { await api('DELETE', '/api/quick-commands/' + q.id); loadCmds(); };
    el.appendChild(div);
  });
}

function renderCmdPayload() {
  const a = $('#cmdAction').value;
  const box = $('#cmdPayload');
  if (a === 'booking') box.innerHTML = `<select id="cmdType"><option value="food">外卖</option><option value="hotel">酒店</option><option value="train">火车票</option><option value="flight">机票</option></select>`;
  else if (a === 'itinerary') box.innerHTML = `<input id="cmdDest" placeholder="默认目的地（可空）" /><input id="cmdDays" placeholder="默认天数，如 3" />`;
  else if (a === 'reminder') box.innerHTML = `<input id="cmdRTitle" placeholder="提醒内容" /><input id="cmdRWhen" placeholder="时间，如 明天 09:00" />`;
  else if (a === 'goal') box.innerHTML = `<input id="cmdGTitle" placeholder="目标内容" />`;
  else if (a === 'plan') box.innerHTML = `<input id="cmdPTitle" placeholder="计划内容，如：周末出游" /><input id="cmdPDue" placeholder="截止时间（可空），如 本周末" />`;
  else if (a === 'diary') box.innerHTML = `<input id="cmdDTitle" placeholder="日记标题，如：生活日记" /><textarea id="cmdDContent" placeholder="日记内容（可空，留空自动生成）"></textarea>`;
  else if (a === 'message') box.innerHTML = `<input id="cmdMsg" placeholder="要回复的话" />`;
  else box.innerHTML = '';
}

// ---------- 通知轮询 + Toast ----------
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
        // 桌面提醒：提醒类通知优先用系统通知弹出
        if (n.level === 'warn') notifySystem(n.text);
      }
    });
    firstPoll = false;
    updateBell();
  } catch (e) {}
}

// 系统通知（页面在前台/后台均可弹出；浏览器关闭需服务端 VAPID 推送）
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
function updateBell() {
  const badge = $('#bellBadge');
  if (unreadCount > 0) { badge.hidden = false; badge.textContent = unreadCount; }
  else { badge.hidden = true; }
}
function toast(text, kind = '') {
  const wrap = $('#toastWrap');
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = text;
  wrap.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 4000);
}

// ---------- 登录 / 启动 ----------
let appStarted = false;
function switchView(view) {
  $$('.tab').forEach((x) => x.classList.remove('active'));
  const tb = $(`.tab[data-view="${view}"]`);
  if (tb) tb.classList.add('active');
  $$('.view').forEach((v) => v.classList.remove('active'));
  const vw = $('#view-' + view);
  if (vw) vw.classList.add('active');
  if (view === 'me') loadMe($('#meSubtabs .subtab.active').dataset.me);
  else if (view === 'cmd') loadCmds();
  else if (view === 'home') loadHome();
  else if (view === 'calendar') loadCalendar();
}

function showApp() {
  $('#auth').hidden = true; $('#auth').style.display = 'none';
  $('#app').hidden = false; $('#app').style.display = '';
  if (appStarted) { loadHome(); return; }
  appStarted = true;
  api('GET', '/api/config').then((c) => {
    if (c) { if (c.provider) APP_CONFIG = c; renderProviderStatus(); }
  }).catch(() => {});
  addMsg('agent', '你好，我是你的智能小秘 🤖\n告诉我你想办的事，或试试下面的快捷示例：');
  showSuggestions(['明天9点提醒我开会', '帮我规划去成都3天行程', '点午餐外卖', '定个目标：每天读书30分钟']);
  loadHome();
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

function bindEvents() {
  // 登录相关
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
  const installBtn = $('#installBtn');
  if (installBtn) installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) { toast('可点击浏览器菜单「安装应用」', 'warn'); return; }
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (_) {}
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  // 导出我的全部数据（带鉴权，前端拉取后触发下载）
  const exportBtn = $('#exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', async () => {
    try {
      const res = await fetch(getApiBase() + '/api/me/export', { headers: { 'Authorization': 'Bearer ' + getToken() } });
      if (!res.ok) { toast('导出失败：' + res.status, 'warn'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename="?([^"]+)"?/);
      a.download = m ? m[1] : 'xiaomi-export.json';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast('数据已导出 📦', 'success');
    } catch (e) { toast('导出失败', 'warn'); }
  });

  // 服务器地址设置弹窗
  const settingsModal = $('#settingsModal');
  const settingsBtn = $('#settingsBtn');
  const settingsClose = $('#settingsClose');
  const settingsSave = $('#settingsSave');
  const settingsReset = $('#settingsReset');
  const apiBaseInput = $('#apiBaseInput');
  const srvTestResult = $('#srvTestResult');
  function openSettings() {
    if (!settingsModal) return;
    apiBaseInput.value = getApiBase();
    srvTestResult.innerHTML = '';
    settingsModal.hidden = false;
  }
  if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
  if (settingsClose) settingsClose.addEventListener('click', () => { settingsModal.hidden = true; });
  if (settingsModal) settingsModal.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.hidden = true; });
  if (settingsReset) settingsReset.addEventListener('click', () => { apiBaseInput.value = ''; setApiBase(''); srvTestResult.innerHTML = '<span class="ok">已恢复默认（同源访问）</span>'; });
  if (settingsSave) settingsSave.addEventListener('click', async () => {
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

  // 视图切换（统一入口）
  $$('.tab').forEach((t) => t.addEventListener('click', () => switchView(t.dataset.view)));
  $('#calPrev').addEventListener('click', () => { calMonth.setMonth(calMonth.getMonth() - 1); if (lastMe) renderCalendar(lastMe); });
  $('#calNext').addEventListener('click', () => { calMonth.setMonth(calMonth.getMonth() + 1); if (lastMe) renderCalendar(lastMe); });

  // 首页快捷动作：跳到对话并预填示例
  $$('#view-home .ha').forEach((b) => b.addEventListener('click', () => {
    const map = { reminder: '提醒我 ', itinerary: '帮我规划 ', goal: '定个目标：', plan: '帮我做个计划：', diary: '帮我写一篇今天的生活日记', booking: '点外卖 ' };
    switchView('chat');
    $('#input').value = map[b.dataset.act] || '';
    $('#input').focus();
  }));
  $$('#meSubtabs .subtab').forEach((t) => t.addEventListener('click', () => {
    $$('#meSubtabs .subtab').forEach((x) => x.classList.remove('active'));
    t.classList.add('active');
    loadMe(t.dataset.me);
    if (t.dataset.me === 'notifications') { unreadCount = 0; updateBell(); }
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

  // 指令
  $('#addCmdBtn').addEventListener('click', () => { const f = $('#cmdForm'); f.hidden = !f.hidden; });
  $('#cmdAction').addEventListener('change', renderCmdPayload);
  $('#cmdCancel').addEventListener('click', () => { $('#cmdForm').hidden = true; });
  $('#cmdSave').addEventListener('click', async () => {
    const a = $('#cmdAction').value;
    const payload = {};
    if (a === 'booking') payload.type = $('#cmdType').value;
    if (a === 'itinerary') { payload.destination = $('#cmdDest').value; payload.days = parseInt($('#cmdDays').value, 10) || 3; }
    if (a === 'reminder') { payload.title = $('#cmdRTitle').value; payload.when = $('#cmdRWhen').value; }
    if (a === 'goal') payload.title = $('#cmdGTitle').value;
    if (a === 'plan') { payload.title = $('#cmdPTitle').value; payload.dueDate = $('#cmdPDue').value; }
    if (a === 'diary') { payload.title = $('#cmdDTitle').value; payload.text = $('#cmdDContent').value; }
    if (a === 'message') payload.text = $('#cmdMsg').value;
    await api('POST', '/api/quick-commands', {
      title: $('#cmdTitle').value, trigger: $('#cmdTrigger').value, icon: $('#cmdIcon').value || '⚡',
      actionType: a, payload
    });
    $('#cmdForm').hidden = true;
    ['cmdTitle', 'cmdTrigger', 'cmdIcon', 'cmdPayload'].forEach((id) => { if ($('#' + id)) $('#' + id).value = ''; });
    loadCmds();
    toast('指令已保存 ⚡', 'success');
  });

  // 通知铃铛
  $('#bellBtn').addEventListener('click', () => {
    $$('#meSubtabs .subtab').forEach((x) => x.classList.remove('active'));
    const nt = $('#meSubtabs .subtab[data-me="notifications"]');
    nt.classList.add('active');
    unreadCount = 0; updateBell();
    loadMe('notifications');
  });
}

// ---------- PWA：安装引导 + Service Worker ----------
let deferredPrompt = null;
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = $('#installBtn');
    if (btn) btn.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    const btn = $('#installBtn');
    if (btn) btn.hidden = true;
    toast('已安装到桌面 🎉', 'success');
  });
  // 桌面提醒开关：勾选即申请通知权限
  const nt = $('#notifToggle');
  if (nt) {
    if ('Notification' in window && Notification.permission === 'granted') nt.checked = true;
    nt.addEventListener('change', async () => {
      if (nt.checked) {
        if (!('Notification' in window)) { nt.checked = false; toast('当前浏览器不支持桌面通知', 'warn'); return; }
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') { nt.checked = false; toast('未授权桌面通知', 'warn'); }
        else toast('已开启桌面提醒 🔔', 'success');
      }
    });
  }
}

bindEvents();
initPWA();
boot();
