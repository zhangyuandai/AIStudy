# 滑板公社 · 后台管理系统 — 部署指南

## 📦 项目信息

| 项目 | 说明 |
|------|------|
| **项目名称** | skate-admin（滑板公社后台管理系统） |
| **技术栈** | Vue 3.4 + Vite 5 + Element Plus 2.7 + Pinia 2 + ECharts 5 |
| **运行环境** | Node.js >= 18 |
| **开发端口** | http://localhost:3000 |
| **构建产物** | 静态文件（HTML/CSS/JS），可部署至任意 Web 服务器 |

---

## 🚀 快速启动（本地开发）

### 1. 安装依赖

```bash
cd admin
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:3000`，演示账号：**admin / admin123**

### 3. 构建生产版本

```bash
npm run build
```

构建产物输出到 `admin/dist/` 目录，可直接部署。

---

## 🌐 生产部署方案

### 方案一：Nginx 静态托管（推荐 ⭐）

最简单的方案，适合中小规模部署。Nginx 直接托管 Vite 构建的静态文件。

#### 前置条件

- 一台 Linux 服务器（CentOS / Ubuntu / Debian）
- 已安装 Nginx（或用 Docker 跑 Nginx）

#### 步骤

**1）在本地构建项目**

```bash
cd admin
npm install
npm run build
# 产物在 dist/ 目录
```

**2）上传到服务器**

```bash
# 方式 A：scp 上传
scp -r admin/dist/* user@your-server:/opt/skate-admin/

# 方式 B：先打包再上传
tar -czf skate-admin.tar.gz admin/dist/
scp skate-admin.tar.gz user@your-server:/tmp/
# 在服务器上解压
ssh user@your-server "mkdir -p /opt/skate-admin && tar -xzf /tmp/skate-admin.tar.gz -C /opt/skate-admin --strip-components=1"
```

**3）配置 Nginx**

编辑 `/etc/nginx/conf.d/skate-admin.conf`：

```nginx
server {
    listen 80;
    server_name admin.skate-club.com;   # 替换为你的域名，或直接写 IP

    root /opt/skate-admin;              # 指向构建产物的目录
    index index.html;

    # Vue Router history 模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 开启 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
```

**4）重启 Nginx**

```bash
nginx -t          # 测试配置是否正确
systemctl restart nginx
```

**5）（可选）配置 HTTPS + 自动续期**

```bash
# 安装 certbot
apt install certbot python3-certbot-nginx    # Ubuntu/Debian
yum install certbot python3-certbot-nginx    # CentOS/RHEL

# 申请证书并自动配置 nginx
certbot --nginx -d admin.skate-club.com

# 测试自动续期
certbot renew --dry-run
```

#### 更新部署脚本

以后每次更新只需：

```bash
# 本地执行
cd admin && npm run build
scp -r dist/* user@your-server:/opt/skate-admin/
# 完成！无需重启 Nginx（因为只是替换了静态文件）
```

---

### 方案二：Docker 容器化部署

适合需要标准化运维、多环境复制的场景。

#### Dockerfile

项目根目录已包含 `Dockerfile`（见下文），使用多阶段构建优化镜像体积。

```dockerfile
# ===== 构建阶段 =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ===== 运行阶段 =====
FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx 配置（Docker 内嵌）

创建 `docker/nginx.conf`：

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 构建与运行

```bash
# 构建镜像
docker build -t skate-admin:latest .

# 运行容器
docker run -d \
  --name skate-admin \
  -p 8080:80 \
  -v $(pwd)/logs:/var/log/nginx \
  --restart unless-stopped \
  skate-admin:latest

# 访问 http://your-server-ip:8080
```

#### 使用 Docker Compose（推荐）

创建 `docker-compose.yml`：

```yaml
version: '3.9'
services:
  admin:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: skate-admin
    ports:
      - "8080:80"
    volumes:
      - ./logs:/var/log/nginx
    restart: always
    networks:
      - skate-net

networks:
  skate-net:
    driver: bridge
```

启动：

```bash
docker compose up -d --build
```

---

### 方案三：云服务一键部署（最快上手）

如果不想自己管服务器，可以用以下方案：

| 服务商 | 方案 | 价格参考 | 特点 |
|--------|------|---------|------|
| **Vercel** | `npm run build` → 连接 Git 仓库自动部署 | 免费额度够用 | CDN 加速、自动 HTTPS、零配置 |
| **Netlify** | 同上，拖拽 `dist/` 文件夹即可 | 免费 | 最简单，拖拽即上线 |
| **腾讯云 COS + CDN** | 上传 dist 到 COS 绑定域名 | ~几元/月 | 国内访问快，适合已有腾讯云生态 |
| **阿里云 OSS + CDN** | 同上 | ~几元/月 | 同上 |

#### 以 Netlify 为例（3 分钟部署）

1. 打开 [netlify.com](https://www.netlify.com)，登录/注册
2. 把 `admin/dist/` 整个文件夹**拖拽到页面中央**
3. 等待部署完成 → 获到一个 `xxx.netlify.app` 的地址
4. （可选）在 Domain settings 里绑定自己的域名

就这么简单，不需要任何服务器。

#### 以 Vercel 为例

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入项目目录
cd admin

# 部署（按提示操作即可）
vercel

# 之后更新只需
vercel --prod
```

Vercel 会自动识别 Vite 项目并正确处理 SPA 路由。

---

## 🔧 后端 API 对接指南

当前项目使用 Mock 数据。接入真实后端时：

### 1. 创建 API 封装层

```javascript
// src/utils/request.js
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

// 请求拦截器 — 添加 token
request.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 响应拦截器 — 统一错误处理
request.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default request
```

### 2. 环境变量配置

创建 `.env.development` 和 `.env.production`：

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000/api

# .env.production
VITE_API_BASE_URL=https://api.skate-club.com/api
```

### 3. Nginx 反向代理配置（前后端分离部署）

如果前端和后端分开部署，需要在 Nginx 中加代理：

```nginx
server {
    listen 443 ssl;
    server_name admin.skate-club.com;

    # 前端静态资源
    root /opt/skate-admin;
    index index.html;

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8000;     # 后端服务地址
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Vue Router fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 📋 项目结构一览

```
admin/
├── index.html                  # HTML 入口
├── package.json                # 项目依赖
├── vite.config.js              # Vite 构建配置
│
├── public/                     # 静态资源（不参与打包）
│
└── src/
    ├── main.js                 # 应用入口
    ├── App.vue                 # 根组件
    ├── router/index.js         # 路由配置（含守卫）
    │
    ├── styles/index.css        # 全局样式
    │
    ├── layout/index.vue        # 主布局（侧边栏+顶栏+内容区）
    │
    └── views/                  # 页面组件
        ├── login/index.vue     # 登录页
        ├── dashboard/index.vue # 数据大盘（ECharts 图表）
        ├── students/index.vue  # 学员管理（列表+搜索+调账弹窗）
        ├── points/index.vue    # 积分管理（调账记录+流水双Tab）
        ├── goods/index.vue     # 礼品管理（CRUD+库存+上下架）
        ├── orders/index.vue    # 订单管理（状态条+发货弹窗）
        ├── staff/index.vue     # 店员管理（增删改查+启用停用）
        └── settings/index.vue  # 系统设置（积分规则+商城配置）
```

---

## ✅ 部署检查清单

- [ ] `npm run build` 构建成功，无报错无警告
- [ ] 本地 `npm run preview` 预览正常，路由跳转无误
- [ ] 登录页可正常登录（demo: admin/admin123）
- [ ] 所有菜单页面可正常打开和展示数据
- [ ] ECharts 图表渲染正常（Dashboard 页面）
- [ ] 弹窗交互正常（调账/发货/库存调整等）
- [ ] 服务器 Nginx 配置已测试通过
- [ ] HTTPS 证书已配置（生产环境必选）
- [ ] API 反向代理已配置（对接后端时）
