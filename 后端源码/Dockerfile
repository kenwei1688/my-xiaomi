# 小秘智能体 Dockerfile（Node 服务 + SQLite 持久化）
# 零外部依赖；node:22 自带 node:sqlite（已静态编入二进制，alpine 可用）。
# 若某些 alpine 版本报 sqlite 相关错误，可把基础镜像改为 node:22-slim（Debian）。
FROM node:22-alpine
WORKDIR /app

# 仅拷贝源码（无需 npm install）
COPY package.json ./
COPY start.js server.js db.js ./
COPY lib ./lib
COPY public ./public

# 数据目录由环境变量 DATA_DIR 控制（部署平台挂载持久卷时指定），本地默认 ./data
ENV PORT=3000
EXPOSE 3000

# 用 start.js 启动：它会按 Node 版本自动决定是否加 --experimental-sqlite
CMD ["node", "start.js"]
