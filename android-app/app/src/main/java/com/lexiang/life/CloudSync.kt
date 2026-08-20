package com.lexiang.life

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean

/**
 * 云端提醒同步层：在后台线程拉取登录用户的云端提醒，映射为原生可调度的结构，
 * 再交给 ReminderScheduler 统一调度到系统闹钟。
 *
 * 触发时机：
 *  - App 启动 / 回到前台（MainActivity.onCreate / onResume）
 *  - 设备重启（BootReceiver）
 *  - H5 登录成功后通过 NativeBridge.setCloudConfig 主动触发
 *
 * 设计要点：
 *  - 云端接口需鉴权（Authorization: Bearer <token>），server 与 token 由 H5 登录后下发并持久化。
 *  - 后端提醒 id 为字符串，而原生 ReminderScheduler 用 id 派生 AlarmManager 的 PendingIntent
 *    requestCode，字符串 id 无法稳定转为 long → 统一在此派生为稳定的 31 位正整数，避免多条提醒
 *    code 碰撞导致只有最后一条生效。
 *  - 注意：token 仅以明文存于 SharedPreferences（与现有 reminders 存储策略一致）；
 *    正式发布应使用 AndroidX Security 的 EncryptedSharedPreferences。
 */
object CloudSync {

    private const val TAG = "CloudSync"
    private const val PREFS = "life_cloud"
    private const val KEY_SERVER = "server"
    private const val KEY_TOKEN = "token"

    private val syncing = AtomicBoolean(false)

    private fun prefs(ctx: Context) =
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun getServer(ctx: Context): String = prefs(ctx).getString(KEY_SERVER, "") ?: ""

    fun getToken(ctx: Context): String = prefs(ctx).getString(KEY_TOKEN, "") ?: ""

    /** H5 登录成功或切换服务器时调用：保存云端配置 */
    fun setCloudConfig(ctx: Context, server: String, token: String) {
        prefs(ctx).edit().apply {
            putString(KEY_SERVER, server.trim())
            putString(KEY_TOKEN, token.trim())
            apply()
        }
        Log.i(TAG, "已保存云端配置: ${server.trim()}")
    }

    /** 退出登录时清空云端配置，原生回到纯本地调度（不受云端覆盖） */
    fun clearCloudConfig(ctx: Context) {
        prefs(ctx).edit().remove(KEY_SERVER).remove(KEY_TOKEN).apply()
        Log.i(TAG, "已清空云端配置")
    }

    fun isConfigured(ctx: Context): Boolean =
        getServer(ctx).isNotEmpty() && getToken(ctx).isNotEmpty()

    /**
     * 拉取云端提醒并同步到原生闹钟。可任意线程调用：网络与调度在后台线程完成。
     * 未配置云端账号时直接返回（不报错），不影响本地调度。
     */
    fun sync(ctx: Context) {
        if (!isConfigured(ctx)) {
            Log.d(TAG, "未配置云端账号，跳过同步")
            return
        }
        if (syncing.getAndSet(true)) {
            Log.d(TAG, "云端同步进行中，跳过重复触发")
            return
        }
        val server = getServer(ctx)
        val token = getToken(ctx)
        Thread {
            try {
                val arrJson = pullReminders(server, token)
                if (arrJson == null) {
                    Log.w(TAG, "云端拉取失败或无数据，保留本地调度")
                    return@Thread
                }
                val nativeJson = mapToNative(arrJson)
                ReminderScheduler.syncAll(ctx, nativeJson)
                Log.i(TAG, "云端提醒同步完成，共 ${countItems(nativeJson)} 条")
            } catch (e: Exception) {
                Log.e(TAG, "云端同步异常: ${e.message}")
            } finally {
                syncing.set(false)
            }
        }.start()
    }

    /** GET /api/reminders -> reminders 数组的 JSON 字符串；失败返回 null */
    private fun pullReminders(server: String, token: String): String? {
        val base = server.trimEnd('/')
        val url = URL("$base/api/reminders")
        var conn: HttpURLConnection? = null
        try {
            conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.setRequestProperty("Authorization", "Bearer $token")
            conn.setRequestProperty("Accept", "application/json")
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            val code = conn.responseCode
            if (code != HttpURLConnection.HTTP_OK) {
                Log.w(TAG, "云端返回 HTTP $code")
                return null
            }
            val body = conn.inputStream.bufferedReader().use { it.readText() }
            val obj = JSONObject(body)
            val arr = obj.optJSONArray("reminders") ?: JSONArray()
            return arr.toString()
        } catch (e: Exception) {
            Log.e(TAG, "拉取云端提醒失败: ${e.message}")
            return null
        } finally {
            conn?.disconnect()
        }
    }

    /** 将云端提醒数组映射为原生 ReminderScheduler 可消费的结构（字符串 id -> 稳定数字 id） */
    private fun mapToNative(arrJson: String): String {
        return try {
            val arr = JSONArray(arrJson)
            val out = JSONArray()
            for (i in 0 until arr.length()) {
                val r = arr.optJSONObject(i) ?: continue
                val o = JSONObject()
                o.put("id", stableId(r.optString("id", "")))
                o.put("title", r.optString("title", "提醒"))
                o.put("desc", r.optString("desc", ""))
                o.put("time", r.optString("time", "08:00"))
                o.put("date", r.optString("date", ""))
                o.put("repeat", r.optString("repeat", "仅一次"))
                o.put("method", r.optString("method", "alarm"))
                o.put("type", r.optString("type", "custom"))
                o.put("icon", r.optString("icon", "bell"))
                o.put("enabled", r.optBoolean("enabled", true))
                out.put(o)
            }
            out.toString()
        } catch (e: Exception) {
            Log.e(TAG, "映射云端提醒失败: ${e.message}")
            "[]"
        }
    }

    /**
     * 把云端字符串 id 派生为稳定的 31 位正整数，作为闹钟 requestCode 基础。
     * String.hashCode() 对同一字符串恒等；映射到 [0, 2^31) 落在 Int 正范围，
     * 可被 ReminderScheduler 的 (id and 0x7FFFFFFF) 安全转 Int。
     */
    private fun stableId(raw: String): Long {
        if (raw.isEmpty()) return System.currentTimeMillis() and 0x7FFFFFFF
        return (raw.hashCode().toLong() and 0x7FFFFFFF)
    }

    private fun countItems(arrJson: String): Int = try {
        JSONArray(arrJson).length()
    } catch (e: Exception) { 0 }
}
