package com.lexiang.life

import android.app.Application
import android.os.Build
import android.util.Log
import android.webkit.WebView
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

class LexiangApp : Application() {

    companion object {
        private const val TAG = "LexiangApp"
        lateinit var httpClient: OkHttpClient
            private set
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "LexiangLife App starting...")

        httpClient = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()

        // Pre-warm WebView data directory (API 28+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            try {
                WebView.setDataDirectorySuffix("lexiang")
            } catch (e: Exception) {
                Log.w(TAG, "WebView data dir already set")
            }
        }
    }
}
