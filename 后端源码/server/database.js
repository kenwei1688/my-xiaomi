// ==================== 生活小秘 - 内存数据库 ====================
// 包含完整种子数据 + CRUD 操作

const db = {
  // ===== 分类 =====
  categories: [
    { id: 1, name: '美食', icon: 'food', color: '#FF6B35', color2: '#FF9A56' },
    { id: 2, name: '足疗按摩', icon: 'massage', color: '#5856D6', color2: '#7B79F0' },
    { id: 3, name: '打车出行', icon: 'car', color: '#34C759', color2: '#30D158' },
    { id: 4, name: '景点游玩', icon: 'camera', color: '#00C7BE', color2: '#30D5C8' },
    { id: 5, name: '旅游度假', icon: 'plane', color: '#007AFF', color2: '#5AC8FA' },
    { id: 6, name: '运动健身', icon: 'dumbbell', color: '#FF9500', color2: '#FFB800' },
    { id: 7, name: 'KTV', icon: 'mic', color: '#AF52DE', color2: '#D65BFF' },
    { id: 8, name: '电影演出', icon: 'film', color: '#FF2D55', color2: '#FF6B6B' },
  ],

  // ===== 轮播图 =====
  banners: [
    { id: 1, title: '夏日美食节', subtitle: '全场5折起 满100减30', category: '美食', seed: 'banner1', tag: '限时' },
    { id: 2, title: '养生足疗季', subtitle: '专业技师 49元起畅享', category: '足疗按摩', seed: 'banner2', tag: '热卖' },
    { id: 3, title: '周末出游季', subtitle: '精选景点门票 低至3折', category: '旅游度假', seed: 'banner3', tag: '推荐' },
  ],

  // ===== 热门搜索 =====
  hotSearches: ['火锅', '足疗', '电影票', '密室逃脱', '日料', 'KTV', '健身房', '亲子乐园', '温泉', '烧烤'],

  // ===== 商家列表 =====
  merchants: [
    { id: 1, name: '蜀香居老火锅', category: '美食', categoryId: 1, rating: 4.8, distance: '1.2km', address: '朝阳区建国路88号SOHO现代城B座', hours: '10:00-22:00', avgPrice: 128, soldCount: 3280, tags: ['火锅', '川菜', '聚餐'], seed: 'merchant1', open: true, desc: '正宗重庆牛油锅底，精选空运毛肚、鲜鸭肠等百余种食材' },
    { id: 2, name: '汤泉一品足道会所', category: '足疗按摩', categoryId: 2, rating: 4.9, distance: '0.8km', address: '海淀区中关村大街15号', hours: '10:00-02:00', avgPrice: 198, soldCount: 2150, tags: ['足疗', 'SPA', '按摩'], seed: 'merchant2', open: true, desc: '技师手法专业，环境优雅私密，提供足疗、全身按摩、精油SPA等' },
    { id: 3, name: '西贝莜面村', category: '美食', categoryId: 1, rating: 4.7, distance: '2.1km', address: '朝阳区三里屯太古里S6-31', hours: '11:00-21:30', avgPrice: 89, soldCount: 5600, tags: ['西北菜', '亲子', '健康'], seed: 'merchant3', open: true, desc: '西北特色莜面、羊肉串，食材绿色天然，适合家庭聚餐' },
    { id: 4, name: '金逸影城IMAX', category: '电影演出', categoryId: 8, rating: 4.6, distance: '1.5km', address: '朝阳区朝阳大悦城7F', hours: '09:00-24:00', avgPrice: 55, soldCount: 12800, tags: ['IMAX', '影城', '约会'], seed: 'merchant4', open: true, desc: 'IMAX巨幕影厅，杜比全景声，最新院线大片同步上映' },
    { id: 5, name: '欢乐KTV主题量贩', category: 'KTV', categoryId: 7, rating: 4.5, distance: '2.8km', address: '丰台区方庄芳城园1号', hours: '12:00-06:00', avgPrice: 68, soldCount: 4300, tags: ['KTV', '聚会', '欢唱'], seed: 'merchant5', open: true, desc: '50间主题包厢，进口音响设备，含酒水小吃套餐' },
    { id: 6, name: '超级猩猩健身工坊', category: '运动健身', categoryId: 6, rating: 4.9, distance: '1.8km', address: '朝阳区国贸三期B座5F', hours: '06:00-23:00', avgPrice: 299, soldCount: 890, tags: ['健身', '私教', '团课'], seed: 'merchant6', open: true, desc: '24小时智能健身，不推销不办卡，按次付费，进口器械' },
    { id: 7, name: '故宫博物院', category: '景点游玩', categoryId: 4, rating: 4.9, distance: '5.2km', address: '东城区景山前街4号', hours: '08:30-17:00', avgPrice: 60, soldCount: 89000, tags: ['5A景区', '文化', '历史'], seed: 'merchant7', open: true, desc: '世界文化遗产，明清两代皇宫，珍宝馆、钟表馆值得一看' },
    { id: 8, name: '颐和园', category: '景点游玩', categoryId: 4, rating: 4.8, distance: '8.5km', address: '海淀区新建宫门路19号', hours: '06:30-18:00', avgPrice: 30, soldCount: 65000, tags: ['皇家园林', '5A景区', '湖景'], seed: 'merchant8', open: true, desc: '清代皇家园林，昆明湖、万寿山、长廊等经典景观' },
    { id: 9, name: '南京大排档', category: '美食', categoryId: 1, rating: 4.6, distance: '1.6km', address: '朝阳区朝阳大悦城6F', hours: '11:00-22:00', avgPrice: 75, soldCount: 7200, tags: ['金陵菜', '小吃', '复古'], seed: 'merchant9', open: true, desc: '民国风装修，金陵盐水鸭、狮子头、美龄粥等经典金陵美食' },
    { id: 10, name: '花涧堂养生SPA', category: '足疗按摩', categoryId: 2, rating: 4.8, distance: '2.3km', address: '朝阳区望京SOHO T1-1602', hours: '10:00-23:00', avgPrice: 358, soldCount: 1200, tags: ['SPA', '精油', '养生'], seed: 'merchant10', open: true, desc: '泰式古法按摩，进口精油，独立贵宾房含茶点' },
    { id: 11, name: '环球影城', category: '旅游度假', categoryId: 5, rating: 4.7, distance: '22km', address: '通州区文化旅游区', hours: '09:00-19:00', avgPrice: 548, soldCount: 21000, tags: ['主题乐园', '哈利波特', '变形金刚'], seed: 'merchant11', open: true, desc: '好莱坞主题乐园，哈利波特魔法世界、变形金刚3D骑乘' },
    { id: 12, name: '麦穗轻食沙拉', category: '美食', categoryId: 1, rating: 4.5, distance: '0.5km', address: '朝阳区建外SOHO 9号楼', hours: '07:00-21:00', avgPrice: 45, soldCount: 3400, tags: ['轻食', '沙拉', '健康'], seed: 'merchant12', open: true, desc: '现做沙拉、谷物碗、鲜榨果蔬汁，健身人群首选' },
    { id: 13, name: '首钢园极限运动场', category: '运动健身', categoryId: 6, rating: 4.6, distance: '15km', address: '石景山区石景山路68号', hours: '09:00-21:00', avgPrice: 168, soldCount: 670, tags: ['滑板', '攀岩', '极限'], seed: 'merchant13', open: false, desc: '工业风改造极限运动场，室内攀岩、滑板、跑酷场地' },
    { id: 14, name: '天安门广场', category: '景点游玩', categoryId: 4, rating: 4.9, distance: '4.8km', address: '东城区东长安街', hours: '全天开放', avgPrice: 0, soldCount: 999999, tags: ['地标', '免费', '升旗'], seed: 'merchant14', open: true, desc: '世界最大城市广场，每天日出升旗仪式，免费参观' },
    { id: 15, name: '橙天嘉禾影城', category: '电影演出', categoryId: 8, rating: 4.5, distance: '3.2km', address: '西城区西单大悦城10F', hours: '09:00-24:00', avgPrice: 48, soldCount: 9800, tags: ['影城', '4D', '购物'], seed: 'merchant15', open: true, desc: '4D影厅+杜比厅，西单商圈核心位置，购物观影一站式' },
  ],

  // ===== 特价美食 =====
  deals: [
    { id: 1, name: '双人火锅套餐', merchant: '蜀香居老火锅', price: 99, originalPrice: 198, soldCount: 1280, rating: 4.8, seed: 'deal1' },
    { id: 2, name: '西北四菜套餐', merchant: '西贝莜面村', price: 68, originalPrice: 136, soldCount: 980, rating: 4.7, seed: 'deal2' },
    { id: 3, name: '金陵美食三人餐', merchant: '南京大排档', price: 128, originalPrice: 256, soldCount: 2300, rating: 4.6, seed: 'deal3' },
    { id: 4, name: '健康轻食周卡', merchant: '麦穗轻食沙拉', price: 199, originalPrice: 315, soldCount: 560, rating: 4.5, seed: 'deal4' },
    { id: 5, name: '足疗养生套餐', merchant: '汤泉一品足道', price: 128, originalPrice: 198, soldCount: 890, rating: 4.9, seed: 'deal5' },
    { id: 6, name: 'SPA精油体验', merchant: '花涧堂养生SPA', price: 268, originalPrice: 358, soldCount: 320, rating: 4.8, seed: 'deal6' },
  ],

  // ===== 限时秒杀 =====
  flashSales: [
    { id: 1, name: '火锅四人餐', price: 168, originalPrice: 398, soldCount: 86, totalStock: 100, endTime: getEndTime(3), seed: 'flash1' },
    { id: 2, name: '足疗60分钟', price: 49, originalPrice: 128, soldCount: 192, totalStock: 200, endTime: getEndTime(5), seed: 'flash2' },
    { id: 3, name: '电影票2张', price: 39, originalPrice: 110, soldCount: 348, totalStock: 500, endTime: getEndTime(1), seed: 'flash3' },
    { id: 4, name: 'KTV欢唱3小时', price: 29, originalPrice: 168, soldCount: 67, totalStock: 80, endTime: getEndTime(8), seed: 'flash4' },
    { id: 5, name: '健身单次卡', price: 19, originalPrice: 99, soldCount: 289, totalStock: 300, endTime: getEndTime(2), seed: 'flash5' },
  ],

  // ===== 兴趣偏好标签 =====
  interestTags: [
    { id: 1, name: '美食探店', selected: true, icon: 'food' },
    { id: 2, name: '足疗养生', selected: true, icon: 'massage' },
    { id: 3, name: '电影演出', selected: false, icon: 'film' },
    { id: 4, name: 'K歌聚会', selected: false, icon: 'mic' },
    { id: 5, name: '运动健身', selected: false, icon: 'dumbbell' },
    { id: 6, name: '周边游', selected: true, icon: 'camera' },
    { id: 7, name: '长途旅行', selected: false, icon: 'plane' },
    { id: 8, name: '打车出行', selected: false, icon: 'car' },
    { id: 9, name: '温泉度假', selected: false, icon: 'pin' },
    { id: 10, name: '亲子乐园', selected: false, icon: 'star' },
    { id: 11, name: '密室逃脱', selected: false, icon: 'question' },
    { id: 12, name: '美甲美发', selected: false, icon: 'gift' },
  ],

  // ===== 推荐流 =====
  recommendFeed: [
    { id: 1, title: '蜀香居老火锅', subtitle: '正宗重庆牛油锅底', category: '美食', rating: 4.8, distance: '1.2km', price: 128, seed: 'rec1', tag: '热门' },
    { id: 2, title: '汤泉一品足道会所', subtitle: '专业技师手法到位', category: '足疗按摩', rating: 4.9, distance: '0.8km', price: 198, seed: 'rec2', tag: '好评' },
    { id: 3, title: '故宫博物院', subtitle: '世界文化遗产', category: '景点游玩', rating: 4.9, distance: '5.2km', price: 60, seed: 'rec3', tag: '必去' },
    { id: 4, title: '环球影城', subtitle: '哈利波特魔法世界', category: '旅游度假', rating: 4.7, distance: '22km', price: 548, seed: 'rec4', tag: '热门' },
    { id: 5, title: '金逸影城IMAX', subtitle: 'IMAX巨幕杜比全景声', category: '电影演出', rating: 4.6, distance: '1.5km', price: 55, seed: 'rec5', tag: '推荐' },
    { id: 6, title: '超级猩猩健身', subtitle: '24小时按次付费', category: '运动健身', rating: 4.9, distance: '1.8km', price: 299, seed: 'rec6', tag: '好评' },
    { id: 7, title: '西贝莜面村', subtitle: '西北特色健康美食', category: '美食', rating: 4.7, distance: '2.1km', price: 89, seed: 'rec7', tag: '亲子' },
    { id: 8, title: '欢乐KTV主题', subtitle: '50间主题包厢欢唱', category: 'KTV', rating: 4.5, distance: '2.8km', price: 68, seed: 'rec8', tag: '聚会' },
    { id: 9, title: '颐和园', subtitle: '皇家园林湖光山色', category: '景点游玩', rating: 4.8, distance: '8.5km', price: 30, seed: 'rec9', tag: '必去' },
    { id: 10, title: '南京大排档', subtitle: '民国风金陵美食', category: '美食', rating: 4.6, distance: '1.6km', price: 75, seed: 'rec10', tag: '推荐' },
    { id: 11, title: '花涧堂养生SPA', subtitle: '泰式古法精油按摩', category: '足疗按摩', rating: 4.8, distance: '2.3km', price: 358, seed: 'rec11', tag: '好评' },
    { id: 12, title: '麦穗轻食沙拉', subtitle: '现做健康轻食', category: '美食', rating: 4.5, distance: '0.5km', price: 45, seed: 'rec12', tag: '健康' },
    { id: 13, title: '首钢园极限运动', subtitle: '工业风滑板攀岩', category: '运动健身', rating: 4.6, distance: '15km', price: 168, seed: 'rec13', tag: '潮玩' },
    { id: 14, title: '天安门广场', subtitle: '世界最大城市广场', category: '景点游玩', rating: 4.9, distance: '4.8km', price: 0, seed: 'rec14', tag: '免费' },
    { id: 15, title: '橙天嘉禾影城', subtitle: '4D影厅杜比厅', category: '电影演出', rating: 4.5, distance: '3.2km', price: 48, seed: 'rec15', tag: '推荐' },
    { id: 16, title: '环球影城', subtitle: '变形金刚3D骑乘', category: '旅游度假', rating: 4.7, distance: '22km', price: 548, seed: 'rec16', tag: '热门' },
  ],

  // ===== 上新动态 =====
  newestFeed: [
    {
      id: 1, author: '蜀香居老火锅', authorType: '商家', category: '美食', categoryTag: '美食',
      content: '新品上市！鲜毛肚空运到店，每日限量50份。搭配秘制牛油锅底，一口鲜嫩，两口爽脆！',
      price: 88, originalPrice: 128, groupPrice: 78, content2: '双人套餐含：鲜毛肚+鸭肠+黄喉+蔬菜拼盘+酸梅汤',
      seed: 'new1', avatarSeed: 'a1', likes: 328, liked: false, comments: [
        { user: '吃货小李', text: '毛肚绝了！鲜嫩爽脆' },
        { user: '美食猎人', text: '这个价格很划算' },
      ]
    },
    {
      id: 2, author: '汤泉一品足道', authorType: '商家', category: '养生', categoryTag: '养生',
      content: '全新艾草温灸足疗上线！古法艾灸+足底穴位按摩，温经散寒、祛湿助眠。夏季养生首选。',
      price: 168, originalPrice: 268, groupPrice: 138, content2: '60分钟艾草温灸套餐：足浴+穴位按摩+艾灸+花茶',
      seed: 'new2', avatarSeed: 'a2', likes: 215, liked: false, comments: [
        { user: '养生达人', text: '做完很舒服，睡眠都好了' },
      ]
    },
    {
      id: 3, author: '环球影城', authorType: '商家', category: '旅游', categoryTag: '旅游',
      content: '夏日狂欢！侏罗纪世界新区域开放，沉浸式恐龙互动体验+激流勇进升级版。限时限量早鸟票。',
      price: 468, originalPrice: 548, groupPrice: 428, content2: '全日通票含：所有游乐设施+侏罗纪新区+花车巡游',
      seed: 'new3', avatarSeed: 'a3', likes: 892, liked: false, comments: [
        { user: '恐龙迷', text: '太期待了！' },
        { user: '亲子游达人', text: '孩子一定会喜欢' },
        { user: '冒险家', text: '激流勇进升级版超刺激' },
      ]
    },
    {
      id: 4, author: '超级猩猩健身', authorType: '商家', category: '健身', categoryTag: '健身',
      content: '新品上线！AI智能私教课程，根据你的体能数据定制训练计划。含体测分析+个性化方案。',
      price: 299, originalPrice: 499, groupPrice: 259, content2: 'AI私教月卡：体测+定制计划+4次私教课+营养指导',
      seed: 'new4', avatarSeed: 'a4', likes: 156, liked: false, comments: [
        { user: '健身小白', text: '正好需要个性化指导' },
      ]
    },
    {
      id: 5, author: '欢乐KTV主题', authorType: '商家', category: 'KTV', categoryTag: 'KTV',
      content: '全新星际主题包厢上线！沉浸式星空穹顶+3D环绕音效+智能点歌系统。开业特惠欢唱3小时。',
      price: 59, originalPrice: 168, groupPrice: 49, content2: '星际包厢3小时套餐：包厢+酒水小吃+点歌系统',
      seed: 'new5', avatarSeed: 'a5', likes: 432, liked: false, comments: [
        { user: '麦霸小姐姐', text: '星空穹顶太好看了' },
        { user: '聚会达人', text: '团建首选' },
      ]
    },
    {
      id: 6, author: '花涧堂养生SPA', authorType: '商家', category: '养生', categoryTag: '养生',
      content: '夏季限定荷花精油SPA上线！采用天然荷花精油，清凉舒缓、美白淡斑。含全身按摩+面部护理。',
      price: 298, originalPrice: 458, groupPrice: 268, content2: '荷花精油SPA套餐：全身按摩+面部护理+花茶点心+沐浴',
      seed: 'new6', avatarSeed: 'a6', likes: 198, liked: false, comments: [
        { user: '精致女孩', text: '荷花精油好特别' },
      ]
    },
  ],

  // ===== 上新筛选 =====
  newestFilters: ['全部', '美食', '养生', '健身', 'KTV', '旅游'],

  // ===== 订单分类 =====
  orderCategories: [
    { id: 'pending', name: '待付款', icon: 'card', count: 2 },
    { id: 'pending_use', name: '待使用', icon: 'ticket', count: 3 },
    { id: 'pending_review', name: '待评价', icon: 'edit', count: 1 },
    { id: 'refund', name: '退款', icon: 'refresh', count: 0 },
  ],

  // ===== 功能入口 =====
  functions: [
    { id: 1, name: '我的收藏', icon: 'star' },
    { id: 2, name: '收货地址', icon: 'pin' },
    { id: 3, name: '我的钱包', icon: 'wallet' },
    { id: 4, name: '邀请好友', icon: 'gift' },
  ],

  // ===== 设置列表 =====
  settings: [
    { id: 1, name: '收货地址管理', icon: 'pin' },
    { id: 2, name: '账户与安全', icon: 'lock' },
    { id: 3, name: '通用设置', icon: 'gear' },
    { id: 4, name: '帮助与反馈', icon: 'question' },
    { id: 5, name: '关于生活小秘', icon: 'info' },
  ],

  // ===== 用户信息 =====
  user: {
    id: 1,
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
  },

  // ===== 订单 =====
  orders: [
    { id: 'ORD20260808001', merchant: '蜀香居老火锅', item: '双人火锅套餐', price: 99, status: 'pending_use', date: '2026-08-08', seed: 'order1' },
    { id: 'ORD20260807002', merchant: '汤泉一品足道', item: '足疗养生套餐', price: 128, status: 'pending_use', date: '2026-08-07', seed: 'order2' },
    { id: 'ORD20260806003', merchant: '金逸影城IMAX', item: '电影票2张', price: 39, status: 'pending_review', date: '2026-08-06', seed: 'order3' },
    { id: 'ORD20260805004', merchant: '欢乐KTV', item: 'KTV欢唱3小时', price: 29, status: 'pending', date: '2026-08-05', seed: 'order4' },
    { id: 'ORD20260804005', merchant: '超级猩猩健身', item: '健身单次卡', price: 19, status: 'pending', date: '2026-08-04', seed: 'order5' },
  ],

  // ===== 行程规划 =====
  trips: [
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
      seed: 'tripsanya',
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
      seed: 'triphk',
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
      seed: 'tripbj',
      progress: 100,
      schedule: [
        { day: 1, plan: '抵达北京 → 故宫博物院 → 景山公园', icon: 'pin' },
        { day: 2, plan: '长城一日游 → 鸟巢水立方夜景', icon: 'camera' },
        { day: 3, plan: '颐和园 → 圆明园 → 清华北大', icon: 'star' },
        { day: 4, plan: '天坛 → 南锣鼓巷 → 簋街美食', icon: 'food' },
        { day: 5, plan: '798艺术区 → 返程', icon: 'plane' },
      ],
    },
  ],

  // ===== 提醒事项 =====
  reminders: [
    { id: 1, type: 'work', title: '上班打卡提醒', desc: '每日 09:00 准时打卡，别迟到哦～', time: '09:00', repeat: '工作日重复', method: 'alarm', enabled: true, icon: 'clock' },
    { id: 2, type: 'offwork', title: '下班打卡提醒', desc: '每日 18:00 下班打卡，辛苦了！', time: '18:00', repeat: '工作日重复', method: 'alarm', enabled: true, icon: 'clock' },
    { id: 3, type: 'travel', title: '三亚出行提醒', desc: '8月20日 07:30 出发前往机场，记得带身份证和防晒霜！', time: '07:30', date: '2026-08-20', repeat: '仅一次', method: 'wechat', enabled: true, icon: 'plane' },
    { id: 4, type: 'custom', title: '健身打卡', desc: '每周一三五 20:00 健身时间，坚持就是胜利！', time: '20:00', repeat: '周一/三/五', method: 'alarm', enabled: false, icon: 'dumbbell' },
    { id: 5, type: 'custom', title: '妈妈生日', desc: '记得提前准备生日礼物和蛋糕🎂', time: '10:00', date: '2026-08-18', repeat: '每年', method: 'sms', enabled: true, icon: 'gift' },
  ],

  // ===== 快捷指令 =====
  quickActions: [
    { id: 1, name: '点外卖', icon: 'food', color: '#FF6B35' },
    { id: 2, name: '订餐厅', icon: 'store', color: '#FF9500' },
    { id: 3, name: '订酒店', icon: 'pin', color: '#5856D6' },
    { id: 4, name: '买火车票', icon: 'plane', color: '#007AFF' },
    { id: 5, name: '买飞机票', icon: 'plane', color: '#00C7BE' },
    { id: 6, name: '规划行程', icon: 'camera', color: '#34C759' },
    { id: 7, name: '买电影票', icon: 'film', color: '#FF2D55' },
    { id: 8, name: '订KTV', icon: 'mic', color: '#AF52DE' },
  ],
};

// 辅助函数：生成结束时间
function getEndTime(hoursFromNow) {
  return Date.now() + hoursFromNow * 3600000;
}

// ===== 数据库操作方法 =====

// 获取所有分类
db.getCategories = function() {
  return this.categories;
};

// 获取轮播
db.getBanners = function() {
  return this.banners;
};

// 获取热门搜索
db.getHotSearches = function() {
  return this.hotSearches;
};

// 获取商家列表（支持筛选）
db.getMerchants = function(filter = {}) {
  let result = [...this.merchants];
  if (filter.categoryId) {
    result = result.filter(m => m.categoryId === filter.categoryId);
  }
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    result = result.filter(m =>
      m.name.toLowerCase().includes(kw) ||
      m.tags.some(t => t.toLowerCase().includes(kw)) ||
      m.desc.toLowerCase().includes(kw)
    );
  }
  if (filter.nearby) {
    result.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
  }
  if (filter.limit) {
    result = result.slice(0, filter.limit);
  }
  return result;
};

// 获取单个商家
db.getMerchant = function(id) {
  return this.merchants.find(m => m.id === parseInt(id));
};

// 搜索商家
db.searchMerchants = function(query) {
  if (!query) return [];
  const kw = query.toLowerCase();
  return this.merchants.filter(m =>
    m.name.toLowerCase().includes(kw) ||
    m.category.toLowerCase().includes(kw) ||
    m.tags.some(t => t.toLowerCase().includes(kw)) ||
    m.desc.toLowerCase().includes(kw)
  );
};

// 获取特价美食
db.getDeals = function() {
  return this.deals;
};

// 获取秒杀
db.getFlashSales = function() {
  return this.flashSales.map(f => ({
    ...f,
    endTime: f.endTime,
    remaining: Math.max(0, f.endTime - Date.now()),
  }));
};

// 获取兴趣标签
db.getInterestTags = function() {
  return this.interestTags;
};

// 更新兴趣标签
db.updateInterests = function(selectedIds) {
  this.interestTags.forEach(t => {
    t.selected = selectedIds.includes(t.id);
  });
  this.user.interests = selectedIds;
  return this.interestTags;
};

// 获取推荐流（基于兴趣）
db.getRecommendations = function() {
  const selectedCategories = this.interestTags
    .filter(t => t.selected)
    .map(t => t.name);

  let feed = [...this.recommendFeed];

  // 将匹配兴趣的排在前面
  feed.sort((a, b) => {
    const aMatch = selectedCategories.some(c =>
      a.category.includes(c) || a.title.includes(c)
    );
    const bMatch = selectedCategories.some(c =>
      b.category.includes(c) || b.title.includes(c)
    );
    return (bMatch ? 1 : 0) - (aMatch ? 1 : 0);
  });

  return feed;
};

// 获取上新动态
db.getNewestFeed = function(filter) {
  let result = [...this.newestFeed];
  if (filter && filter !== '全部') {
    result = result.filter(item => item.categoryTag === filter);
  }
  return result;
};

// 获取上新筛选
db.getNewestFilters = function() {
  return this.newestFilters;
};

// 点赞/取消点赞
db.toggleLike = function(postId) {
  const post = this.newestFeed.find(p => p.id === parseInt(postId));
  if (post) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    return post;
  }
  return null;
};

// 添加评论
db.addComment = function(postId, user, text) {
  const post = this.newestFeed.find(p => p.id === parseInt(postId));
  if (post) {
    post.comments.push({ user, text });
    return post;
  }
  return null;
};

// 获取订单
db.getOrders = function(status) {
  if (status && status !== 'all') {
    return this.orders.filter(o => o.status === status);
  }
  return this.orders;
};

// 创建订单
db.createOrder = function(orderData) {
  const order = {
    id: 'ORD' + Date.now(),
    ...orderData,
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
  };
  this.orders.unshift(order);
  return order;
};

// 获取用户信息
db.getUser = function() {
  return this.user;
};

// 获取快捷指令
db.getQuickActions = function() {
  return this.quickActions;
};

// 获取订单分类
db.getOrderCategories = function() {
  return this.orderCategories;
};

// 获取功能入口
db.getFunctions = function() {
  return this.functions;
};

// 获取设置列表
db.getSettings = function() {
  return this.settings;
};

// 获取行程规划
db.getTrips = function(status) {
  if (status && status !== 'all') {
    return this.trips.filter(t => t.status === status);
  }
  return this.trips;
};

// 创建行程
db.createTrip = function(tripData) {
  const trip = {
    id: Date.now(),
    ...tripData,
    progress: 0,
    spent: 0,
  };
  this.trips.unshift(trip);
  return trip;
};

// 删除行程
db.deleteTrip = function(id) {
  const idx = this.trips.findIndex(t => t.id === parseInt(id) || t.id === id);
  if (idx >= 0) {
    return this.trips.splice(idx, 1)[0];
  }
  return null;
};

// 获取提醒事项
db.getReminders = function() {
  return this.reminders;
};

// 创建提醒
db.createReminder = function(reminderData) {
  const reminder = {
    id: Date.now(),
    ...reminderData,
    enabled: true,
  };
  this.reminders.push(reminder);
  return reminder;
};

// 切换提醒状态
db.toggleReminder = function(id) {
  const r = this.reminders.find(r => r.id === parseInt(id));
  if (r) {
    r.enabled = !r.enabled;
    return r;
  }
  return null;
};

// 删除提醒
db.deleteReminder = function(id) {
  const idx = this.reminders.findIndex(r => r.id === parseInt(id));
  if (idx >= 0) {
    return this.reminders.splice(idx, 1)[0];
  }
  return null;
};

// 更新用户资料
db.updateUser = function(updates) {
  Object.assign(this.user, updates);
  return this.user;
};

module.exports = db;
