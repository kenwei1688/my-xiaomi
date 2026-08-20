// db.js — SQLite 持久层（node:sqlite，零额外依赖）+ 多租户
// 设计：每个用户一份独立数据桶（内存惰性加载，SQLite 持久化）。
//       未登录访问使用匿名桶 'me'；登录后按 token 中的 userId 隔离。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 数据目录：优先取环境变量 DATA_DIR（部署平台挂载持久卷时指定），本地默认 ./data
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SQLITE_FILE = path.join(DATA_DIR, 'xiaomi.db');
const JSON_FILE = path.join(DATA_DIR, 'store.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const COLLECTIONS = ['quickCommands', 'reminders', 'goals', 'itineraries', 'plans', 'diary', 'bookings', 'notifications'];

const DEFAULT_QUICK_COMMANDS = [
  { id: 'qc_demo_waimai', title: '点午餐外卖', icon: '🍱', trigger: '点午餐', actionType: 'booking', payload: { type: 'food', preset: '午餐' }, createdAt: new Date().toISOString() },
  { id: 'qc_demo_hotel', title: '订出差酒店', icon: '🏨', trigger: '订酒店', actionType: 'booking', payload: { type: 'hotel' }, createdAt: new Date().toISOString() },
  { id: 'qc_demo_trip', title: '规划周边游', icon: '🧳', trigger: '周边游', actionType: 'itinerary', payload: { destination: '', days: 2 }, createdAt: new Date().toISOString() }
];
const ANON_USER = 'me';

let sql = null;
let backend = 'json'; // 'sqlite' | 'json'
const states = {};     // userId -> 用户数据桶（内存）
let users = [];        // 注册用户（内存，SQLite 时以库为准）

function clone(o) { return JSON.parse(JSON.stringify(o)); }
function nowISO() { return new Date().toISOString(); }
function ensureDir() { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); }
export function uid(prefix = 'id') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

function emptyUserState() {
  return { quickCommands: clone(DEFAULT_QUICK_COMMANDS), reminders: [], goals: [], itineraries: [], plans: [], diary: [], bookings: [], notifications: [], pendingBooking: null };
}

// ---- SQLite 初始化 ----
async function initSqlite() {
  try {
    const mod = await import('node:sqlite');
    const DatabaseSync = mod.DatabaseSync;
    if (!DatabaseSync) return false;
    ensureDir();
    const db = new DatabaseSync(SQLITE_FILE);
    db.exec(`
      PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS docs (
        id TEXT NOT NULL, user_id TEXT NOT NULL, type TEXT NOT NULL,
        data TEXT NOT NULL, created_at TEXT, PRIMARY KEY (id)
      );
      CREATE INDEX IF NOT EXISTS idx_docs_user_type ON docs(user_id, type);
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, pass_hash TEXT NOT NULL, created_at TEXT
      );
    `);
    sql = db;
    backend = 'sqlite';
    console.log('[db] 使用 SQLite 持久化：', SQLITE_FILE);
    return true;
  } catch (e) {
    console.warn('[db] SQLite 不可用（加 --experimental-sqlite 可启用），回退 JSON 文件：', e.message);
    return false;
  }
}

// ---- 用户数据桶（惰性加载） ----
function loadUserState(userId) {
  if (states[userId]) return states[userId];
  const s = emptyUserState();
  if (backend === 'sqlite' && sql) {
    for (const type of COLLECTIONS) {
      const rows = sql.prepare(`SELECT data FROM docs WHERE user_id=? AND type=? ORDER BY rowid ASC`).all(userId, type);
      s[type] = rows.map((r) => JSON.parse(r.data));
    }
  }
  states[userId] = s;
  return s;
}

function persistUser(userId) {
  const s = states[userId];
  if (!s) return;
  if (backend !== 'sqlite' || !sql) return saveJsonUser(userId);
  sql.exec('BEGIN');
  try {
    sql.prepare(`DELETE FROM docs WHERE user_id=?`).run(userId);
    const ins = sql.prepare(`INSERT INTO docs (id, user_id, type, data, created_at) VALUES (?, ?, ?, ?, ?)`);
    for (const type of COLLECTIONS) {
      for (const item of (s[type] || [])) {
        ins.run(item.id || `${type}_${Math.random().toString(36).slice(2)}`, userId, type, JSON.stringify(item), item.createdAt || nowISO());
      }
    }
    sql.exec('COMMIT');
  } catch (e) {
    try { sql.exec('ROLLBACK'); } catch (_) {}
    console.error('[db] 持久化失败:', e.message);
  }
}

// 返回某用户的集合访问器（兼容旧调用点的 .reminders / .getState() / .save() / .pushNotification()）
export function forUser(userId) {
  const uidKey = userId || ANON_USER;
  const s = loadUserState(uidKey);
  return {
    getState: () => s,
    get reminders() { return s.reminders; },
    get goals() { return s.goals; },
    get itineraries() { return s.itineraries; },
    get plans() { return s.plans; },
    get diary() { return s.diary; },
    get bookings() { return s.bookings; },
    get quickCommands() { return s.quickCommands; },
    get notifications() { return s.notifications; },
    save: () => persistUser(uidKey),
    pushNotification: ({ text, level = 'info' }) => {
      const n = { id: uid('nt'), text, level, read: false, createdAt: nowISO() };
      s.notifications.unshift(n);
      if (s.notifications.length > 50) s.notifications.length = 50;
      persistUser(uidKey);
      return n;
    }
  };
}

// 已加载的所有用户桶（供提醒调度遍历）：[{ userId, state }]
export function allUserEntries() { return Object.entries(states).map(([userId, s]) => ({ userId, state: s })); }

// ---- 用户账户（注册 / 登录 / 校验） ----
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPasswordHash(stored, password) {
  const [salt, hash] = (stored || '').split(':');
  if (!salt || !hash) return false;
  const calc = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calc, 'hex'));
}

function loadUsersJson() {
  ensureDir();
  if (fs.existsSync(USERS_FILE)) {
    try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { users = []; }
  }
}
function saveUsersJson() {
  ensureDir();
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8'); } catch (e) { console.error('[db] users 写入失败:', e.message); }
}

export function registerUser(username, password) {
  if (!username || !password) throw new Error('用户名和密码必填');
  if (String(password).length < 4) throw new Error('密码至少 4 位');
  if (getUserByUsername(username)) throw new Error('用户名已存在');
  const u = { id: uid('u'), username, pass_hash: hashPassword(password), created_at: nowISO() };
  if (backend === 'sqlite' && sql) {
    sql.prepare(`INSERT INTO users (id, username, pass_hash, created_at) VALUES (?, ?, ?, ?)`).run(u.id, username, u.pass_hash, u.created_at);
  } else {
    users.push(u); saveUsersJson();
  }
  return { id: u.id, username: u.username };
}

export function getUserByUsername(username) {
  if (backend === 'sqlite' && sql) {
    const row = sql.prepare(`SELECT * FROM users WHERE username=?`).get(username);
    return row ? { id: row.id, username: row.username, pass_hash: row.pass_hash } : null;
  }
  return users.find((u) => u.username === username) || null;
}

export function verifyCredentials(username, password) {
  const u = getUserByUsername(username);
  if (!u) return null;
  if (!verifyPasswordHash(u.pass_hash, password)) return null;
  return { id: u.id, username: u.username };
}

export function backendName() { return backend; }
export function anonUser() { return ANON_USER; }

// ---- 管理后台统计 ----
export function userCount() {
  if (backend === 'sqlite' && sql) return sql.prepare('SELECT COUNT(*) c FROM users').get().c;
  return users.length;
}
export function collectionCounts() {
  const counts = {};
  COLLECTIONS.forEach((c) => { counts[c] = 0; });
  if (backend === 'sqlite' && sql) {
    const rows = sql.prepare('SELECT type, COUNT(*) c FROM docs GROUP BY type').all();
    rows.forEach((r) => { counts[r.type] = r.c; });
  } else {
    Object.values(states).forEach((s) => { COLLECTIONS.forEach((c) => { counts[c] += (s[c] || []).length; }); });
  }
  return counts;
}

export async function load() {
  if (!sql) {
    const ok = await initSqlite();
    if (!ok) { loadUsersJson(); }
  }
  return true;
}

export default { load, forUser, allUserEntries, registerUser, getUserByUsername, verifyCredentials, backendName, anonUser, uid, userCount, collectionCounts };
