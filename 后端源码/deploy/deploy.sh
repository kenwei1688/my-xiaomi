#!/usr/bin/env bash
# ==================== 生活小秘 - 服务器一键部署脚本 ====================
# 适用：Ubuntu 20.04+ / Debian 11+（云服务器）
# 用法：sudo bash deploy.sh
#
# 本脚本自动完成：
#   1. 安装 Docker + Docker Compose
#   2. 构建并启动生活小秘容器
#   3. 配置 HTTPS（需域名，可跳过）
#   4. 输出访问地址

set -e

echo "=============================================="
echo "  生活小秘 - 一键部署脚本"
echo "=============================================="

# ---------- 1. 检查 root 权限 ----------
if [ "$EUID" -ne 0 ]; then
  echo "❌ 请使用 root 权限运行: sudo bash deploy.sh"
  exit 1
fi

# ---------- 2. 检查 / 安装 Docker ----------
if ! command -v docker >/dev/null 2>&1; then
  echo "▶ 正在安装 Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi
echo "✅ Docker: $(docker --version)"

# ---------- 3. 检查 / 安装 Docker Compose ----------
if ! docker compose version >/dev/null 2>&1; then
  echo "▶ 正在安装 Docker Compose..."
  apt-get update -y
  apt-get install -y docker-compose-plugin || \
    curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose
fi
echo "✅ Docker Compose: $(docker compose version)"

# ---------- 4. 构建并启动服务 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "▶ 构建并启动生活小秘服务..."
cd "$PROJECT_ROOT"
docker compose -f deploy/docker-compose.yml up -d --build
echo "✅ 服务已启动"

# ---------- 5. 等待健康检查通过 ----------
echo "▶ 等待服务就绪..."
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "✅ 健康检查通过"
    break
  fi
  sleep 2
  [ "$i" = "15" ] && echo "⚠️  健康检查超时，请查看日志: docker logs lexiang-life"
done

# ---------- 6. 获取服务器公网 IP ----------
SERVER_IP=$(curl -sf --max-time 5 ifconfig.me 2>/dev/null || echo "你的服务器IP")

# ---------- 7. 可选：配置 HTTPS ----------
read -rp "是否配置 HTTPS？需要已解析到本机的域名 [y/N]: " DO_HTTPS
if [[ "$DO_HTTPS" =~ ^[Yy]$ ]]; then
  read -rp "请输入域名（如 lexiang.example.com）: " DOMAIN
  if [ -z "$DOMAIN" ]; then
    echo "⚠️  域名不能为空，跳过 HTTPS 配置"
  else
    echo "▶ 安装 nginx 和 certbot..."
    apt-get install -y nginx certbot python3-certbot-nginx
    # 生成反向代理配置（替换域名）
    sed "s/lexiang.example.com/$DOMAIN/g" "$SCRIPT_DIR/nginx.conf" \
      > /etc/nginx/conf.d/lexiang.conf
    nginx -t && systemctl reload nginx
    # 申请 Let's Encrypt 证书
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos \
      --register-unsafely-without-email --redirect || \
      echo "⚠️  HTTPS 证书申请失败，可稍后手动执行: certbot --nginx -d $DOMAIN"
    echo "✅ HTTPS 已配置: https://$DOMAIN"
  fi
fi

echo ""
echo "=============================================="
echo "  🎉 部署完成！"
echo "=============================================="
echo "  直接访问:  http://$SERVER_IP:3000"
echo "  API 文档:  http://$SERVER_IP:3000/api/health"
if [[ "$DO_HTTPS" =~ ^[Yy]$ ]] && [ -n "$DOMAIN" ]; then
  echo "  HTTPS:     https://$DOMAIN"
fi
echo "  管理命令:  docker logs -f lexiang-life"
echo "             docker compose -f deploy/docker-compose.yml down"
echo "=============================================="
