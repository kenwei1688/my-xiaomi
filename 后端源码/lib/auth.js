// lib/auth.js — 零依赖 JWT（HS256，node:crypto 自签）
import crypto from 'node:crypto';

const SECRET = process.env.JWT_SECRET || 'xiaomi-secretary-dev-secret-change-me';

function b64url(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }

// 签发 token，默认 30 天有效
export function sign(payload, expHours = 720) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + expHours * 3600 };
  const h = b64url(header);
  const p = b64url(body);
  const sig = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
  return `${h}.${p}.${sig}`;
}

// 校验 token，返回 payload 或 null
export function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
