package com.lexiang.life

import android.util.Log
import com.google.gson.Gson
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

/**
 * AI Service - communicates with the Node.js backend
 * Falls back to local intent matching when server is unavailable
 */
object AIService {

    private const val TAG = "AIService"
    private var serverUrl: String = ""  // Set to your backend URL

    private val gson = Gson()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    data class ChatResponse(
        val reply: String,
        val cards: List<Any>? = null,
        val actions: List<String>? = null,
        val orderId: String? = null,
        val sessionId: String? = null,
        val needConfirm: Boolean = false,
        val confirmType: String? = null
    )

    fun setServerUrl(url: String) {
        serverUrl = url.trimEnd('/')
    }

    suspend fun chat(message: String, sessionId: String): ChatResponse {
        if (serverUrl.isEmpty()) {
            return localResponse(message)
        }

        return try {
            val jsonBody = JSONObject().apply {
                put("message", message)
                put("sessionId", sessionId)
            }.toString()

            val request = Request.Builder()
                .url("$serverUrl/api/ai/chat")
                .post(jsonBody.toRequestBody(JSON))
                .header("Content-Type", "application/json")
                .build()

            val response = LexiangApp.httpClient.newCall(request).execute()
            val body = response.body?.string() ?: ""

            if (response.isSuccessful) {
                val json = JSONObject(body)
                val data = json.optJSONObject("data")
                if (data != null) {
                    ChatResponse(
                        reply = data.optString("reply"),
                        cards = null, // parse cards if needed
                        actions = data.optJSONArray("actions")?.let { arr ->
                            List(arr.length()) { arr.getString(it) }
                        },
                        orderId = data.optString("orderId", null),
                        sessionId = data.optString("sessionId", sessionId),
                        needConfirm = data.optBoolean("needConfirm"),
                        confirmType = data.optString("confirmType", null)
                    )
                } else {
                    ChatResponse(reply = "抱歉，我遇到了一些问题，请稍后再试。")
                }
            } else {
                localResponse(message)
            }
        } catch (e: Exception) {
            Log.e(TAG, "AI chat error", e)
            localResponse(message)
        }
    }

    // Local fallback - same intent matching as the web version
    private fun localResponse(message: String): ChatResponse {
        val msg = message.trim()

        return when {
            msg.contains("外卖") || msg.contains("点餐") || msg.contains("饿了") -> ChatResponse(
                reply = "好的，我来帮您找找附近有什么好吃的！\n\n根据您的位置，为您推荐以下美食外卖商家：\n\n1. 蜀香源火锅 - 评分4.8，距您800m\n2. 鲜芋仙甜品店 - 评分4.6，距您1.2km\n3. 老王烧烤城 - 评分4.7，距您1.5km\n\n您想选哪家？或者告诉我您想吃什么类型的美食？",
                actions = listOf("选第一家", "换一批", "我想吃火锅")
            )
            msg.contains("酒店") || msg.contains("住宿") || msg.contains("宾馆") -> ChatResponse(
                reply = "我来帮您查找附近酒店！\n\n为您推荐：\n\n1. 深圳湾万豪酒店 - 5星级，¥688起\n2. 南山希尔顿酒店 - 4星级，¥458起\n3. 全季酒店科技园店 - 商务型，¥298起\n\n您偏好什么价位或区域？",
                actions = listOf("选第一家", "更便宜的", "看详细")
            )
            msg.contains("行程") || msg.contains("规划") || msg.contains("旅游") -> ChatResponse(
                reply = "好的！我来为您规划一日游行程：\n\n9:00-11:00 欢乐谷主题乐园\n   体验刺激的过山车和大摆锤\n\n11:30-13:00 午餐 - 蜀香源火锅\n   人均¥88，距乐园800米\n\n14:00-16:00 足道养生馆\n   90分钟全身按摩，¥168\n\n17:00-19:00 深圳湾公园\n   海边漫步，看日落\n\n20:00-22:00 K歌之王KTV\n   豪华包厢，欢唱2小时\n\n这个行程您觉得怎么样？需要调整吗？",
                actions = listOf("确认行程", "换一个", "加个景点")
            )
            msg.contains("火车") || msg.contains("高铁") -> ChatResponse(
                reply = "帮您查询火车票！\n\n请告诉我：\n- 出发地\n- 目的地\n- 出发日期\n- 几个人\n\n我会帮您查找合适的车次。",
                actions = listOf("深圳到北京", "广州到上海", "明天出发")
            )
            msg.contains("飞机") || msg.contains("机票") -> ChatResponse(
                reply = "帮您查询机票！\n\n请告诉我：\n- 出发城市\n- 到达城市\n- 出发日期\n- 乘客人数\n\n我会帮您找到最便宜的航班。",
                actions = listOf("深圳飞北京", "广州飞上海", "下周出发")
            )
            msg.contains("电影") -> ChatResponse(
                reply = "正在上映热门影片：\n\n1. 流浪地球3 - 科幻/IMAX - ¥45\n2. 满江红2 - 剧情 - ¥38\n3. 热辣滚烫 - 喜剧 - ¥42\n\n您想看哪部？需要选哪个影院？",
                actions = listOf("看流浪地球3", "选最近影院", "看今晚的")
            )
            msg.contains("K") || msg.contains("KTV") || msg.contains("唱歌") -> ChatResponse(
                reply = "帮您预订KTV包厢！\n\n附近推荐：\n\n1. K歌之王(南山店) - 豪华中包 ¥298/2h\n2. 麦乐迪KTV - 标准包厢 ¥158/2h\n3. 钱柜KTV(海岸城) - VIP大包 ¥388/3h\n\n您需要什么规格的包厢？大概几个人？",
                actions = listOf("订K歌之王", "便宜点的", "大包厢")
            )
            else -> ChatResponse(
                reply = "您好！我是小秘，您的智能生活管家～\n\n我可以帮您：\n- 点外卖、订餐厅\n- 预订酒店\n- 购买火车票/飞机票\n- 规划出行行程\n- 买电影票\n- 预订KTV包厢\n\n请告诉我您需要什么帮助？"
            )
        }
    }
}
