// lib/booking.js — 下单表单与确认（下单逻辑委托给 lib/providers 适配层）
// 供应商可插拔：默认 mock，设置 BOOKING_PROVIDER=meituan 等可切换真实平台。
import { submitOrder } from './providers/index.js';

const TYPE_LABEL = {
  food: '外卖订餐',
  hotel: '酒店预订',
  train: '火车票',
  flight: '飞机票'
};

export function typeLabel(t) { return TYPE_LABEL[t] || '下单'; }

// 不同业务类型的表单字段
export function buildBookingForm(type, prefill = {}) {
  const base = { type, title: TYPE_LABEL[type] || '下单', fields: [] };
  if (type === 'food') {
    base.fields = [
      { key: 'category', label: '餐品类型', type: 'select', options: ['中餐', '西餐', '快餐', '奶茶小吃'], value: prefill.category || '' },
      { key: 'detail', label: '菜品 / 备注', type: 'text', placeholder: '例如：黄焖鸡米饭 不加辣', value: prefill.detail || '' },
      { key: 'address', label: '送餐地址', type: 'text', placeholder: '例如：公司3号楼', value: prefill.address || '' },
      { key: 'time', label: '期望送达', type: 'text', placeholder: '例如：12:30 或 尽快', value: prefill.time || '' }
    ];
  } else if (type === 'hotel') {
    base.fields = [
      { key: 'city', label: '城市', type: 'text', placeholder: '例如：成都', value: prefill.city || prefill.destination || '' },
      { key: 'checkin', label: '入住日期', type: 'date', value: prefill.checkin || '' },
      { key: 'checkout', label: '离店日期', type: 'date', value: prefill.checkout || '' },
      { key: 'area', label: '商圈 / 地段', type: 'text', placeholder: '例如：春熙路', value: prefill.area || '' },
      { key: 'level', label: '价位', type: 'select', options: ['经济', '舒适', '高档'], value: prefill.level || '舒适' }
    ];
  } else if (type === 'train') {
    base.fields = [
      { key: 'from', label: '出发城市', type: 'text', value: prefill.from || '' },
      { key: 'to', label: '到达城市', type: 'text', value: prefill.to || '' },
      { key: 'date', label: '出发日期', type: 'date', value: prefill.date || '' },
      { key: 'prefer', label: '车次偏好', type: 'select', options: ['高铁', '普通列车'], value: prefill.prefer || '高铁' },
      { key: 'seat', label: '座位', type: 'select', options: ['二等座', '一等座', '商务座'], value: prefill.seat || '二等座' }
    ];
  } else if (type === 'flight') {
    base.fields = [
      { key: 'from', label: '出发城市', type: 'text', value: prefill.from || '' },
      { key: 'to', label: '到达城市', type: 'text', value: prefill.to || '' },
      { key: 'date', label: '出发日期', type: 'date', value: prefill.date || '' },
      { key: 'cabin', label: '舱位', type: 'select', options: ['经济舱', '商务舱', '头等舱'], value: prefill.cabin || '经济舱' }
    ];
  }
  return base;
}

// 确认下单：委托给当前供应商适配层（默认 mock，可切换真实平台）
export async function confirmBooking(type, detail = {}) {
  return await submitOrder(type, detail);
}
