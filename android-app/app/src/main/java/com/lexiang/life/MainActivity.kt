package com.lexiang.life

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import org.json.JSONObject
import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer

class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        private const val LOCAL_INDEX = "file:///android_asset/web/index.html"
        // Change this to your server URL for production
        private const val REMOTE_SERVER = ""
    }

    private lateinit var webView: WebView
    private lateinit var refreshLayout: SwipeRefreshLayout
    private val handler = Handler(Looper.getMainLooper())

    // 当前 WebView 是否处于顶部（由前端滚动上报维护），用于决定是否允许下拉刷新
    @Volatile private var webViewAtTop: Boolean = true
    // 语音识别器实例
    private var speechRecognizer: SpeechRecognizer? = null

    // 录音权限请求
    private val recordAudioPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            startSpeechRecognition()
        } else {
            Toast.makeText(
                this@MainActivity,
                "需要麦克风权限才能使用语音输入",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    // 通知权限请求（Android 13+ 必须，提醒才会响）
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* 无需处理，后续下发通知时再判断 */ }

    // 短信权限请求（短信提醒需要）
    private val smsPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* 未授权时短信提醒会回退为 App 内通知 */ }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT

        // 透明状态栏上使用深色图标，确保在浅色内容背景上清晰可见
        val statusBarController = WindowInsetsControllerCompat(window, window.decorView)
        statusBarController.isAppearanceLightStatusBars = true

        // Build layout programmatically
        refreshLayout = SwipeRefreshLayout(this).apply {
            setOnRefreshListener {
                webView.reload()
            }
            // 修复滚动异常：只有 WebView 确实在顶部时才允许触发下拉刷新，
            // 页面在中间滚动时不会误触发刷新导致的页面跳动
            setOnChildScrollUpCallback { _, _ ->
                webView.scrollY > 0 || !webViewAtTop
            }
        }

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        refreshLayout.addView(webView)
        setContentView(refreshLayout)

        // Configure WebView
        configureWebView()

        // 提醒调度：创建通知渠道 + 重启后恢复已有提醒
        ReminderScheduler.ensureChannels(this)
        ReminderScheduler.restoreAll(this)
        // 云端同步：已登录用户拉取云端提醒并调度到原生闹钟
        CloudSync.sync(this)

        // Load page
        val url = if (REMOTE_SERVER.isNotEmpty() && isOnline()) REMOTE_SERVER else LOCAL_INDEX
        Log.i(TAG, "Loading URL: $url")
        webView.loadUrl(url)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        webView.apply {
            // Enable JavaScript
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            settings.cacheMode = android.webkit.WebSettings.LOAD_DEFAULT

            // Viewport settings
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true

            // Zoom
            settings.builtInZoomControls = false
            settings.displayZoomControls = false

            // Mixed content
            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

            // User agent
            settings.userAgentString = settings.userAgentString + " LexiangLife/1.0 Android"

            // Media playback
            settings.mediaPlaybackRequiresUserGesture = false

            // Scrollbar
            isVerticalScrollBarEnabled = true
            isHorizontalScrollBarEnabled = false
            scrollBarStyle = View.SCROLLBARS_INSIDE_OVERLAY

            // Background
            setBackgroundColor(Color.WHITE)

            // JavaScript interface
            addJavascriptInterface(NativeBridge(this@MainActivity), "AndroidBridge")

            // WebView client
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest
                ): Boolean {
                    val url = request.url.toString()
                    Log.d(TAG, "Loading: $url")
                    // Allow local and same-origin URLs
                    return false
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    refreshLayout.isRefreshing = false
                    // Inject device info
                    injectNativeInfo()
                }

                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: android.webkit.WebResourceError?
                ) {
                    super.onReceivedError(view, request, error)
                    Log.e(TAG, "Error: ${error?.description}")
                    refreshLayout.isRefreshing = false
                }
            }

            // Chrome client
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView?, newProgress: Int) {
                    if (newProgress == 100) {
                        refreshLayout.isRefreshing = false
                    }
                }

                override fun onJsAlert(
                    view: WebView?,
                    url: String?,
                    message: String?,
                    result: android.webkit.JsResult?
                ): Boolean {
                    Toast.makeText(this@MainActivity, message ?: "", Toast.LENGTH_SHORT).show()
                    result?.confirm()
                    return true
                }

                override fun onJsConfirm(
                    view: WebView?,
                    url: String?,
                    message: String?,
                    result: android.webkit.JsResult?
                ): Boolean {
                    // Simple confirm dialog
                    result?.confirm()
                    return true
                }
            }
        }
    }

    private fun injectNativeInfo() {
        val js = """
            window.__NATIVE_INFO__ = {
                platform: 'android',
                version: '1.0.0',
                isApp: true,
                statusBarHeight: ${getStatusBarHeight()},
                hasNotch: ${hasNotch()},
                screenWidth: ${resources.displayMetrics.widthPixels},
                screenHeight: ${resources.displayMetrics.heightPixels},
                density: ${resources.displayMetrics.density}
            };
            if (typeof window.onNativeReady === 'function') {
                window.onNativeReady(window.__NATIVE_INFO__);
            }
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun getStatusBarHeight(): Int {
        val resourceId = resources.getIdentifier("status_bar_height", "dimen", "android")
        return if (resourceId > 0) resources.getDimensionPixelSize(resourceId) else 0
    }

    private fun hasNotch(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.decorView.rootWindowInsets?.displayCutout != null
        } else false
    }

    private fun isOnline(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = cm.activeNetwork ?: return false
        val caps = cm.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    // 前端滚动位置上报：state == "true" 表示在顶部
    fun onWebViewScrollState(atTop: Boolean) {
        webViewAtTop = atTop
    }

    // ===== 语音识别 =====
    fun requestRecordAudioPermission() {
        recordAudioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
    }

    // 请求提醒所需权限（通知 + 短信），仅在尚未授权时弹出
    fun requestReminderPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS)
            != PackageManager.PERMISSION_GRANTED
        ) {
            smsPermissionLauncher.launch(Manifest.permission.SEND_SMS)
        }
    }

    fun startSpeechRecognition() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) {
            Toast.makeText(
                this@MainActivity,
                "当前设备不支持语音识别，请直接输入文字",
                Toast.LENGTH_SHORT
            ).show()
            return
        }
        // SpeechRecognizer 必须在主线程创建与启动，否则在部分机型上静默失败
        runOnUiThread {
            try {
                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this@MainActivity).apply {
                    setRecognitionListener(object : RecognitionListener {
                        override fun onReadyForSpeech(params: Bundle?) {}
                        override fun onBeginningOfSpeech() {}
                        override fun onRmsChanged(rmsdB: Float) {}
                        override fun onBufferReceived(buffer: ByteArray?) {}
                        override fun onEndOfSpeech() {
                            handler.post { setVoiceBtnActiveNative(true) }
                        }
                        override fun onError(error: Int) {
                            handler.post {
                                setVoiceBtnActiveNative(false)
                                val msg = when (error) {
                                    SpeechRecognizer.ERROR_NO_MATCH -> "没有识别到语音"
                                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "未检测到说话"
                                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "缺少录音权限"
                                    SpeechRecognizer.ERROR_NETWORK -> "网络异常，语音识别失败"
                                    SpeechRecognizer.ERROR_CLIENT -> "语音识别被中断"
                                    else -> "语音识别失败，请重试"
                                }
                                Toast.makeText(this@MainActivity, msg, Toast.LENGTH_SHORT).show()
                            }
                        }

                        override fun onResults(results: Bundle?) {
                            handler.post { setVoiceBtnActiveNative(false) }
                            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                            val text = matches?.firstOrNull() ?: ""
                            if (text.isNotEmpty()) {
                                // 转义，避免 JS 注入 / 引号截断
                                val escaped = text
                                    .replace("\\", "\\\\")
                                    .replace("'", "\\'")
                                    .replace("\"", "\\\"")
                                    .replace("\n", " ")
                                webView.evaluateJavascript("onVoiceResult('$escaped')", null)
                            }
                        }

                        override fun onPartialResults(partialResults: Bundle?) {}
                        override fun onEvent(eventType: Int, params: Bundle?) {}
                    })
                }

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "zh-CN")
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
                    putExtra(RecognizerIntent.EXTRA_PROMPT, "请说话…")
                }
                speechRecognizer?.startListening(intent)
            } catch (e: Exception) {
                handler.post {
                    setVoiceBtnActiveNative(false)
                    Toast.makeText(this@MainActivity, "语音识别启动失败：${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // 与 H5 联动：通知原生把麦克风按钮置为录音中/停止态
    private fun setVoiceBtnActiveNative(active: Boolean) {
        webView.evaluateJavascript("if(window.setVoiceBtnActive)window.setVoiceBtnActive($active);", null)
    }

    // Handle back button
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    // Double-tap back to exit
    private var backPressedTime = 0L
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            if (backPressedTime + 2000 > System.currentTimeMillis()) {
                super.onBackPressed()
            } else {
                Toast.makeText(this, "再按一次退出生活小秘", Toast.LENGTH_SHORT).show()
                backPressedTime = System.currentTimeMillis()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        // 回到前台尝试一次云端同步，保持提醒最新
        CloudSync.sync(this)
    }

    override fun onDestroy() {
        speechRecognizer?.destroy()
        speechRecognizer = null
        webView.apply {
            removeAllViews()
            destroy()
        }
        super.onDestroy()
    }

    // JavaScript Bridge
    class NativeBridge(private val context: Context) {

        @JavascriptInterface
        fun showToast(message: String) {
            Handler(Looper.getMainLooper()).post {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun getDeviceInfo(): String {
            return JSONObject().apply {
                put("platform", "android")
                put("version", "1.0.0")
                put("model", Build.MODEL)
                put("manufacturer", Build.MANUFACTURER)
                put("sdk", Build.VERSION.SDK_INT)
                put("isApp", true)
            }.toString()
        }

        @JavascriptInterface
        fun isOnline(): Boolean {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        }

        @JavascriptInterface
        fun closeApp() {
            (context as? MainActivity)?.finish()
        }

        // 启动语音识别（供前端"麦克风"按钮调用）
        @JavascriptInterface
        fun startVoiceRecognition() {
            val activity = context as? MainActivity ?: return
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED
            ) {
                activity.startSpeechRecognition()
            } else {
                activity.requestRecordAudioPermission()
            }
        }

        // 接收前端滚动位置上报：state == "true" 表示在顶部
        @JavascriptInterface
        fun updateScrollState(state: String) {
            (context as? MainActivity)?.onWebViewScrollState(state == "true")
        }

        // ===== 提醒调度桥接 =====
        // H5 每次增删改提醒后，把完整提醒数组同步给原生，由原生负责系统闹钟调度
        @JavascriptInterface
        fun syncReminders(json: String) {
            try {
                ReminderScheduler.syncAll(context, json)
            } catch (e: Exception) {
                Log.e("NativeBridge", "syncReminders 失败: ${e.message}")
            }
        }

        // 保存提醒设置（短信接收手机号、默认方式等）
        @JavascriptInterface
        fun saveReminderSettings(json: String) {
            ReminderScheduler.saveSettings(context, json)
        }

        // 读取提醒设置（返回 JSON 字符串）
        @JavascriptInterface
        fun getReminderSettings(): String {
            return ReminderScheduler.getSettings(context).toString()
        }

        // 请求提醒所需权限（通知 + 短信）
        @JavascriptInterface
        fun requestReminderPermissions() {
            (context as? MainActivity)?.requestReminderPermissions()
        }

        // 读取权限授予状态（供 H5 判断是否需要引导用户开启）
        @JavascriptInterface
        fun getPermissionStatus(): String {
            val ctx = context
            val notif = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) ==
                    PackageManager.PERMISSION_GRANTED
            } else true
            val sms = ContextCompat.checkSelfPermission(ctx, Manifest.permission.SEND_SMS) ==
                PackageManager.PERMISSION_GRANTED
            return try {
                JSONObject().put("notification", notif).put("sms", sms).toString()
            } catch (e: Exception) { "{}" }
        }

        // ===== 云端配置桥接 =====
        // H5 登录成功后把云端服务器地址与 token 传给原生，由原生在后台拉取云端提醒
        @JavascriptInterface
        fun setCloudConfig(server: String, token: String) {
            val activity = context as? MainActivity ?: return
            CloudSync.setCloudConfig(activity, server, token)
            CloudSync.sync(activity)
        }

        // H5 退出登录时调用：清空原生持有的云端配置，回到纯本地调度
        @JavascriptInterface
        fun clearCloudConfig() {
            val activity = context as? MainActivity ?: return
            CloudSync.clearCloudConfig(activity)
        }
    }
}
