# 生活小秘 - Android 应用

## 项目概述

**生活小秘** 是一款个性化智能吃喝玩乐服务平台 Android 原生应用。基于 WebView 容器技术，将完整的 Web 前端应用打包为 Android 原生 App，支持离线使用、原生状态栏适配、返回键处理等 Android 特性。

## 技术栈

| 层面 | 技术 |
|------|------|
| 语言 | Kotlin |
| 最低 SDK | Android 7.0 (API 24) |
| 目标 SDK | Android 14 (API 34) |
| 构建 | Gradle 8.2 + AGP 8.2 |
| UI | WebView + HTML/CSS/JS |
| 网络 | OkHttp 4.12 |
| JSON | Gson 2.10 |
| 架构 | 单 Activity + WebView 容器 |

## 项目结构

```
android-app/
├── settings.gradle                 # Gradle 项目配置
├── build.gradle                    # 项目级构建脚本
├── gradle.properties               # Gradle 属性
├── gradle/wrapper/
│   └── gradle-wrapper.properties   # Gradle Wrapper 配置
│
└── app/
    ├── build.gradle                # App 模块构建脚本
    ├── proguard-rules.pro          # 代码混淆规则
    │
    └── src/main/
        ├── AndroidManifest.xml     # 清单文件
        │
        ├── java/com/lexiang/life/
        │   ├── LexiangApp.kt       # Application 类（OkHttp 初始化）
        │   ├── MainActivity.kt     # 主 Activity（WebView 容器）
        │   ├── SplashActivity.kt   # 启动页
        │   └── AIService.kt        # AI 服务（后端通信 + 本地回退）
        │
        ├── assets/web/             # Web 前端资源（离线打包）
        │   ├── index.html          # 全屏版主页（无手机外壳）
        │   ├── css/style.css        # Android 适配样式
        │   └── js/
        │       ├── data.js          # 模拟数据
        │       ├── api.js           # API 客户端（带超时+回退）
        │       └── app.js           # 应用逻辑
        │
        └── res/
            ├── layout/
            │   └── activity_splash.xml  # 启动页布局
            ├── drawable/
            │   ├── ic_launcher_foreground.xml  # App 图标前景
            │   ├── ic_splash_logo.xml           # 启动页 Logo
            │   └── splash_background.xml        # 启动页背景
            ├── mipmap-anydpi-v26/
            │   ├── ic_launcher.xml              # 自适应图标
            │   └── ic_launcher_round.xml        # 圆形图标
            ├── values/
            │   ├── colors.xml      # 颜色定义
            │   ├── strings.xml     # 字符串
            │   ├── themes.xml      # 主题样式
            │   └── dimens.xml      # 尺寸定义
            └── xml/
                ├── network_security_config.xml  # 网络安全配置
                ├── backup_rules.xml              # 备份规则
                └── data_extraction_rules.xml     # 数据提取规则
```

## 如何构建 APK

### 方法一：使用 Android Studio（推荐）

1. **安装 Android Studio**（最新稳定版）
   - 下载地址：https://developer.android.com/studio
   - 安装时勾选 Android SDK、Android SDK Platform、Android Virtual Device

2. **导入项目**
   - 打开 Android Studio
   - 选择 `File → Open`
   - 选择 `android-app` 文件夹
   - 等待 Gradle 同步完成（首次约 3-5 分钟，需下载依赖）

3. **构建 Debug APK**
   - 菜单栏：`Build → Build Bundle(s) / APK(s) → Build APK(s)`
   - 构建完成后点击通知栏的 `locate` 链接
   - APK 文件位于：`app/build/outputs/apk/debug/app-debug.apk`

4. **构建 Release APK**
   - 菜单栏：`Build → Generate Signed Bundle / APK`
   - 选择 APK → Next
   - 创建或选择签名密钥（Key store）
   - 选择 `release` → Finish
   - APK 位于：`app/build/outputs/apk/release/app-release.apk`

### 方法二：使用命令行

```bash
# 确保已安装 Android SDK 和 Gradle

# Windows
cd android-app
gradlew.bat assembleDebug

# macOS / Linux
cd android-app
./gradlew assembleDebug

# 生成的 APK
# app/build/outputs/apk/debug/app-debug.apk
```

## 如何安装到手机

### 方法一：USB 直连安装

1. 手机开启 `设置 → 开发者选项 → USB 调试`
2. USB 连接电脑
3. 在 Android Studio 中点击 `Run` 按钮（绿色三角形）
4. 选择你的设备，自动安装并启动

### 方法二：APK 文件安装

1. 将构建好的 `app-debug.apk` 传到手机
2. 手机文件管理器找到该文件
3. 点击安装（需开启"允许未知来源应用"）

## 功能模块

| 页面 | 功能 |
|------|------|
| 首页 | 搜索栏、8大分类入口、轮播图、商家列表、特价美食、限时秒杀 |
| 推荐 | 兴趣偏好自定义、千人千面内容过滤、瀑布流推荐 |
| 小秘 | AI 对话、8大快捷指令（外卖/酒店/行程/票务等） |
| 上新 | 类朋友圈新品动态、筛选、点赞评论社交互动 |
| 个人中心 | 用户信息、资产卡片、订单管理、功能入口、系统设置 |

## 配置后端连接（可选）

默认情况下 App 使用本地数据离线运行。如需连接后端服务器：

1. 在 `app/src/main/assets/web/js/api.js` 中设置：
   ```javascript
   baseUrl: 'http://your-server-ip:3000',
   ```

2. 在 `AndroidManifest.xml` 中确保网络权限已开启

3. 如果使用 HTTPS，在 `network_security_config.xml` 中配置域名白名单

## 发布到应用商店

### 国内应用商店（华为/小米/OPPO/vivo/应用宝等）

1. 注册开发者账号
2. 提交应用信息（截图、描述、隐私政策）
3. 上传 Release APK
4. 等待审核（通常 1-3 个工作日）

### Google Play

1. 注册 Google Play 开发者账号（$25 一次性费用）
2. 在 Google Play Console 上传 AAB（Android App Bundle）
3. 填写商品详情、内容分级、隐私政策
4. 提交审核

## 权限说明

| 权限 | 用途 |
|------|------|
| INTERNET | 网络访问（加载网页内容、API 请求） |
| ACCESS_NETWORK_STATE | 检测网络连接状态 |
| ACCESS_WIFI_STATE | 检测 WiFi 连接状态 |
| ACCESS_FINE_LOCATION | 附近商家搜索（基于位置） |
| ACCESS_COARSE_LOCATION | 大致位置定位 |
| VIBRATE | 点击反馈震动 |
| CAMERA | 头像上传（个人中心） |

## 签名密钥生成

```bash
keytool -genkey -v -keystore lexiang-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias lexiang
```

在 `app/build.gradle` 中配置：

```groovy
signingConfigs {
    release {
        storeFile file('path/to/lexiang-release-key.jks')
        storePassword 'your_store_password'
        keyAlias 'lexiang'
        keyPassword 'your_key_password'
    }
}
```

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0.0 | 2026-08-12 | 初始版本：WebView 容器 + 全屏适配 + 启动页 + 原生返回键 |
