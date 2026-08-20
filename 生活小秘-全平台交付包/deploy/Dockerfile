# ==================== 生活小秘 - 生产环境 Dockerfile ====================
# 用法：在项目根目录（包含 app/ 和 server/ 的目录）构建
#   docker build -f deploy/Dockerfile -t lexiang-life .
#   docker run -d -p 3000:3000 --name lexiang-life lexiang-life

FROM node:22-alpine

# 运行时用户（安全加固：不用 root 运行）
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# 只复制运行所需文件（排除开发/文档文件）
COPY server/ ./server/
COPY app/ ./app/

# 使用非 root 用户运行
USER app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server/server.js"]
