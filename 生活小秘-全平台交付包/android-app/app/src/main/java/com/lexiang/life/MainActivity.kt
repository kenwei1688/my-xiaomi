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
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import org.json.JSONObject

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

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT

        // Build layout programmatically
        refreshLayout = SwipeRefreshLayout(this).apply {
            setOnRefreshListener {
                webView.reload()
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
    }

    override fun onDestroy() {
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
    }
}
