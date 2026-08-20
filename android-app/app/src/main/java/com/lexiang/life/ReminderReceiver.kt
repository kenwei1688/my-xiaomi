package com.lexiang.life

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.telephony.SmsManager
import android.util.Log
import androidx.core.app.NotificationCompat
import org.json.JSONObject

/**
 * 提醒触发广播：在 AlarmManager 到点时由系统广播给本接收器。
 * 根据提醒方式执行：闹钟（响铃+震动+全屏）、短信（发送短信）、微信（高优先通知+打开微信）。
 */
class ReminderReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "ReminderReceiver"
    }

    override fun onReceive(ctx: Context, intent: Intent) {
        val json = intent.getStringExtra("reminder") ?: return
        val r = try {
            JSONObject(json)
        } catch (e: Exception) {
            Log.e(TAG, "提醒数据解析失败: ${e.message}")
            return
        }
        ReminderScheduler.ensureChannels(ctx)
        val method = r.optString("method", "alarm")
        Log.i(TAG, "提醒触发：${r.optString("title")} 方式=$method")

        when (method) {
            "sms" -> fireSms(ctx, r)
            "wechat" -> fireWechat(ctx, r)
            else -> fireAlarm(ctx, r)
        }

        // 重复类提醒触发后自动排到下一次
        if (!ReminderScheduler.isOneShot(r)) {
            val next = ReminderScheduler.computeNextTrigger(r, forwardOnly = true)
            if (next > 0) {
                r.put("__next", next)
                ReminderScheduler.schedule(ctx, r)
            }
        }
    }

    /** 闹钟提醒：响铃 + 震动 + 锁屏全屏弹窗。全屏弹窗由 setAlarmClock 的 showIntent 负责，
     *  这里仅再补一条通知栏通知（即便通知权限关闭，全屏弹窗仍会显示）。 */
    private fun fireAlarm(ctx: Context, r: JSONObject) {
        val title = r.optString("title", "提醒")
        val desc = r.optString("desc", "")
        val tapIntent = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val tapPi = PendingIntent.getActivity(
            ctx, (r.optLong("id", 0) and 0x7FFFFFFF).toInt() + 800000,
            tapIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notif = NotificationCompat.Builder(ctx, "reminder_alarm")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("⏰ $title")
            .setContentText(desc)
            .setStyle(NotificationCompat.BigTextStyle().bigText(desc))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM))
            .setVibrate(longArrayOf(0, 500, 250, 500, 250, 500))
            .setAutoCancel(true)
            .setContentIntent(tapPi)
            .build()

        post(ctx, (r.optLong("id", 0) and 0x7FFFFFFF).toInt() + 100000, notif)
    }

    /** 短信提醒：通过 SmsManager 发送到设置中的手机号（无法发送时回退为通知） */
    private fun fireSms(ctx: Context, r: JSONObject) {
        val settings = ReminderScheduler.getSettings(ctx)
        val phone = settings.optString("smsPhone", "").trim()
        val title = r.optString("title", "提醒")
        val desc = r.optString("desc", "")
        val body = "【生活小秘】$title：$desc"

        val canSms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            ctx.checkSelfPermission(android.Manifest.permission.SEND_SMS) ==
                android.content.pm.PackageManager.PERMISSION_GRANTED
        } else true

        if (phone.isNotEmpty() && canSms) {
            try {
                val sm = SmsManager.getDefault()
                val parts = sm.divideMessage(body)
                sm.sendMultipartTextMessage(phone, null, parts, null, null)
                Log.i(TAG, "已发送短信提醒至 $phone")
            } catch (e: Exception) {
                Log.e(TAG, "发送短信失败: ${e.message}")
            }
        } else {
            Log.w(TAG, "未配置短信手机号或无权限，回退为通知")
        }
        // 无论是否发出短信，都留存一条 App 内通知，确保用户可见
        val tapIntent = Intent(ctx, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val tapPi = PendingIntent.getActivity(
            ctx, (r.optLong("id", 0) and 0x7FFFFFFF).toInt() + 900000,
            tapIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notif = NotificationCompat.Builder(ctx, "reminder_normal")
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setContentTitle("💬 短信提醒：$title")
            .setContentText(if (phone.isNotEmpty()) "已发送短信至 $phone" else "未设置接收手机号，无法发送短信")
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setContentIntent(tapPi)
            .build()
        post(ctx, (r.optLong("id", 0) and 0x7FFFFFFF).toInt() + 200000, notif)
    }

    /** 微信提醒：微信没有开放自动发消息的接口，故以高优先通知提醒，并提供"打开微信"直达 */
    private fun fireWechat(ctx: Context, r: JSONObject) {
        val title = r.optString("title", "提醒")
        val desc = r.optString("desc", "")
        val body = "$title：$desc"

        val wechatIntent = ctx.packageManager.getLaunchIntentForPackage("com.tencent.mm")
        val openPi = if (wechatIntent != null) {
            wechatIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            PendingIntent.getActivity(
                ctx, (r.optLong("id", 0) and 0x7FFFFFFF).toInt() + 950000,
                wechatIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else null

        val builder = NotificationCompat.Builder(ctx, "reminder_normal")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("💚 微信提醒：$title")
            .setContentText("微信暂不支持自动发送消息，请打开微信自行提醒～")
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
        if (openPi != null) {
            builder.addAction(android.R.drawable.ic_menu_send, "打开微信", openPi)
            builder.setContentIntent(openPi)
        }
        post(ctx, (r.optLong("id", 0) and 0x7FFFFFFF).toInt() + 300000, builder.build())
    }

    private fun post(ctx: Context, id: Int, notif: Notification) {
        val mgr = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        mgr.notify(id, notif)
    }
}
