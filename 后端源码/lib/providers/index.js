// lib/providers/index.js — 供应商适配层：按环境变量选择下单通道
import mock from './mock.js';

// 注册可用供应商；新增真实平台时在下方接入并注册。
// 真实平台默认不启用，需设置环境变量 BOOKING_PROVIDER=<name> 才生效。
import meituan from './meituan.js';
import ctrip from './ctrip.js';
const registry = { mock, meituan, ctrip };

// 按品类选择供应商：优先用 BOOKING_PROVIDER_<TYPE>（如 BOOKING_PROVIDER_HOTEL=ctrip），
// 否则回退全局 BOOKING_PROVIDER，再回退 mock。
export function providerForType(type) {
  const specific = process.env['BOOKING_PROVIDER_' + type.toUpperCase()];
  const name = (specific || process.env.BOOKING_PROVIDER || 'mock').toLowerCase();
  const p = registry[name] || mock;
  if (name !== 'mock' && !registry[name]) {
    console.warn(`[provider] 未知供应商 "${name}"，回退 mock`);
  }
  return p;
}

export function getProvider() { return providerForType('default'); }

export async function submitOrder(type, detail = {}) {
  const p = providerForType(type);
  try {
    const r = await p.submit(type, detail);
    return { ...r, provider: r.provider || p.name };
  } catch (e) {
    console.error(`[provider] ${p.name} 下单失败:`, e.message);
    return {
      orderNo: 'ERR',
      provider: p.name,
      summary: '下单失败：' + e.message,
      eta: '',
      status: 'failed',
      error: e.message,
      createdAt: new Date().toISOString()
    };
  }
}

// 返回各品类当前生效的供应商名（前端展示用）
export function providerName() {
  const map = {};
  for (const t of ['food', 'hotel', 'train', 'flight']) map[t] = providerForType(t).name;
  map.default = providerForType('default').name;
  return map;
}

// 返回各品类供应商就绪状态：是否已选真实供应商、且密钥已配置（可真正下单）
export function providerStatus() {
  const meituanReady = !!(process.env.MEITUAN_APP_KEY && process.env.MEITUAN_APP_SECRET);
  const ctripReady = !!(process.env.CTRIP_APP_KEY && process.env.CTRIP_APP_SECRET);
  const info = {};
  for (const t of ['food', 'hotel', 'train', 'flight']) {
    const name = providerForType(t).name;
    const real = name !== 'mock';
    const keys = name === 'meituan' ? meituanReady : name === 'ctrip' ? ctripReady : false;
    info[t] = { provider: name, real, configured: real && keys };
  }
  info.default = providerForType('default').name;
  return info;
}
