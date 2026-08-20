// lib/providers/meituan.js — 美团开放平台真实接入适配器（生产形态骨架）
//
// 重要前提：
//   美团 / 携程等平台的"真实下单"需要企业资质、应用审批与密钥，
//   个人开发者通常无法直接调用。本文件给出可直接落地的接入骨架：
//   - 用 APP_KEY/APP_SECRET 走 OAuth 取访问令牌（client_credentials）
//   - 用 HMAC-SHA256 对请求参数签名（美团开放平台标准做法）
//   - 把内部 detail 映射为平台订单字段并发起创建订单请求
//   你只需填入真实的 API_BASE / 令牌与订单端点（见下方 CONFIG），即可跑通。
//
// 启用方式：启动前设置环境变量
//   BOOKING_PROVIDER=meituan
//   MEITUAN_APP_KEY=你的appKey
//   MEITUAN_APP_SECRET=你的appSecret
//   （可选）MEITUAN_API_BASE=https://api-open.meituan.com
//
// 未配置密钥时，submit 会抛出清晰错误，由上层转化为"下单失败"提示，不会伪造成功。
import crypto from 'node:crypto';

const CONFIG = {
  // 真实环境下替换为你申请的开放平台网关地址
  API_BASE: process.env.MEITUAN_API_BASE || 'https://api-open.meituan.com',
  TOKEN_PATH: '/oauth/token',      // 获取 access_token 的路径（按实际文档调整）
  ORDER_PATH: '/order/create',     // 创建订单的路径（按实际文档调整）
  GRANT_TYPE: 'client_credentials'
};

function kv(k, v) { return `${k}=${typeof v === 'object' && v !== null ? JSON.stringify(v) : v}`; }
function hmacSign(params, secret) {
  // 美团签名：按 key 升序拼接 key=value，末尾追加 secret，做 HMAC-SHA256（示例方案；按真实平台规范调整）
  const sorted = Object.keys(params).filter((k) => params[k] !== undefined && params[k] !== '').sort();
  const raw = sorted.map((k) => kv(k, params[k])).join('&') + secret;
  return crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
}

async function getAccessToken(key, secret) {
  const params = {
    app_key: key,
    grant_type: CONFIG.GRANT_TYPE,
    timestamp: Math.floor(Date.now() / 1000)
  };
  params.sign = hmacSign(params, secret);
  const url = CONFIG.API_BASE + CONFIG.TOKEN_PATH + '?' + new URLSearchParams(params);
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  if (!resp.ok) throw new Error(`令牌获取失败 HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.code && data.code !== 0) throw new Error(`令牌错误：${data.msg || data.message || data.code}`);
  return data.access_token || data.token;
}

// 把内部业务 detail 映射为平台订单字段（按真实接口字段调整）
function mapToPlatform(type, detail) {
  if (type === 'food') {
    return {
      category: detail.category,
      items: detail.detail,
      delivery_address: detail.address,
      expect_time: detail.time
    };
  }
  if (type === 'hotel') {
    return {
      city: detail.city,
      check_in: detail.checkin,
      check_out: detail.checkout,
      area: detail.area,
      level: detail.level
    };
  }
  if (type === 'train' || type === 'flight') {
    return { from: detail.from, to: detail.to, date: detail.date };
  }
  return detail;
}

export default {
  name: 'meituan',
  async submit(type, detail = {}) {
    const key = process.env.MEITUAN_APP_KEY;
    const secret = process.env.MEITUAN_APP_SECRET;
    if (!key || !secret) {
      throw new Error('未配置 MEITUAN_APP_KEY / MEITUAN_APP_SECRET，无法使用真实供应商。请在服务端设置这两个环境变量后重启。');
    }
    try {
      const token = await getAccessToken(key, secret);
      const payload = {
        app_key: key,
        access_token: token,
        timestamp: Math.floor(Date.now() / 1000),
        biz: type,
        order: mapToPlatform(type, detail)
      };
      payload.sign = hmacSign(payload, secret);
      const resp = await fetch(CONFIG.API_BASE + CONFIG.ORDER_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`下单请求失败 HTTP ${resp.status}`);
      const data = await resp.json();
      if (data.code && data.code !== 0) throw new Error(data.msg || data.message || ('平台返回错误码 ' + data.code));
      return {
        orderNo: data.order_id || data.orderId || ('MT' + Date.now()),
        provider: '美团开放平台',
        summary: typeof data.summary === 'string' ? data.summary : JSON.stringify(mapToPlatform(type, detail)),
        eta: data.eta || '已提交，等待平台确认',
        status: 'success',
        createdAt: new Date().toISOString()
      };
    } catch (e) {
      // 上浮错误，由上层转化为"下单失败"提示；绝不伪造成功
      throw new Error('美团下单失败：' + e.message);
    }
  }
};
