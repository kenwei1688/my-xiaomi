// ==================== 生活小秘 - HTTP 服务器 ====================
// 基于 Node.js 内置 http 模块，无需第三方依赖

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const db = require('./database');
const AIEngine = require('./ai-engine');
const ai = new AIEngine(db);

const PORT = 3000;
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
        version: '2.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET  /api/health',
          'GET  /api/categories',
          'GET  /api/banners',
          'GET  /api/merchants?categoryId=1&keyword=火锅&nearby=true',
          'GET  /api/merchants/:id',
          'GET  /api/deals',
          'GET  /api/flash-sales',
          'GET  /api/hot-searches',
          'GET  /api/interests',
          'POST /api/interests',
          'GET  /api/recommendations',
          'GET  /api/newest?filter=美食',
          'POST /api/newest/:id/like',
          'POST /api/newest/:id/comment',
          'GET  /api/orders?status=pending',
          'POST /api/orders',
          'GET  /api/user',
          'GET  /api/quick-actions',
          'GET  /api/functions',
          'GET  /api/settings',
          'POST /api/ai/chat',
        ]
      });
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

      if (!message.trim()) {
        return sendError(res, '消息不能为空', 400);
      }

      const response = ai.chat(message, sessionId);
      return sendJSON(res, {
        success: true,
        data: {
          reply: response.reply,
          cards: response.cards || [],
          actions: response.actions || [],
          timestamp: new Date().toISOString()
        }
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

server.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     生活小秘 - 后端服务已启动                   ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  前端地址:  http://localhost:${PORT}              ║`);
  console.log(`║  API 文档:  http://localhost:${PORT}/api/health   ║`);
  console.log(`║  AI 对话:  POST /api/ai/chat                   ║`);
  console.log('║  数据库:   内存数据库 (含种子数据)              ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`服务运行中... 按 Ctrl+C 停止`);
});
