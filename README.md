# 滑板公社 · 积分管理系统（微信小程序）

## 📋 项目概述

基于 PRD 文档实现的 **滑板店铺积分管理系统** 微信小程序 MVP 版本，包含学员端和店员端双端功能。

### 技术栈
- **框架**：微信小程序原生开发
- **数据层**：Mock 数据 + API 封装层（可无缝切换到真实后端）
- **组件化**：4 个自定义公共组件
- **页面**：共 12 个页面（学员端 8 个 + 店员端 4 个）
- **资源**：AI 生成全套本地图标与商品图片（无外部依赖）

---

## ✅ 工作进展

### 已完成

| 阶段 | 内容 | 状态 |
|------|------|------|
| **MVP 功能开发** | 12 个页面 + 4 个公共组件全部完成，学员端/店员端双端功能就绪 | ✅ |
| **WXML 编译修复** | 修复 `staff-adjust.wxml:125` 的 `unexpected token '.'` 错误（WXML 不支持 `.length`），改用 JS 层预计算 `reasonLength` | ✅ |
| **图片资源本地化** | 全部替换 `icons8.com` 外部链接为本地路径，覆盖礼品图(10张)、UI 图标(18张)、默认头像/空状态 | ✅ |
| **包体积优化** | 从 19MB 压缩至 ~940KB（远低于微信 2MB 限制）：PNG→JPG 转换 + 尺寸下采样 + sips 批量处理 | ✅ |
| **数据完整性修复** | 所有 `avatar: ''` 空字符串统一替换为默认头像常量 `DEFAULT_AVATAR`，排行榜/学员列表/签到记录全覆盖 | ✅ |

### 当前资产清单

```
assets/
├── icons/                    # UI 图标（18 张 PNG）
│   ├── home(-active).png     # TabBar - 首页
│   ├── checkin(-active).png  # TabBar - 签到
│   ├── mall(-active).png     # TabBar - 商城
│   ├── points(-active).png   # TabBar - 明细
│   ├── profile(-active).png  # TabBar - 我的
│   ├── arrow-right(.white).png  # 导航箭头
│   ├── cart.png              # 购物车
│   ├── crown.png             # 皇冠/VIP
│   ├── notify.png            # 通知
│   ├── default-avatar.png    # 默认头像
│   ├── default-gift.png      # 默认礼品图
│   └── empty.png             # 空状态占位
│
└── gifts/                    # 礼品/商品图片（10 张 JPG，~30KB/张）
    ├── gift-bearings.jpg     # ABEC-9 轴承套装
    ├── gift-tshirt.jpg       # 定制俱乐部 T 恤
    ├── gift-voucher.jpg      # 免费体验券
    ├── gift-discount.jpg     # 8 折优惠券
    ├── gift-class.jpg        # 免费私教课
    ├── gift-deck.jpg         # 限定樱花板面
    ├── gift-gear.jpg         # 护具套装
    └── gift-socks.jpg        # 运动袜（双）
```

---

## 📁 项目结构

```
skate-points-app/
├── app.js                    # 小程序入口，全局方法封装
├── app.json                  # 全局配置（页面路由、TabBar）
├── app.wxss                  # 全局样式（CSS变量、工具类）
├── project.config.json       # 项目配置
├── sitemap.json              # 站点地图
│
├── utils/                    # 工具与数据层
│   ├── util.js               # 通用工具函数
│   ├── api.js                # API 请求封装层
│   └── mock.js               # Mock 数据（开发调试用）
│
├── components/               # 公共组件
│   ├── points-card/          # 积分卡片组件
│   ├── gift-card/            # 礼品卡片组件
│   ├── empty-state/          # 空状态组件
│   └── points-record-item/   # 积分流水项组件
│
├── pages/                    # 页面目录
│   ├── index/                # 学员端 - 首页仪表盘
│   ├── checkin/              # 学员端 - 签到页面
│   ├── mall/                 # 学员端 - 积分商城（分类+搜索+列表）
│   ├── gift-detail/          # 学员端 - 礼品详情+兑换入口
│   ├── exchange-confirm/     # 学员端 - 确认兑换（表单+校验）
│   ├── exchange-success/     # 学员端 - 兑换成功展示
│   ├── profile/              # 学员端 - 个人中心
│   ├── points-history/       # 学员端 - 积分明细流水
│   └── staff/                # 店员端
│       ├── home/staff-home           # 工作台首页
│       ├── signin/staff-signin       # 学员签到
│       ├── adjust/staff-adjust       # 手动调账
│       └── orders/staff-orders       # 兑换订单处理
│
└── assets/                  # 静态资源（全部本地化，无外部依赖）
    ├── icons/               # UI 图标（18 张 PNG）
    └── gifts/               # 礼品商品图（10 张 JPG）
```

---

## 🎯 功能模块

### 学员端（8个页面）

| 页面 | 核心功能 |
|------|----------|
| 首页仪表盘 | 积分卡片、今日任务、快捷入口、排行榜、热门礼品 |
| 签到上课 | 二维码出示、本周签到日历、连续签到奖励提示 |
| 积分商城 | 分类Tab筛选、关键词搜索、双列瀑布流列表 |
| 礼品详情 | 图片轮播、余额对比、兑换须知、立即兑换按钮 |
| 确认兑换 | 积分预览、收货表单/虚拟商品提示、二次确认 |
| 兑换成功 | 成功动画、订单信息复制、继续逛商城 |
| 个人中心 | 用户信息、积分概览、统计数据、功能菜单、店员入口 |
| 积分明细 | 类型筛选Tab、日期分组流水、正负着色 |

### 店员端（4个页面）

| 页面 | 核心功能 |
|------|----------|
| 工作台 | 今日统计(签到/发放/待办)、快捷操作、最近记录 |
| 学员签到 | 搜索学员、扫码签到、弹窗确认、防重复签 |
| 手动调账 | 学员选择器、补录/扣除切换、金额输入、原因必填≥5字 |
| 订单处理 | 状态Tab筛选、实物发货弹窗(快递+运单号)、虚拟商品一键发放 |

### 公共组件（4个）

- `points-card` — 渐变背景积分卡，等级进度条，冻结积分展示
- `gift-card` — 礼品卡片，含库存标签、价格、兑换人数
- `empty-state` — 空状态占位，支持操作按钮
- `points-record-item` — 流水记录行，自动按type着色

---

## 🔧 接入真实 API

1. 将各页面的 `MockApi.xxx()` 替换为 `api.js` 中对应模块调用
2. 在 `app.js` 和 `api.js` 的 `BASE_URL` 配置真实接口地址
3. 生产环境移除 mock.js 引用

---

## ⚠️ 待完善项

- [x] ~~替换 `assets/icons/` 图标为实际设计稿资源~~ → **已完成**：AI 生成全套 28 张图片（18 PNG 图标 + 10 JPG 礼品图），全部本地化，无外部依赖
- [ ] 接入微信登录授权流程
- [ ] 接入微信订阅消息模板
- [ ] 二维码生成（wxacode.getUnlimited）
- [ ] 数据埋点事件上报集成
- [ ] 管理后台 H5 页面开发
