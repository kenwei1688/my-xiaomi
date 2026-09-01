// lib/providers/mock.js — 默认模拟供应商（零依赖，本地生成订单）
const ETA_MAP = {
  food: '约 30 分钟送达',
  hotel: '预订已确认，可凭身份证入住',
  train: '购票成功，请提前取票',
  flight: '出票成功，请提前值机'
};
const SUMMARY_MAP = {
  food: (d) => `${d.category || '餐品'} · ${d.detail || ''} → ${d.address || '地址待填'}`,
  hotel: (d) => `${d.city || ''} ${d.area || ''} ${d.level || ''}酒店 ${d.checkin || ''} 至 ${d.checkout || ''}`,
  train: (d) => `${d.from || ''} → ${d.to || ''} ${d.date || ''} ${d.prefer || ''} ${d.seat || ''}`,
  flight: (d) => `${d.from || ''} → ${d.to || ''} ${d.date || ''} ${d.cabin || ''}`
};

export default {
  name: 'mock',
  async submit(type, detail = {}) {
    const orderNo = type.toUpperCase() + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
    const summary = (SUMMARY_MAP[type] || (() => JSON.stringify(detail)))(detail);
    return {
      orderNo,
      provider: '模拟供应商（MVP）',
      summary,
      eta: ETA_MAP[type] || '已处理',
      status: 'success',
      createdAt: new Date().toISOString()
    };
  }
};
