// server.js — 纯 Node http 服务（零外部依赖）
// 提供：静态前端 + REST API（多租户 + JWT 鉴权）+ 提醒调度器
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import db from './db.js';
import { sign, verify } from './lib/auth.js';
import { handleMessage } from './lib/engine.js';
import { confirmBooking, typeLabel } from './lib/booking.js';
import { providerName, providerStatus } from './lib/providers/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

function sendJSON(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, urlPath) {
  let rel = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(PUBLIC_DIR, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!filePath.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not Found'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    });
    res.end(buf);
  });
}

// 从请求解析当前用户：带有效 Bearer token 则用其 uid，否则匿名 'me'
function authUserId(req) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return db.anonUser();
  const payload = verify(m[1]);
  return payload && payload.uid ? payload.uid : db.anonUser();
}

// ---- 提醒调度 ----
function nextOccurrence(r, from) {
  const d = new Date(from);
  if (r.repeat === 'daily') { d.setDate(d.getDate() + 1); }
  else if (r.repeat === 'weekday') {
    do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
  } else if (r.repeat === 'weekly') {
    if (r.repeatWeekday != null) {
      let diff = (r.repeatWeekday - d.getDay() + 7) % 7; if (diff === 0) diff = 7;
      d.setDate(d.getDate() + diff);
    } else d.setDate(d.getDate() + 7);
  } else if (r.repeat === 'monthly') {
    d.setMonth(d.getMonth() + 1);
    if (r.repeatMonthDay) d.setDate(Math.min(r.repeatMonthDay, 28));
  } else if (r.repeat === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
    if (r.repeatMonthDay) d.setDate(r.repeatMonthDay);
  } else return null;
  return d;
}

function reconcileOnStart() {
  const now = new Date();
  for (const { state } of db.allUserEntries()) {
    for (const r of state.reminders) {
      const dt = new Date(r.datetime);
      if (r.repeat) {
        let cur = dt;
        while (cur < now) { const nx = nextOccurrence(r, cur); if (!nx) break; cur = nx; }
        r.datetime = cur.toISOString();
        r.fired = false;
      } else if (dt < now) {
        r.done = true;
      }
    }
  }
  for (const { userId } of db.allUserEntries()) db.forUser(userId).save();
}

function tickReminders() {
  const now = new Date();
  const changed = new Set();
  for (const { userId, state } of db.allUserEntries()) {
    for (const r of state.reminders) {
      if (r.done && !r.repeat) continue;
      const dt = new Date(r.datetime);
      if (dt <= now && !r.fired) {
        db.forUser(userId).pushNotification({ text: `⏰ 提醒：${r.title}`, level: 'warn' });
        if (r.repeat) {
          const nx = nextOccurrence(r, dt);
          if (nx) { r.datetime = nx.toISOString(); r.fired = false; }
        } else {
          r.done = true; r.fired = true;
        }
        changed.add(userId);
      }
    }
  }
  for (const u of changed) db.forUser(u).save();
}

// ---- 路由 ----
const server = http.createServer(async (req, res) => {
  // CORS：允许 WebView / 跨域前端访问（Android Capacitor 壳 origin 为 capacitor://localhost）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  const method = req.method.toUpperCase();

  if (method === 'GET' && (p === '/' || p.startsWith('/index.html') || p.endsWith('.html') || p.endsWith('.css') || p.endsWith('.js') || p.endsWith('.svg') || p.endsWith('.ico') || p.endsWith('.webmanifest'))) {
    return serveStatic(res, p);
  }

  if (p.startsWith('/api/')) {
    try {
      // 健康检查（部署平台探活用）
      if (p === '/api/health' && method === 'GET') {
        return sendJSON(res, 200, { status: 'ok', time: new Date().toISOString(), backend: db.backendName() });
      }
      // 注册 / 登录
      if (p === '/api/auth/register' && method === 'POST') {
        const body = await readBody(req);
        try {
          const user = db.registerUser(body.username, body.password);
          const token = sign({ uid: user.id, username: user.username });
          return sendJSON(res, 200, { token, user: { id: user.id, username: user.username } });
        } catch (e) { return sendJSON(res, 400, { error: e.message }); }
      }
      if (p === '/api/auth/login' && method === 'POST') {
        const body = await readBody(req);
        const user = db.verifyCredentials(body.username, body.password);
        if (!user) return sendJSON(res, 401, { error: '用户名或密码错误' });
        const token = sign({ uid: user.id, username: user.username });
        return sendJSON(res, 200, { token, user: { id: user.id, username: user.username } });
      }

      // 管理后台统计（需管理员令牌）
      if (p === '/api/admin/stats' && method === 'GET') {
        const adminToken = req.headers['x-admin-token'] || (url.searchParams.get('admin_token') || '');
        const expected = process.env.ADMIN_TOKEN || (process.env.NODE_ENV === 'production' ? null : 'dev-admin');
        if (!expected || adminToken !== expected) {
          return sendJSON(res, 401, { error: '需要有效的管理员令牌（设置环境变量 ADMIN_TOKEN；本地开发默认 dev-admin）' });
        }
        return sendJSON(res, 200, {
          backend: db.backendName(),
          users: db.userCount(),
          collections: db.collectionCounts()
        });
      }

      const uid = authUserId(req);

      // /api/me/export —— 当前用户全量数据导出
      if (p === '/api/me/export' && method === 'GET') {
        const s = db.forUser(uid).getState();
        const payload = {
          exportedAt: new Date().toISOString(),
          userId: uid,
          data: {
            reminders: s.reminders, goals: s.goals, itineraries: s.itineraries,
            plans: s.plans, diary: s.diary,
            bookings: s.bookings, quickCommands: s.quickCommands, notifications: s.notifications
          }
        };
        const body = JSON.stringify(payload, null, 2);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="xiaomi-export-${uid}-${Date.now()}.json"`
        });
        return res.end(body);
      }

      // /api/chat
      if (p === '/api/chat' && method === 'POST') {
        const body = await readBody(req);
        const result = await handleMessage(body.text || '', uid);
        return sendJSON(res, 200, result);
      }

      // /api/me
      if (p === '/api/me' && method === 'GET') {
        const s = db.forUser(uid).getState();
        return sendJSON(res, 200, {
          reminders: s.reminders, goals: s.goals, itineraries: s.itineraries,
          plans: s.plans, diary: s.diary,
          bookings: s.bookings, quickCommands: s.quickCommands, notifications: s.notifications
        });
      }

      // /api/notifications
      if (p === '/api/notifications' && method === 'GET') {
        return sendJSON(res, 200, { notifications: db.forUser(uid).notifications });
      }

      // /api/config —— 前端展示当前下单通道等
      if (p === '/api/config' && method === 'GET') {
        return sendJSON(res, 200, { provider: providerName(), status: providerStatus(), backend: db.backendName() });
      }

      // /api/booking/confirm
      if (p === '/api/booking/confirm' && method === 'POST') {
        const body = await readBody(req);
        const type = body.type;
        const detail = body.detail || {};
        const confirmed = await confirmBooking(type, detail);
        // 供应商下单失败：如实返回，不伪造成功订单
        if (confirmed.status === 'failed') {
          return sendJSON(res, 200, { ok: false, booking: confirmed, message: confirmed.error || '下单失败' });
        }
        const u = db.forUser(uid);
        const record = { id: db.uid('bk'), type, ...confirmed, detail, createdAt: new Date().toISOString() };
        u.bookings.unshift(record);
        u.save();
        u.pushNotification({ text: `✅ ${typeLabel(type)}下单成功，订单号 ${confirmed.orderNo}`, level: 'success' });
        return sendJSON(res, 200, { ok: true, booking: record });
      }

      // 快速指令 CRUD
      if (p === '/api/quick-commands' && method === 'GET') {
        return sendJSON(res, 200, { quickCommands: db.forUser(uid).quickCommands });
      }
      if (p === '/api/quick-commands' && method === 'POST') {
        const body = await readBody(req);
        if (!body.title || !body.trigger || !body.actionType) {
          return sendJSON(res, 400, { error: 'title / trigger / actionType 必填' });
        }
        const u = db.forUser(uid);
        const qc = {
          id: db.uid('qc'), title: body.title, icon: body.icon || '⚡', trigger: body.trigger,
          actionType: body.actionType, payload: body.payload || {}, createdAt: new Date().toISOString()
        };
        u.quickCommands.push(qc);
        u.save();
        return sendJSON(res, 200, { quickCommand: qc });
      }
      const qcMatch = p.match(/^\/api\/quick-commands\/(.+)$/);
      if (qcMatch && method === 'DELETE') {
        const arr = db.forUser(uid).quickCommands;
        const idx = arr.findIndex((x) => x.id === qcMatch[1]);
        if (idx >= 0) { arr.splice(idx, 1); db.forUser(uid).save(); return sendJSON(res, 200, { ok: true }); }
        return sendJSON(res, 404, { error: 'not found' });
      }

      // 提醒 PATCH/DELETE
      const rmMatch = p.match(/^\/api\/reminders\/(.+)$/);
      if (rmMatch) {
        const id = rmMatch[1];
        const arr = db.forUser(uid).reminders;
        const idx = arr.findIndex((x) => x.id === id);
        if (idx < 0) return sendJSON(res, 404, { error: 'not found' });
        if (method === 'PATCH') {
          const body = await readBody(req);
          if (body.datetime) arr[idx].datetime = body.datetime;
          if (typeof body.done === 'boolean') arr[idx].done = body.done;
          if (body.title) arr[idx].title = body.title;
          if (body.note !== undefined) arr[idx].note = body.note;
          db.forUser(uid).save();
          return sendJSON(res, 200, { reminder: arr[idx] });
        }
        if (method === 'DELETE') { arr.splice(idx, 1); db.forUser(uid).save(); return sendJSON(res, 200, { ok: true }); }
      }

      // 目标 PATCH/DELETE
      const glMatch = p.match(/^\/api\/goals\/(.+)$/);
      if (glMatch) {
        const id = glMatch[1];
        const arr = db.forUser(uid).goals;
        const idx = arr.findIndex((x) => x.id === id);
        if (idx < 0) return sendJSON(res, 404, { error: 'not found' });
        if (method === 'PATCH') {
          const body = await readBody(req);
          if (typeof body.progress === 'number') arr[idx].progress = Math.max(0, Math.min(100, body.progress));
          if (body.status) arr[idx].status = body.status;
          if (body.title) arr[idx].title = body.title;
          db.forUser(uid).save();
          return sendJSON(res, 200, { goal: arr[idx] });
        }
        if (method === 'DELETE') { arr.splice(idx, 1); db.forUser(uid).save(); return sendJSON(res, 200, { ok: true }); }
      }

      // 行程 DELETE
      const itMatch = p.match(/^\/api\/itineraries\/(.+)$/);
      if (itMatch && method === 'DELETE') {
        const arr = db.forUser(uid).itineraries;
        const idx = arr.findIndex((x) => x.id === itMatch[1]);
        if (idx >= 0) { arr.splice(idx, 1); db.forUser(uid).save(); }
        return sendJSON(res, 200, { ok: true });
      }

      // 计划 CRUD
      if (p === '/api/plans' && method === 'GET') {
        return sendJSON(res, 200, { plans: db.forUser(uid).plans });
      }
      if (p === '/api/plans' && method === 'POST') {
        const body = await readBody(req);
        if (!body.title) return sendJSON(res, 400, { error: 'title 必填' });
        const u = db.forUser(uid);
        const pl = {
          id: db.uid('pl'), title: body.title, content: body.content || '',
          status: body.status || 'pending', dueDate: body.dueDate || null, createdAt: new Date().toISOString()
        };
        u.plans.unshift(pl);
        u.save();
        return sendJSON(res, 200, { plan: pl });
      }
      const plMatch = p.match(/^\/api\/plans\/(.+)$/);
      if (plMatch) {
        const id = plMatch[1];
        const arr = db.forUser(uid).plans;
        const idx = arr.findIndex((x) => x.id === id);
        if (idx < 0) return sendJSON(res, 404, { error: 'not found' });
        if (method === 'PATCH') {
          const body = await readBody(req);
          if (body.title) arr[idx].title = body.title;
          if (body.content !== undefined) arr[idx].content = body.content;
          if (body.status) arr[idx].status = body.status;
          if (body.dueDate !== undefined) arr[idx].dueDate = body.dueDate;
          db.forUser(uid).save();
          return sendJSON(res, 200, { plan: arr[idx] });
        }
        if (method === 'DELETE') { arr.splice(idx, 1); db.forUser(uid).save(); return sendJSON(res, 200, { ok: true }); }
      }

      // 日记 CRUD
      if (p === '/api/diary' && method === 'GET') {
        return sendJSON(res, 200, { diary: db.forUser(uid).diary });
      }
      if (p === '/api/diary' && method === 'POST') {
        const body = await readBody(req);
        if (!body.title) return sendJSON(res, 400, { error: 'title 必填' });
        const u = db.forUser(uid);
        const dy = {
          id: db.uid('dy'), title: body.title, content: body.content || '',
          mood: body.mood || '', date: body.date || new Date().toISOString(), createdAt: new Date().toISOString()
        };
        u.diary.unshift(dy);
        u.save();
        return sendJSON(res, 200, { diary: dy });
      }
      const dyMatch = p.match(/^\/api\/diary\/(.+)$/);
      if (dyMatch) {
        const id = dyMatch[1];
        const arr = db.forUser(uid).diary;
        const idx = arr.findIndex((x) => x.id === id);
        if (idx < 0) return sendJSON(res, 404, { error: 'not found' });
        if (method === 'PATCH') {
          const body = await readBody(req);
          if (body.title) arr[idx].title = body.title;
          if (body.content !== undefined) arr[idx].content = body.content;
          if (body.mood !== undefined) arr[idx].mood = body.mood;
          if (body.date !== undefined) arr[idx].date = body.date;
          db.forUser(uid).save();
          return sendJSON(res, 200, { diary: arr[idx] });
        }
        if (method === 'DELETE') { arr.splice(idx, 1); db.forUser(uid).save(); return sendJSON(res, 200, { ok: true }); }
      }

      return sendJSON(res, 404, { error: 'API not found' });
    } catch (e) {
      console.error('[api] error:', e);
      return sendJSON(res, 500, { error: e.message });
    }
  }

  if (method === 'GET') return serveStatic(res, '/index.html');
  sendJSON(res, 404, { error: 'Not Found' });
});

await db.load();
db.forUser(db.anonUser()); // 预加载匿名桶
reconcileOnStart();
setInterval(tickReminders, 15000);
tickReminders();

function listen(port, tries) {
  server.listen(port, () => {
    console.log(`\n🤖 小秘智能体已启动： http://localhost:${port}\n`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && tries > 0) {
      console.log(`端口 ${port} 被占用，尝试 ${port + 1} ...`);
      listen(port + 1, tries - 1);
    } else {
      console.error('服务启动失败:', err.message);
    }
  });
}
listen(PORT, 10);
