# 🛹 滑板公社 API Server

后端服务，为微信小程序和 PC 管理后台提供 RESTful API。

## 技术栈

| 组件 | 选型 |
|------|------|
| 运行时 | Node.js 18+ |
| 框架 | Express 4 |
| 数据库 | MySQL 8.0 (mysql2/promise) |
| 认证 | JWT (jsonwebtoken) |
| 校验 | Joi |
| 安全 | Helmet + CORS + Rate Limiting |
| 日志 | Morgan + 自定义 Logger |

## 项目结构

```
server/
├── src/
│   ├── app.js                  # 入口文件
│   ├── config/
│   │   ├── index.js            # 全局配置(环境变量)
│   │   └── database.js         # MySQL 连接池
│   ├── middleware/
│   │   ├── auth.js             # JWT 认证中间件
│   │   ├── errorHandler.js     # 全局错误处理
│   │   └── validator.js        # 参数校验(Joi)
│   ├── routes/                 # 路由层
│   │   ├── auth.js             # /api/auth/* (登录)
│   │   ├── user.js             # /api/user/* (用户/积分/排行/任务)
│   │   ├── mall.js             # /api/mall/* (商城/订单)
│   │   ├── staff.js            # /api/staff/* (店员签到/调账)
│   │   └── admin.js            # /api/admin/* (管理后台全功能)
│   ├── services/               # 业务逻辑层
│   │   ├── userService.js      # 用户/注册/登录
│   │   ├── pointsService.js    # 积分核心(增减/流水/等级)
│   │   ├── giftService.js      # 商品CRUD/库存
│   │   ├── orderService.js     # 订单事务(扣积分+冻结+发货)
│   │   ├── checkinService.js   # 签到(防重复+连续奖励)
│   │   ├── staffService.js     # 员工管理/登录
│   │   └── configService.js    # 系统配置KV
│   └── utils/
│       ├── response.js         # 统一响应封装
│       ├── token.js            # JWT 工具
│       └── logger.js           # 日志工具
├── database/
│   └── schema.sql              # 建表SQL + 初始数据
├── Dockerfile                  # 多阶段构建镜像
├── docker-compose.yml          # MySQL + API + Nginx 编排
├── docker/nginx.conf            # Nginx 反代配置
├── .env.example                # 环境变量模板
├── package.json
└── .gitignore
```

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 准备数据库

```bash
# 方式A: Docker 一键启动（推荐）
docker compose up -d mysql

# 方式B: 本地MySQL
mysql -u root -p < database/schema.sql
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入数据库密码、JWT密钥等
```

### 4. 启动开发服务器

```bash
npm run dev    # nodemon 热重载，端口 3001
```

访问 `http://localhost:3001/health` 验证。

### 5. Docker 生产部署

```bash
# 一键启动全部服务
docker compose up -d --build

# 查看日志
docker compose logs -f api
```

## API 端点总览（41个）

### 认证（无需Token）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 小程序微信登录 |
| POST | `/api/auth/admin/login` | PC后台登录 |

### 用户端（需用户Token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/user/profile` | 个人信息 |
| PUT | `/api/user/profile` | 更新资料 |
| GET | `/api/user/points/account` | 积分账户 |
| GET | `/api/user/points/history` | 积分流水 |
| GET | `/api/user/ranking/list` | 排行榜 |
| GET | `/api/user/task/today` | 今日任务 |
| POST | `/api/user/bind-phone` | 绑定手机号 |

### 商城（部分公开）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/mall/gift/list` | 礼品列表 |
| GET | `/api/mall/gift/detail` | 礼品详情 |
| POST | `/api/mall/order/create` | 创建兑换订单 |
| GET | `/api/mall/order/list` | 我的订单 |

### 店员端（需管理员Token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/staff/dashboard/stats` | 工作台统计 |
| GET | `/api/staff/student/list` | 学员搜索 |
| POST | `/api/staff/checkin` | 执行签到 |
| GET | `/api/staff/checkin/today` | 今日签到列表 |
| POST | `/api/staff/points/adjust` | 手动调账 |
| GET | `/api/staff/order/pending` | 待处理订单 |
| POST | `/api/staff/order/ship` | 发货 |

### 管理后台（需管理员Token）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/report/overview` | 数据概览Dashboard |
| GET | `/api/admin/students` | 学生列表 |
| POST | `/api/admin/students/:id/adjust-points` | 学生调账 |
| GET | `/api/admin/points/records` | 积分流水 |
| GET | `/api/admin/points/adjustments` | 调账记录 |
| CRUD | `/api/admin/gifts` | 商品管理 |
| CRUD | `/api/admin/orders` | 订单管理 |
| CRUD | `/api/admin/staff` | 员工管理 |
| GET/PUT | `/api/admin/settings` | 系统设置 |
| GET | `/api/admin/export/students` | 数据导出 |

## 数据库设计（10张表）

| 表名 | 用途 | 核心字段 |
|------|------|----------|
| `sc_user` | 用户 | openid, phone, nickname, is_staff |
| `sc_points_account` | 积分账户 | available/frozen, total_earned, streak_days |
| `sc_points_record` | 积分流水 | type(income/expense), amount, balance_after, source |
| `sc_gift_category` | 商品分类 | code, name |
| `sc_gift` | 商品 | name, points_price, stock_count, status |
| `sc_order` | 订单 | order_no, gift_snapshot(JSON), status(0待发/1已发/2完成) |
| `sc_checkin` | 签到 | user_id + checkin_date(唯一), operator_id |
| `sc_staff` | 员工 | username, role(admin/coach/receptionist) |
| `sc_system_config` | 系统配置 | KV结构(group_key + config_key) |
| `sc_task` | 任务 | task_type, trigger_type(daily/once) |

## 核心业务流程

### 签到 → 发积分
```
店员扫码 → 验证学员存在 → 检查今日未签(UNIQUE约束)
→ 开启事务 → 写签到记录 → 计算连续天数 → 发放基础+连签奖励 → 提交
```

### 兑换商品
```
用户下单 → 事务开始:
1. FOR UPDATE 锁定商品 → 校验库存/上架/兑换限制
2. 扣减库存
3. 扣减积分(FOR UPDATE 锁余额 → 校验不足则抛异常)
4. 冻结等额积分(frozen_points += cost)
5. 写入订单(含商品JSON快照)
6. 增加兑换计数
→ 事务提交
```

### 发货 → 完成
```
管理员发货 → 更新订单状态=1 + 快递信息
管理员确认完成:
1. 释放冻结积分(frozen_points -= cost)
2. 写消费确认流水
3. 订单状态=2 + completed_at
```

## 默认账号

部署后自动创建：
- **管理后台**: `admin` / `admin123`

## 安全设计

- JWT 双Token体系：用户端7天 / 管理端24小时
- 密码 bcrypt 哈希存储（salt rounds = 10）
- 全局速率限制：15分钟200次（生产环境）
- SQL注入防护：全部使用参数化查询
- 积分操作原子性：FOR UPDATE 行锁 + 事务保证
- 签到防重复：数据库 UNIQUE(user_id, checkin_date)

## 注意事项

⚠️ 微信登录当前为**开发模式模拟**，生产环境需替换 `userService.wxLogin()` 中为真实 `wx.code2Session` 调用。
