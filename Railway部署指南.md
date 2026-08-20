# 生活小秘 · Railway 一键部署指南

把 `server/`（Node 后端 API）+ `app/`（H5 前端）作为一个**单进程同源服务**部署到 Railway，平台自动构建、运行，并给你一个 `https://xxx.up.railway.app` 的公网网址。无需买/管服务器，自带 HTTPS。

---

## 一、前置准备（你本机，一次性）

1. **注册 Railway 账号**：https://railway.app （用 GitHub 登录最方便）。
2. **安装 Railway CLI**（二选一）：
   ```bash
   # 方式 A：npm（需本机有 Node）
   npm i -g @railway/cli

   # 方式 B：macOS Homebrew
   brew install railway
   ```
3. **登录**（浏览器授权）：
   ```bash
   railway login
   ```

---

## 二、部署（在项目根目录执行）

打开终端，`cd` 到本工程根目录（即含 `server/`、`app/`、`package.json`、`railway.json` 的那一层）。

```bash
# 1) 关联/新建 Railway 项目（按提示选 Create New Project）
railway init

# 2) 设置鉴权密钥（必填，平台自动注入为环境变量；下方随机串请自行替换，或让小布生成）
railway variables --set JWT_SECRET=$(openssl rand -hex 32)

# 注意：不要手动设置 PORT，Railway 会自动注入 $PORT，server.js 已读取

# 3) 一键部署（会上传 app/ + server/，自动 npm install + npm start）
railway up

# 4) 生成公网域名（也可在 Dashboard 的 Settings → Domains 里点 Generate）
railway domain
```

部署完成后，终端/仪表盘会显示一个域名，例如 `https://lexiang-life.up.railway.app`。
浏览器打开它即可访问「小秘」前端；打开 `https://<你的域名>/api/health` 应返回 `persistent:true` 等健康信息。

> **部署源已切换为 GitHub 自动部署（2026-08-20 完成）**：服务源已连接到 `kenwei1688/my-xiaomi` 仓库的 `main` 分支，`git push` 到 `main` 即自动部署（已实测两次通过）。数据目录 `DATA_DIR` 已设为 `/app/server/data`（与卷挂载点对齐）。原持久卷 `2026-08-09-12-47-29-volume` 处于 pending-deletion 待删状态（硬删时间 `2026-08-22T02:58:55Z` = 10:58 +08），届时槽位释放后由定时任务 `automation-1787197826304`（8/22 12:00 +08）自动挂载新卷恢复持久化；当前为内存空库，重部署不会丢配置但会清空运行期数据，**正式投产前请勿写入重要账号/数据**。
>
> **push-to-deploy 已生效（2026-08-20 17:41 确认）**：17:30、17:36 两次推送均未自动部署，根因为当初用 CLI 连仓库时未注册 GitHub push webhook（仅点 Enable 不够）。17:39 在 CLI 断开并重连服务源（`railway service source disconnect` → `connect`）后重新注册了 webhook；17:41 推送 commit 后 Railway 自动出新部署（f60f9326、随后 ec362808），`/api/health` 返回 200。**现已是推送 `main` 即自动部署**，之后改代码直接 `git push` 即可上线，无需 `railway up`。

---

## 三、数据持久化（重要）

Railway 的容器文件系统**默认是临时的**——每次部署/重启，`server/data/db.json` 会被清空，**用户账号、提醒、行程会丢失**。

要让数据长期保留，挂一个持久卷：

1. 在 Railway 仪表盘 → 你的项目 → **Storage（或 Volumes）** → 新建 Volume。
2. 把卷挂载到容器路径：**`/app/server/data`**（与 `store.js` 默认的 `DATA_DIR` 一致）；或用 CLI：`railway volume add -m /app/server/data`。
3. 容量 1 GB 足够。保存/添加后服务会自动重新 Deploy。

挂上卷后，`db.json` 就落在持久盘上，重启/重新部署都不丢数据。

> **进阶**：`store.js` 支持 `DATA_DIR` 环境变量（默认 `server/data`）。若把卷挂到别的路径（如 `/app/data`），设 `railway variables set DATA_DIR=/app/data` 即可，本地/Docker 默认行为不受影响。Railway 限制**一个服务只能挂 1 块卷**。

> 若暂时不想挂卷（纯演示），可接受“重新部署即清空”，但不建议用于真实运营。

---

## 四、同源与客户端对接

- 单进程同源：同一 Node 进程既提供 `/api/*` 又托管 `app/` 静态前端，**无需手动填服务器地址**，H5 自动走相对路径。
- **Android 端**：在 H5「云端同步」登录后，会把 `location.origin`（即 `https://xxx.up.railway.app`）传给原生 `setCloudConfig`，原生据此拉取并调度系统级提醒——同源逻辑已自动生效。
- **HTTPS**：Railway 域名自带 HTTPS，token 传输安全。

---

## 五、环境变量速查

| 变量 | 来源 | 说明 |
|---|---|---|
| `PORT` | Railway 自动注入 | 不要手动设；`server.js` 已监听 |
| `JWT_SECRET` | 你用 `railway variables` 设置 | 登录 Token 签名密钥，**必须设置且足够随机** |
| `JWT_TTL_DAYS` | 可选 | Token 有效期（天），默认 30 |
| `DATA_DIR` | 可选 | 持久化数据目录，默认 `server/data`（相对路径）。云端部署挂卷时可设为卷挂载点（本部署为 `/app/server/data`），实现重启不丢 |

---

## 六、常见问题

- **`railway up` 上传了无关文件？** 已用 `.railwayignore` 排除 `android-app/`、`miniprogram/`、`*.apk`、`*.zip` 等，只传 `app/` + `server/` + 配置文件。
- **健康检查失败？** `railway.json` 已设 `healthcheckPath: /api/health`，确保服务起来后该接口返回 200。
- **免费额度限制？** Railway 免费版有用量上限与「冷启动」（一段时间无访问会变慢），长期运营建议升级付费套餐。
- **想换回 VPS？** 同一套 `server/` + `app/` 代码在任意有 Node 的云主机都能跑（见《后端公有云部署指南.md》），部署物互相通用。

---

## 七、上线状态与 8/22 换卷计划（2026-08-20 更新）

- **公网地址**：https://2026-08-09-12-47-29-production.up.railway.app （区域 ams，状态 Online）
- **JWT_SECRET**：已设为 Railway 环境变量（随机生成，可在 Dashboard → Variables 查看/轮换）。
- **DATA_DIR**：当前设为 `/app/server/data`（与卷挂载点对齐；详见下方）。
- **测试账号 `railwaytest`**：已清除（登录返回 401）。

### ⚠️ 当前持久化状态（重要，如实说明 · 2026-08-20 实测）
- 原卷 `2026-08-09-12-47-29-volume` 处于 **pending-deletion 软删除**状态，硬删时间 `2026-08-22T02:58:55Z`（= 10:58 +08）。期间 Railway **控制面仍把该卷记为"已挂载"**，且限制一个服务只能挂 1 块卷，因此期间**无法添加新卷**（报 `A volume is already mounted`）。
- 我们曾主动 `railway volume delete` 想提前释放槽位，但 Railway 异步删除**未真正生效**——卷仍在、仍占唯一槽位，所以 `add` 新卷一直被拒。
- 关键实测：容器内 `/app/server/data` **不存在、`NO_MOUNT`**（控制面显示挂载但实例侧根本没挂上）。当前 `DATA_DIR=/app/server/data` 指向临时盘，**数据只在内存，重部署会丢**。
- 服务本身运行正常（health 200、前端 200），但**持久化在 8/22 前处于降级状态**。库内无真实用户数据（仅测试账号且已清除），影响有限；**请勿在 8/22 前用真实账号注册重要数据**。

### ✅ 8/22 自动换卷（已建定时任务 automation-1787197826304）
旧卷 8/22 硬删后槽位释放，定时任务会在 **2026-08-22 12:00 +08** 自动执行换卷（含 30 分钟重试循环兜底），也可手动提前触发：

```bash
cd <工程根目录>
# 槽位已释放后，加一块全新持久卷（挂 /app/server/data，与 DATA_DIR 一致）
railway volume add -m /app/server/data
# 重新部署，容器挂载新卷（GitHub 源用 redeploy，不要 railway up）
railway service redeploy --yes
# 验证挂载（空库时无 db.json 属正常，首次写入才生成）
railway ssh "ls -la /app/server/data"
```

> 持久化验证：注册临时用户 → 触发重部署 → 重部署后登录该用户成功，即证明数据跨重部署不丢。若定时任务因 Railway 登录态过期未执行，终端 `railway login` 后手动跑上面命令即可，1 分钟内恢复持久化。

- **更新代码**：改完本地后 `git push origin main` 即自动部署上线（GitHub 源），无需 `railway up`。
