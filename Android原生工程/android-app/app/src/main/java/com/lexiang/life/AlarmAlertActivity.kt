package com.lexiang.life

import android.app.NotificationManager
import android.app.KeyguardManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.Vibrator
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/**
 * 闹钟式全屏弹窗：提醒到点后覆盖在锁屏之上，循环响铃+震动，点击"知道了"关闭。
 */
class AlarmAlertActivity : AppCompatActivity() {

    private var ringtone: Ringtone? = null
    private var vibrator: Vibrator? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 锁屏之上显示、点亮屏幕、保持亮屏
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        @Suppress("DEPRECATION")
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        )

        val title = intent.getStringExtra("title") ?: "提醒"
        val desc = intent.getStringExtra("desc") ?: ""

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 96, 48, 96)
            setBackgroundColor(0xFF1C1C1E.toInt())
        }
        val tvTitle = TextView(this).apply {
            text = "⏰ $title"
            textSize = 28f
            setTextColor(0xFFFFFFFF.toInt())
            gravity = android.view.Gravity.CENTER
        }
        val tvDesc = TextView(this).apply {
            text = desc
            textSize = 18f
            setTextColor(0xFFCCCCCC.toInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 32, 0, 48)
        }
        val btn = Button(this).apply {
            text = "我知道了"
            textSize = 18f
            setBackgroundColor(0xFFFF6B35.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener { dismissAlarm() }
        }
        root.addView(tvTitle)
        root.addView(tvDesc)
        root.addView(btn)
        setContentView(root)

        startRinging()
    }

    private fun startRinging() {
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            ringtone = RingtoneManager.getRingtone(this, uri).apply {
                isLooping = true
                play()
            }
        } catch (e: Exception) {
            // 忽略
        }
        try {
            vibrator = getSystemService(Vibrator::class.java)
            val pattern = longArrayOf(0, 500, 250, 500, 250, 500)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(
                    android.os.VibrationEffect.createWaveform(pattern, 0)
                )
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (e: Exception) {
            // 忽略
        }
    }

    private fun dismissAlarm() {
        try {
            ringtone?.stop()
            vibrator?.cancel()
        } catch (e: Exception) {
        }
        // 取消对应的通知
        try {
            val mgr = getSystemService(NotificationManager::class.java)
            // 通知 id 在 ReminderReceiver 中按 id+offset 计算，这里无法精确对应，
            // 直接取消全部本 App 提醒类通知
            mgr.cancelAll()
        } catch (e: Exception) {
        }
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            ringtone?.stop()
            vibrator?.cancel()
        } catch (e: Exception) {
        }
    }
}
