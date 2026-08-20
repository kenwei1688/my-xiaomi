// ==================== 生活小秘 - HTTP 服务器 ====================
// 基于 Node.js 内置 http 模块，无需第三方依赖

// 轻量 .env 加载（零依赖）：必须在 require 其他模块前执行，
// 使 JWT_SECRET / PORT 既可来自真实环境变量，也可来自同目录 .env 文件。
(function loadEnv() {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    const text = fs.readFileSync(envPath, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = val;
    }
    console.log('[env] 已从 .env 加载配置');
  } catch (e) {
    console.warn('[env] 加载 .env 失败（忽略）:', e.message);
  }
})();

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const db = require('./database');
const store = require('./store');
const auth = require('./auth');
const AIEngine = require('./ai-engine');
const ai = new AIEngine(db, store);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// 启动时加载持久化数据（用户 / 提醒 / 行程）
store.load();

// 从 Authorization: Bearer <token> 解析出用户 id；无效返回 null
function getUid(req) {
  const header = req.headers['authorization'] || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const payload = auth.verifyToken(m[1].trim());
  return payload ? payload.uid : null;
}
const STATIC_DIR = path.join(__dirname, '..', 'app');

// MIME 类型映射
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// ===== 工具函数 =====

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJSON(res, data, status = 200) {
  setCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendError(res, message, status = 400) {
  sendJSON(res, { error: message }, status);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(STATIC_DIR, pathname);
  if (pathname === '/' || pathname === '') {
    filePath = path.join(STATIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA 回退：返回 index.html
        fs.readFile(path.join(STATIC_DIR, 'index.html'), (e2, d2) => {
          if (e2) {
            sendError(res, 'Not Found', 404);
          } else {
            setCors(res);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(d2);
          }
        });
      } else {
        sendError(res, 'Server Error', 500);
      }
      return;
    }
    setCors(res);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// ===== API 路由 =====

async function handleApi(req, res, pathname, method) {
  const parts = pathname.replace(/^\/api\//, '').split('/');
  const resource = parts[0];
  const id = parts[1];

  try {
    // ===== 健康检查 =====
    if (resource === 'health') {
      return sendJSON(res, {
        status: 'ok',
        service: '生活小秘 API',
        version: '3.0',
        persistent: true,
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET  /api/health',
          '-- 账号（零依赖持久化） --',
          'POST /api/auth/register  {identifier,password,name?}',
          'POST /api/auth/login     {identifier,password}',
          'GET  /api/me             (需登录)',
          '-- 云端提醒（需登录，按用户隔离） --',
          'GET  /api/reminders',
          'POST /api/reminders      {reminders:[...]} 全量同步 或 单条创建',
          'PUT  /api/reminders/:id',
          'DELETE /api/reminders/:id',
          '-- 云端行程（需登录） --',
          'GET  /api/trips',
          'POST /api/trips',
          'DELETE /api/trips/:id',
          '-- 其余只读 / AI --',
          'GET  /api/categories / banners / merchants / deals / flash-sales',
          'GET  /api/interests / recommendations / newest / orders / user',
          'GET  /api/quick-actions / functions / settings',
          'POST /api/ai/chat        {message,sessionId?,token?}',
        ]
      });
    }

    // ===== 账号：注册 / 登录 =====
    if (resource === 'auth') {
      if (parts[1] === 'register' && method === 'POST') {
        const body = await parseBody(req);
        const identifier = (body.identifier || '').trim();
        const password = body.password || '';
        const name = body.name || '';
        if (!identifier || !password) return sendError(res, '账号与密码不能为空', 400);
        if (password.length < 6) return sendError(res, '密码至少 6 位', 400);
        if (store.findUserByIdentifier(identifier)) return sendError(res, '该账号已注册，请直接登录', 409);
        const user = store.createUser(identifier, password, name);
        const token = auth.issueToken(user.id);
        return sendJSON(res, { token, user: store.publicUser(user) }, 200);
      }
      if (parts[1] === 'login' && method === 'POST') {
        const body = await parseBody(req);
        const identifier = (body.identifier || '').trim();
        const password = body.password || '';
        const user = store.findUserByIdentifier(identifier);
        if (!user || !store.verifyPassword(user, password)) return sendError(res, '账号或密码错误', 401);
        const token = auth.issueToken(user.id);
        return sendJSON(res, { token, user: store.publicUser(user) }, 200);
      }
      return sendError(res, '不支持的鉴权操作', 404);
    }

    // 已登录用户态
    if (resource === 'me' && method === 'GET') {
      const uid = getUid(req);
      if (!uid) return sendError(res, '未登录或登录已过期', 401);
      const user = store.findUserById(uid);
      if (!user) return sendError(res, '用户不存在', 404);
      return sendJSON(res, { user: store.publicUser(user) });
    }

    // ===== 云端提醒（需登录，按用户隔离） =====
    if (resource === 'reminders') {
      const uid = getUid(req);
      if (!uid) return sendError(res, '请先登录', 401);
      if (method === 'GET') {
        return sendJSON(res, { reminders: store.getReminders(uid) });
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        // 全量同步：客户端传 {reminders:[...]} 直接替换该用户全部提醒（幂等）
        if (body.reminders && Array.isArray(body.reminders)) {
          const list = store.replaceReminders(uid, body.reminders);
          return sendJSON(res, { reminders: list, synced: true });
        }
        // 单条创建
        const r = store.createReminder(uid, body);
        return sendJSON(res, { reminder: r }, 201);
      }
      if ((method === 'PUT' || method === 'DELETE') && id) {
        if (method === 'PUT') {
          const body = await parseBody(req);
          const r = store.updateReminder(uid, id, body);
          if (!r) return sendError(res, '提醒不存在', 404);
          return sendJSON(res, { reminder: r });
        }
        const r = store.deleteReminder(uid, id);
        if (!r) return sendError(res, '提醒不存在', 404);
        return sendJSON(res, { ok: true, id });
      }
      return sendError(res, '不支持的操作', 405);
    }

    // ===== 云端行程（需登录，按用户隔离，基础 CRUD） =====
    if (resource === 'trips') {
      const uid = getUid(req);
      if (!uid) return sendError(res, '请先登录', 401);
      if (method === 'GET') {
        return sendJSON(res, { trips: store.getTrips(uid) });
      }
      if (method === 'POST') {
        const body = await parseBody(req);
        const t = store.createTrip(uid, body);
        return sendJSON(res, { trip: t }, 201);
      }
      if (method === 'DELETE' && id) {
        const t = store.deleteTrip(uid, id);
        if (!t) return sendError(res, '行程不存在', 404);
        return sendJSON(res, { ok: true, id });
      }
      return sendError(res, '不支持的操作', 405);
    }

    // ===== 分类 =====
    if (resource === 'categories') {
      return sendJSON(res, db.getCategories());
    }

    // ===== 轮播 =====
    if (resource === 'banners') {
      return sendJSON(res, db.getBanners());
    }

    // ===== 热门搜索 =====
    if (resource === 'hot-searches') {
      return sendJSON(res, db.getHotSearches());
    }

    // ===== 商家 =====
    if (resource === 'merchants') {
      if (id) {
        const merchant = db.getMerchant(id);
        if (!merchant) return sendError(res, '商家不存在', 404);
        return sendJSON(res, merchant);
      }
      const query = url.parse(req.url, true).query;
      const filter = {};
      if (query.categoryId) filter.categoryId = parseInt(query.categoryId);
      if (query.keyword) filter.keyword = query.keyword;
      if (query.nearby === 'true') filter.nearby = true;
      if (query.limit) filter.limit = parseInt(query.limit);
      return sendJSON(res, db.getMerchants(filter));
    }

    // ===== 特价美食 =====
    if (resource === 'deals') {
      return sendJSON(res, db.getDeals());
    }

    // ===== 秒杀 =====
    if (resource === 'flash-sales') {
      return sendJSON(res, db.getFlashSales());
    }

    // ===== 兴趣偏好 =====
    if (resource === 'interests') {
      if (method === 'POST') {
        const body = await parseBody(req);
        const updated = db.updateInterests(body.selectedIds || []);
        return sendJSON(res, { success: true, data: updated });
      }
      return sendJSON(res, db.getInterestTags());
    }

    // ===== 推荐流 =====
    if (resource === 'recommendations') {
      return sendJSON(res, db.getRecommendations());
    }

    // ===== 上新动态 =====
    if (resource === 'newest') {
      if (id) {
        // 点赞/评论
        const action = parts[2];
        if (action === 'like') {
          const result = db.toggleLike(id);
          if (!result) return sendError(res, '动态不存在', 404);
          return sendJSON(res, { success: true, data: result });
        }
        if (action === 'comment') {
          const body = await parseBody(req);
          const result = db.addComment(id, body.user || '匿名用户', body.text || '');
          if (!result) return sendError(res, '动态不存在', 404);
          return sendJSON(res, { success: true, data: result });
        }
      }
      const query = url.parse(req.url, true).query;
      return sendJSON(res, {
        filters: db.getNewestFilters(),
        feed: db.getNewestFeed(query.filter)
      });
    }

    // ===== 订单 =====
    if (resource === 'orders') {
      if (method === 'POST') {
        const body = await parseBody(req);
        const order = db.createOrder(body);
        return sendJSON(res, { success: true, data: order }, 201);
      }
      const query = url.parse(req.url, true).query;
      return sendJSON(res, {
        categories: db.getOrderCategories(),
        orders: db.getOrders(query.status)
      });
    }

    // ===== 用户 =====
    if (resource === 'user') {
      if (method === 'PUT') {
        const body = await parseBody(req);
        const user = db.updateUser(body);
        return sendJSON(res, { success: true, data: user });
      }
      return sendJSON(res, db.getUser());
    }

    // ===== 快捷指令 =====
    if (resource === 'quick-actions') {
      return sendJSON(res, db.getQuickActions());
    }

    // ===== 功能入口 =====
    if (resource === 'functions') {
      return sendJSON(res, db.getFunctions());
    }

    // ===== 设置 =====
    if (resource === 'settings') {
      return sendJSON(res, db.getSettings());
    }

    // ===== AI 对话 =====
    if (resource === 'ai' && parts[1] === 'chat') {
      const body = await parseBody(req);
      const message = body.message || '';
      const sessionId = body.sessionId || 'web-default';
      // 透传登录用户 id：AI 创建的提醒/行程将落在该用户的云端空间
      const uid = getUid(req) ||
        (body.token ? (auth.verifyToken(String(body.token)) || {}).uid : null) || null;

      if (!message.trim()) {
        return sendError(res, '消息不能为空', 400);
      }

      const response = ai.chat(message, sessionId, uid);
      const responseData = {
        reply: response.reply,
        cards: response.cards || [],
        actions: response.actions || [],
        timestamp: new Date().toISOString()
      };
      // 透传自动创建/删除的行程和提醒数据
      if (response.tripCreated) {
        responseData.tripCreated = response.tripCreated;
      }
      if (response.reminderCreated) {
        responseData.reminderCreated = response.reminderCreated;
      }
      if (response.askReminder) {
        responseData.askReminder = response.askReminder;
      }
      if (response.tripDeleted) {
        responseData.tripDeleted = response.tripDeleted;
      }
      if (response.tripDeletedAll) {
        responseData.tripDeletedAll = response.tripDeletedAll;
      }
      if (response.reminderDeleted) {
        responseData.reminderDeleted = response.reminderDeleted;
      }
      if (response.reminderDeletedAll) {
        responseData.reminderDeletedAll = response.reminderDeletedAll;
      }
      return sendJSON(res, {
        success: true,
        data: responseData
      });
    }

    // ===== 404 =====
    return sendError(res, `接口不存在: /api/${resource}`, 404);

  } catch (error) {
    console.error('API Error:', error);
    return sendError(res, '服务器内部错误: ' + error.message, 500);
  }
}

// ===== 创建服务器 =====

const server = http.createServer(async (req, res) => {
  // 处理 OPTIONS 预检
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

  // API 路由
  if (pathname.startsWith('/api/')) {
    await handleApi(req, res, pathname, method);
    return;
  }

  // 静态文件
  serveStatic(req, res, pathname);
});

// ===== 启动 =====

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     生活小秘 - 后端服务已启动                   ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  前端地址:  http://localhost:${PORT}              ║`);
  console.log(`║  API 文档:  http://localhost:${PORT}/api/health   ║`);
  console.log(`║  AI 对话:  POST /api/ai/chat                   ║`);
  console.log('║  数据库:   JSON 文件持久化 (server/data/db.json)    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`服务运行中... 按 Ctrl+C 停止`);
});
