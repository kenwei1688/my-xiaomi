// ==================== 生活小秘 - AI 对话引擎 ====================
// 意图识别 + 实体提取 + 多轮对话 + 数据驱动回复

class AIEngine {
  constructor(database) {
    this.db = database;
    this.sessions = new Map();
    this.botName = '小秘';
  }

  // ===== 会话管理 =====
  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        state: 'idle',       // idle | searching | selecting | ordering | planning | chatting
        intent: null,        // 当前意图
        context: {},         // 上下文数据（选中的商家、品类等）
        history: [],         // 对话历史
        lastIntent: null,    // 上次意图
        step: 0,             // 当前流程步骤
      });
    }
    return this.sessions.get(sessionId);
  }

  // ===== 主入口 =====
  chat(message, sessionId = 'default') {
    const session = this.getSession(sessionId);
    const msg = message.trim().toLowerCase();
    session.history.push({ role: 'user', text: message });

    // 意图识别
    const intent = this.recognizeIntent(msg, session);
    // 实体提取
    const entities = this.extractEntities(msg, intent);
    // 生成回复
    const response = this.generateResponse(intent, entities, message, session);

    session.history.push({ role: 'bot', text: response.reply });
    session.lastIntent = intent.type;
    session.intent = intent.type;

    return response;
  }

  // ===== 意图识别 =====
  recognizeIntent(msg, session) {
    // 中断当前流程（用户说了新话题）
    const isTopicChange = this.isTopicChange(msg, session);

    // 点外卖
    if (/(外卖|配送|送餐|饿了|吃什么|点餐|点饭|叫饭)/.test(msg)) {
      return { type: 'order_food', confidence: 0.9 };
    }
    // 订餐厅
    if (/(订餐厅|订位|预订餐厅|定位|book餐|餐厅预订|排号)/.test(msg)) {
      return { type: 'reserve_restaurant', confidence: 0.9 };
    }
    // 订酒店
    if (/(酒店|住宿|宾馆|民宿|旅馆|住哪|订房)/.test(msg)) {
      return { type: 'book_hotel', confidence: 0.9 };
    }
    // 火车票
    if (/(火车票|高铁票|动车票|火车|高铁|动车)/.test(msg)) {
      return { type: 'buy_train', confidence: 0.9 };
    }
    // 飞机票
    if (/(飞机票|机票|航班|飞机|飞往|飞去)/.test(msg)) {
      return { type: 'buy_flight', confidence: 0.9 };
    }
    // 规划行程
    if (/(规划行程|旅游攻略|行程安排|旅游计划|出去玩|周末去哪|旅行计划|安排一下|一日游|两日游|三日游|帮我规划|规划.*游|安排.*行程|附近.*好玩|有什么.*玩)/.test(msg)) {
      return { type: 'plan_trip', confidence: 0.9 };
    }
    // 电影票
    if (/(电影票|看电影|电影|影票|票房)/.test(msg)) {
      return { type: 'buy_movie', confidence: 0.9 };
    }
    // KTV
    if (/(ktv|k歌|唱歌|订包厢|订ktv)/.test(msg)) {
      return { type: 'book_ktv', confidence: 0.9 };
    }
    // 搜索/查询商家
    if (/(搜索|查找|找一下|有没有|附近|推荐|哪家好|哪个好)/.test(msg)) {
      // 判断搜索什么品类
      if (/(火锅|烧烤|日料|川菜|美食|饭|吃)/.test(msg)) return { type: 'search', category: '美食', confidence: 0.8 };
      if (/(足疗|按摩|spa|养生|推拿)/.test(msg)) return { type: 'search', category: '足疗按摩', confidence: 0.8 };
      if (/(景点|公园|游玩|逛逛|打卡)/.test(msg)) return { type: 'search', category: '景点游玩', confidence: 0.8 };
      if (/(健身|运动|锻炼|健身房)/.test(msg)) return { type: 'search', category: '运动健身', confidence: 0.8 };
      return { type: 'search', category: null, confidence: 0.6 };
    }
    // 美食类
    if (/(火锅|烧烤|日料|川菜|粤菜|西餐|中餐|小吃|面食|奶茶|咖啡)/.test(msg)) {
      return { type: 'search', category: '美食', keyword: this.extractFoodKeyword(msg), confidence: 0.8 };
    }
    // 足疗类
    if (/(足疗|按摩|spa|养生|推拿|泡脚)/.test(msg)) {
      return { type: 'search', category: '足疗按摩', confidence: 0.8 };
    }
    // 景点类
    if (/(故宫|长城|颐和园|天安门|公园|景点|博物馆)/.test(msg)) {
      return { type: 'search', category: '景点游玩', confidence: 0.8 };
    }
    // 健身类
    if (/(健身|瑜伽|跑步|游泳|私教)/.test(msg)) {
      return { type: 'search', category: '运动健身', confidence: 0.8 };
    }
    // 电影类
    if (/(电影|imax|3d|4d)/.test(msg)) {
      return { type: 'search', category: '电影演出', confidence: 0.8 };
    }
    // KTV类
    if (/(ktv|k歌)/.test(msg)) {
      return { type: 'search', category: 'KTV', confidence: 0.8 };
    }
    // 闲聊/打招呼
    if (/(你好|hi|hello|嗨|在吗|你是谁|你能做什么|帮助|功能)/.test(msg)) {
      return { type: 'greeting', confidence: 0.9 };
    }
    // 感谢
    if (/(谢谢|感谢|thx|多谢)/.test(msg)) {
      return { type: 'thanks', confidence: 0.9 };
    }
    // 再见
    if (/(再见|拜拜|bye|走了|886)/.test(msg)) {
      return { type: 'bye', confidence: 0.9 };
    }
    // 确认（多轮对话中）
    if (/(好的|可以|行|没问题|确认|下单|订这个|就要这个|是的|对)/.test(msg)) {
      if (session.state === 'selecting' || session.state === 'ordering') {
        return { type: 'confirm_order', confidence: 0.85 };
      }
    }
    // 取消
    if (/(取消|不要了算了|算了)/.test(msg)) {
      return { type: 'cancel', confidence: 0.9 };
    }

    // 查看更多
    if (/(更多|还有吗|其他的|换一批)/.test(msg)) {
      return { type: 'more', confidence: 0.8 };
    }

    // 默认：尝试搜索或闲聊
    return { type: 'general', confidence: 0.3 };
  }

  // ===== 实体提取 =====
  extractEntities(msg, intent) {
    const entities = {};

    // 提取品类关键词
    const foodKeywords = ['火锅', '烧烤', '日料', '川菜', '粤菜', '西餐', '中餐', '小吃', '面食', '奶茶', '咖啡', '沙拉', '轻食', '西北菜', '金陵菜'];
    for (const kw of foodKeywords) {
      if (msg.includes(kw)) {
        entities.keyword = kw;
        break;
      }
    }

    // 提取地点
    const locations = ['朝阳', '海淀', '西城', '东城', '丰台', '石景山', '通州', '望京', '三里屯', '国贸', '中关村', '西单', '方庄'];
    for (const loc of locations) {
      if (msg.includes(loc.toLowerCase())) {
        entities.location = loc;
        break;
      }
    }

    // 提取人数
    const peopleMatch = msg.match(/(\d+)(人|位)/);
    if (peopleMatch) {
      entities.people = parseInt(peopleMatch[1]);
    }

    // 提取价格意向
    if (/(便宜|实惠|低价|划算)/.test(msg)) {
      entities.priceRange = 'low';
    } else if (/(高端|贵|档次|奢华|高档)/.test(msg)) {
      entities.priceRange = 'high';
    }

    // 提取时间
    if (/(今天|今晚|现在|马上)/.test(msg)) {
      entities.time = 'today';
    } else if (/(明天|明晚|明日)/.test(msg)) {
      entities.time = 'tomorrow';
    } else if (/(周末|周六|周日|这周末)/.test(msg)) {
      entities.time = 'weekend';
    }

    return entities;
  }

  extractFoodKeyword(msg) {
    const keywords = ['火锅', '烧烤', '日料', '川菜', '粤菜', '西餐', '中餐', '小吃', '面食', '奶茶', '咖啡', '沙拉', '轻食'];
    for (const kw of keywords) {
      if (msg.includes(kw)) return kw;
    }
    return null;
  }

  // ===== 判断是否话题转换 =====
  isTopicChange(msg, session) {
    if (session.state === 'idle' || session.state === 'chatting') return true;
    return false;
  }

  // ===== 回复生成 =====
  generateResponse(intent, entities, originalMsg, session) {
    switch (intent.type) {
      case 'greeting':
        return this.handleGreeting(session);
      case 'order_food':
        return this.handleOrderFood(entities, session);
      case 'reserve_restaurant':
        return this.handleReserveRestaurant(entities, session);
      case 'book_hotel':
        return this.handleBookHotel(entities, session);
      case 'buy_train':
        return this.handleBuyTrain(entities, session);
      case 'buy_flight':
        return this.handleBuyFlight(entities, session);
      case 'plan_trip':
        return this.handlePlanTrip(entities, session);
      case 'buy_movie':
        return this.handleBuyMovie(entities, session);
      case 'book_ktv':
        return this.handleBookKTV(entities, session);
      case 'search':
        return this.handleSearch(intent, entities, session);
      case 'confirm_order':
        return this.handleConfirm(session);
      case 'cancel':
        return this.handleCancel(session);
      case 'more':
        return this.handleMore(session);
      case 'thanks':
        return {
          reply: '不客气！能帮到您是' + this.botName + '最大的开心～有需要随时找我哦！',
          actions: ['点外卖', '订酒店', '规划行程']
        };
      case 'bye':
        return {
          reply: '再见！祝您开心每一天，想吃喝玩乐了随时来找' + this.botName + '哦～',
          actions: []
        };
      default:
        return this.handleGeneral(originalMsg, session);
    }
  }

  // ===== 打招呼 =====
  handleGreeting(session) {
    session.state = 'idle';
    return {
      reply: `你好呀！我是${this.botName}，您的智能生活助手。我可以帮您：\n\n🍜 点外卖 / 订餐厅\n🏨 预订酒店\n🚄 买火车票 / 飞机票\n🎬 买电影票 / 订KTV\n🗺️ 智能规划出行行程\n\n直接告诉我你想做什么就行～`,
      actions: ['点外卖', '订酒店', '规划行程', '附近美食']
    };
  }

  // ===== 点外卖 =====
  handleOrderFood(entities, session) {
    if (session.state === 'ordering' && session.context.selectedMerchant) {
      // 确认下单
      const m = session.context.selectedMerchant;
      const order = this.db.createOrder({
        merchant: m.name,
        item: m.category + '套餐',
        price: Math.round(m.avgPrice * 0.8),
        seed: m.seed
      });
      session.state = 'idle';
      session.context = {};
      return {
        reply: `下单成功！\n\n📋 订单号：${order.id}\n🏪 商家：${m.name}\n💰 金额：¥${order.price}\n📍 配送地址：朝阳区建外SOHO 9号楼\n⏰ 预计送达：35-45分钟\n\n付款后商家立即开始备餐～`,
        actions: ['去付款', '查看订单', '继续逛逛']
      };
    }

    // 搜索美食商家
    let merchants = this.db.getMerchants({ categoryId: 1, nearby: true });
    if (entities.keyword) {
      merchants = merchants.filter(m =>
        m.tags.some(t => t.includes(entities.keyword)) ||
        m.name.includes(entities.keyword) ||
        m.desc.includes(entities.keyword)
      );
    }
    if (entities.priceRange === 'low') {
      merchants.sort((a, b) => a.avgPrice - b.avgPrice);
    }

    const top3 = merchants.slice(0, 3);
    session.state = 'selecting';
    session.context = { candidates: top3, intent: 'order_food' };

    const cards = top3.map(m => ({
      type: 'merchant',
      id: m.id,
      name: m.name,
      category: m.category,
      rating: m.rating,
      distance: m.distance,
      avgPrice: m.avgPrice,
      seed: m.seed,
      tags: m.tags,
      desc: m.desc
    }));

    let intro = entities.keyword
      ? `好的！帮您搜索附近的「${entities.keyword}」外卖，找到以下推荐：`
      : `好的！帮您找找附近好吃的外卖，为您推荐：`;

    if (entities.priceRange === 'low') intro += '（已按价格排序）';

    return {
      reply: intro,
      cards,
      actions: ['选第一家', '换一批', '看看其他品类']
    };
  }

  // ===== 订餐厅 =====
  handleReserveRestaurant(entities, session) {
    let merchants = this.db.getMerchants({ categoryId: 1, nearby: true });
    const top3 = merchants.slice(0, 3);
    session.state = 'selecting';
    session.context = { candidates: top3, intent: 'reserve_restaurant' };

    const people = entities.people ? `${entities.people}人` : '';
    return {
      reply: `好的，帮您预订餐厅${people}位！以下是附近热门餐厅：`,
      cards: top3.map(m => ({
        type: 'merchant',
        id: m.id,
        name: m.name,
        category: m.category,
        rating: m.rating,
        distance: m.distance,
        avgPrice: m.avgPrice,
        seed: m.seed,
        tags: m.tags,
        desc: m.desc
      })),
      actions: ['选第一家', '换一批']
    };
  }

  // ===== 订酒店 =====
  handleBookHotel(entities, session) {
    session.state = 'selecting';
    // 模拟酒店数据
    const hotels = [
      { name: '北京王府井希尔顿酒店', rating: 4.8, price: 688, distance: '3.5km', seed: 'hotel1', tags: ['五星级', '含早', '泳池'] },
      { name: '三里屯通盈中心洲际', rating: 4.9, price: 888, distance: '2.1km', seed: 'hotel2', tags: ['五星级', '含早', '健身'] },
      { name: '国贸大酒店', rating: 4.7, price: 568, distance: '1.8km', seed: 'hotel3', tags: ['四星级', '含早', '商务'] },
    ];
    session.context = { candidates: hotels, intent: 'book_hotel' };
    return {
      reply: '好的，帮您搜索附近优质酒店：',
      cards: hotels.map(h => ({
        type: 'hotel',
        name: h.name,
        rating: h.rating,
        price: h.price,
        distance: h.distance,
        seed: h.seed,
        tags: h.tags
      })),
      actions: ['选第一家', '换一批', '查看更多']
    };
  }

  // ===== 买火车票 =====
  handleBuyTrain(entities, session) {
    session.state = 'selecting';
    return {
      reply: '好的，帮您查询火车票！请告诉我：\n\n出发城市 → 目的地城市\n出行日期\n\n例如：北京 → 上海 明天',
      actions: ['北京→上海', '北京→广州', '北京→杭州']
    };
  }

  // ===== 买飞机票 =====
  handleBuyFlight(entities, session) {
    session.state = 'selecting';
    return {
      reply: '好的，帮您查询机票！请告诉我：\n\n出发城市 → 目的地城市\n出行日期\n\n例如：北京 → 三亚 周末',
      actions: ['北京→三亚', '北京→成都', '北京→昆明']
    };
  }

  // ===== 规划行程 =====
  handlePlanTrip(entities, session) {
    session.state = 'planning';
    const attractions = this.db.getMerchants({ categoryId: 4, nearby: true }).slice(0, 3);
    const food = this.db.getMerchants({ categoryId: 1, nearby: true }).slice(0, 2);
    const entertainment = this.db.getMerchants({ categoryId: 7 }).concat(this.db.getMerchants({ categoryId: 8 })).slice(0, 2);

    return {
      reply: `好的！帮您规划一日游行程 🗺️\n\n根据您的位置和偏好，推荐以下路线：\n\n🌅 上午 09:00\n${attractions[0] ? attractions[0].name : '故宫博物院'} - ${attractions[0] ? attractions[0].desc : ''}\n\n🍽️ 中午 12:00\n${food[0] ? food[0].name : '蜀香居老火锅'} 午餐 - 人均¥${food[0] ? food[0].avgPrice : 128}\n\n🎬 下午 14:30\n${entertainment[0] ? entertainment[0].name : '金逸影城IMAX'} - 看场最新大片\n\n🌸 下午 16:00\n${attractions[1] ? attractions[1].name : '天安门广场'} - 打卡拍照\n\n🍽️ 晚上 18:30\n${food[1] ? food[1].name : '南京大排档'} 晚餐 - 人均¥${food[1] ? food[1].avgPrice : 75}\n\n🎤 晚上 20:30\n${entertainment[1] ? entertainment[1].name : '欢乐KTV'} - K歌放松\n\n💡 全程花费约 ¥500-600，需要我帮您预订其中某项吗？`,
      cards: [
        ...(attractions[0] ? [{ type: 'merchant', ...attractions[0] }] : []),
        ...(food[0] ? [{ type: 'merchant', ...food[0] }] : []),
        ...(entertainment[0] ? [{ type: 'merchant', ...entertainment[0] }] : []),
      ],
      actions: ['预订全部', '只订餐饮', '只订景点']
    };
  }

  // ===== 买电影票 =====
  handleBuyMovie(entities, session) {
    const cinemas = this.db.getMerchants({ categoryId: 8 });
    session.state = 'selecting';
    session.context = { candidates: cinemas, intent: 'buy_movie' };

    return {
      reply: '好的，帮您查查附近影院和正在热映的电影：\n\n🎬 正在热映\n• 《流浪地球3》9.2分 - 科幻巨制\n• 《长安三万里》8.8分 - 历史动画\n• 《孤注一掷2》8.5分 - 犯罪悬疑\n\n以下是为您推荐的影院：',
      cards: cinemas.map(c => ({
        type: 'merchant',
        id: c.id,
        name: c.name,
        category: c.category,
        rating: c.rating,
        distance: c.distance,
        avgPrice: c.avgPrice,
        seed: c.seed,
        tags: c.tags,
        desc: c.desc
      })),
      actions: ['选第一家', '查看排片', '换一批']
    };
  }

  // ===== 订KTV =====
  handleBookKTV(entities, session) {
    const ktvs = this.db.getMerchants({ categoryId: 7 });
    session.state = 'selecting';
    session.context = { candidates: ktvs, intent: 'book_ktv' };

    return {
      reply: '好的，帮您找找附近KTV：',
      cards: ktvs.map(k => ({
        type: 'merchant',
        id: k.id,
        name: k.name,
        category: k.category,
        rating: k.rating,
        distance: k.distance,
        avgPrice: k.avgPrice,
        seed: k.seed,
        tags: k.tags,
        desc: k.desc
      })),
      actions: ['选这家', '换一批']
    };
  }

  // ===== 搜索 =====
  handleSearch(intent, entities, session) {
    let merchants;
    if (intent.category) {
      const cat = this.db.categories.find(c => c.name === intent.category);
      merchants = this.db.getMerchants({ categoryId: cat ? cat.id : null, nearby: true });
    } else {
      merchants = this.db.getMerchants({ nearby: true });
    }

    if (entities.keyword) {
      merchants = merchants.filter(m =>
        m.tags.some(t => t.includes(entities.keyword)) ||
        m.name.includes(entities.keyword) ||
        m.desc.includes(entities.keyword)
      );
    }

    if (entities.priceRange === 'low') {
      merchants.sort((a, b) => a.avgPrice - b.avgPrice);
    }

    const top4 = merchants.slice(0, 4);
    session.state = 'selecting';
    session.context = { candidates: top4 };

    let intro = entities.keyword
      ? `帮您搜索附近的「${entities.keyword}」相关商家，找到以下推荐：`
      : intent.category
        ? `帮您搜索附近的「${intent.category}」商家，找到以下推荐：`
        : '帮您搜索附近的吃喝玩乐，为您推荐：';

    if (entities.priceRange === 'low') intro += '（已按价格从低到高排序）';
    if (entities.location) intro += `（${entities.location}附近）`;

    return {
      reply: intro,
      cards: top4.map(m => ({
        type: 'merchant',
        id: m.id,
        name: m.name,
        category: m.category,
        rating: m.rating,
        distance: m.distance,
        avgPrice: m.avgPrice,
        seed: m.seed,
        tags: m.tags,
        desc: m.desc
      })),
      actions: ['选第一家', '换一批', '看看其他']
    };
  }

  // ===== 确认下单 =====
  handleConfirm(session) {
    if (session.context && session.context.candidates && session.context.candidates.length > 0) {
      const selected = session.context.candidates[0];
      session.context.selectedMerchant = selected;
      session.state = 'ordering';

      const orderTypeMap = {
        order_food: '外卖订单',
        reserve_restaurant: '餐厅预订',
        buy_movie: '电影票',
        book_ktv: 'KTV包厢',
        book_hotel: '酒店预订'
      };

      const orderType = orderTypeMap[session.context.intent] || '订单';
      const price = selected.avgPrice || selected.price || 99;

      return {
        reply: `好的，帮您确认${orderType}：\n\n🏪 ${selected.name}\n📍 ${selected.address || '附近'}\n💰 预估金额 ¥${price}\n⭐ 评分 ${selected.rating}\n\n确认下单吗？`,
        actions: ['确认下单', '换一家', '取消']
      };
    }
    return {
      reply: '抱歉，没有找到可下单的商家，请重新搜索～',
      actions: ['点外卖', '订酒店', '规划行程']
    };
  }

  // ===== 取消 =====
  handleCancel(session) {
    session.state = 'idle';
    session.context = {};
    return {
      reply: '好的，已取消操作。有其他需要随时告诉我～',
      actions: ['点外卖', '订酒店', '规划行程']
    };
  }

  // ===== 查看更多 =====
  handleMore(session) {
    if (session.context && session.context.candidates) {
      // 模拟换一批
      const allMerchants = this.db.getMerchants({ nearby: true });
      const current = session.context.candidates.map(c => c.id).filter(Boolean);
      const newOnes = allMerchants.filter(m => !current.includes(m.id)).slice(0, 4);

      if (newOnes.length > 0) {
        session.context.candidates = newOnes;
        return {
          reply: '为您换一批推荐：',
          cards: newOnes.map(m => ({
            type: 'merchant',
            id: m.id,
            name: m.name,
            category: m.category,
            rating: m.rating,
            distance: m.distance,
            avgPrice: m.avgPrice,
            seed: m.seed,
            tags: m.tags,
            desc: m.desc
          })),
          actions: ['选第一家', '换一批', '看看其他']
        };
      }
    }
    return {
      reply: '暂时没有更多了，试试其他分类吧～',
      actions: ['美食', '足疗', '景点', '电影']
    };
  }

  // ===== 通用回复 =====
  handleGeneral(msg, session) {
    // 尝试从消息中提取关键词搜索
    const merchants = this.db.searchMerchants(msg);

    if (merchants.length > 0) {
      session.state = 'selecting';
      session.context = { candidates: merchants.slice(0, 4) };
      return {
        reply: `帮您找到了「${msg}」相关的推荐：`,
        cards: merchants.slice(0, 4).map(m => ({
          type: 'merchant',
          id: m.id,
          name: m.name,
          category: m.category,
          rating: m.rating,
          distance: m.distance,
          avgPrice: m.avgPrice,
          seed: m.seed,
          tags: m.tags,
          desc: m.desc
        })),
        actions: ['选第一家', '换一批', '看看其他']
      };
    }

    // 真正的兜底回复
    const suggestions = [
      '我可以帮您点外卖、订餐厅、订酒店、买火车票飞机票、规划出行行程、买电影票、订KTV等。直接告诉我您想做什么就好～',
      '想吃喝玩乐？告诉我具体需求，我来帮您安排！比如"附近有什么好吃的火锅"',
      '不知道玩什么？试试说"规划行程"或"推荐附近好玩的"，我来帮您安排～',
    ];

    return {
      reply: suggestions[Math.floor(Math.random() * suggestions.length)],
      actions: ['点外卖', '订酒店', '规划行程', '附近美食']
    };
  }
}

module.exports = AIEngine;
