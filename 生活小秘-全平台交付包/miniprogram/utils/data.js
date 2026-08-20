// utils/data.js - 模拟数据模块

// 图片渐变色生成（替代网络图片，保证小程序离线可用）
function gradient(c1, c2) {
  return 'linear-gradient(135deg,' + c1 + ',' + c2 + ')';
}

// 分类数据
const categories = [
  { name: '美食', emoji: '🍜', bg: 'linear-gradient(135deg,#FF6B35,#FF9A56)', color: '#FF6B35' },
  { name: '足疗按摩', emoji: '💆', bg: 'linear-gradient(135deg,#34C759,#30D158)', color: '#34C759' },
  { name: '打车出行', emoji: '🚗', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)', color: '#007AFF' },
  { name: '景点游玩', emoji: '📷', bg: 'linear-gradient(135deg,#AF52DE,#D65BFF)', color: '#AF52DE' },
  { name: '旅游度假', emoji: '✈️', bg: 'linear-gradient(135deg,#FF9500,#FFB800)', color: '#FF9500' },
  { name: '运动健身', emoji: '💪', bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)', color: '#FF2D55' },
  { name: 'KTV', emoji: '🎤', bg: 'linear-gradient(135deg,#5856D6,#7B79F0)', color: '#5856D6' },
  { name: '电影演出', emoji: '🎬', bg: 'linear-gradient(135deg,#00C7BE,#30D5C8)', color: '#00C7BE' },
];

// 轮播图
const banners = [
  { title: '周末美食狂欢节', subtitle: '满100减50 · 限时抢购', bg: gradient('#FF6B35','#FF9A56'), emoji: '🍜', tag: '热门' },
  { title: '足疗养生5折起', subtitle: '放松身心 · 从足疗开始', bg: gradient('#34C759','#30D158'), emoji: '💆', tag: '养生' },
  { title: '暑期旅游特惠', subtitle: '海边度假仅需 ¥399/人', bg: gradient('#007AFF','#5AC8FA'), emoji: '✈️', tag: '旅行' },
  { title: 'KTV欢唱之夜', subtitle: '包厢低消 ¥99起 · 含酒水', bg: gradient('#5856D6','#7B79F0'), emoji: '🎤', tag: '欢唱' },
];

// 附近热门商家
const merchants = [
  {
    name: '川味坊 · 正宗川菜', emoji: '🍲', bg: gradient('#FF6B35','#FFAB40'),
    rating: 4.8, distance: '1.2km', address: '南山区海德二道32号',
    cuisine: '川菜', avgPrice: 85, soldCount: '已售3280',
    tags: [{text:'招牌水煮鱼',color:'#FF6B35'},{text:'满100减30',color:'#FF3B30'},{text:'排队15分钟',color:'#007AFF'}],
    isOpen: true, hours: '10:00-22:00',
  },
  {
    name: '松鹤楼 · 足疗SPA养生馆', emoji: '💆', bg: gradient('#34C759','#AED581'),
    rating: 4.9, distance: '0.8km', address: '南山区文心五路8号',
    cuisine: '足疗按摩', avgPrice: 168, soldCount: '已售1560',
    tags: [{text:'技师手法好',color:'#34C759'},{text:'新客8折',color:'#FF6B35'},{text:'免费茶点',color:'#FF9500'}],
    isOpen: true, hours: '10:00-24:00',
  },
  {
    name: '海世界 · 海洋主题餐厅', emoji: '🦐', bg: gradient('#007AFF','#5AC8FA'),
    rating: 4.7, distance: '2.1km', address: '南山区海岸城3楼',
    cuisine: '海鲜', avgPrice: 256, soldCount: '已售892',
    tags: [{text:'活海鲜现做',color:'#007AFF'},{text:'亲子推荐',color:'#AF52DE'},{text:'生日特惠',color:'#FF9500'}],
    isOpen: true, hours: '11:00-21:30',
  },
  {
    name: '锐力健身 · 南山店', emoji: '💪', bg: gradient('#FF2D55','#FF6B6B'),
    rating: 4.6, distance: '1.5km', address: '南山区科技园南区',
    cuisine: '健身', avgPrice: 399, soldCount: '月卡已售560',
    tags: [{text:'私教1对1',color:'#FF2D55'},{text:'团课免费',color:'#34C759'},{text:'新店5折',color:'#FF6B35'}],
    isOpen: true, hours: '06:00-23:00',
  },
  {
    name: '欢乐KTV · 海岸城店', emoji: '🎤', bg: gradient('#5856D6','#7B79F0'),
    rating: 4.5, distance: '0.5km', address: '南山区海岸城5楼',
    cuisine: 'KTV', avgPrice: 99, soldCount: '已售4200',
    tags: [{text:'曲库更新',color:'#5856D6'},{text:'欢唱3小时',color:'#FF9500'},{text:'含酒水小食',color:'#FF6B35'}],
    isOpen: true, hours: '12:00-06:00',
  },
  {
    name: '老北京涮羊肉', emoji: '🥘', bg: gradient('#E53935','#EF5350'),
    rating: 4.7, distance: '1.8km', address: '南山区创业路18号',
    cuisine: '火锅', avgPrice: 128, soldCount: '已售2100',
    tags: [{text:'铜锅涮肉',color:'#E53935'},{text:'正宗麻酱',color:'#FF9500'},{text:'满200减40',color:'#FF6B35'}],
    isOpen: true, hours: '11:00-23:00',
  },
  {
    name: '日料 · 鮨处三味', emoji: '🍣', bg: gradient('#FF7043','#FFAB91'),
    rating: 4.9, distance: '2.5km', address: '南山区万象天地',
    cuisine: '日料', avgPrice: 198, soldCount: '已售680',
    tags: [{text:'Omakase',color:'#FF7043'},{text:'空运食材',color:'#007AFF'},{text:'需预约',color:'#AF52DE'}],
    isOpen: true, hours: '17:00-23:00',
  },
  {
    name: '万达影城 · IMAX海岸城', emoji: '🎬', bg: gradient('#00C7BE','#30D5C8'),
    rating: 4.8, distance: '0.3km', address: '南山区海岸城4楼',
    cuisine: '电影', avgPrice: 45, soldCount: '本周热门',
    tags: [{text:'IMAX厅',color:'#00C7BE'},{text:'杜比全景声',color:'#007AFF'},{text:'会员半价',color:'#FF6B35'}],
    isOpen: true, hours: '09:00-24:00',
  },
  {
    name: '悦SPA · 泰式古法按摩', emoji: '🌸', bg: gradient('#66BB6A','#AED581'),
    rating: 4.8, distance: '3.0km', address: '南山区蛇口海上世界',
    cuisine: 'SPA按摩', avgPrice: 288, soldCount: '已售920',
    tags: [{text:'泰国技师',color:'#34C759'},{text:'精油SPA',color:'#FF9500'},{text:'送足浴',color:'#FF6B35'}],
    isOpen: true, hours: '10:00-24:00',
  },
  {
    name: '欢乐谷主题公园', emoji: '🎢', bg: gradient('#FF9500','#FFB800'),
    rating: 4.6, distance: '5.2km', address: '南山区华侨城',
    cuisine: '景点', avgPrice: 230, soldCount: '暑期特惠',
    tags: [{text:'30+项游乐',color:'#FF9500'},{text:'夜场半价',color:'#FF6B35'},{text:'亲子首选',color:'#AF52DE'}],
    isOpen: true, hours: '09:00-21:00',
  },
];

// 特价美食
const deals = [
  { title: '老城隍庙小笼包 8只装', price: 19.9, oldPrice: 39, badge: '5折', sold: 1280, emoji: '🥟', bg: gradient('#FFD180','#FFAB40') },
  { title: '日式拉面定食套餐', price: 29.9, oldPrice: 58, badge: '5折', sold: 860, emoji: '🍜', bg: gradient('#FFAB91','#FF7043') },
  { title: '重庆老火锅双人套餐', price: 88, oldPrice: 168, badge: '5折', sold: 2100, emoji: '🍲', bg: gradient('#EF5350','#E53935') },
  { title: '日料寿司拼盘12贯', price: 49, oldPrice: 98, badge: '5折', sold: 560, emoji: '🍣', bg: gradient('#81C784','#43A047') },
  { title: '韩式炸鸡啤酒套餐', price: 59, oldPrice: 118, badge: '5折', sold: 1820, emoji: '🍗', bg: gradient('#FFD54F','#FFA000') },
  { title: '粤式早茶点心拼盘', price: 39.9, oldPrice: 79, badge: '5折', sold: 940, emoji: '🥢', bg: gradient('#FFCC80','#FFA726') },
];

// 限时秒杀
const flashSales = [
  { title: '椰子鸡双人套餐', price: 59, origPrice: 128, progress: 72, emoji: '🐔', bg: gradient('#FFF176','#FFD54F') },
  { title: '全身精油SPA 60min', price: 99, origPrice: 298, progress: 45, emoji: '💆', bg: gradient('#A5D6A7','#66BB6A') },
  { title: '海岸城IMAX电影票', price: 25, origPrice: 60, progress: 88, emoji: '🎬', bg: gradient('#90CAF9','#42A5F5') },
  { title: '欢乐谷全天门票', price: 129, origPrice: 230, progress: 30, emoji: '🎢', bg: gradient('#CE93D8','#AB47BC') },
  { title: 'KTV欢唱3小时包厢', price: 79, origPrice: 198, progress: 55, emoji: '🎤', bg: gradient('#9FA8DA','#5C6BC0') },
];

// 推荐内容流
const recommendFeed = [
  { type:'美食', typeColor:'#FF6B35', title:'巷子里 · 地道重庆火锅', subtitle:'双人鸳鸯锅套餐', rating:4.9, distance:'1.2km', price:88, unit:'/份', sold:328, emoji:'🍲', bg:gradient('#FF6B35','#FFAB40') },
  { type:'养生', typeColor:'#34C759', title:'泰式古法按摩', subtitle:'全身精油SPA 90分钟', rating:4.8, distance:'0.8km', price:168, unit:'/次', sold:156, emoji:'💆', bg:gradient('#66BB6A','#AED581') },
  { type:'健身', typeColor:'#FF2D55', title:'CrossFit燃脂团课', subtitle:'专业教练1对1指导', rating:4.7, distance:'1.5km', price:49, unit:'/节', sold:89, emoji:'💪', bg:gradient('#EF5350','#FF8A80') },
  { type:'景点', typeColor:'#FF9500', title:'深圳欢乐谷全天票', subtitle:'含30+项游乐设施', rating:4.6, distance:'5.2km', price:129, unit:'/张', sold:2100, emoji:'🎢', bg:gradient('#FF9500','#FFB800') },
  { type:'电影', typeColor:'#00C7BE', title:'万达影城IMAX', subtitle:'最新大片观影体验', rating:4.8, distance:'0.3km', price:45, unit:'/张', sold:560, emoji:'🎬', bg:gradient('#00C7BE','#30D5C8') },
  { type:'美食', typeColor:'#FF6B35', title:'日料 · 鮨处三味', subtitle:'极上寿司套餐12贯', rating:4.9, distance:'2.0km', price:128, unit:'/份', sold:320, emoji:'🍣', bg:gradient('#FF7043','#FFAB91') },
  { type:'养生', typeColor:'#34C759', title:'中医推拿馆', subtitle:'颈肩腰腿调理套餐', rating:4.7, distance:'1.0km', price:98, unit:'/次', sold:186, emoji:'🩺', bg:gradient('#43A047','#81C784') },
  { type:'景点', typeColor:'#007AFF', title:'世界之窗夜场票', subtitle:'赏灯光秀+烟花表演', rating:4.5, distance:'4.8km', price:69, unit:'/张', sold:890, emoji:'🌃', bg:gradient('#1E88E5','#64B5F6') },
  { type:'美食', typeColor:'#FF6B35', title:'老北京涮羊肉', subtitle:'铜锅涮肉4人餐', rating:4.7, distance:'1.8km', price:198, unit:'/份', sold:560, emoji:'🥘', bg:gradient('#E53935','#EF5350') },
  { type:'KTV', typeColor:'#5856D6', title:'欢乐KTV · 欢唱夜', subtitle:'中包4小时含酒水', rating:4.5, distance:'0.5km', price:158, unit:'/场', sold:890, emoji:'🎤', bg:gradient('#5856D6','#7B79F0') },
  { type:'美食', typeColor:'#FF6B35', title:'韩式炸鸡啤酒', subtitle:'双拼炸鸡+啤酒套餐', rating:4.6, distance:'1.1km', price:59, unit:'/份', sold:1200, emoji:'🍗', bg:gradient('#FFD54F','#FFA000') },
  { type:'养生', typeColor:'#34C759', title:'悦SPA · 泰式按摩', subtitle:'全身精油+足浴120min', rating:4.8, distance:'3.0km', price:288, unit:'/次', sold:92, emoji:'🌸', bg:gradient('#66BB6A','#AED581') },
  { type:'电影', typeColor:'#00C7BE', title:'CGV影城 · 杜比厅', subtitle:'最新科幻大片首映', rating:4.7, distance:'1.6km', price:55, unit:'/张', sold:340, emoji:'🎞️', bg:gradient('#26C6DA','#80DEEA') },
  { type:'健身', typeColor:'#FF2D55', title:'锐力健身月卡', subtitle:'不限次+团课+私教体验', rating:4.6, distance:'1.5km', price:399, unit:'/月', sold:56, emoji:'🏋️', bg:gradient('#EC407A','#F48FB1') },
  { type:'美食', typeColor:'#FF6B35', title:'粤式早茶 · 陶陶居', subtitle:'点心拼盘+茶位6人餐', rating:4.8, distance:'2.3km', price:168, unit:'/份', sold:780, emoji:'🥢', bg:gradient('#FFCC80','#FFA726') },
  { type:'景点', typeColor:'#AF52DE', title:'锦绣中华民俗村', subtitle:'夜场+大型表演套票', rating:4.5, distance:'6.0km', price:85, unit:'/张', sold:430, emoji:'🏛️', bg:gradient('#AB47BC','#CE93D8') },
];

// 快捷指令
const quickActions = [
  { name:'点外卖', emoji:'🍜', bg:'linear-gradient(135deg,#FF6B35,#FF9A56)' },
  { name:'订餐厅', emoji:'🍽️', bg:'linear-gradient(135deg,#34C759,#30D158)' },
  { name:'订酒店', emoji:'🏨', bg:'linear-gradient(135deg,#007AFF,#5AC8FA)' },
  { name:'火车票', emoji:'🚄', bg:'linear-gradient(135deg,#AF52DE,#D65BFF)' },
  { name:'飞机票', emoji:'✈️', bg:'linear-gradient(135deg,#FF9500,#FFB800)' },
  { name:'规划行程', emoji:'🗺️', bg:'linear-gradient(135deg,#FF2D55,#FF6B6B)' },
  { name:'买电影票', emoji:'🎬', bg:'linear-gradient(135deg,#5856D6,#7B79F0)' },
  { name:'K歌订包', emoji:'🎤', bg:'linear-gradient(135deg,#00C7BE,#30D5C8)' },
];

// 聊天回复规则
const chatReplies = {
  '外卖': { text: '好的！我来帮你点外卖。\n请问你想吃什么类型的美食呢？\n\n为你推荐附近热门外卖：', card: { title: '川味坊 · 正宗川菜', desc: '30分钟送达 | 满50减15 | 人均¥85', emoji: '🍲', bg: 'linear-gradient(135deg,#FF6B35,#FF9A56)', btn: '立即下单' } },
  '餐厅': { text: '帮你订餐厅！\n我为你推荐附近几家优质餐厅：', card: { title: '海世界 · 海洋主题餐厅', desc: '海鲜 · 4.7分 · 2.1km | 今日有位', emoji: '🦐', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)', btn: '预订座位' } },
  '酒店': { text: '订酒店没问题！\n请告诉我你的入住日期和城市：', card: { title: '深圳南山万豪酒店', desc: '五星级 · 海景房 · ¥688/晚 | 含双早', emoji: '🏨', bg: 'linear-gradient(135deg,#AF52DE,#D65BFF)', btn: '查看详情' } },
  '火车': { text: '帮你查火车票！\n请告诉我出发地、目的地和日期：', card: { title: '深圳北 → 广州南', desc: 'G1024 | 09:15-09:48 | 二等座 ¥75', emoji: '🚄', bg: 'linear-gradient(135deg,#5856D6,#7B79F0)', btn: '立即购票' } },
  '飞机': { text: '机票查询来啦！\n请问从哪飞到哪？什么时间出发？', card: { title: '深圳 → 三亚', desc: '深航ZH9321 | 10:20起飞 | ¥520起', emoji: '✈️', bg: 'linear-gradient(135deg,#FF9500,#FFB800)', btn: '预订机票' } },
  '行程': { text: '行程规划交给小秘！\n请告诉我你的目的地、天数和大致预算：', card: { title: '三亚3日游 · 经典行程', desc: 'Day1亚龙湾→Day2蜈支洲岛→Day3南山寺 | 预算¥2000/人', emoji: '🗺️', bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)', btn: '查看行程' } },
  '电影': { text: '买电影票！\n附近影院和正在热映的电影：', card: { title: '万达影城IMAX · 海岸城店', desc: '《星际穿越2》| IMAX厅 | ¥45/张', emoji: '🎬', bg: 'linear-gradient(135deg,#00C7BE,#30D5C8)', btn: '选座购票' } },
  'K': { text: '帮你订KTV包厢！\n附近热门KTV推荐：', card: { title: '欢乐KTV · 海岸城店', desc: '中包厢 | ¥99/3小时 | 含酒水小食', emoji: '🎤', bg: 'linear-gradient(135deg,#5856D6,#7B79F0)', btn: '预订包厢' } },
  'default': { text: '收到！我是你的智能生活管家小秘。\n我可以帮你：点外卖、订餐厅、订酒店、买火车票/飞机票、规划行程、买电影票、订KTV包厢等。\n\n直接告诉我你想做什么吧！' },
};

// 上新动态
const newestPosts = [
  {
    user: '川味坊官方', userEmoji: '🍲', userBg: 'linear-gradient(135deg,#FF6B35,#FF9A56)', time: '2小时前', isOfficial: true,
    imgCount: 2, images: [
      { emoji: '🐟', bg: gradient('#FF6B35','#FFAB40') },
      { emoji: '🌶️', bg: gradient('#FF7043','#FFAB91') }
    ],
    title: '新品上市！招牌藤椒鱼双人餐',
    desc: '选用新鲜乌鱼，秘制藤椒酱料，麻而不苦、辣而不燥。限时新品价，前100名下单赠酸梅汤一杯！',
    tags: ['#新品上市', '#川菜', '#双人套餐'],
    price: 88, oldPrice: 168, likes: 328,
    comments: [{ user: '吃货小李', text: '看起来好好吃，周末就去试试！' }, { user: '美食达人', text: '藤椒鱼是招牌，必须安排' }],
    commentCount: 26, liked: false, showComments: false,
  },
  {
    user: '松鹤楼SPA', userEmoji: '💆', userBg: 'linear-gradient(135deg,#34C759,#30D158)', time: '3小时前', isOfficial: true,
    imgCount: 1, images: [
      { emoji: '🌿', bg: gradient('#66BB6A','#AED581') }
    ],
    title: '新项目！泰式草药热敷SPA',
    desc: '引进泰国古法配方，搭配温热草药球，深层放松筋络。新品体验价，全程120分钟含足浴+茶点。',
    tags: ['#新品首发', '#泰式SPA', '#限时特惠'],
    price: 199, oldPrice: 358, likes: 156,
    comments: [{ user: '养生爱好者', text: '这个项目期待很久了' }],
    commentCount: 12, liked: false, showComments: false,
  },
  {
    user: '锐力健身', userEmoji: '💪', userBg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)', time: '5小时前', isOfficial: false,
    imgCount: 3, images: [
      { emoji: '🏋️', bg: gradient('#EF5350','#FF8A80') },
      { emoji: '🔥', bg: gradient('#FF2D55','#FF6B6B') },
      { emoji: '💪', bg: gradient('#EC407A','#F48FB1') }
    ],
    title: '新课程上线！CrossFit燃脂训练营',
    desc: '专业CrossFit教练带练，每节课45分钟高强度燃脂，适合有一定运动基础的健身爱好者。首课免费体验！',
    tags: ['#新课程', '#燃脂', '#免费体验'],
    price: 0, oldPrice: 88, likes: 89,
    comments: [{ user: '健身狂人', text: 'CrossFit终于有了！' }, { user: '萌新小白', text: '新手能参加吗？' }],
    commentCount: 8, liked: false, showComments: false,
  },
  {
    user: '欢乐KTV', userEmoji: '🎤', userBg: 'linear-gradient(135deg,#5856D6,#7B79F0)', time: '6小时前', isOfficial: true,
    imgCount: 2, images: [
      { emoji: '🎵', bg: gradient('#5856D6','#7B79F0') },
      { emoji: '🍻', bg: gradient('#AB47BC','#CE93D8') }
    ],
    title: '欢唱夜 · 新品套餐上线',
    desc: '夜猫子专属！22:00-02:00欢唱4小时，含啤酒6瓶+小食拼盘，新品首发价仅需¥158！',
    tags: ['#夜间特惠', '#欢唱套餐', '#含酒水'],
    price: 158, oldPrice: 298, likes: 215,
    comments: [{ user: '麦霸小王', text: '这个价格太香了！' }, { user: '夜猫子', text: '约起来约起来' }, { user: '歌神在世', text: '曲库更新了吗？' }],
    commentCount: 31, liked: false, showComments: false,
  },
  {
    user: '海世界餐厅', userEmoji: '🦐', userBg: 'linear-gradient(135deg,#007AFF,#5AC8FA)', time: '8小时前', isOfficial: true,
    imgCount: 2, images: [
      { emoji: '🦞', bg: gradient('#007AFF','#5AC8FA') },
      { emoji: '🦪', bg: gradient('#42A5F5','#90CAF9') }
    ],
    title: '上新！波龙海鲜大餐双人套餐',
    desc: '每日凌晨直采活海鲜，波龙+生蚝+扇贝+刺身拼盘，限量供应需预约。上新特惠前50名享8折！',
    tags: ['#海鲜上新', '#限量供应', '#需预约'],
    price: 388, oldPrice: 588, likes: 167,
    comments: [{ user: '海鲜控', text: '波龙我的最爱！' }, { user: '美食博主', text: '看着就高级' }],
    commentCount: 19, liked: false, showComments: false,
  },
  {
    user: '欢乐谷', userEmoji: '🎢', userBg: 'linear-gradient(135deg,#FF9500,#FFB800)', time: '12小时前', isOfficial: true,
    imgCount: 3, images: [
      { emoji: '🎆', bg: gradient('#FF9500','#FFB800') },
      { emoji: '🎡', bg: gradient('#FFA726','#FFCC80') },
      { emoji: '🎠', bg: gradient('#FFB300','#FFE082') }
    ],
    title: '暑期新品！夜场灯光秀+烟花套餐',
    desc: '全新升级夜场体验！大型灯光秀+烟花表演+夜间游乐设施，暑期特惠学生半价，家庭套票更优惠！',
    tags: ['#暑期特惠', '#夜场套餐', '#亲子首选'],
    price: 99, oldPrice: 168, likes: 340,
    comments: [{ user: '带娃达人', text: '暑假必去！' }, { user: '摄影爱好者', text: '灯光秀拍照绝了' }],
    commentCount: 42, liked: false, showComments: false,
  },
];

// 上新筛选标签
const newestFilters = ['全部', '美食', '养生', '健身', 'KTV', '景点', '海鲜'];

// 订单状态
const orderStatuses = [
  { name: '待付款', emoji: '💳', bg: 'linear-gradient(135deg,#FF6B35,#FF9A56)', badge: '2' },
  { name: '待使用', emoji: '🎫', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)', badge: '3' },
  { name: '待评价', emoji: '✏️', bg: 'linear-gradient(135deg,#FF9500,#FFB800)', badge: '1' },
  { name: '退款/售后', emoji: '🔄', bg: 'linear-gradient(135deg,#AF52DE,#D65BFF)', badge: '' },
];

// 常用功能
const funcItems = [
  { name: '我的收藏', emoji: '⭐', bg: 'linear-gradient(135deg,#FF6B35,#FF9A56)' },
  { name: '我的足迹', emoji: '🕐', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)' },
  { name: '收货地址', emoji: '📍', bg: 'linear-gradient(135deg,#34C759,#30D158)' },
  { name: '我的钱包', emoji: '💰', bg: 'linear-gradient(135deg,#FF9500,#FFB800)' },
  { name: '邀请好友', emoji: '🎁', bg: 'linear-gradient(135deg,#FF2D55,#FF6B6B)' },
  { name: '会员中心', emoji: '👑', bg: 'linear-gradient(135deg,#5856D6,#7B79F0)' },
  { name: '附近门店', emoji: '🏪', bg: 'linear-gradient(135deg,#00C7BE,#30D5C8)' },
  { name: '在线客服', emoji: '🎧', bg: 'linear-gradient(135deg,#AF52DE,#D65BFF)' },
];

// 系统设置
const settings = [
  { emoji: '🔔', bg: 'linear-gradient(135deg,#007AFF,#5AC8FA)', label: '消息通知', value: '' },
  { emoji: '📍', bg: 'linear-gradient(135deg,#34C759,#30D158)', label: '收货地址管理', value: '3个地址' },
  { emoji: '🔒', bg: 'linear-gradient(135deg,#AF52DE,#D65BFF)', label: '账户与安全', value: '已绑定' },
  { emoji: '⚙️', bg: 'linear-gradient(135deg,#FF9500,#FFB800)', label: '通用设置', value: '' },
  { emoji: '❓', bg: 'linear-gradient(135deg,#FF6B35,#FF9A56)', label: '帮助与反馈', value: '' },
  { emoji: 'ℹ️', bg: 'linear-gradient(135deg,#5856D6,#7B79F0)', label: '关于生活小秘', value: 'v2.6.0' },
];

// 热门搜索
const hotSearches = ['火锅', '足疗', '电影票', 'KTV', '酒店', '日料', '欢乐谷', 'SPA', '健身', '海鲜'];

// 用户信息
const userInfo = {
  name: '乐享用户',
  avatarEmoji: '😊',
  avatarBg: 'linear-gradient(135deg,#FF6B35,#FFB627)',
  level: 'VIP3',
  levelText: '黄金会员',
  walletBalance: 2580,
  coupons: 36,
  points: 5890,
  following: 128,
  followers: 356,
  posts: 89,
};

module.exports = {
  categories,
  banners,
  merchants,
  deals,
  flashSales,
  recommendFeed,
  quickActions,
  chatReplies,
  newestPosts,
  newestFilters,
  orderStatuses,
  funcItems,
  settings,
  hotSearches,
  userInfo,
};
