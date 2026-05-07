# ============================================================
#  滑板公社后端 Docker 镜像
#  多阶段构建：依赖安装 → 运行时精简镜像
# ============================================================

# ---- 阶段1: 构建 ----
FROM node:20-alpine AS builder
WORKDIR /app

# 先复制 package 文件以利用Docker层缓存
COPY package.json ./
RUN npm install --omit=dev --registry=https://registry.npmmirror.com

# 再复制源码
COPY src/ ./src/
COPY database/ ./database/

# ---- 阶段2: 运行时 ----
FROM node:20-alpine AS runtime
WORKDIR /app

# 安装生产依赖（无devDependencies）
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    rm -rf /var/cache/apk/*

# 从builder阶段复制
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/database ./database
COPY package.json ./

# 创建上传目录
RUN mkdir -p uploads

# 非root运行
USER node
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "src/app.js"]
