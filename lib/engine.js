// lib/engine.js — 智能体编排核心：把用户的一句话变成具体动作与回复
import db from '../db.js';
import {
  detectIntent, parseDateTime, extractDestination, extractDays, extractCityPair, cleanText
} from './nlu.js';
import { generatePlan } from './itinerary.js';
import { buildBookingForm, confirmBooking, typeLabel } from './booking.js';

const now = () => new Date();

// 去掉时间/日期/提醒触发词，提取"要提醒的事"
function extractEventTitle(text) {
  return text
    .replace(/(今天|今日|明天|明日|后天|大后天|昨天|昨日|大前天)/g, '')
    .replace(/下?[周礼拜][一二三四五六日天]/g, '')
    .replace(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g, '')
    .replace(/(\d{1,2})[月.\/](\d{1,2})[日号]?/g, '')
    .replace(/(\d{1,2})\s*点\s*(半|(\d{1,2})\s*分)?/g, '')
    .replace(/(\d{1,2}):(\d{2})/g, '')
    .replace(/(\d+)\s*(天|日|小时|分钟|个?小时|个?分钟)[以]?后/g, '')
    .replace(/(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜里|夜晚)/g, '')
    .replace(/(每天|每日|天天|工作日|周一到周五|平时|每周|每星期|每逢|每月)/g, '')
    .replace(/(提醒我|提醒|记得到|记得|别忘了|别忘记|闹钟|定个时|到点|备忘|通知我|帮我|请|麻烦|我想|我要|可以|能否|能不能)/g, '')
    .replace(/(是|的|了)/g, '')
    .replace(/[，,。.！!？?、~～]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractGoalTitle(text) {
  return text
    .replace(/^(制定目标|定个目标|定目标|我的目标|目标[:：]|我要坚持|我想养成|养成|计划坚持|立个flag|flag)[：: ]?/, '')
    .replace(/(帮我|请|我想|我要)/g, '')
    .replace(/[，,。.！!？?、~～]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 提取"计划"正文：去掉 帮我/做个/制定/一份 等外壳，保留"周末出游"这类主题
function extractPlanTitle(text) {
  return text
    .replace(/^(帮我|请|麻烦|我想|我要|可以|能否|能不能)/, '')
    .replace(/^(我|我的|今)?计划/, '')
    .replace(/^(做|制定|制订|列|写|拟|定|立|出|来|安排)[个一]?[份]?/, '')
    // 去掉相对时间前缀（周五前/下周X前/月底前等；"周末出游"中的"周末"属于主题，予以保留）
    .replace(/^(这?个?周末前|本周末前|周末前|[下这]?个?[周礼拜][一二三四五六日天]前|月底前|下个月前|年底前)[的]?/, '')
    .replace(/^(年底|下个月|这周|下周|今天|今日|明天|明日|后天|大后天)[的]?/, '')
    .replace(/^的/, '')
    .replace(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, '')
    .replace(/(\d{1,2})[月.\/](\d{1,2})[日号]?/, '')
    .replace(/[，,。.！!？?、~～]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || '计划';
}

// 提取日记主题：从"写一篇 X 的日记 / X 一日游 / 记录 X"中抽取
function extractDiaryTopic(text) {
  // 1) "写一篇……的日记/游记"：非贪婪捕获主题，避免吃掉结尾的"的"
  let m = text.match(/写[一篇本份]*(?:关于|有关|一下)?([\u4e00-\u9fa5]{2,10}?)[的]?(?:日记|游记)/);
  if (m) {
    let t = m[1]
      .replace(/([一二两三四五六七八九十\d]+)[日天]?游玩?|游玩|旅游|旅行|出游|一日游/g, '')
      .replace(/^(关于|有关)/, '')
      .replace(/[的]$/, '')
      .trim();
    if (t.length >= 2) return t;
  }
  // 2) X一日游 / X两日游（无"日记"后缀）
  m = text.match(/([\u4e00-\u9fa5]{2,10})(?:一日|两日|三日|\d+日)游/);
  if (m) return m[1];
  // 3) 记录X
  m = text.match(/记录[一下]?(?:今天|今日)?[的]?([\u4e00-\u9fa5]{2,10})/);
  if (m && m[1] && !/(今天|今日)/.test(m[1])) return m[1];
  return '';
}

// 提取日记心情词
function extractDiaryMood(text) {
  const m = text.match(/(开心|愉快|快乐|高兴|兴奋|充实|难忘|美好|轻松|疲惫|累|emo|难过|伤感|平静|期待|幸福|满足)/);
  return m ? m[1] : '';
}

// 离线日记模板（无 LLM 时兜底）
function buildDiaryContent(topic, mood, dateISO, isTrip) {
  const d = dateISO ? new Date(dateISO) : new Date();
  const label = `${d.getMonth() + 1}月${d.getDate()}日`;
  const moodWord = mood ? `，${mood}` : '，心情轻松愉快';
  const place = topic || '这座城市';
  if (isTrip) {
    return [
      `${label}${moodWord}。`,
      `今天去了${place}，一路上风景很好，空气清新，心情也随之明亮起来。`,
      `上午先逛了最想去的几个地方，随手拍了很多照片，每一帧都想留住。中午尝了当地特色美食，味道很赞，吃饱后元气满满地继续下午的行程。`,
      `傍晚在${place}的街头走走停停，看夕阳把天空染成橘红色，那一刻觉得生活真美好。`,
      `晚上回到住处，把今天的见闻写进日记。${place}值得再来一次，也期待下一次出发。`
    ].join('\n');
  }
  return [
    `${label}${moodWord}。`,
    '今天没有特别的安排，但平凡的日子也有值得记录的瞬间。',
    '早上给自己泡了杯热茶，处理了一些手头的事，节奏不紧不慢。午后的阳光透过窗户洒在桌上，忍不住发了一会儿呆，觉得这样的时光也很珍贵。',
    '傍晚出门走了走，看到街边的花开得很好，顺手拍了一张。晚上回到家里，写下这篇日记。',
    '生活就是这样，细水长流的日子里，藏着很多小确幸。愿每一天都认真过，好好记录。'
  ].join('\n');
}

function emptyReply(reply, extra = {}) {
  return { reply, results: [], booking: null, suggestions: [], ...extra };
}

// ---- 各类意图处理 ----

function runQuickCommand(cmd, text, userId) {
  const a = cmd.actionType;
  if (a === 'booking') return bookingFlow(cmd.payload?.type || 'food', text, cmd.payload || {});
  if (a === 'itinerary') return itineraryFlowWith(cmd.payload?.destination || '', cmd.payload?.days || 3, userId);
  if (a === 'reminder') {
    const dt = parseDateTime(cmd.payload?.when || '明天 09:00', now());
    const r = createReminder(cmd.payload?.title || cmd.title, dt.iso, {}, userId);
    return emptyReply(`已通过快捷指令添加提醒：${cmd.payload?.title || cmd.title} 🔔`, { results: [r] });
  }
  if (a === 'goal') {
    const g = createGoal(cmd.payload?.title || cmd.title, userId);
    return emptyReply(`已通过快捷指令添加目标：${cmd.payload?.title || cmd.title} 🎯`, { results: [g] });
  }
  if (a === 'plan') {
    const p = createPlan(cmd.payload?.title || cmd.title, userId, { dueDate: cmd.payload?.dueDate || null });
    return emptyReply(`已通过快捷指令添加计划：${cmd.payload?.title || cmd.title} 📝`, { results: [p] });
  }
  if (a === 'diary') {
    const d = createDiary(cmd.payload?.title || '日记', cmd.payload?.text || '（快捷指令生成的日记）', userId);
    return emptyReply(`已通过快捷指令写日记：${cmd.payload?.title || '日记'} 📓`, { results: [d] });
  }
  return emptyReply(cmd.payload?.text || `已执行快捷指令「${cmd.title}」`);
}

function bookingFlow(type, text, prefill = {}) {
  const pair = extractCityPair(text);
  const pref = { ...prefill };
  if (pair) { pref.from = pair.from; pref.to = pair.to; }
  if (!pref.destination && !pref.city) {
    const dest = extractDestination(text);
    if (dest) pref.destination = dest;
  }
  const dm = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || text.match(/(\d{1,2})[月.\/](\d{1,2})[日号]?/);
  if (dm && !pref.date && !pref.checkin) {
    const y = dm[1].length === 4 ? dm[1] : String(now().getFullYear());
    const m = dm[1].length === 4 ? dm[2].padStart(2, '0') : dm[1].padStart(2, '0');
    const d = (dm[1].length === 4 ? dm[3] : dm[2]).padStart(2, '0');
    pref.date = `${y}-${m}-${d}`;
    pref.checkin = pref.date;
  }
  const form = buildBookingForm(type, pref);
  return emptyReply(`好的，我来帮你${typeLabel(type)}。请补全下面的信息确认 👇`, { booking: form });
}

function itineraryFlowWith(destination, days, userId) {
  if (!destination) {
    return emptyReply('想去哪儿玩呀？告诉我城市，我来帮你规划行程～\n例如：「帮我规划去成都 3 天行程」 🧳', {
      suggestions: ['去杭州3天', '去厦门2天', '周边游']
    });
  }
  const plan = generatePlan(destination, days);
  const id = db.uid('it');
  const record = {
    id, destination: plan.destination, days: plan.days, known: plan.known, tip: plan.tip,
    plan: plan.plan, createdAt: new Date().toISOString()
  };
  const u = db.forUser(userId);
  u.itineraries.unshift(record);
  u.save();
  u.pushNotification({ text: `已生成「${plan.destination}${plan.days}日游」行程`, level: 'success' });
  return emptyReply(
    `已为你生成「${plan.destination} ${plan.days}日游」行程，并添加到「我的」页面 🧳${plan.known ? '' : '（该城市暂用通用模板，可自行调整）'}`,
    { results: [record], suggestions: ['查看我的行程', '再来一个目的地'] }
  );
}

function itineraryFlow(text, userId) {
  const dest = extractDestination(text);
  // 明确写了天数用天数；说"明天/今天去玩"默认 1 日游；其余默认 3 日游
  const days = extractDays(text) || (/(今天|今日|明天|明日|后天|大后天)/.test(text) ? 1 : 3);
  return itineraryFlowWith(dest, days, userId);
}

function createReminder(title, iso, extra, userId) {
  const id = db.uid('rm');
  const r = {
    id, title: title || '提醒', datetime: iso, repeat: extra.repeat || null,
    repeatWeekday: extra.repeatWeekday ?? null, repeatMonthDay: extra.repeatMonthDay ?? null,
    done: false, fired: false, source: extra.source || 'chat', note: '', createdAt: new Date().toISOString()
  };
  const u = db.forUser(userId);
  u.reminders.unshift(r);
  u.save();
  return r;
}

function reminderFlow(text, tag, userId) {
  const parsed = parseDateTime(text, now());

  if (tag === 'commute') {
    let hour = 8, minute = 30, title = '上班提醒';
    if (/下班/.test(text)) { hour = 18; minute = 30; title = '下班提醒'; }
    let base = parsed.iso ? new Date(parsed.iso) : now();
    if (!parsed.iso) base = new Date(now());
    base.setHours(hour, minute, 0, 0);
    const r = createReminder(title, base.toISOString(), { repeat: 'daily', source: 'chat' }, userId);
    db.forUser(userId).pushNotification({ text: `已添加每日${title}（${hour}:${minute}）`, level: 'success' });
    return emptyReply(`已为你设置「每天 ${hour}:${minute} ${title}」🔔，已加入「我的」页面。`, { results: [r] });
  }

  if (tag === 'birthday') {
    const m = text.match(/(\d{1,2})月(\d{1,2})[日号]?/);
    const title = extractEventTitle(text).replace(/生日/g, '') || '生日';
    if (m) {
      const month = parseInt(m[1], 10), day = parseInt(m[2], 10);
      const thisYear = now().getFullYear();
      let d = new Date(thisYear, month - 1, day, 9, 0, 0, 0);
      if (d < now()) d = new Date(thisYear + 1, month - 1, day, 9, 0, 0, 0);
      const r = createReminder(`${title}生日`, d.toISOString(), { repeat: 'yearly', repeatMonthDay: day, source: 'chat' }, userId);
      db.forUser(userId).pushNotification({ text: `已添加每年${month}月${day}日「${title}生日」提醒`, level: 'success' });
      return emptyReply(`已添加「每年 ${month}月${day}日 ${title}生日」提醒 🎂，已加入「我的」页面。`, { results: [r] });
    }
    return emptyReply('告诉我生日是几月几日吧，例如「提醒我妈生日是5月20日」，我帮你设为每年提醒 🎂', {});
  }

  if (!parsed.iso) {
    return emptyReply('想什么时候提醒你呢？告诉我时间，例如「明天早上8点」「每天晚上10点」或「30分钟后」🔔', {
      suggestions: ['明天 09:00 开会', '每天 08:30 起床', '每周一 10:00 周会']
    });
  }

  let title = extractEventTitle(text) || '提醒';
  if (tag === 'business_trip') title = title.includes('出差') ? title : `出差·${title}`;
  const r = createReminder(title, parsed.iso, {
    repeat: parsed.repeat, repeatWeekday: parsed.repeatWeekday, repeatMonthDay: parsed.repeatMonthDay, source: 'chat'
  }, userId);
  db.forUser(userId).pushNotification({ text: `已添加提醒：${title}（${parsed.label}）`, level: 'success' });
  let reply = `已添加提醒：「${title}」⏰ ${parsed.label}`;
  if (parsed.dateOnly) reply += '（时间默认 09:00，可在「我的」页修改）';
  reply += '，已加入「我的」页面。';
  const suggestions = tag === 'business_trip' ? ['顺便规划出差行程', '查看我的提醒'] : ['查看我的提醒', '再添加一个'];
  return emptyReply(reply, { results: [r], suggestions });
}

function createGoal(title, userId) {
  const id = db.uid('gl');
  const g = { id, title: title || '目标', target: '', progress: 0, status: 'active', createdAt: new Date().toISOString() };
  const u = db.forUser(userId);
  u.goals.unshift(g);
  u.save();
  return g;
}

function goalFlow(text, userId) {
  const title = extractGoalTitle(text);
  if (!title) {
    return emptyReply('想定个什么目标呢？例如「每天读书30分钟」「三个月减重5斤」「坚持跑步」🎯', {
      suggestions: ['每天读书30分钟', '三个月减重5斤', '坚持早睡']
    });
  }
  const g = createGoal(title, userId);
  db.forUser(userId).pushNotification({ text: `已添加目标：${title}`, level: 'success' });
  return emptyReply(`已为你制定目标：「${title}」🎯，已加入「我的」页面，记得经常回来打卡哦。`, {
    results: [g], suggestions: ['查看我的目标', '再定一个']
  });
}

function createPlan(title, userId, extra = {}) {
  const id = db.uid('pl');
  const p = {
    id, title: title || '计划', content: extra.content || '', status: extra.status || 'pending',
    dueDate: extra.dueDate || null, createdAt: new Date().toISOString()
  };
  const u = db.forUser(userId);
  u.plans.unshift(p);
  u.save();
  return p;
}

function planFlow(text, userId) {
  const title = extractPlanTitle(text);
  const due = parseDateTime(text, now());
  const p = createPlan(title, userId, { dueDate: due.iso || null });
  const dueLabel = due && due.iso ? `（${due.label}）` : '';
  db.forUser(userId).pushNotification({ text: `已添加计划：${title}`, level: 'success' });
  return emptyReply(`已为你制定计划：「${title}」📝${dueLabel}，已加入「我的」页面，加油执行哦。`, {
    results: [p], suggestions: ['查看我的计划', '再制定一个']
  });
}

function createDiary(title, content, userId, extra = {}) {
  const id = db.uid('dy');
  const d = {
    id, title: title || '日记', content: content || '', mood: extra.mood || '',
    date: extra.date || new Date().toISOString(), createdAt: new Date().toISOString()
  };
  const u = db.forUser(userId);
  u.diary.unshift(d);
  u.save();
  return d;
}

// 有 LLM 时生成更自然的日记正文
async function maybeLLMForDiary(text) {
  const base = process.env.LLM_BASE_URL;
  const key = process.env.LLM_API_KEY;
  if (!base || !key) return null;
  try {
    const resp = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是日记写作助手。根据用户要求写一篇 150~250 字的中文日记，第一人称、口语化、温暖自然。直接输出日记正文，不要标题、不要前缀、不要"日记"二字。' },
          { role: 'user', content: text }
        ]
      })
    });
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('[LLM] 日记生成失败，回退模板:', e.message);
    return null;
  }
}

async function diaryFlow(text, userId) {
  const topic = extractDiaryTopic(text);
  const mood = extractDiaryMood(text);
  const date = parseDateTime(text, now()).iso || new Date().toISOString();
  const isTrip = /(一日|两日|三日|\d+)日?游|旅游|旅行|游玩|出行/.test(text);
  const title = topic ? `${topic}日记` : `${new Date(date).getMonth() + 1}月${new Date(date).getDate()}日日记`;
  let content = await maybeLLMForDiary(text);
  if (!content) content = buildDiaryContent(topic, mood, date, isTrip);
  const d = createDiary(title, content, userId, { mood, date });
  db.forUser(userId).pushNotification({ text: `已写日记：${title}`, level: 'success' });
  return emptyReply(`已为你写好「${title}」📓，并加入「我的」页面。\n\n${content}`, {
    results: [d], suggestions: ['查看我的日记', '再写一篇']
  });
}

async function chatFlow(text) {
  const reply = await maybeLLM(text);
  if (reply) {
    return emptyReply(reply, { suggestions: ['明天9点提醒我开会', '帮我规划去杭州3天行程', '帮我写一篇今天的生活日记', '定个目标：每天读书'] });
  }
  return emptyReply(
    '我是你的智能小秘 🤖 可以帮你做这些事：\n' +
    '• 设提醒：说「明天早上8点提醒我开会」「每天下班提醒我」\n' +
    '• 定目标：说「定个目标：每天读书30分钟」\n' +
    '• 规划行程：说「帮我规划去成都3天行程」\n' +
    '• 制定计划：说「帮我做个周末出游计划」\n' +
    '• 写日记：说「帮我写一篇今天的生活日记」\n' +
    '• 一键下单：说「点外卖」「订酒店」「买火车票」「订机票」\n' +
    '• 自定义快捷指令：在「指令」页添加\n' +
    '试试直接说一句话给我听～',
    { suggestions: ['明天9点提醒我开会', '帮我规划去杭州3天行程', '帮我写一篇今天的生活日记', '定个目标：每天读书'] }
  );
}

async function maybeLLM(text) {
  const base = process.env.LLM_BASE_URL;
  const key = process.env.LLM_API_KEY;
  if (!base || !key) return null;
  try {
    const resp = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '你是"小秘"，一个贴心的中文智能办事助手，使用简洁口语化中文回答用户问题，单次回复不超过120字。' },
          { role: 'user', content: text }
        ]
      })
    });
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('[LLM] 调用失败，回退规则:', e.message);
    return null;
  }
}

// 主入口（userId 用于多租户数据隔离；未登录时传入 'me'）
export async function handleMessage(text, userId = 'me') {
  const t = (text || '').trim();
  if (!t) return emptyReply('我在听，说点什么吧～');
  const u = db.forUser(userId);
  const intent = detectIntent(t, u.getState().quickCommands || []);
  switch (intent.intent) {
    case 'quick_command': return runQuickCommand(intent.command, t, userId);
    case 'booking': return bookingFlow(intent.bookingType, t);
    case 'itinerary': return itineraryFlow(t, userId);
    case 'reminder': return reminderFlow(t, intent.tag, userId);
    case 'goal': return goalFlow(t, userId);
    case 'plan': return planFlow(t, userId);
    case 'diary': return diaryFlow(t, userId);
    default: return chatFlow(t);
  }
}

export { createReminder, createGoal, createPlan, createDiary, extractEventTitle, extractGoalTitle, extractPlanTitle, extractDiaryTopic };
