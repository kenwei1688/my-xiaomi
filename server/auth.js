// ==================== 生活小秘 - 鉴权（零依赖） ====================
// 使用 HMAC-SHA256 签发/校验 Bearer Token（payload 含 uid 与过期时间）。
// 生产环境请通过环境变量 JWT_SECRET 设置强密钥。

const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'life-secret-change-me-in-prod';
const TOKEN_TTL_MS = 30 * 24 * 3600 * 1000; // 30 天

function base64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

function sign(payload) {
  const body = base64url(Buffer.from(JSON.stringify(payload)));
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest();
  return body + '.' + base64url(sig);
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = base64url(crypto.createHmac('sha256', SECRET).update(body).digest());
  // 常量时间比较
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromBase64url(body).toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function issueToken(uid) {
  return sign({ uid, exp: Date.now() + TOKEN_TTL_MS, iat: Date.now() });
}

module.exports = { issueToken, verifyToken };
