# 生活小秘 - 生产环境部署指南

本目录提供将「生活小秘」后端 + 前端一键部署到云服务器的完整方案。

## 部署包内容

| 文件 | 用途 |
|------|------|
| `Dockerfile` | 生产镜像（Node 22 Alpine，非 root 运行，健康检查） |
| `docker-compose.yml` | 一键编排（自动重启、健康检查） |
| `nginx.conf` | 反向代理 + HTTPS + 静态缓存 + 安全头 |
| `lexiang.service` | systemd 服务（免 Docker 方案） |
| `deploy.sh` | **一键部署脚本**（推荐） |

## 快速部署（推荐，10 分钟）

### 前提
1. 一台云服务器（腾讯云/阿里云轻量服务器即可，2核2G 起步，约 ¥50-100/月）
2. 系统 Ubuntu 20.04+ / Debian 11+
3. （可选）已备案域名

### 步骤

```bash
# 1. 把项目上传到服务器（任选其一）
#    - 方法A：用 WinSCP/FileZilla 上传项目根目录（含 app/ server/ deploy/）
#    - 方法B：git clone 你的仓库
#    - 方法C：scp -r 本地目录 root@服务器IP:/opt/lexiang-life

# 2. SSH 登录服务器，进入项目目录
ssh root@服务器IP
cd /opt/lexiang-life

# 3. 一键部署（自动装 Docker → 构建 → 启动 → 可选 HTTPS）
sudo bash deploy/deploy.sh

# 4. 完成！浏览器访问
#    http://服务器IP:3000
```

### 配置 HTTPS（有域名时）

部署脚本会引导你输入域名并自动申请 Let's Encrypt 免费证书。
前提：域名已解析（A 记录）到本服务器 IP。

## 免 Docker 方案（systemd）

```bash
# 1. 安装 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# 2. 部署项目到 /opt/lexiang-life（保留 app/ 和 server/）

# 3. 注册 systemd 服务
cp deploy/lexiang.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now lexiang

# 4. 验证
curl http://127.0.0.1:3000/api/health
```

## 安全与运维清单

- [ ] 云服务器安全组开放 80/443 端口（3000 端口建议关闭外网，由 nginx 代理）
- [ ] SSH 密钥登录，禁用密码登录
- [ ] 安装 `fail2ban` 防暴力破解
- [ ] 数据库持久化：当前为 **JSON 文件持久化**（`server/data/db.json`，重启不丢）；接 MySQL/Redis 时挂载 `lexiang-data` 卷
- [ ] 接入监控：`uptime` 探活 + 腾讯云/阿里云云监控告警
- [ ] 每日备份：`tar -czf backup.tar.gz server/ app/` 定时任务

## 后续上线路线（合规）

1. **域名备案**：中国大陆服务器必须 ICP 备案（腾讯云/阿里云控制台提交，约 1-2 周）
2. **HTTPS**：备案后立即配置（本脚本已支持）
3. **支付**：接入微信支付/支付宝需营业执照 + 商户号申请
4. **内容审核**：上新页社区内容需接入审核（可先用微信小程序内容安全 API）
5. **隐私政策 + 用户协议**：上线前必须上架
