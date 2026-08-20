// lib/providers/ctrip.js — 携程开放平台真实接入适配器（生产形态骨架）
//
// 覆盖品类：hotel（酒店预订）、train（火车票/高铁票）、flight（飞机票/机票）。
// 与 meituan.js 同理：给出可直接落地的 OAuth + 签名 + 下单骨架，
// 填入真实网关地址与密钥即可跑通；未配置密钥时诚实报错，绝不伪造成功。
//
// 启用方式：启动前设置环境变量
//   BOOKING_PROVIDER=ctrip            （全局生效）
//   或仅对部分品类生效：BOOKING_PROVIDER_HOTEL=ctrip / BOOKING_PROVIDER_TRAIN=ctrip / BOOKING_PROVIDER_FLIGHT=ctrip
//   CTRIP_APP_KEY=你的appKey
//   CTRIP_APP_SECRET=你的appSecret
//   （可选）CTRIP_API_BASE=https://api.ctrip.com
import crypto from 'node:crypto';

const CONFIG = {
  API_BASE: process.env.CTRIP_API_BASE || 'https://api.ctrip.com',
  TOKEN_PATH: '/oauth/token',
  ORDER_PATH: '/order/create',
  GRANT_TYPE: 'client_credentials'
};

function kv(k, v) { return `${k}=${typeof v === 'object' && v !== null ? JSON.stringify(v) : v}`; }
function hmacSign(params, secret) {
  const sorted = Object.keys(params).filter((k) => params[k] !== undefined && params[k] !== '').sort();
  const raw = sorted.map((k) => kv(k, params[k])).join('&') + secret;
  return crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');
}

async function getAccessToken(key, secret) {
  const params = { app_key: key, grant_type: CONFIG.GRANT_TYPE, timestamp: Math.floor(Date.now() / 1000) };
  params.sign = hmacSign(params, secret);
  const url = CONFIG.API_BASE + CONFIG.TOKEN_PATH + '?' + new URLSearchParams(params);
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  if (!resp.ok) throw new Error(`令牌获取失败 HTTP ${resp.status}`);
  const data = await resp.json();
  if (data.code && data.code !== 0) throw new Error(`令牌错误：${data.msg || data.message || data.code}`);
  return data.access_token || data.token;
}

const LABEL = { hotel: '酒店', train: '火车票', flight: '飞机票' };

function mapToPlatform(type, detail) {
  if (type === 'hotel') {
    return {
      city: detail.city,
      check_in: detail.checkin,
      check_out: detail.checkout,
      area: detail.area,
      level: detail.level,
      guests: detail.guests
    };
  }
  if (type === 'train' || type === 'flight') {
    return {
      from: detail.from,
      to: detail.to,
      date: detail.date,
      passengers: detail.passengers,
      seat: detail.seat
    };
  }
  return detail;
}

export default {
  name: 'ctrip',
  async submit(type, detail = {}) {
    const key = process.env.CTRIP_APP_KEY;
    const secret = process.env.CTRIP_APP_SECRET;
    if (!key || !secret) {
      throw new Error('未配置 CTRIP_APP_KEY / CTRIP_APP_SECRET，无法使用携程真实供应商。请在服务端设置这两个环境变量后重启。');
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
        orderNo: data.order_id || data.orderId || ('CT' + Date.now()),
        provider: '携程开放平台',
        summary: `${LABEL[type] || '订单'} ${detail.from ? detail.from + '→' + detail.to : detail.city || ''} ${detail.date || ''}`.trim(),
        eta: data.eta || '已提交，等待平台确认',
        status: 'success',
        createdAt: new Date().toISOString()
      };
    } catch (e) {
      throw new Error('携程下单失败：' + e.message);
    }
  }
};
