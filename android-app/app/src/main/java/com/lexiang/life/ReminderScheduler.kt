package com.lexiang.life

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.media.RingtoneManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

/**
 * 提醒调度引擎：负责把 H5 中的提醒数据转换成 Android 系统闹钟（AlarmManager），
 * 并在 App 被杀/重启后恢复调度。被 MainActivity、ReminderReceiver、BootReceiver 共用。
 */
object ReminderScheduler {

    private const val TAG = "ReminderScheduler"
    private const val PREFS = "life_reminders"
    private const val KEY_REMINDERS = "reminders"
    private const val KEY_CODES = "scheduled_codes"
    private const val KEY_SETTINGS = "settings"
    const val ACTION_FIRE = "com.lexiang.life.REMINDER_FIRE"

    /** 创建/确保通知渠道存在（Android 8+ 必须，多次调用幂等） */
    fun ensureChannels(ctx: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val mgr = ctx.getSystemService(android.app.NotificationManager::class.java)
            val alarmChan = android.app.NotificationChannel(
                "reminder_alarm", "提醒闹钟", android.app.NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "生活小秘闹钟提醒"
                val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                val attrs = android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
                setSound(uri, attrs)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 250, 500, 250, 500)
                setBypassDnd(true)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
            val normalChan = android.app.NotificationChannel(
                "reminder_normal", "提醒通知", android.app.NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "生活小秘提醒通知"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            }
            mgr.createNotificationChannel(alarmChan)
            mgr.createNotificationChannel(normalChan)
        }
    }

    private fun prefs(ctx: Context): SharedPreferences =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** 保存 H5 同步过来的全部提醒（含已关闭/已删除），供重启后恢复 */
    fun saveReminders(ctx: Context, json: String) {
        prefs(ctx).edit().putString(KEY_REMINDERS, json).apply()
    }

    fun getReminders(ctx: Context): JSONArray {
        val raw = prefs(ctx).getString(KEY_REMINDERS, "[]") ?: "[]"
        return try {
            JSONArray(raw)
        } catch (e: Exception) {
            JSONArray()
        }
    }

    fun saveSettings(ctx: Context, json: String) {
        prefs(ctx).edit().putString(KEY_SETTINGS, json).apply()
    }

    fun getSettings(ctx: Context): JSONObject {
        val raw = prefs(ctx).getString(KEY_SETTINGS, "") ?: ""
        return try {
            if (raw.isNotEmpty()) JSONObject(raw) else JSONObject()
        } catch (e: Exception) {
            JSONObject()
        }
    }

    private fun codeMap(ctx: Context): JSONObject {
        val raw = prefs(ctx).getString(KEY_CODES, "{}") ?: "{}"
        return try {
            JSONObject(raw)
        } catch (e: Exception) {
            JSONObject()
        }
    }

    private fun getCode(ctx: Context, id: Long): Int {
        val map = codeMap(ctx)
        if (map.has(id.toString())) return map.getInt(id.toString())
        val code = (id and 0x7FFFFFFF).toInt()
        map.put(id.toString(), code)
        prefs(ctx).edit().putString(KEY_CODES, map.toString()).apply()
        return code
    }

    private fun forgetCode(ctx: Context, id: Long) {
        val map = codeMap(ctx)
        if (map.has(id.toString())) {
            map.remove(id.toString())
            prefs(ctx).edit().putString(KEY_CODES, map.toString()).apply()
        }
    }

    /** 解析 "HH:mm" 为时/分 */
    private fun parseTime(t: String): Pair<Int, Int> {
        val parts = t.split(":")
        val h = parts.getOrNull(0)?.toIntOrNull() ?: 8
        val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
        return Pair(h.coerceIn(0, 23), m.coerceIn(0, 59))
    }

    /** 解析 "yyyy-MM-dd" 为毫秒（失败返回 -1） */
    private fun parseDate(d: String): Long? {
        return try {
            val s = d.split("-")
            val y = s[0].toInt()
            val mo = s[1].toInt() - 1
            val day = s[2].toInt()
            val cal = java.util.Calendar.getInstance().apply {
                set(java.util.Calendar.YEAR, y)
                set(java.util.Calendar.MONTH, mo)
                set(java.util.Calendar.DAY_OF_MONTH, day)
                set(java.util.Calendar.HOUR_OF_DAY, 0)
                set(java.util.Calendar.MINUTE, 0)
                set(java.util.Calendar.SECOND, 0)
                set(java.util.Calendar.MILLISECOND, 0)
            }
            cal.timeInMillis
        } catch (e: Exception) {
            null
        }
    }

    /**
     * 计算下次触发时间（毫秒）。返回 -1 表示无需调度（如一次性已过期）。
     * forwardOnly=true 时强制向未来推移（用于触发后重排）。
     */
    fun computeNextTrigger(r: JSONObject, forwardOnly: Boolean = false): Long {
        val now = System.currentTimeMillis()
        val (hh, mm) = parseTime(r.optString("time", "08:00"))
        val cal = java.util.Calendar.getInstance()

        val dateStr = r.optString("date", "")
        if (dateStr.isNotEmpty()) {
            val base = parseDate(dateStr) ?: return -1
            cal.timeInMillis = base
            cal.set(java.util.Calendar.HOUR_OF_DAY, hh)
            cal.set(java.util.Calendar.MINUTE, mm)
            cal.set(java.util.Calendar.SECOND, 0)
            cal.set(java.util.Calendar.MILLISECOND, 0)
            return if (cal.timeInMillis > now || forwardOnly) cal.timeInMillis else -1
        }

        val repeat = r.optString("repeat", "仅一次")
        cal.timeInMillis = now
        cal.set(java.util.Calendar.HOUR_OF_DAY, hh)
        cal.set(java.util.Calendar.MINUTE, mm)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)

        if (cal.timeInMillis <= now || forwardOnly) {
            when {
                repeat.contains("每天") -> cal.add(java.util.Calendar.DAY_OF_MONTH, 1)
                repeat.contains("工作日") -> {
                    do { cal.add(java.util.Calendar.DAY_OF_MONTH, 1) } while (
                        cal.get(java.util.Calendar.DAY_OF_WEEK) == java.util.Calendar.SATURDAY ||
                        cal.get(java.util.Calendar.DAY_OF_WEEK) == java.util.Calendar.SUNDAY
                    )
                }
                repeat.contains("每周") -> cal.add(java.util.Calendar.DAY_OF_MONTH, 7)
                repeat.contains("每月") -> cal.add(java.util.Calendar.MONTH, 1)
                repeat.contains("每年") -> cal.add(java.util.Calendar.YEAR, 1)
                else -> cal.add(java.util.Calendar.DAY_OF_MONTH, 1) // 仅一次
            }
        }
        return cal.timeInMillis
    }

    /** 判断是否为一次性提醒（触发后不再重排）。带具体日期或"仅一次"均为一次性 */
    fun isOneShot(r: JSONObject): Boolean {
        if (r.optString("date", "").isNotEmpty()) return true
        val repeat = r.optString("repeat", "仅一次")
        return !repeat.contains("每天") && !repeat.contains("工作日") &&
            !repeat.contains("每周") && !repeat.contains("每月") && !repeat.contains("每年")
    }

    /** 调度单个提醒（若已关闭则取消） */
    fun schedule(ctx: Context, r: JSONObject) {
        ensureChannels(ctx)
        val id = r.optLong("id", 0)
        if (!r.optBoolean("enabled", true)) {
            cancel(ctx, id)
            return
        }
        val trigger = computeNextTrigger(r)
        if (trigger <= 0) {
            Log.i(TAG, "提醒 $id 无需调度（已过期）")
            return
        }
        try {
            val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val code = getCode(ctx, id)
            val intent = Intent(ctx, ReminderReceiver::class.java).apply {
                action = ACTION_FIRE
                putExtra("reminder", r.toString())
            }
            val pi = PendingIntent.getBroadcast(
                ctx, code, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            val method = r.optString("method", "alarm")
            if (method == "alarm" && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                // 闹钟提醒：使用 setAlarmClock，系统保证按时唤醒并弹出全屏提醒，
                // 不依赖 SCHEDULE_EXACT_ALARM 权限，即便用户未授予通知权限也能正常响铃。
                val showIntent = Intent(ctx, AlarmAlertActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    putExtra("title", r.optString("title", "提醒"))
                    putExtra("desc", r.optString("desc", ""))
                    putExtra("method", "alarm")
                }
                val showPi = PendingIntent.getActivity(
                    ctx, (code + 700000) and 0x7FFFFFFF, showIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                am.setAlarmClock(AlarmManager.AlarmClockInfo(trigger, showPi), pi)
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !am.canScheduleExactAlarms()) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi)
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi)
            } else {
                am.set(AlarmManager.RTC_WAKEUP, trigger, pi)
            }
            Log.i(TAG, "已调度提醒 $id 方式=$method @ ${java.util.Date(trigger)}")
        } catch (e: Exception) {
            Log.e(TAG, "调度提醒 $id 失败: ${e.message}")
        }
    }

    /** 取消单个提醒的闹钟 */
    fun cancel(ctx: Context, id: Long) {
        try {
            val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val code = getCode(ctx, id)
            val intent = Intent(ctx, ReminderReceiver::class.java).apply { action = ACTION_FIRE }
            val pi = PendingIntent.getBroadcast(
                ctx, code, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            am.cancel(pi)
            forgetCode(ctx, id)
        } catch (e: Exception) {
            Log.e(TAG, "取消提醒 $id 失败: ${e.message}")
        }
    }

    /** 全量同步：根据 H5 传来的提醒数组，调度启用项、取消已删除/已关闭项 */
    fun syncAll(ctx: Context, json: String) {
        ensureChannels(ctx)
        saveReminders(ctx, json)
        try {
            val arr = JSONArray(json)
            val enabledIds = mutableSetOf<Long>()
            for (i in 0 until arr.length()) {
                val r = arr.getJSONObject(i)
                if (r.optBoolean("enabled", true)) {
                    enabledIds.add(r.optLong("id", 0))
                    schedule(ctx, r)
                } else {
                    cancel(ctx, r.optLong("id", 0))
                }
            }
            // 取消已不存在于列表中的旧闹钟
            val map = codeMap(ctx)
            val it = map.keys().iterator()
            while (it.hasNext()) {
                val idStr = it.next()
                val id = idStr.toLongOrNull() ?: continue
                if (!enabledIds.contains(id)) cancel(ctx, id)
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncAll 失败: ${e.message}")
        }
    }

    /** 设备重启/应用更新后，恢复所有启用的提醒调度 */
    fun restoreAll(ctx: Context) {
        ensureChannels(ctx)
        val arr = getReminders(ctx)
        for (i in 0 until arr.length()) {
            val r = arr.getJSONObject(i)
            if (r.optBoolean("enabled", true)) schedule(ctx, r)
        }
    }
}
