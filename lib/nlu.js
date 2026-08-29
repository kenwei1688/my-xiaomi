// lib/nlu.js — 中文意图识别 + 时间/实体解析（零依赖规则引擎）
// 说明：作为智能体默认大脑，离线可用；若配置了 LLM 会在 engine 中优先调用。

const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'];

function pad(n) { return String(n).padStart(2, '0'); }

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// 解析"周X / 星期X / 礼拜X" → 0..6
function parseWeekdayToken(tok) {
  const m = tok.match(/[周礼拜]([一二三四五六日天])/);
  if (!m) return -1;
  const w = m[1];
  if (w === '日' || w === '天') return 0;
  return '一二三四五六'.indexOf(w) + 1;
}

// 主时间解析：返回 { iso, dateOnly, repeat, repeatWeekday, repeatMonthDay, label }
export function parseDateTime(text, now = new Date()) {
  const result = { iso: null, dateOnly: false, repeat: null, repeatWeekday: null, repeatMonthDay: null, label: '' };
  let base = startOfDay(now);
  let hasExplicitDate = false;
  let hour = null, minute = 0;

  // ---- 重复模式优先识别 ----
  if (/(每天|每日|天天|每个?早上|每个?晚上|每个?中午|每个?上午|每个?下午)/.test(text)) {
    result.repeat = 'daily';
  } else if (/(工作日|每工作日|周一到周五|星期一到星期五|平时)/.test(text)) {
    result.repeat = 'weekday';
  } else if (/(每周|每星期|每逢周|每个?周)([一二三四五六日天])/.test(text)) {
    const m = text.match(/(每周|每星期|每逢周|每个?周)([一二三四五六日天])/);
    result.repeat = 'weekly';
    result.repeatWeekday = parseWeekdayToken('周' + m[2]);
  } else if (/每月(\d{1,2})[日号]?/.test(text)) {
    const m = text.match(/每月(\d{1,2})[日号]?/);
    result.repeat = 'monthly';
    result.repeatMonthDay = Math.min(28, parseInt(m[1], 10));
  }

  // ---- 日期识别 ----
  // 今天/明日/后天/大后天
  if (/(今天|今日)/.test(text)) { base = startOfDay(now); hasExplicitDate = true; }
  else if (/(明天|明日)/.test(text)) { base = addDays(now, 1); hasExplicitDate = true; }
  else if (/后天/.test(text)) { base = addDays(now, 2); hasExplicitDate = true; }
  else if (/大后天/.test(text)) { base = addDays(now, 3); hasExplicitDate = true; }
  else if (/(昨天|昨日)/.test(text)) { base = addDays(now, -1); hasExplicitDate = true; }
  // 周末 / 这周末 / 本周末 → 本周六（若今天已是周六则下周六）
  else if (/(这?个?周末|本周末|周末)/.test(text)) {
    let diff = (6 - now.getDay() + 7) % 7; if (diff === 0) diff = 7;
    base = addDays(startOfDay(now), diff);
    hasExplicitDate = true;
  }
  // 周X前 / 下周五前等（"前"字结尾的截止语义，取目标周X当天）
  else if (/([下这]?个?[周礼拜])([一二三四五六日天])前/.test(text)) {
    const m = text.match(/([下这]?个?[周礼拜])([一二三四五六日天])前/);
    const w = parseWeekdayToken('周' + m[2]);
    let diff = (w - now.getDay() + 7) % 7; if (diff === 0) diff = 7;
    if (m[1].includes('下')) diff += 7;
    base = addDays(startOfDay(now), diff);
    hasExplicitDate = true;
  }
  // 下周X
  else if (/下[周礼拜]([一二三四五六日天])/.test(text)) {
    const w = parseWeekdayToken(text.match(/下[周礼拜]([一二三四五六日天])/)[0]);
    let diff = (w - now.getDay() + 7) % 7; if (diff === 0) diff = 7;
    base = addDays(startOfDay(now), diff + 7 > 13 ? diff : diff); // 下周
    base = addDays(startOfDay(now), ((w - now.getDay()) + 7) % 7 + 7);
    hasExplicitDate = true;
  }
  // 周X（未来最近的那个）
  else if (/[周礼拜]([一二三四五六日天])/.test(text)) {
    const w = parseWeekdayToken(text.match(/[周礼拜]([一二三四五六日天])/)[0]);
    let diff = (w - now.getDay() + 7) % 7; if (diff === 0) diff = 7;
    base = addDays(startOfDay(now), diff);
    hasExplicitDate = true;
  }
  // 相对天数
  else if (/(\d+)\s*(天|日)[以]?后/.test(text)) {
    const m = text.match(/(\d+)\s*(天|日)[以]?后/);
    base = addDays(startOfDay(now), parseInt(m[1], 10));
    hasExplicitDate = true;
  }
  // 明确日期 YYYY-MM-DD / YYYY/MM/DD
  else if (/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.test(text)) {
    const m = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    base = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
    hasExplicitDate = true;
  }
  // M月D日 / M月D号 / M/D / M.D
  else if (/(\d{1,2})[月.\/](\d{1,2})[日号]?/.test(text)) {
    const m = text.match(/(\d{1,2})[月.\/](\d{1,2})[日号]?/);
    base = new Date(now.getFullYear(), parseInt(m[1]) - 1, parseInt(m[2]));
    if (base < startOfDay(now)) base = new Date(now.getFullYear() + 1, parseInt(m[1]) - 1, parseInt(m[2]));
    hasExplicitDate = true;
  }

  // ---- 时间识别 ----
  const timeCtx = (() => {
    if (/凌晨/.test(text)) return 'early';
    if (/(早上|早晨|上午)/.test(text)) return 'am';
    if (/中午/.test(text)) return 'noon';
    if (/(下午|傍晚)/.test(text)) return 'pm';
    if (/(晚上|夜里|夜晚|夜里)/.test(text)) return 'night';
    return null;
  })();

  // 数字点：X点 / X点半 / X点Y分
  const dotMatch = text.match(/(\d{1,2})\s*点\s*(半|(\d{1,2})\s*分)?/);
  const colonMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    hour = parseInt(colonMatch[1], 10); minute = parseInt(colonMatch[2], 10);
  } else if (dotMatch) {
    hour = parseInt(dotMatch[1], 10);
    if (dotMatch[2] === '半') minute = 30;
    else if (dotMatch[3]) minute = parseInt(dotMatch[3], 10);
    // 上下文修正 12 小时制
    if (timeCtx === 'pm' || timeCtx === 'night') { if (hour < 12) hour += 12; }
    else if (timeCtx === 'noon') { hour = 12; }
    else if (timeCtx === 'early' && hour > 12) hour = 0; // 凌晨不会>12
    else if (timeCtx === 'am' && hour === 12) hour = 0;
  }

  // 相对小时/分钟
  if (hour === null) {
    if (/(\d+)\s*个?小时[以]?后/.test(text)) {
      const m = text.match(/(\d+)\s*个?小时[以]?后/);
      const d = new Date(now); d.setHours(d.getHours() + parseInt(m[1], 10));
      result.iso = d.toISOString();
      result.label = formatLabel(d, result.repeat);
      return result;
    }
    if (/(半|(\d+)\s*个?)小时?[以]?后/.test(text) && /半小时/.test(text)) {
      const d = new Date(now); d.setMinutes(d.getMinutes() + 30);
      result.iso = d.toISOString();
      result.label = formatLabel(d, result.repeat);
      return result;
    }
    if (/(\d+)\s*分钟[以]?后/.test(text)) {
      const m = text.match(/(\d+)\s*分钟[以]?后/);
      const d = new Date(now); d.setMinutes(d.getMinutes() + parseInt(m[1], 10));
      result.iso = d.toISOString();
      result.label = formatLabel(d, result.repeat);
      return result;
    }
  }

  if (hour !== null) {
    const d = new Date(base);
    d.setHours(hour, minute, 0, 0);
    if (!hasExplicitDate && d < now) {
      // 今天但时间已过 → 推到明天
      d.setDate(d.getDate() + 1);
    }
    result.iso = d.toISOString();
    result.dateOnly = false;
  } else if (hasExplicitDate) {
    // 有日期无时间点：默认 09:00（用户可在我的页修改）
    const d = new Date(base); d.setHours(9, 0, 0, 0);
    result.iso = d.toISOString();
    result.dateOnly = true;
  } else {
    // 完全没时间信息，但若有重复模式则算下一次触发
    if (result.repeat) {
      let nb = startOfDay(now);
      nb.setHours(9, 0, 0, 0);
      if (result.repeat === 'monthly' && result.repeatMonthDay) {
        const md = Math.min(result.repeatMonthDay, 28);
        let m = now.getMonth(), y = now.getFullYear();
        let cand = new Date(y, m, md, 9, 0, 0, 0);
        if (cand <= now) { m++; if (m > 11) { m = 0; y++; } cand = new Date(y, m, md, 9, 0, 0, 0); }
        nb = cand;
      } else if (result.repeat === 'weekly' && result.repeatWeekday != null) {
        let diff = (result.repeatWeekday - now.getDay() + 7) % 7;
        if (diff === 0 && nb <= now) diff = 7;
        nb = addDays(nb, diff);
      } else if (result.repeat === 'weekday') {
        while (nb <= now || nb.getDay() === 0 || nb.getDay() === 6) { nb = addDays(nb, 1); nb.setHours(9, 0, 0, 0); }
      } else {
        // daily
        if (nb <= now) nb = addDays(nb, 1);
      }
      result.iso = nb.toISOString();
      result.dateOnly = false;
    } else {
      result.dateOnly = true;
    }
  }

  result.label = formatLabel(result.iso ? new Date(result.iso) : base, result.repeat, result.repeatWeekday, result.repeatMonthDay);
  return result;
}

function formatLabel(d, repeat, wk, md) {
  if (!d) return '';
  const w = WEEKDAY_CN[d.getDay()];
  const datePart = `${d.getMonth() + 1}月${d.getDate()}日(${w})`;
  const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (repeat === 'daily') return `每天 ${timePart}`;
  if (repeat === 'weekday') return `每个工作日 ${timePart}`;
  if (repeat === 'weekly') return `每周${WEEKDAY_CN[wk]} ${timePart}`;
  if (repeat === 'monthly') return `每月${md}日 ${timePart}`;
  if (repeat === 'yearly') return `每年 ${datePart} ${timePart}`;
  return `${datePart} ${timePart}`;
}

// ---- 实体提取 ----
export function extractDestination(text) {
  const stripSuffix = (c) => c.replace(/(旅游|游玩|旅行|行程|攻略|路线|玩|几天|日游|市|的行程|的攻略|的)$/, '').trim();
  const stripVerb = (c) => c.replace(/^(推荐|帮我|请|我想|想|去|到|前往|规划|安排|计划|玩|看|来|带|给|帮)/, '').trim();
  const clean = (c) => { const s = stripVerb(stripSuffix(c)); return s.length >= 2 ? s : ''; };
  // 1) 去/到/前往 X（X 后可能紧跟旅游类后缀）
  let m = text.match(/[去到前往]([\u4e00-\u9fa5]{2,4})/);
  if (m) { const city = clean(m[1]); if (city) return city; }
  // 2) X + 后缀（X 紧邻后缀，允许中间夹一个数字；城市名限 2–4 字；
  //    锚定「城市前必须是非中文或行首」，避免把前置动词一并吞入）
  m = text.match(/(?:^|[^\u4e00-\u9fa5])([\u4e00-\u9fa5]{2,4})\d*(?:旅游|游玩|旅行|攻略|几天|日游|路线|行程|玩)/);
  if (m) { const city = clean(m[1]); if (city) return city; }
  // 3) 规划/去玩/安排/计划去/想去/玩/推荐 X（覆盖「规划上海」「玩上海3日游」「推荐北京3日游」）
  m = text.match(/(?:规划|去玩|安排|计划去|想去|玩|推荐)\s*([\u4e00-\u9fa5]{2,4})/);
  if (m) { const city = clean(m[1]); if (city) return city; }
  return '';
}

export function extractDays(text) {
  let m = text.match(/(\d+)\s*(天|日|晚|夜)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function extractCityPair(text) {
  // 从A到B / A飞B / A至B，并清理动词与"的/票"等杂质
  const m = text.match(/([\u4e00-\u9fa5]{2,4})[到至飞往]([\u4e00-\u9fa5]{2,4})/);
  if (!m) return null;
  let from = m[1].replace(/^(买|订|去|要|想|帮我|请)/, '');
  let to = m[2].replace(/的.*$/, '').replace(/(高铁票|机票|火车票|航班|车票)$/, '');
  if (from.length < 2 || to.length < 2) return null;
  return { from, to };
}

// ---- 意图识别 ----
const BOOKING_KW = {
  food: ['点外卖', '外卖', '叫外卖', '订餐', '点餐', '叫餐', '点个外卖'],
  hotel: ['订酒店', '酒店', '住酒店', '开房', '订房间', '宾馆'],
  train: ['火车票', '高铁票', '动车票', '火车', '高铁', '买车票'],
  flight: ['飞机票', '机票', '航班', '订机票', '买机票', '飞机']
};

const ITINERARY_KW = ['规划', '行程', '攻略', '游玩', '旅游', '旅行', '出游', '去玩', '路线', '安排一下', '玩几天', '计划去'];
const REMINDER_KW = ['提醒', '提醒我', '记得到', '记得', '别忘了', '别忘记', '闹钟', '定个时', '到点', '备忘', '通知我'];
const GOAL_KW = ['制定目标', '定个目标', '我的目标', '目标：', '目标:', '我要坚持', '我想养成', '养成', '计划坚持', '立个flag', 'flag', '定目标'];
const DIARY_KW = ['写日记', '日记', '记日记', '写篇日记', '写一篇', '记一篇', '写点日记', '记录今天', '记录一下今天', '写日记了'];

function countHits(text, kws) {
  let c = 0;
  for (const k of kws) if (text.includes(k)) c++;
  return c;
}

export function detectIntent(text, quickCommands = []) {
  // 1) 自定义快速指令优先（子串命中 trigger）
  for (const qc of quickCommands) {
    if (qc.trigger && qc.trigger.length >= 1 && text.includes(qc.trigger)) {
      return { intent: 'quick_command', command: qc, score: 100 };
    }
  }

  // 2) 下单类（但若用户明确说"提醒我…赶飞机"等，提醒优先于下单）
  let bestBooking = null, bestScore = 0;
  for (const [type, kws] of Object.entries(BOOKING_KW)) {
    const s = countHits(text, kws);
    if (s > bestScore) { bestScore = s; bestBooking = type; }
  }
  const hasReminderKw = countHits(text, REMINDER_KW) > 0;
  if (bestScore > 0 && !hasReminderKw) return { intent: 'booking', bookingType: bestBooking, score: bestScore + 5 };

  // 3) 行程规划
  const itScore = countHits(text, ITINERARY_KW);
  // 4) 提醒
  let rmScore = countHits(text, REMINDER_KW);
  // 5) 目标
  const glScore = countHits(text, GOAL_KW);
  // 6) 日记（"日记/写一篇"语义明确，权重高，优先于行程/计划）
  const dyScore = countHits(text, DIARY_KW) * 2;
  // 7) 计划：出现"计划"即算，若前面有 做/制定/列/写/拟 等动作词则加权重，
  //    与行程类关键词共存时（如"做出游计划"）倾向判定为计划
  let plScore = text.includes('计划') ? 1 : 0;
  if (/(做|制定|制订|列|写|拟|定|立|出|来|安排|规划)[个一]?[份]?[^，。！？、\s]{0,8}计划/.test(text)) plScore += 2;
  if (/计划[表书方案安排]/.test(text)) plScore += 1;

  // 特殊语义标记（7 类提醒标签 + 通勤兜底）
  let tag = null;
  if (/生日/.test(text)) tag = 'birthday';
  else if (/打卡/.test(text) && /上班/.test(text)) tag = 'clockin';
  else if (/打卡/.test(text) && /下班/.test(text)) tag = 'clockout';
  else if (/(上下班|通勤|上班|下班)/.test(text)) tag = 'commute';
  else if (/出差/.test(text)) tag = 'business_trip';
  else if (/(会议|开会|周会|例会|晨会|晚会|评审|答辩|路演)/.test(text)) tag = 'meeting';
  else if (/(还钱|还款|还信用卡|还贷|还房贷|还车贷|还花呗|还白条|还借呗|还账|还欠)/.test(text)) tag = 'repayment';
  else if (/(出行|出发|赶飞机|赶高铁|赶火车|赶车|登机|值机|启程|动身)/.test(text)) tag = 'travel';

  // 强标签词（打卡/生日/会议/还钱/出行/出差）本身即提醒意图，即使没说"提醒"
  if (tag) rmScore = Math.max(rmScore, 1);

  const candidates = [
    { intent: 'itinerary', score: itScore },
    { intent: 'reminder', score: rmScore },
    { intent: 'goal', score: glScore },
    { intent: 'plan', score: plScore },
    { intent: 'diary', score: dyScore }
  ].sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (top.score > 0) {
    return { intent: top.intent, score: top.score, tag };
  }
  return { intent: 'chat', score: 0, tag };
}

// ---- 提醒方式提取（闹钟 / 微信 / 短信） ----
export function extractMethod(text) {
  if (/(微信|企业微信|vx|wx)/i.test(text)) return 'wechat';
  if (/(短信|手机短信|发短信|sms)/i.test(text)) return 'sms';
  if (/(闹钟|响铃|铃声|闹铃)/.test(text)) return 'alarm';
  return null;
}

// 去掉常见语气词前后缀，便于提取事项正文
export function cleanText(text) {
  return text
    .replace(/^(帮我|请|麻烦|我想|我要|可以|能不能|能否|麻烦你|劳驾)/, '')
    .replace(/(吗|呢|啦|吧|呀|啊|哦|哈|～|~)$/, '')
    .replace(/[，,。.！!？?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
