// ==================== 生活小秘 - 持久化存储层 ====================
// JSON 文件持久化（零依赖），按用户隔离：users / reminders / trips
// 重启不丢数据，是"真后端"的核心。

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 数据目录：默认 server/data（相对路径，本地/Docker 不变）；
// 云端部署可设 DATA_DIR 指向持久卷挂载点（如 Railway 挂 /app/data），实现重启不丢。
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// 运行时内存数据（启动时从磁盘加载）
let data = {
  users: [],      // { id, identifier, name, salt, hash, createdAt }
  reminders: [],  // { id, userId, type, title, desc, time, date, repeat, method, enabled, icon, createdAt, updatedAt }
  trips: [],      // { id, userId, title, status, startDate, endDate, days, destination, budget, spent, seed, progress, schedule, createdAt }
};

// ===== 加载 / 持久化 =====
function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      data.users = Array.isArray(raw.users) ? raw.users : [];
      data.reminders = Array.isArray(raw.reminders) ? raw.reminders : [];
      data.trips = Array.isArray(raw.trips) ? raw.trips : [];
      console.log(`[store] 已加载本地数据：用户 ${data.users.length} 个，提醒 ${data.reminders.length} 条，行程 ${data.trips.length} 条`);
    } else {
      console.log('[store] 未发现本地数据库，将创建新的空库');
    }
  } catch (e) {
    console.error('[store] 加载本地数据失败，使用空库：', e.message);
  }
}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[store] 持久化失败：', e.message);
  }
}

// ===== 密码哈希（pbkdf2 + 随机盐，零依赖） =====
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

function verifyPassword(user, password) {
  if (!user || !user.salt || !user.hash) return false;
  const hash = crypto.pbkdf2Sync(password, user.salt, 100000, 32, 'sha256').toString('hex');
  // 常量时间比较防时序攻击
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(user.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ===== 用户 =====
function findUserByIdentifier(identifier) {
  const key = String(identifier).trim().toLowerCase();
  return data.users.find(u => u.identifier === key) || null;
}

function findUserById(id) {
  return data.users.find(u => u.id === id) || null;
}

function createUser(identifier, password, name) {
  const key = String(identifier).trim().toLowerCase();
  const { salt, hash } = hashPassword(password);
  const user = {
    id: 'u' + Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
    identifier: key,
    name: name && name.trim() ? name.trim() : key,
    salt,
    hash,
    createdAt: new Date().toISOString(),
  };
  data.users.push(user);
  persist();
  return user;
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, identifier: user.identifier, name: user.name, createdAt: user.createdAt };
}

// ===== 提醒（按用户隔离） =====
function getReminders(userId) {
  return data.reminders.filter(r => r.userId === userId);
}

// 全量同步：用客户端传来的完整列表替换该用户的所有提醒（幂等、避免逐条并发冲突）
function replaceReminders(userId, list) {
  data.reminders = data.reminders.filter(r => r.userId !== userId);
  const now = new Date().toISOString();
  const incoming = Array.isArray(list) ? list : [];
  incoming.forEach(r => {
    const item = {
      id: r.id != null ? r.id : Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
      userId,
      type: r.type || 'custom',
      title: r.title || '提醒',
      desc: r.desc || '',
      time: r.time || '08:00',
      date: r.date || '',
      repeat: r.repeat || '仅一次',
      method: r.method || 'alarm',
      enabled: r.enabled !== false,
      icon: r.icon || 'bell',
      createdAt: now,
      updatedAt: now,
    };
    data.reminders.push(item);
  });
  persist();
  return getReminders(userId);
}

function createReminder(userId, r) {
  const item = {
    id: r.id != null ? r.id : Date.now() + '_' + crypto.randomBytes(3).toString('hex'),
    userId,
    type: r.type || 'custom',
    title: r.title || '提醒',
    desc: r.desc || '',
    time: r.time || '08:00',
    date: r.date || '',
    repeat: r.repeat || '仅一次',
    method: r.method || 'alarm',
    enabled: r.enabled !== false,
    icon: r.icon || 'bell',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.reminders.push(item);
  persist();
  return item;
}

function updateReminder(userId, id, patch) {
  const r = data.reminders.find(x => x.userId === userId && String(x.id) === String(id));
  if (!r) return null;
  ['type', 'title', 'desc', 'time', 'date', 'repeat', 'method', 'enabled', 'icon'].forEach(k => {
    if (patch[k] !== undefined) r[k] = patch[k];
  });
  if (typeof patch.enabled === 'boolean') r.enabled = patch.enabled;
  r.updatedAt = new Date().toISOString();
  persist();
  return r;
}

function deleteReminder(userId, id) {
  const idx = data.reminders.findIndex(x => x.userId === userId && String(x.id) === String(id));
  if (idx < 0) return null;
  const removed = data.reminders.splice(idx, 1)[0];
  persist();
  return removed;
}

// ===== 行程（按用户隔离，基础 CRUD） =====
function getTrips(userId) {
  return data.trips.filter(t => t.userId === userId);
}

function createTrip(userId, t) {
  const item = Object.assign({ userId, createdAt: new Date().toISOString() }, t);
  if (item.id == null) item.id = Date.now() + '_' + crypto.randomBytes(3).toString('hex');
  data.trips.push(item);
  persist();
  return item;
}

function deleteTrip(userId, id) {
  const idx = data.trips.findIndex(x => x.userId === userId && String(x.id) === String(id));
  if (idx < 0) return null;
  const removed = data.trips.splice(idx, 1)[0];
  persist();
  return removed;
}

module.exports = {
  load,
  persist,
  verifyPassword,
  findUserByIdentifier,
  findUserById,
  createUser,
  publicUser,
  getReminders,
  replaceReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getTrips,
  createTrip,
  deleteTrip,
};
