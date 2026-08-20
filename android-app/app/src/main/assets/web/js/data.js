// ==================== 生活小秘 - 模拟数据 (v2.0 全面升级版) ====================

// 图片辅助函数：picsum真实图片 + CSS渐变兜底
function pic(seed, w, h) {
    return `url('https://picsum.photos/seed/${seed}/${w}/${h}'), linear-gradient(135deg,#FF6B35,#FFAB40)`;
}
function picG(seed, w, h, c1, c2) {
    return `url('https://picsum.photos/seed/${seed}/${w}/${h}'), linear-gradient(135deg,${c1},${c2})`;
}

// ===== SVG 图标库 (stroke 风格，白色) =====
const SVG = {
    // 分类图标
    food: '<path d="M4 11h16M4 11a8 8 0 0016 0M9 3v4M12 3v4M15 3v4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>',
    massage: '<circle cx="12" cy="7" r="3" stroke="#fff" stroke-width="2" fill="none"/><path d="M7 21v-4a5 5 0 0110 0v4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    car: '<path d="M5 13l1.5-5h11L19 13v4H5v-4z" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/><circle cx="8" cy="17" r="1.5" fill="#fff"/><circle cx="16" cy="17" r="1.5" fill="#fff"/>',
    camera: '<path d="M9 4l-2 2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-3l-2-2H9z" stroke="#fff" stroke-width="2" fill="none"/><circle cx="12" cy="13" r="3" stroke="#fff" stroke-width="2" fill="none"/>',
    plane: '<path d="M21 15v-2l-8-4.5V3a1.5 1.5 0 00-3 0v5.5L2 13v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5l8 2.5z" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/>',
    dumbbell: '<rect x="2" y="9" width="4" height="6" rx="1" stroke="#fff" stroke-width="2" fill="none"/><rect x="18" y="9" width="4" height="6" rx="1" stroke="#fff" stroke-width="2" fill="none"/><rect x="6" y="11" width="12" height="2" stroke="#fff" stroke-width="2" fill="none"/>',
    mic: '<rect x="9" y="3" width="6" height="10" rx="3" stroke="#fff" stroke-width="2" fill="none"/><path d="M6 11a6 6 0 0012 0M12 17v3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    film: '<rect x="3" y="5" width="18" height="14" rx="2" stroke="#fff" stroke-width="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="#fff" stroke-width="1.5"/><line x1="3" y1="15" x2="21" y2="15" stroke="#fff" stroke-width="1.5"/><line x1="7" y1="5" x2="7" y2="19" stroke="#fff" stroke-width="1.5"/><line x1="17" y1="5" x2="17" y2="19" stroke="#fff" stroke-width="1.5"/>',
    // 功能图标
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/>',
    clock: '<circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2" fill="none"/><path d="M12 7v5l3 2" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>',
    pin: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#fff" stroke-width="2" fill="none"/><circle cx="12" cy="9" r="2.5" stroke="#fff" stroke-width="2" fill="none"/>',
    wallet: '<path d="M21 12a2.5 2.5 0 01-2.5 2.5H5a3 3 0 010-6h13.5A2.5 2.5 0 0121 11v1z" stroke="#fff" stroke-width="2" fill="none"/><path d="M16 9.5V7a2 2 0 00-2-2H5a3 3 0 00-3 3v8a3 3 0 003 3h13a3 3 0 003-3v-2.5" stroke="#fff" stroke-width="2" fill="none"/>',
    gift: '<path d="M20 12v8a1 1 0 01-1 1H5a1 1 0 01-1-1v-8M2 7h20v5H2V7zM12 22V7M12 7S10 2 7 2s-2 5 5 5zM12 7s2-5 5-5 2 5-5 5z" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    crown: '<path d="M5 16L3 7l5.5 4L12 4l3.5 7L21 7l-2 9H5zM5 20h14" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    store: '<path d="M3 9l1.5-5h15L21 9M3 9v3a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0V9M5 12v8h14v-8" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    headset: '<path d="M3 14v-2a9 9 0 0118 0v2M3 14a2 2 0 002 2h1v-6H5a2 2 0 00-2 2v2zM21 14a2 2 0 01-2 2h-1v-6h1a2 2 0 012 2v2zM18 16v1a4 4 0 01-4 4h-3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    // 设置图标
    bell: '<path d="M18 16v-5a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2zM10 21a2 2 0 004 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2" stroke="#fff" stroke-width="2" fill="none"/><path d="M8 11V7a4 4 0 018 0v4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    gear: '<circle cx="12" cy="12" r="3" stroke="#fff" stroke-width="2" fill="none"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="#fff" stroke-width="2" fill="none"/>',
    question: '<circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2" fill="none"/><path d="M9.5 9a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 18.5h.01" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    info: '<circle cx="12" cy="12" r="9" stroke="#fff" stroke-width="2" fill="none"/><path d="M12 11v5M12 7.5h.01" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    // 订单图标
    card: '<rect x="2" y="5" width="20" height="14" rx="2" stroke="#fff" stroke-width="2" fill="none"/><line x1="2" y1="10" x2="22" y2="10" stroke="#fff" stroke-width="2"/>',
    ticket: '<path d="M3 8a2 2 0 012-2h14a2 2 0 012 2 2 2 0 000 4 2 2 0 01-2 2H5a2 2 0 01-2-2 2 2 0 000-4z" stroke="#fff" stroke-width="2" fill="none"/><path d="M14 6v12" stroke="#fff" stroke-width="2" fill="none"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    // UI 图标
    search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z" fill="currentColor"/></svg>',
    starFill: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
    heart: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    heartFill: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    comment: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" stroke-width="2" fill="none"/></svg>',
    share: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="2"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="2"/></svg>',
    location: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" fill="#FF6B35"/></svg>',
    send: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="#fff"/></svg>',
    chevronRight: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    // Tab 图标
    tabHome: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    tabHomeActive: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z"/></svg>',
    tabRecommend: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    tabRecommendActive: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z"/></svg>',
    tabAssistant: '<svg width="28" height="28" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" fill="currentColor"/><circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/><path d="M9 14h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>',
    tabNewest: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 4h16v16l-4-3-4 3-4-3-4 3V4z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/></svg>',
    tabNewestActive: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v16l-4-3-4 3-4-3-4 3V4z"/></svg>',
    tabProfile: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    tabProfileActive: '<svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>',
};

// ===== 分类数据 =====
const CATEGORIES = [
    { name: '美食', icon: SVG.food, bg: 'linear-gradient(135deg,#FF6B35,#FF9A56)' },
    { name: '足疗按摩', icon: SVG.massage, bg: 'linear-gradient(135deg,#34C759,#30D158)' },
    { name: '打车出行', icon: SVG.car, bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)' },
    { name: '景点游玩', icon: SVG.camera, bg: 'linear-gradient(135deg,#AF52DE,#D65BFF)' },
    { name: '旅游度假', icon: SVG.plane, bg: 'linear-gradient(135deg,#FF9500,#FFB800)' },
    { name: '运动健身', icon: SVG.dumbbell, bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)' },
    { name: 'KTV', icon: SVG.mic, bg: 'linear-gradient(135deg,#5856D6,#7B79F0)' },
    { name: '电影演出', icon: SVG.film, bg: 'linear-gradient(135deg,#00C7BE,#30D5C8)' },
];

// ===== 轮播图 =====
const BANNERS = [
    { title: '周末美食狂欢节', subtitle: '满100减50 · 限时抢购', img: picG('foodbanner1',400,200,'#FF6B35','#FF9A56'), tag: '热门' },
    { title: '足疗养生5折起', subtitle: '放松身心 · 从足疗开始', img: picG('spabanner1',400,200,'#34C759','#30D158'), tag: '养生' },
    { title: '暑期旅游特惠', subtitle: '海边度假仅需 ¥399/人', img: picG('travelbanner1',400,200,'#007AFF','#5AC8FA'), tag: '旅行' },
    { title: 'KTV欢唱之夜', subtitle: '包厢低消 ¥99起 · 含酒水', img: picG('ktvbanner1',400,200,'#5856D6','#7B79F0'), tag: '欢唱' },
];

// ===== 附近热门商家 (10家) =====
const MERCHANTS = [
    {
        name: '川味坊 · 正宗川菜',
        img: picG('sichuan1',400,280,'#FF6B35','#FFAB40'),
        rating: 4.8, distance: '1.2km', address: '南山区海德二道32号',
        cuisine: '川菜', avgPrice: 85, soldCount: '已售3280',
        tags: [{text:'招牌水煮鱼',color:'#FF6B35'},{text:'满100减30',color:'#FF3B30'},{text:'排队15分钟',color:'#007AFF'}],
        isOpen: true, hours: '10:00-22:00',
    },
    {
        name: '松鹤楼 · 足疗SPA养生馆',
        img: picG('spa1',400,280,'#34C759','#AED581'),
        rating: 4.9, distance: '0.8km', address: '南山区文心五路8号',
        cuisine: '足疗按摩', avgPrice: 168, soldCount: '已售1560',
        tags: [{text:'技师手法好',color:'#34C759'},{text:'新客8折',color:'#FF6B35'},{text:'免费茶点',color:'#FF9500'}],
        isOpen: true, hours: '10:00-24:00',
    },
    {
        name: '海世界 · 海洋主题餐厅',
        img: picG('seafood1',400,280,'#007AFF','#5AC8FA'),
        rating: 4.7, distance: '2.1km', address: '南山区海岸城3楼',
        cuisine: '海鲜', avgPrice: 256, soldCount: '已售892',
        tags: [{text:'活海鲜现做',color:'#007AFF'},{text:'亲子推荐',color:'#AF52DE'},{text:'生日特惠',color:'#FF9500'}],
        isOpen: true, hours: '11:00-21:30',
    },
    {
        name: '锐力健身 · 南山店',
        img: picG('gym1',400,280,'#FF2D55','#FF6B6B'),
        rating: 4.6, distance: '1.5km', address: '南山区科技园南区',
        cuisine: '健身', avgPrice: 399, soldCount: '月卡已售560',
        tags: [{text:'私教1对1',color:'#FF2D55'},{text:'团课免费',color:'#34C759'},{text:'新店5折',color:'#FF6B35'}],
        isOpen: true, hours: '06:00-23:00',
    },
    {
        name: '欢乐KTV · 海岸城店',
        img: picG('ktv1',400,280,'#5856D6','#7B79F0'),
        rating: 4.5, distance: '0.5km', address: '南山区海岸城5楼',
        cuisine: 'KTV', avgPrice: 99, soldCount: '已售4200',
        tags: [{text:'曲库更新',color:'#5856D6'},{text:'欢唱3小时',color:'#FF9500'},{text:'含酒水小食',color:'#FF6B35'}],
        isOpen: true, hours: '12:00-06:00',
    },
    {
        name: '老北京涮羊肉',
        img: picG('hotpot1',400,280,'#E53935','#EF5350'),
        rating: 4.7, distance: '1.8km', address: '南山区创业路18号',
        cuisine: '火锅', avgPrice: 128, soldCount: '已售2100',
        tags: [{text:'铜锅涮肉',color:'#E53935'},{text:'正宗麻酱',color:'#FF9500'},{text:'满200减40',color:'#FF6B35'}],
        isOpen: true, hours: '11:00-23:00',
    },
    {
        name: '日料 · 鮨处三味',
        img: picG('sushi1',400,280,'#FF7043','#FFAB91'),
        rating: 4.9, distance: '2.5km', address: '南山区万象天地',
        cuisine: '日料', avgPrice: 198, soldCount: '已售680',
        tags: [{text:'Omakase',color:'#FF7043'},{text:'空运食材',color:'#007AFF'},{text:'需预约',color:'#AF52DE'}],
        isOpen: true, hours: '17:00-23:00',
    },
    {
        name: '万达影城 · IMAX海岸城',
        img: picG('cinema1',400,280,'#00C7BE','#30D5C8'),
        rating: 4.8, distance: '0.3km', address: '南山区海岸城4楼',
        cuisine: '电影', avgPrice: 45, soldCount: '本周热门',
        tags: [{text:'IMAX厅',color:'#00C7BE'},{text:'杜比全景声',color:'#007AFF'},{text:'会员半价',color:'#FF6B35'}],
        isOpen: true, hours: '09:00-24:00',
    },
    {
        name: '悦SPA · 泰式古法按摩',
        img: picG('thaispa1',400,280,'#66BB6A','#AED581'),
        rating: 4.8, distance: '3.0km', address: '南山区蛇口海上世界',
        cuisine: 'SPA按摩', avgPrice: 288, soldCount: '已售920',
        tags: [{text:'泰国技师',color:'#34C759'},{text:'精油SPA',color:'#FF9500'},{text:'送足浴',color:'#FF6B35'}],
        isOpen: true, hours: '10:00-24:00',
    },
    {
        name: '欢乐谷主题公园',
        img: picG('themepark1',400,280,'#FF9500','#FFB800'),
        rating: 4.6, distance: '5.2km', address: '南山区华侨城',
        cuisine: '景点', avgPrice: 230, soldCount: '暑期特惠',
        tags: [{text:'30+项游乐',color:'#FF9500'},{text:'夜场半价',color:'#FF6B35'},{text:'亲子首选',color:'#AF52DE'}],
        isOpen: true, hours: '09:00-21:00',
    },
];

// ===== 特价美食 =====
const DEALS = [
    { title: '老城隍庙小笼包 8只装', price: 19.9, oldPrice: 39, badge: '5折', sold: 1280, img: picG('xiaolong1',200,150,'#FFD180','#FFAB40') },
    { title: '日式拉面定食套餐', price: 29.9, oldPrice: 58, badge: '5折', sold: 860, img: picG('ramen1',200,150,'#FFAB91','#FF7043') },
    { title: '重庆老火锅双人套餐', price: 88, oldPrice: 168, badge: '5折', sold: 2100, img: picG('hotpotdeal1',200,150,'#EF5350','#E53935') },
    { title: '日料寿司拼盘12贯', price: 49, oldPrice: 98, badge: '5折', sold: 560, img: picG('sushideal1',200,150,'#81C784','#43A047') },
    { title: '韩式炸鸡啤酒套餐', price: 59, oldPrice: 118, badge: '5折', sold: 1820, img: picG('chicken1',200,150,'#FFD54F','#FFA000') },
    { title: '粤式早茶点心拼盘', price: 39.9, oldPrice: 79, badge: '5折', sold: 940, img: picG('dimsum1',200,150,'#FFCC80','#FFA726') },
];

// ===== 限时秒杀 =====
const FLASH_SALES = [
    { title: '椰子鸡双人套餐', price: 59, origPrice: 128, progress: 72, img: picG('coconut1',150,100,'#FFF176','#FFD54F') },
    { title: '全身精油SPA 60min', price: 99, origPrice: 298, progress: 45, img: picG('spamassage1',150,100,'#A5D6A7','#66BB6A') },
    { title: '海岸城IMAX电影票', price: 25, origPrice: 60, progress: 88, img: picG('movieticket1',150,100,'#90CAF9','#42A5F5') },
    { title: '欢乐谷全天门票', price: 129, origPrice: 230, progress: 30, img: picG('themeparkticket1',150,100,'#CE93D8','#AB47BC') },
    { title: 'KTV欢唱3小时包厢', price: 79, origPrice: 198, progress: 55, img: picG('ktvdeal1',150,100,'#9FA8DA','#5C6BC0') },
];

// ===== 兴趣品类 =====
const INTEREST_CATEGORIES = [
    { id:'food', name:'美食探店', svg:SVG.food, bg:'linear-gradient(135deg,#FF6B35,#FF9A56)', selected:true },
    { id:'massage', name:'足疗养生', svg:SVG.massage, bg:'linear-gradient(135deg,#34C759,#30D158)', selected:true },
    { id:'travel', name:'旅游度假', svg:SVG.plane, bg:'linear-gradient(135deg,#FF9500,#FFB800)', selected:false },
    { id:'fitness', name:'运动健身', svg:SVG.dumbbell, bg:'linear-gradient(135deg,#FF2D55,#FF6B6B)', selected:true },
    { id:'ktv', name:'KTV欢唱', svg:SVG.mic, bg:'linear-gradient(135deg,#5856D6,#7B79F0)', selected:false },
    { id:'movie', name:'电影演出', svg:SVG.film, bg:'linear-gradient(135deg,#00C7BE,#30D5C8)', selected:true },
    { id:'attraction', name:'景点游玩', svg:SVG.camera, bg:'linear-gradient(135deg,#AF52DE,#D65BFF)', selected:true },
    { id:'car', name:'打车出行', svg:SVG.car, bg:'linear-gradient(135deg,#007AFF,#5AC8FA)', selected:false },
    { id:'shopping', name:'逛街购物', svg:SVG.wallet, bg:'linear-gradient(135deg,#FF9500,#FFB800)', selected:false },
    { id:'beauty', name:'美甲美容', svg:SVG.star, bg:'linear-gradient(135deg,#FF2D55,#FF6B6B)', selected:false },
    { id:'bar', name:'酒吧夜店', svg:SVG.gift, bg:'linear-gradient(135deg,#5856D6,#7B79F0)', selected:false },
    { id:'photo', name:'摄影写真', svg:SVG.camera, bg:'linear-gradient(135deg,#00C7BE,#30D5C8)', selected:false },
];

// ===== 推荐内容流 (16条) =====
const RECOMMEND_FEED = [
    { type:'美食', typeColor:'#FF6B35', title:'巷子里 · 地道重庆火锅', subtitle:'双人鸳鸯锅套餐', rating:4.9, distance:'1.2km', price:88, unit:'/份', sold:328, img:picG('recheap1',200,150,'#FF6B35','#FFAB40') },
    { type:'养生', typeColor:'#34C759', title:'泰式古法按摩', subtitle:'全身精油SPA 90分钟', rating:4.8, distance:'0.8km', price:168, unit:'/次', sold:156, img:picG('recspa1',200,150,'#66BB6A','#AED581') },
    { type:'健身', typeColor:'#FF2D55', title:'CrossFit燃脂团课', subtitle:'专业教练1对1指导', rating:4.7, distance:'1.5km', price:49, unit:'/节', sold:89, img:picG('recfit1',200,150,'#EF5350','#FF8A80') },
    { type:'景点', typeColor:'#FF9500', title:'深圳欢乐谷全天票', subtitle:'含30+项游乐设施', rating:4.6, distance:'5.2km', price:129, unit:'/张', sold:2100, img:picG('recpark1',200,150,'#FF9500','#FFB800') },
    { type:'电影', typeColor:'#00C7BE', title:'万达影城IMAX', subtitle:'最新大片观影体验', rating:4.8, distance:'0.3km', price:45, unit:'/张', sold:560, img:picG('recmov1',200,150,'#00C7BE','#30D5C8') },
    { type:'美食', typeColor:'#FF6B35', title:'日料 · 鮨处三味', subtitle:'极上寿司套餐12贯', rating:4.9, distance:'2.0km', price:128, unit:'/份', sold:320, img:picG('recsushi1',200,150,'#FF7043','#FFAB91') },
    { type:'养生', typeColor:'#34C759', title:'中医推拿馆', subtitle:'颈肩腰腿调理套餐', rating:4.7, distance:'1.0km', price:98, unit:'/次', sold:186, img:picG('rectcm1',200,150,'#43A047','#81C784') },
    { type:'景点', typeColor:'#007AFF', title:'世界之窗夜场票', subtitle:'赏灯光秀+烟花表演', rating:4.5, distance:'4.8km', price:69, unit:'/张', sold:890, img:picG('recworld1',200,150,'#1E88E5','#64B5F6') },
    { type:'美食', typeColor:'#FF6B35', title:'老北京涮羊肉', subtitle:'铜锅涮肉4人餐', rating:4.7, distance:'1.8km', price:198, unit:'/份', sold:560, img:picG('rechotpot1',200,150,'#E53935','#EF5350') },
    { type:'KTV', typeColor:'#5856D6', title:'欢乐KTV · 欢唱夜', subtitle:'中包4小时含酒水', rating:4.5, distance:'0.5km', price:158, unit:'/场', sold:890, img:picG('recktv1',200,150,'#5856D6','#7B79F0') },
    { type:'美食', typeColor:'#FF6B35', title:'韩式炸鸡啤酒', subtitle:'双拼炸鸡+啤酒套餐', rating:4.6, distance:'1.1km', price:59, unit:'/份', sold:1200, img:picG('recchicken1',200,150,'#FFD54F','#FFA000') },
    { type:'养生', typeColor:'#34C759', title:'悦SPA · 泰式按摩', subtitle:'全身精油+足浴120min', rating:4.8, distance:'3.0km', price:288, unit:'/次', sold:92, img:picG('recspa2',200,150,'#66BB6A','#AED581') },
    { type:'电影', typeColor:'#00C7BE', title:'CGV影城 · 杜比厅', subtitle:'最新科幻大片首映', rating:4.7, distance:'1.6km', price:55, unit:'/张', sold:340, img:picG('recmov2',200,150,'#26C6DA','#80DEEA') },
    { type:'健身', typeColor:'#FF2D55', title:'锐力健身月卡', subtitle:'不限次+团课+私教体验', rating:4.6, distance:'1.5km', price:399, unit:'/月', sold:56, img:picG('recfit2',200,150,'#EC407A','#F48FB1') },
    { type:'美食', typeColor:'#FF6B35', title:'粤式早茶 · 陶陶居', subtitle:'点心拼盘+茶位6人餐', rating:4.8, distance:'2.3km', price:168, unit:'/份', sold:780, img:picG('recdim1',200,150,'#FFCC80','#FFA726') },
    { type:'景点', typeColor:'#AF52DE', title:'锦绣中华民俗村', subtitle:'夜场+大型表演套票', rating:4.5, distance:'6.0km', price:85, unit:'/张', sold:430, img:picG('recsplendid1',200,150,'#AB47BC','#CE93D8') },
];

// ===== 快捷指令 =====
const QUICK_ACTIONS = [
    { name:'点外卖', svg:SVG.food, bg:'linear-gradient(135deg,#FF6B35,#FF9A56)' },
    { name:'订餐厅', svg:SVG.star, bg:'linear-gradient(135deg,#34C759,#30D158)' },
    { name:'订酒店', svg:SVG.store, bg:'linear-gradient(135deg,#007AFF,#5AC8FA)' },
    { name:'火车票', svg:SVG.car, bg:'linear-gradient(135deg,#AF52DE,#D65BFF)' },
    { name:'飞机票', svg:SVG.plane, bg:'linear-gradient(135deg,#FF9500,#FFB800)' },
    { name:'规划行程', svg:SVG.camera, bg:'linear-gradient(135deg,#FF2D55,#FF6B6B)' },
    { name:'买电影票', svg:SVG.film, bg:'linear-gradient(135deg,#5856D6,#7B79F0)' },
    { name:'K歌订包', svg:SVG.mic, bg:'linear-gradient(135deg,#00C7BE,#30D5C8)' },
];

// ===== 聊天回复 =====
const CHAT_REPLIES = {
    '外卖': { text:'好的！我来帮你点外卖。请问你想吃什么类型的美食呢？', card:{ title:'附近热门外卖推荐', desc:'川味坊 · 正宗川菜 | 30分钟送达 | 满50减15', img:picG('chatfood1',300,160,'#FF6B35','#FF9A56'), btn:'立即下单' }},
    '餐厅': { text:'帮你订餐厅！我为你推荐附近几家优质餐厅：', card:{ title:'海世界 · 海洋主题餐厅', desc:'海鲜 · 4.7分 · 2.1km | 今日有位', img:picG('chatrest1',300,160,'#007AFF','#5AC8FA'), btn:'预订座位' }},
    '酒店': { text:'订酒店没问题！请告诉我你的入住日期和城市：', card:{ title:'深圳南山万豪酒店', desc:'五星级 · 海景房 · ¥688/晚 | 含双早', img:picG('chathotel1',300,160,'#AF52DE','#D65BFF'), btn:'查看详情' }},
    '火车': { text:'帮你查火车票！请告诉我出发地、目的地和日期：', card:{ title:'深圳北 → 广州南', desc:'G1024 | 09:15-09:48 | 二等座 ¥75', img:picG('chattrain1',300,160,'#5856D6','#7B79F0'), btn:'立即购票' }},
    '飞机': { text:'机票查询来啦！请问从哪飞到哪？什么时间出发？', card:{ title:'深圳 → 三亚', desc:'深航ZH9321 | 10:20起飞 | ¥520起', img:picG('chatplane1',300,160,'#FF9500','#FFB800'), btn:'预订机票' }},
    '行程': { text:'行程规划交给小秘！请告诉我你的目的地、天数和大致预算：', card:{ title:'三亚3日游 · 经典行程', desc:'Day1亚龙湾 → Day2蜈支洲岛 → Day3南山寺 | 预算¥2000/人', img:picG('chattrip1',300,160,'#FF2D55','#FF6B6B'), btn:'查看行程' }},
    '电影': { text:'买电影票！附近影院和正在热映的电影：', card:{ title:'万达影城IMAX · 海岸城店', desc:'《星际穿越2》| IMAX厅 | ¥45/张', img:picG('chatmovie1',300,160,'#00C7BE','#30D5C8'), btn:'选座购票' }},
    'K': { text:'帮你订KTV包厢！附近热门KTV推荐：', card:{ title:'欢乐KTV · 海岸城店', desc:'中包厢 | ¥99/3小时 | 含酒水小食', img:picG('chatktv1',300,160,'#5856D6','#7B79F0'), btn:'预订包厢' }},
    'default': { text:'收到！我是你的智能生活管家小秘。\n我可以帮你：点外卖、订餐厅、订酒店、买火车票/飞机票、规划行程、买电影票、订KTV包厢等。\n直接告诉我你想做什么吧！' },
};

// ===== 上新动态 (6条) =====
const NEWEST_POSTS = [
    {
        user:'川味坊官方', userSvg:SVG.food, userBg:'linear-gradient(135deg,#FF6B35,#FF9A56)', time:'2小时前', isOfficial:true,
        images:[picG('newfood1a',300,200,'#FF6B35','#FFAB40'), picG('newfood1b',300,200,'#FF7043','#FFAB91')], imgCount:'two',
        title:'新品上市！招牌藤椒鱼双人餐',
        desc:'选用新鲜乌鱼，秘制藤椒酱料，麻而不苦、辣而不燥。限时新品价，前100名下单赠酸梅汤一杯！',
        tags:['#新品上市','#川菜','#双人套餐'],
        price:88, oldPrice:168, likes:328,
        comments:[{user:'吃货小李',text:'看起来好好吃，周末就去试试！'},{user:'美食达人',text:'藤椒鱼是招牌，必须安排'}],
        commentCount:26, liked:false, showComments:false,
    },
    {
        user:'松鹤楼SPA', userSvg:SVG.massage, userBg:'linear-gradient(135deg,#34C759,#30D158)', time:'3小时前', isOfficial:true,
        images:[picG('newspa1',400,250,'#66BB6A','#AED581')], imgCount:'one',
        title:'新项目！泰式草药热敷SPA',
        desc:'引进泰国古法配方，搭配温热草药球，深层放松筋络。新品体验价，全程120分钟含足浴+茶点。',
        tags:['#新品首发','#泰式SPA','#限时特惠'],
        price:199, oldPrice:358, likes:156,
        comments:[{user:'养生爱好者',text:'这个项目期待很久了'}],
        commentCount:12, liked:false, showComments:false,
    },
    {
        user:'锐力健身', userSvg:SVG.dumbbell, userBg:'linear-gradient(135deg,#FF2D55,#FF6B6B)', time:'5小时前', isOfficial:false,
        images:[picG('newfit1a',200,150,'#EF5350','#FF8A80'), picG('newfit1b',200,150,'#FF2D55','#FF6B6B'), picG('newfit1c',200,150,'#EC407A','#F48FB1')], imgCount:'three',
        title:'新课程上线！CrossFit燃脂训练营',
        desc:'专业CrossFit教练带练，每节课45分钟高强度燃脂，适合有一定运动基础的健身爱好者。首课免费体验！',
        tags:['#新课程','#燃脂','#免费体验'],
        price:0, oldPrice:88, likes:89,
        comments:[{user:'健身狂人',text:'CrossFit终于有了！'},{user:'萌新小白',text:'新手能参加吗？'}],
        commentCount:8, liked:false, showComments:false,
    },
    {
        user:'欢乐KTV', userSvg:SVG.mic, userBg:'linear-gradient(135deg,#5856D6,#7B79F0)', time:'6小时前', isOfficial:true,
        images:[picG('newktv1a',300,200,'#5856D6','#7B79F0'), picG('newktv1b',300,200,'#AB47BC','#CE93D8')], imgCount:'two',
        title:'欢唱夜 · 新品套餐上线',
        desc:'夜猫子专属！22:00-02:00欢唱4小时，含啤酒6瓶+小食拼盘，新品首发价仅需¥158！',
        tags:['#夜间特惠','#欢唱套餐','#含酒水'],
        price:158, oldPrice:298, likes:215,
        comments:[{user:'麦霸小王',text:'这个价格太香了！'},{user:'夜猫子',text:'约起来约起来'},{user:'歌神在世',text:'曲库更新了吗？'}],
        commentCount:31, liked:false, showComments:false,
    },
    {
        user:'海世界餐厅', userSvg:SVG.star, userBg:'linear-gradient(135deg,#007AFF,#5AC8FA)', time:'8小时前', isOfficial:true,
        images:[picG('newsea1a',300,200,'#007AFF','#5AC8FA'), picG('newsea1b',300,200,'#42A5F5','#90CAF9')], imgCount:'two',
        title:'上新！波龙海鲜大餐双人套餐',
        desc:'每日凌晨直采活海鲜，波龙+生蚝+扇贝+刺身拼盘，限量供应需预约。上新特惠前50名享8折！',
        tags:['#海鲜上新','#限量供应','#需预约'],
        price:388, oldPrice:588, likes:167,
        comments:[{user:'海鲜控',text:'波龙我的最爱！'},{user:'美食博主',text:'看着就高级'}],
        commentCount:19, liked:false, showComments:false,
    },
    {
        user:'欢乐谷', userSvg:SVG.camera, userBg:'linear-gradient(135deg,#FF9500,#FFB800)', time:'12小时前', isOfficial:true,
        images:[picG('newpark1a',300,200,'#FF9500','#FFB800'), picG('newpark1b',300,200,'#FFA726','#FFCC80'), picG('newpark1c',300,200,'#FFB300','#FFE082')], imgCount:'three',
        title:'暑期新品！夜场灯光秀+烟花套餐',
        desc:'全新升级夜场体验！大型灯光秀+烟花表演+夜间游乐设施，暑期特惠学生半价，家庭套票更优惠！',
        tags:['#暑期特惠','#夜场套餐','#亲子首选'],
        price:99, oldPrice:168, likes:340,
        comments:[{user:'带娃达人',text:'暑假必去！'},{user:'摄影爱好者',text:'灯光秀拍照绝了'}],
        commentCount:42, liked:false, showComments:false,
    },
];

// ===== 上新筛选标签 =====
const NEWEST_FILTERS = ['全部','美食','养生','健身','KTV','景点','海鲜'];

// ===== 订单状态 =====
const ORDER_STATUSES = [
    { name:'待付款', svg:SVG.card, bg:'linear-gradient(135deg,#FF6B35,#FF9A56)', badge:'2' },
    { name:'待使用', svg:SVG.ticket, bg:'linear-gradient(135deg,#007AFF,#5AC8FA)', badge:'3' },
    { name:'待评价', svg:SVG.edit, bg:'linear-gradient(135deg,#FF9500,#FFB800)', badge:'1' },
    { name:'退款/售后', svg:SVG.refresh, bg:'linear-gradient(135deg,#AF52DE,#D65BFF)', badge:'' },
];

// ===== 常用功能 =====
const FUNC_ITEMS = [
    { name:'我的收藏', svg:SVG.star, bg:'linear-gradient(135deg,#FF6B35,#FF9A56)' },
    { name:'收货地址', svg:SVG.pin, bg:'linear-gradient(135deg,#34C759,#30D158)' },
    { name:'我的钱包', svg:SVG.wallet, bg:'linear-gradient(135deg,#FF9500,#FFB800)' },
    { name:'邀请好友', svg:SVG.gift, bg:'linear-gradient(135deg,#FF2D55,#FF6B6B)' },
];

// ===== 系统设置 =====
const SETTINGS = [
    { svg:SVG.lock, bg:'linear-gradient(135deg,#AF52DE,#D65BFF)', label:'账户与安全', value:'已绑定' },
    { svg:SVG.gear, bg:'linear-gradient(135deg,#FF9500,#FFB800)', label:'通用设置', value:'' },
    { svg:SVG.question, bg:'linear-gradient(135deg,#FF6B35,#FF9A56)', label:'帮助与反馈', value:'' },
    { svg:SVG.info, bg:'linear-gradient(135deg,#5856D6,#7B79F0)', label:'关于生活小秘', value:'v2.6.0' },
];

// ===== 热门搜索 =====
const HOT_SEARCHES = ['火锅','足疗','电影票','KTV','酒店','日料','欢乐谷','SPA','健身','海鲜'];

// ===== 用户详细资料 =====
const USER_PROFILE = {
    name: '小秘用户',
    avatar: '🦊',
    phone: '138****8888',
    level: 'VIP3',
    levelName: '黄金会员',
    levelProgress: 68,
    nextLevel: '铂金会员',
    following: 128,
    followers: 356,
    posts: 89,
    gender: '男',
    birthday: '1995-06-15',
    city: '深圳',
    bio: '热爱生活，享受每一刻的美好时光✨',
    registerDate: '2024-03-08',
};

// ===== 行程规划 =====
const TRIP_PLANS = [
    {
        id: 1,
        title: '三亚5日阳光之旅',
        status: 'upcoming',
        startDate: '2026-08-20',
        endDate: '2026-08-24',
        days: 5,
        destination: '三亚',
        budget: 5800,
        spent: 3200,
        coverImg: picG('tripsanya', 400, 200, '#00C7BE', '#30D5C8'),
        progress: 55,
        schedule: [
            { day: 1, plan: '抵达三亚 → 亚龙湾度假酒店入住 → 海滩漫步', icon: 'plane' },
            { day: 2, plan: '蜈支洲岛一日游 → 浮潜体验 → 海鲜大餐', icon: 'pin' },
            { day: 3, plan: '南山文化旅游区 → 天涯海角 → 椰梦长廊', icon: 'camera' },
            { day: 4, plan: '免税店购物 → 亚诺达雨林探险', icon: 'star' },
            { day: 5, plan: '酒店早餐 → 自由活动 → 返程', icon: 'plane' },
        ],
    },
    {
        id: 2,
        title: '周末香港文化游',
        status: 'upcoming',
        startDate: '2026-08-16',
        endDate: '2026-08-17',
        days: 2,
        destination: '中国香港',
        budget: 2000,
        spent: 800,
        coverImg: picG('triphk', 400, 200, '#5856D6', '#7B79F0'),
        progress: 40,
        schedule: [
            { day: 1, plan: '福田口岸过关 → 尖沙咀 → 维多利亚港夜景', icon: 'pin' },
            { day: 2, plan: '中环 → 太平山顶 → 铜锣湾购物 → 返程', icon: 'camera' },
        ],
    },
    {
        id: 3,
        title: '北京历史探索之旅',
        status: 'completed',
        startDate: '2026-07-10',
        endDate: '2026-07-14',
        days: 5,
        destination: '北京',
        budget: 6500,
        spent: 6200,
        coverImg: picG('tripbj', 400, 200, '#FF6B35', '#FF9A56'),
        progress: 100,
        schedule: [
            { day: 1, plan: '抵达北京 → 故宫博物院 → 景山公园', icon: 'pin' },
            { day: 2, plan: '长城一日游 → 鸟巢水立方夜景', icon: 'camera' },
            { day: 3, plan: '颐和园 → 圆明园 → 清华北大', icon: 'star' },
            { day: 4, plan: '天坛 → 南锣鼓巷 → 簋街美食', icon: 'food' },
            { day: 5, plan: '798艺术区 → 返程', icon: 'plane' },
        ],
    },
];

// ===== 提醒事项 =====
// method: 提醒方式 alarm=闹钟 / sms=短信 / wechat=微信
const REMINDERS = [
    {
        id: 1,
        type: 'work',
        title: '上班打卡提醒',
        desc: '每日 09:00 准时打卡，别迟到哦～',
        time: '09:00',
        repeat: '工作日重复',
        enabled: true,
        method: 'alarm',
        icon: 'clock',
        bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)',
    },
    {
        id: 2,
        type: 'offwork',
        title: '下班打卡提醒',
        desc: '每日 18:00 下班打卡，辛苦了！',
        time: '18:00',
        repeat: '工作日重复',
        enabled: true,
        method: 'alarm',
        icon: 'clock',
        bg: 'linear-gradient(135deg,#34C759,#30D158)',
    },
    {
        id: 3,
        type: 'travel',
        title: '三亚出行提醒',
        desc: '8月20日 07:30 出发前往机场，记得带身份证和防晒霜！',
        time: '07:30',
        date: '2026-08-20',
        repeat: '仅一次',
        enabled: true,
        method: 'alarm',
        icon: 'plane',
        bg: 'linear-gradient(135deg,#00C7BE,#30D5C8)',
    },
    {
        id: 4,
        type: 'custom',
        title: '健身打卡',
        desc: '每周一三五 20:00 健身时间，坚持就是胜利！',
        time: '20:00',
        repeat: '周一/三/五',
        enabled: false,
        method: 'wechat',
        icon: 'dumbbell',
        bg: 'linear-gradient(135deg,#FF9500,#FFB800)',
    },
    {
        id: 5,
        type: 'custom',
        title: '妈妈生日',
        desc: '记得提前准备生日礼物和蛋糕🎂',
        time: '10:00',
        date: '2026-08-18',
        repeat: '每年',
        enabled: true,
        method: 'sms',
        icon: 'gift',
        bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)',
    },
];

// ===== 订单详细列表 =====
const RECENT_ORDERS = [
    { id: 'ORD20260808001', merchant: '蜀香居老火锅', item: '双人火锅套餐', price: 99, status: 'pending_use', statusText: '待使用', date: '2026-08-08', seed: 'order1', quantity: 1 },
    { id: 'ORD20260807002', merchant: '汤泉一品足道', item: '足疗养生套餐', price: 128, status: 'pending_use', statusText: '待使用', date: '2026-08-07', seed: 'order2', quantity: 1 },
    { id: 'ORD20260806003', merchant: '金逸影城IMAX', item: '电影票2张', price: 39, status: 'pending_review', statusText: '待评价', date: '2026-08-06', seed: 'order3', quantity: 2 },
    { id: 'ORD20260805004', merchant: '欢乐KTV', item: 'KTV欢唱3小时', price: 29, status: 'pending', statusText: '待付款', date: '2026-08-05', seed: 'order4', quantity: 1 },
    { id: 'ORD20260804005', merchant: '超级猩猩健身', item: '健身单次卡', price: 19, status: 'pending', statusText: '待付款', date: '2026-08-04', seed: 'order5', quantity: 1 },
    { id: 'ORD20260730006', merchant: '三亚亚龙湾酒店', item: '海景房2晚', price: 2680, status: 'completed', statusText: '已完成', date: '2026-07-30', seed: 'order6', quantity: 1 },
    { id: 'ORD20260725007', merchant: '老王川菜馆', item: '外卖订单', price: 45, status: 'completed', statusText: '已完成', date: '2026-07-25', seed: 'order7', quantity: 1 },
    { id: 'ORD20260720008', merchant: '欢乐谷主题公园', item: '全天通票2张', price: 460, status: 'refund', statusText: '已退款', date: '2026-07-20', seed: 'order8', quantity: 2 },
];
