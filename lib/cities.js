// lib/cities.js — 内置热门城市游玩数据（离线行程生成用）
// 每个城市提供 上午/下午/晚上 的建议景点与美食，引擎按天循环取用。
export const CITIES = {
  北京: {
    food: ['北京烤鸭', '炸酱面', '豆汁焦圈', '涮羊肉'],
    morning: [
      { name: '天安门广场 & 故宫', desc: '穿越六百年皇家宫殿，建议早到避开人流' },
      { name: '颐和园', desc: '皇家园林，昆明湖泛舟' }
    ],
    afternoon: [
      { name: '胡同漫步（南锣鼓巷/什刹海）', desc: '感受老北京烟火气' },
      { name: '长城（八达岭/慕田峪）', desc: '不到长城非好汉，预留半天' }
    ],
    evening: [
      { name: '三里屯 / 国贸夜景', desc: '现代北京的霓虹' },
      { name: '德云社相声', desc: '京味儿夜生活' }
    ],
    tip: '春秋最佳；故宫需提前预约门票。'
  },
  上海: {
    food: ['生煎', '小笼包', '本帮红烧肉', '葱油拌面'],
    morning: [
      { name: '外滩 & 南京路', desc: '万国建筑与百年商街' },
      { name: '豫园 & 城隍庙', desc: '江南园林与老城厢' }
    ],
    afternoon: [
      { name: '陆家嘴（东方明珠/上海中心）', desc: '登顶看天际线' },
      { name: '田子坊 / 思南公馆', desc: '文艺弄堂' }
    ],
    evening: [
      { name: '黄浦江夜游', desc: '两岸灯光秀' },
      { name: '静安寺商圈', desc: '购物与夜生活' }
    ],
    tip: '地铁发达，建议办张公共交通卡。'
  },
  杭州: {
    food: ['西湖醋鱼', '龙井虾仁', '东坡肉', '片儿川'],
    morning: [
      { name: '西湖（断桥/苏堤/白堤）', desc: '晨间骑行或散步最惬意' },
      { name: '灵隐寺', desc: '千年古刹，飞来峰石刻' }
    ],
    afternoon: [
      { name: '西溪湿地', desc: '城市绿肺，摇橹船' },
      { name: '龙井村品茶', desc: '茶园采风' }
    ],
    evening: [
      { name: '河坊街 & 南宋御街', desc: '夜市小吃' },
      { name: '《宋城千古情》演出', desc: '大型演艺' }
    ],
    tip: '西湖免费，周末人多建议工作日。'
  },
  成都: {
    food: ['火锅', '串串香', '担担面', '夫妻肺片'],
    morning: [
      { name: '大熊猫繁育研究基地', desc: '看滚滚，务必早去' },
      { name: '宽窄巷子', desc: '老成都慢生活' }
    ],
    afternoon: [
      { name: '武侯祠 & 锦里', desc: '三国文化与小吃街' },
      { name: '杜甫草堂', desc: '诗意园林' }
    ],
    evening: [
      { name: '春熙路 / 太古里', desc: '时尚夜生活' },
      { name: '蜀风雅韵川剧', desc: '看变脸' }
    ],
    tip: '美食之都，留好胃口；吃辣量力而行。'
  },
  西安: {
    food: ['肉夹馍', '羊肉泡馍', 'biangbiang面', '凉皮'],
    morning: [
      { name: '兵马俑', desc: '世界第八大奇迹，预留半天' },
      { name: '西安城墙', desc: '骑城墙看晨光' }
    ],
    afternoon: [
      { name: '大雁塔 & 大唐不夜城', desc: '盛唐气象' },
      { name: '陕西历史博物馆', desc: '华夏宝藏' }
    ],
    evening: [
      { name: '回民街', desc: '夜市美食天堂' },
      { name: '钟鼓楼夜景', desc: '古城中心' }
    ],
    tip: '兵马俑离市区较远，安排专车或早班车。'
  },
  重庆: {
    food: ['重庆火锅', '小面', '酸辣粉', '江湖菜'],
    morning: [
      { name: '洪崖洞', desc: '魔幻8D夜景地标（白天也值）' },
      { name: '李子坝轻轨', desc: '穿楼而过的轻轨' }
    ],
    afternoon: [
      { name: '磁器口古镇', desc: '嘉陵江畔老镇' },
      { name: '长江索道', desc: '空中看两江' }
    ],
    evening: [
      { name: '南滨路夜景', desc: '看渝中半岛灯光' },
      { name: '解放碑商圈', desc: '山城不夜城' }
    ],
    tip: '地形复杂，导航以"到达层"为准。'
  },
  厦门: {
    food: ['沙茶面', '海蛎煎', '土笋冻', '姜母鸭'],
    morning: [
      { name: '鼓浪屿', desc: '海上花园，提前买船票' },
      { name: '环岛路骑行', desc: '海岸线风景' }
    ],
    afternoon: [
      { name: '南普陀寺 & 厦大', desc: '闽南古刹与最美校园' },
      { name: '曾厝垵', desc: '文艺渔村' }
    ],
    evening: [
      { name: '中山路步行街', desc: '骑楼夜市' },
      { name: '鹭江夜游', desc: '看对岸鼓浪屿灯光' }
    ],
    tip: '鼓浪屿船票旺季紧张，务必提前。'
  },
  三亚: {
    food: ['海鲜大餐', '椰子鸡', '清补凉', '文昌鸡'],
    morning: [
      { name: '亚龙湾 / 三亚湾', desc: '沙滩日出' },
      { name: '蜈支洲岛', desc: '潜水天堂' }
    ],
    afternoon: [
      { name: '天涯海角', desc: '经典地标' },
      { name: '南山文化苑', desc: '海上观音' }
    ],
    evening: [
      { name: '第一市场海鲜', desc: '现捞现做' },
      { name: '海棠湾夜景', desc: '奢华酒店群' }
    ],
    tip: '防晒必备；11月-次年3月为最佳季节。'
  },
  丽江: {
    food: ['腊排骨火锅', '鸡豆凉粉', '纳西烤鱼', '酥油茶'],
    morning: [
      { name: '丽江古城', desc: '四方街与流水人家' },
      { name: '玉龙雪山', desc: '雪山索道，注意高反' }
    ],
    afternoon: [
      { name: '束河古镇', desc: '更安静的古镇' },
      { name: '拉市海', desc: '湿地骑马划船' }
    ],
    evening: [
      { name: '古城酒吧街', desc: '民谣live' },
      { name: '看星空', desc: '高原夜空' }
    ],
    tip: '海拔较高，行动放缓、注意防寒。'
  },
  苏州: {
    food: ['松鼠桂鱼', '阳澄湖大闸蟹', '苏式汤面', '糕团'],
    morning: [
      { name: '拙政园', desc: '江南园林之首' },
      { name: '平江路', desc: '水巷老街' }
    ],
    afternoon: [
      { name: '留园 & 虎丘', desc: '园林与斜塔' },
      { name: '苏州博物馆', desc: '贝聿铭设计' }
    ],
    evening: [
      { name: '山塘街夜游', desc: '水乡夜色' },
      { name: '网师园夜花园', desc: '古典夜演' }
    ],
    tip: '园林精致，建议请讲解或租语音导览。'
  }
};

export function knownCity(name) {
  if (!name) return null;
  if (CITIES[name]) return name;
  // 容错：去掉"市"
  const t = name.replace(/市$/, '');
  if (CITIES[t]) return t;
  return null;
}
