package com.lexiang.life

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * 设备重启 / 应用更新后，恢复所有启用的提醒调度。
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(ctx: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == Intent.ACTION_BOOT_COMPLETED
        ) {
            Log.i(TAG, "设备重启/更新，恢复提醒调度")
            ReminderScheduler.restoreAll(ctx)
            // 已登录用户：重启后从云端拉取最新提醒并重新调度（云端为准）
            CloudSync.sync(ctx)
        }
    }
}
