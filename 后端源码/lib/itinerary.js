// lib/itinerary.js — 离线行程生成
import { CITIES, knownCity } from './cities.js';

const GENERIC = {
  food: ['当地特色菜', '街头小吃', '网红餐厅'],
  morning: [{ name: '城市地标 / 博物馆', desc: '了解当地历史文化' }],
  afternoon: [{ name: '老城区漫步', desc: '感受市井生活' }],
  evening: [{ name: '夜市 / 滨江夜景', desc: '体验夜生活' }],
  tip: '未收录该城市，已生成通用模板，可按喜好自由调整。'
};

export function generatePlan(destination, days) {
  const key = knownCity(destination);
  const data = key ? CITIES[key] : GENERIC;
  const cityName = key || destination;

  const plan = [];
  for (let d = 1; d <= days; d++) {
    const morning = data.morning[(d - 1) % data.morning.length];
    const afternoon = data.afternoon[(d - 1) % data.afternoon.length];
    const evening = data.evening[(d - 1) % data.evening.length];
    const lunch = data.food[(d * 2) % data.food.length];
    const dinner = data.food[(d * 2 + 1) % data.food.length];
    plan.push({
      day: d,
      items: [
        { time: '上午', title: morning.name, desc: morning.desc },
        { time: '午餐', title: lunch, desc: '当地推荐美食' },
        { time: '下午', title: afternoon.name, desc: afternoon.desc },
        { time: '晚餐', title: dinner, desc: '当地推荐美食' },
        { time: '晚上', title: evening.name, desc: evening.desc }
      ]
    });
  }
  return {
    destination: cityName,
    days,
    known: !!key,
    tip: data.tip,
    plan
  };
}
