# 构建入口：Railway（Railpack 自动检测根目录 Dockerfile）从仓库根目录构建
# 后端源码位于「后端源码/」目录（该目录内也保留一份 Dockerfile，可独立构建）
# 零外部依赖；node:22 自带 node:sqlite（已静态编入二进制，alpine 可用）。
FROM node:22-alpine
WORKDIR /app

# 仅拷贝运行所需源码（无需 npm install）
COPY 后端源码/package.json ./
COPY 后端源码/start.js 后端源码/server.js 后端源码/db.js ./
COPY 后端源码/lib ./lib
COPY 后端源码/public ./public

# 数据目录由环境变量 DATA_DIR 控制（部署平台挂载持久卷时指定），本地默认 ./data
ENV PORT=3000
EXPOSE 3000

# start.js 会按 Node 版本自动决定是否加 --experimental-sqlite
CMD ["node", "start.js"]
