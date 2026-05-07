/**
 * Mock 数据 - 用于前端开发阶段模拟API响应
 * 生产环境请替换为真实 API 调用
 */

// ===== 模拟用户数据 =====
const mockUser = {
  user_id: 'U20260416001',
  openid: 'oXXXX_demo_openid',
  nickname: '滑板少年阿明',
  avatar_url: '/assets/gifts/default-avatar-new.jpg',
  phone: '138****8888',
  real_name: '张小明',
  level: 2,
  total_points_earned: 780,
};

// ===== 模拟积分账户 =====
const mockPointsAccount = {
  user_id: 'U20260416001',
  available_points: 1280,
  frozen_points: 200,
  total_earned: 3500,
  total_spent: 2220,
  level: 2,
  level_name: '白银骑士',
  level_progress: 56,
  points_to_next_level: 220,
};

// ===== 模拟积分流水 =====
const mockPointsHistory = [
  {
    record_id: 'R001',
    user_id: 'U20260416001',
    type: 'income',
    amount: 10,
    balance_after: 1290,
    source: 'checkin_lesson',
    source_detail: 'CI20260416001',
    remark: '',
    created_at: '2026-04-16T14:30:00',
  },
  {
    record_id: 'R002',
    user_id: 'U20260416001',
    type: 'income',
    amount: 20,
    balance_after: 1280,
    source: 'monthly_bonus',
    source_detail: 'BONUS202603',
    remark: '3月全勤奖励',
    created_at: '2026-04-01T10:00:00',
  },
  {
    record_id: 'R003',
    user_id: 'U20260416001',
    type: 'expense',
    amount: -500,
    balance_after: 1260,
    source: 'exchange_gift',
    source_detail: 'ORD20260328001',
    remark: '',
    created_at: '2026-03-28T15:20:00',
  },
  {
    record_id: 'R004',
    user_id: 'U20260416001',
    type: 'income',
    amount: 50,
    balance_after: 1760,
    source: 'register_bonus',
    source_detail: 'REG001',
    remark: '新人注册奖励',
    created_at: '2026-03-15T09:00:00',
  },
  {
    record_id: 'R005',
    user_id: 'U20260416001',
    type: 'income',
    amount: 10,
    balance_after: 1710,
    source: 'checkin_lesson',
    source_detail: 'CI20260314001',
    remark: '',
    created_at: '2026-03-14T16:00:00',
  },
  {
    record_id: 'R006',
    user_id: 'U20260416001',
    type: 'expense',
    amount: -200,
    balance_after: 1700,
    source: 'exchange_gift',
    source_detail: 'ORD20260310002',
    remark: '',
    created_at: '2026-03-10T11:30:00',
  },
  {
    record_id: 'R007',
    user_id: 'U20260416001',
    type: 'adjust',
    amount: 30,
    balance_after: 1900,
    source: 'admin_adjust',
    source_detail: 'ADJ001',
    remark: '活动补偿积分',
    created_at: '2026-03-05T14:00:00',
  },
  {
    record_id: 'R008',
    user_id: 'U20260416001',
    type: 'income',
    amount: 10,
    balance_after: 1870,
    source: 'checkin_lesson',
    source_detail: 'CI20260303001',
    remark: '',
    created_at: '2026-03-03T15:30:00',
  },
];

// ===== 模拟礼品列表 =====
const mockGifts = [
  {
    gift_id: 'G001',
    name: '专业轴承套装 ABEC-9',
    category: 'equipment',
    category_name: '装备配件',
    cover_image_url: '/assets/gifts/gift-bearings.jpg',
    detail_images: ['/assets/gifts/gift-bearings.jpg'],
    points_price: 500,
    original_price: 12800,
    stock_count: 8,
    limit_per_user: 1,
    description: '进口高品质ABEC-9轴承，滑行更顺畅，适合进阶滑手。包含8颗轴承 + 1个spacer套装。',
    exchange_count: 15,
    status: 1,
    sort_order: 100,
    created_at: '2026-04-16T10:00:00',
    updated_at: '2026-04-16T10:00:00',
  },
  {
    gift_id: 'G002',
    name: '滑板公社定制T恤',
    category: 'equipment',
    category_name: '装备配件',
    cover_image_url: '/assets/gifts/gift-tshirt.jpg',
    detail_images: [],
    points_price: 300,
    original_price: 9900,
    stock_count: 23,
    limit_per_user: 2,
    description: '100%纯棉，经典logo印花，S/M/L/XL可选。街头潮流必备单品。',
    exchange_count: 42,
    status: 1,
    sort_order: 90,
    created_at: '2026-04-10T10:00:00',
    updated_at: '2026-04-10T10:00:00',
  },
  {
    gift_id: 'G003',
    name: '免费体验课券（1节）',
    category: 'voucher',
    category_name: '体验券',
    cover_image_url: '/assets/gifts/gift-voucher.jpg',
    detail_images: [],
    points_price: 150,
    original_price: 19800,
    stock_count: 999,
    limit_per_user: 1,
    description: '适用于新课程或新教练的免费体验课1节（60分钟），有效期3个月。',
    exchange_count: 88,
    status: 1,
    sort_order: 80,
    created_at: '2026-04-08T10:00:00',
    updated_at: '2026-04-08T10:00:00',
  },
  {
    gift_id: 'G004',
    name: '私教课8折券',
    category: 'voucher',
    category_name: '体验券',
    cover_image_url: '/assets/gifts/gift-discount.jpg',
    detail_images: [],
    points_price: 100,
    original_price: 0,
    stock_count: 500,
    limit_per_user: 3,
    description: '私教课通用8折优惠券，单次使用，不限课程类型。',
    exchange_count: 156,
    status: 1,
    sort_order: 70,
    created_at: '2026-04-05T10:00:00',
    updated_at: '2026-04-05T10:00:00',
  },
  {
    gift_id: 'G005',
    name: '免费正课1节',
    category: 'course',
    category_name: '课程课时',
    cover_image_url: '/assets/gifts/gift-class.jpg',
    detail_images: [],
    points_price: 800,
    original_price: 29800,
    stock_count: 20,
    limit_per_user: 2,
    description: '标准正课1节（90分钟），自动充值到学员课包账户。',
    exchange_count: 31,
    status: 1,
    sort_order: 60,
    created_at: '2026-04-01T10:00:00',
    updated_at: '2026-04-01T10:00:00',
  },
  {
    gift_id: 'G006',
    name: '限量联名板面 · 春日樱花',
    category: 'limited',
    category_name: '限量周边',
    cover_image_url: '/assets/gifts/gift-deck.jpg',
    detail_images: [],
    points_price: 2000,
    original_price: 59800,
    stock_count: 3,
    limit_per_user: 1,
    description: '季度限量联名款！加拿大枫木8层压制，春日限定樱花图案设计。全球仅发行100块。',
    exchange_count: 97,
    status: 1,
    sort_order: 50,
    created_at: '2026-03-25T10:00:00',
    updated_at: '2026-03-25T10:00:00',
  },
  {
    gift_id: 'G007',
    name: '专业护具三件套',
    category: 'equipment',
    category_name: '装备配件',
    cover_image_url: '/assets/gifts/gift-gear.jpg',
    detail_images: [],
    points_price: 600,
    original_price: 16800,
    stock_count: 12,
    limit_per_user: 1,
    description: '含护膝+护肘+护掌各1对，CE认证，适合初学者到进阶滑手。',
    exchange_count: 24,
    status: 1,
    sort_order: 95,
    created_at: '2026-03-20T10:00:00',
    updated_at: '2026-03-20T10:00:00',
  },
  {
    gift_id: 'G008',
    name: '品牌运动袜（双装）',
    category: 'equipment',
    category_name: '装备配件',
    cover_image_url: '/assets/gifts/gift-socks.jpg',
    detail_images: [],
    points_price: 80,
    original_price: 3900,
    stock_count: 55,
    limit_per_user: 3,
    description: '加厚毛圈底，吸汗防臭，黑白两色可选，一双装。',
    exchange_count: 63,
    status: 1,
    sort_order: 85,
    created_at: '2026-03-18T10:00:00',
    updated_at: '2026-03-18T10:00:00',
  },
];

// ===== 模拟分类列表 =====
const mockCategories = [
  { code: '', name: '全部' },
  { code: 'equipment', name: '装备配件' },
  { code: 'voucher', name: '体验券' },
  { code: 'course', name: '课程课时' },
  { code: 'limited', name: '限量周边' },
];

// ===== 模拟订单 =====
const mockOrders = [
  {
    order_id: 'ORD20260416001',
    user_id: 'U20260416001',
    gift_id: 'G001',
    gift_name: '专业轴承套装 ABEC-9',
    gift_image: '/assets/gifts/gift-bearings.jpg',
    points_cost: 500,
    status: 1, // 已发货
    status_text: '已发货',
    receiver_name: '张小明',
    receiver_phone: '138****8888',
    receiver_address: '北京市朝阳区xxx街道xxx号',
    express_company: '顺丰速运',
    tracking_number: 'SF1234567890',
    created_at: '2026-04-15T10:00:00',
    shipped_at: '2026-04-16T09:00:00',
  },
  {
    order_id: 'ORD20260414002',
    user_id: 'U20260416001',
    gift_id: 'G003',
    gift_name: '免费体验课券（1节）',
    gift_image: '/assets/gifts/gift-voucher.jpg',
    points_cost: 150,
    status: 2, // 已完成
    points_cost: 150,
    status: 2, // 已完成
    status_text: '已完成（已发放至账户）',
    receiver_name: '-',
    receiver_phone: '-',
    receiver_address: '-',
    express_company: '-',
    tracking_number: '-',
    created_at: '2026-04-14T11:00:00',
    shipped_at: '2026-04-14T11:05:00',
  },
];

// ===== 模拟今日任务 =====
const mockTodayTasks = [
  {
    task_id: 'T001',
    title: '完成今日签到',
    desc: '到店上课并完成签到可获得积分',
    points_reward: 10,
    is_completed: true,
    icon: '✅',
  },
  {
    task_id: 'T002',
    title: '浏览积分商城',
    desc: '去商城看看有什么好东西吧',
    points_reward: 0,
    is_completed: false,
    icon: '🛒',
  },
  {
    task_id: 'T003',
    title: '首次兑换礼品',
    desc: '使用积分兑换任意一件礼品',
    points_reward: 10,
    is_completed: false,
    icon: '🎁',
  },
];

const DEFAULT_AVATAR = '/assets/icons/default-avatar.png';

// ===== 模拟排行榜 =====
const mockRanking = [
  { rank: 1, user_id: 'U001', nickname: '🛹滑板大神', avatar: DEFAULT_AVATAR, total_points: 5820, level: 4, level_name: '钻石传奇' },
  { rank: 2, user_id: 'U002', nickname: 'Ollie小王子', avatar: DEFAULT_AVATAR, total_points: 4560, level: 3, level_name: '黄金大神' },
  { rank: 3, user_id: 'U003', nickname: 'Kickflip少女', avatar: DEFAULT_AVATAR, total_points: 3980, level: 3, level_name: '黄金大神' },
  { rank: 4, user_id: 'U004', nickname: '街式玩家', avatar: DEFAULT_AVATAR, total_points: 3200, level: 2, level_name: '白银骑士' },
  { rank: 5, user_id: 'U005', nickname: '碗池狂人', avatar: DEFAULT_AVATAR, total_points: 2890, level: 2, level_name: '白银骑士' },
  { rank: 6, user_id: 'U006', nickname: '长板爱好者', avatar: DEFAULT_AVATAR, total_points: 2150, level: 2, level_name: '白银骑士' },
  { rank: 7, user_id: 'U20260416001', nickname: '🛹滑板少年阿明', avatar: DEFAULT_AVATAR, total_points: 1920, level: 2, level_name: '白银骑士', is_me: true },
  { rank: 8, user_id: 'U008', nickname: '新手小白', avatar: DEFAULT_AVATAR, total_points: 1560, level: 1, level_name: '青铜滑手' },
  { rank: 9, user_id: 'U009', nickname: '滑行练习生', avatar: DEFAULT_AVATAR, total_points: 1200, level: 1, level_name: '青铜滑手' },
  { rank: 10, user_id: 'U010', nickname: '周末滑手', avatar: DEFAULT_AVATAR, total_points: 880, level: 1, level_name: '青铜滑手' },
];

// ===== 店员端Mock =====
const mockStaffDashboard = {
  today_checkin_count: 23,
  week_points_given: 1680,
  pending_orders: 5,
  recent_checkins: [
    { student_name: '李小红', course_name: '基础滑行班', time: '14:30', avatar: DEFAULT_AVATAR },
    { student_name: '王大锤', course_name: 'Ollie进阶班', time: '14:15', avatar: DEFAULT_AVATAR },
    { student_name: '赵小明', course_name: '少儿入门班', time: '13:50', avatar: DEFAULT_AVATAR },
    { student_name: '孙小美', course_name: '基础滑行班', time: '13:30', avatar: DEFAULT_AVATAR },
    { student_name: '周小刚', course_name: '碗池技巧班', time: '11:20', avatar: DEFAULT_AVATAR },
  ],
};

const mockStaffStudents = [
  { user_id: 'U101', real_name: '李小红', nickname: '小红同学', avatar: DEFAULT_AVATAR, phone: '139****1111', total_points: 560, today_checked_in: false },
  { user_id: 'U102', real_name: '王大锤', nickname: '大锤哥', avatar: DEFAULT_AVATAR, phone: '137****2222', total_points: 1200, today_checked_in: false },
  { user_id: 'U103', real_name: '赵小明', nickname: '小明', avatar: DEFAULT_AVATAR, phone: '136****3333', total_points: 340, today_checked_in: true },
  { user_id: 'U104', real_name: '孙小美', nickname: '美美哒', avatar: DEFAULT_AVATAR, phone: '135****4444', total_points: 890, today_checked_in: false },
  { user_id: 'U105', real_name: '周小刚', nickname: '刚子', avatar: DEFAULT_AVATAR, phone: '134****5555', total_points: 2100, today_checked_in: false },
  { user_id: 'U106', real_name: '吴小丽', nickname: '丽丽', avatar: DEFAULT_AVATAR, phone: '133****6666', total_points: 450, today_checked_in: false },
  { user_id: 'U107', real_name: '郑小龙', nickname: '龙龙', avatar: DEFAULT_AVATAR, phone: '132****7777', total_points: 1780, today_checked_in: false },
  { user_id: 'U108', real_name: '冯小芳', nickname: '芳芳', avatar: DEFAULT_AVATAR, phone: '131****8888', total_points: 670, today_checked_in: false },
];

const mockPendingOrders = [
  {
    order_id: 'ORD20260416005',
    user_id: 'U101',
    user_name: '李小红',
    gift_name: '专业护具三件套',
    gift_image: '/assets/gifts/gift-gear.jpg',
    points_cost: 600,
    receiver_name: '李小红',
    receiver_phone: '13911112222',
    receiver_address: '北京市朝阳区望京SOHO T1 1205室',
    created_at: '2026-04-16T12:30:00',
    status: 0,
  },
  {
    order_id: 'ORD20260416006',
    user_id: 'U102',
    user_name: '王大锤',
    gift_name: '限量联名板面 · 春日樱花',
    gift_image: '/assets/gifts/gift-deck.jpg',
    receiver_phone: '13722223333',
    receiver_address: '北京市海淀区中关村大街27号',
    created_at: '2026-04-16T10:15:00',
    status: 0,
  },
  {
    order_id: 'ORD20260415007',
    user_id: 'U104',
    user_name: '孙小美',
    gift_name: '滑板公社定制T恤',
    gift_image: '/assets/gifts/gift-tshirt.jpg',
    points_cost: 300,
    receiver_name: '孙小美',
    receiver_phone: '13544445555',
    receiver_address: '上海市浦东新区陆家嘴金融中心',
    created_at: '2026-04-15T16:40:00',
    status: 0,
  },
  {
    order_id: 'ORD20260415008',
    user_id: 'U107',
    user_name: '郑小龙',
    gift_name: '品牌运动袜（双装）',
    gift_image: '/assets/gifts/gift-socks.jpg',
    points_cost: 80,
    receiver_name: '郑小龙',
    receiver_phone: '13277778888',
    receiver_address: '广州市天河区珠江新城华夏路',
    created_at: '2026-04-15T14:20:00',
    status: 0,
  },
  {
    order_id: 'ORD20260414009',
    user_id: 'U106',
    user_name: '吴小丽',
    gift_name: '免费正课1节',
    gift_image: '/assets/gifts/gift-class.jpg',
    points_cost: 800,
    receiver_name: '-',
    receiver_phone: '-',
    receiver_address: '(虚拟商品)',
    created_at: '2026-04-14T17:00:00',
    status: 0,
  },
];

const mockTodayCheckins = [
  { record_id: 'TC001', student_name: '赵小明', course_name: '少儿入门班', operator_name: '店员A', points: 10, time: '13:50', avatar: DEFAULT_AVATAR },
  { record_id: 'TC002', student_name: '钱小虎', course_name: '基础滑行班', operator_name: '店员A', points: 10, time: '13:35', avatar: DEFAULT_AVATAR },
  { record_id: 'TC003', student_name: '陈小娟', course_name: 'Ollie进阶班', operator_name: '店员B', points: 10, time: '12:10', avatar: DEFAULT_AVATAR },
  { record_id: 'TC004', student_name: '魏小强', course_name: '碗池技巧班', operator_name: '店员A', points: 10, time: '11:20', avatar: DEFAULT_AVATAR },
  { record_id: 'TC005', student_name: '韩小雨', course_name: '少儿入门班', operator_name: '店员B', points: 10, time: '10:45', avatar: DEFAULT_AVATAR },
  { record_id: 'TC006', student_name: '杨小峰', course_name: '基础滑行班', operator_name: '店员A', points: 10, time: '10:00', avatar: DEFAULT_AVATAR },
  { record_id: 'TC007', student_name: '朱小燕', course_name: '长板入门班', operator_name: '店员B', points: 10, time: '09:30', avatar: DEFAULT_AVATAR },
  { record_id: 'TC008', student_name: '许小鹏', course_name: '基础滑行班', operator_name: '店员A', points: 10, time: '09:00', avatar: DEFAULT_AVATAR },
];

/**
 * Mock API 响应器 - 模拟网络延迟和接口返回格式
 */
function simulateDelay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const MockApi = {
  // 登录
  async login() {
    await simulateDelay(500);
    return { code: 0, data: { token: 'mock_token_12345', user: mockUser } };
  },

  // 获取用户信息
  async getProfile() {
    await simulateDelay(200);
    return { code: 0, data: mockUser };
  },

  // 获取积分账户
  async getPointsAccount() {
    await simulateDelay(300);
    return { code: 0, data: mockPointsAccount };
  },

  // 获取积分流水
  async getPointsHistory(params = {}) {
    await simulateDelay(400);
    let list = [...mockPointsHistory];
    if (params.type) {
      list = list.filter(item => item.type === params.type);
    }
    return {
      code: 0,
      data: {
        list,
        total: list.length,
        has_more: false,
      },
    };
  },

  // 获取礼品列表
  async getGiftList(params = {}) {
    await simulateDelay(500);
    let list = [...mockGifts];
    if (params.category) {
      list = list.filter(g => g.category === params.category);
    }
    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      list = list.filter(g => g.name.toLowerCase().includes(kw));
    }
    return {
      code: 0,
      data: {
        categories: mockCategories,
        list,
        total: list.length,
      },
    };
  },

  // 获取礼品详情
  async getGiftDetail(giftId) {
    await simulateDelay(300);
    const gift = mockGifts.find(g => g.gift_id === giftId);
    if (!gift) return { code: -1, message: '礼品不存在' };
    return { code: 0, data: gift };
  },

  // 创建兑换订单
  async createOrder(data) {
    await simulateDelay(800);
    const gift = mockGifts.find(g => g.gift_id === data.gift_id);
    if (!gift) return { code: -1, message: '礼品不存在' };

    // 校验库存
    if (gift.stock_count <= 0) {
      return { code: -1, message: '库存不足' };
    }

    const newOrder = {
      order_id: `ORD${Date.now()}`,
      gift_id: data.gift_id,
      gift_name: gift.name,
      gift_image: gift.cover_image_url,
      points_cost: gift.points_price,
      status: 0,
      status_text: '待发货',
      ...data.receiver_info,
      created_at: new Date().toISOString(),
    };
    return { code: 0, data: newOrder };
  },

  // 我的订单列表
  async getOrderList() {
    await simulateDelay(400);
    return {
      code: 0,
      data: {
        list: mockOrders,
        total: mockOrders.length,
      },
    };
  },

  // 排行榜
  async getRanking() {
    await simulateDelay(500);
    return { code: 0, data: { list: mockRanking, my_rank: 7 } };
  },

  // 今日任务
  async getTodayTasks() {
    await simulateDelay(300);
    return { code: 0, data: mockTodayTasks };
  },

  // ========== 店员端 ==========

  // 签到
  async checkIn(studentId) {
    await simulateDelay(600);
    const student = mockStaffStudents.find(s => s.user_id === studentId);
    if (!student) return { code: -1, message: '学员不存在' };
    if (student.today_checked_in) return { code: -1, message: '该学员今日已签到' };
    return {
      code: 0,
      data: {
        success: true,
        points_given: 10,
        message: `为【${student.real_name}】签到成功，获得 10 积分`,
        record_id: `TC${Date.now()}`,
      },
    };
  },

  // 今日签到记录
  async getTodayCheckIns() {
    await simulateDelay(300);
    return { code: 0, data: { list: mockTodayCheckins, total: mockTodayCheckins.length } };
  },

  // 手动调账
  async adjustPoints(data) {
    await simulateDelay(500);
    const student = mockStaffStudents.find(s => s.user_id === data.student_id);
    if (!student) return { code: -1, message: '学员不存在' };

    const absAmount = Math.abs(data.amount);
    if (absAmount > 500) {
      return { code: -1, message: '单次调账上限500分，请联系管理员' };
    }
    if (!data.reason || data.reason.length < 5) {
      return { code: -1, message: '原因说明至少需要5个字' };
    }

    return {
      code: 0,
      data: {
        success: true,
        message: `为【${student.real_name}】${data.amount > 0 ? '补录' : '扣除'} ${absAmount} 积分`,
        record_id: `ADJ${Date.now()}`,
      },
    };
  },

  // 待处理订单
  async getPendingOrders() {
    await simulateDelay(400);
    return {
      code: 0,
      data: {
        list: mockPendingOrders,
        total: mockPendingOrders.length,
      },
    };
  },

  // 确认发货
  async shipOrder(data) {
    await simulateDelay(600);
    if (!data.express_company || !data.tracking_number) {
      return { code: -1, message: '请填写完整快递信息' };
    }
    return {
      code: 0,
      data: { success: true, message: '发货成功' },
    };
  },

  // 工作台统计
  async getDashboardStats() {
    await simulateDelay(400);
    return { code: 0, data: mockStaffDashboard };
  },

  // 学员搜索
  async searchStudents(keyword) {
    await simulateDelay(300);
    let list = [...mockStaffStudents];
    if (keyword) {
      list = list.filter(
        s =>
          s.real_name.includes(keyword) ||
          s.nickname?.includes(keyword) ||
          s.phone?.includes(keyword)
      );
    }
    return { code: 0, data: { list, total: list.length } };
  },
};

module.exports = MockApi;
