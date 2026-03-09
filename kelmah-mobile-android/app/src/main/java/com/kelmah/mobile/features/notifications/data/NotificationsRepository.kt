package com.kelmah.mobile.features.notifications.data

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.session.SessionCoordinator
import dagger.Lazy
import java.time.Instant
import java.time.OffsetDateTime
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import retrofit2.HttpException

@Singleton
class NotificationsRepository @Inject constructor(
    private val notificationsApiService: NotificationsApiService,
    private val sessionCoordinator: Lazy<SessionCoordinator>,
) {
    suspend fun getNotifications(
        unreadOnly: Boolean = false,
        limit: Int = 50,
    ): ApiResult<List<NotificationItem>> = executeAuthorized {
        val response = notificationsApiService.getNotifications(
            buildMap {
                put("limit", limit.toString())
                if (unreadOnly) {
                    put("unreadOnly", "true")
                }
            },
        )
        ApiResult.Success(parseNotifications(response))
    }

    suspend fun getUnreadCount(): ApiResult<Int> = executeAuthorized {
        val response = notificationsApiService.getUnreadCount()
        val unreadCount = response.int("unreadCount")
            ?: response.nestedObject("data")?.int("unreadCount")
            ?: 0
        ApiResult.Success(unreadCount)
    }

    suspend fun markAsRead(notificationId: String): ApiResult<Unit> = executeAuthorized {
        notificationsApiService.markAsRead(notificationId)
        ApiResult.Success(Unit)
    }

    suspend fun markAllAsRead(): ApiResult<Unit> = executeAuthorized {
        notificationsApiService.markAllAsRead()
        ApiResult.Success(Unit)
    }

    suspend fun deleteNotification(notificationId: String): ApiResult<Unit> = executeAuthorized {
        notificationsApiService.deleteNotification(notificationId)
        ApiResult.Success(Unit)
    }

    private suspend fun <T> executeAuthorized(block: suspend () -> ApiResult<T>): ApiResult<T> {
        return try {
            block()
        } catch (error: HttpException) {
            if (error.code() == 401 && sessionCoordinator.get().refreshSession()) {
                try {
                    block()
                } catch (retryError: Exception) {
                    ApiResult.Error(message = retryError.message ?: "Request failed after session refresh")
                }
            } else {
                ApiResult.Error(message = error.message ?: "Request failed", code = error.code())
            }
        } catch (error: Exception) {
            ApiResult.Error(message = error.message ?: "Request failed")
        }
    }

    private fun parseNotifications(response: JsonObject): List<NotificationItem> {
        val dataNode = response["data"]
        val values = when (dataNode) {
            is JsonArray -> dataNode
            is JsonObject -> dataNode.nestedArray("notifications") ?: JsonArray(emptyList())
            else -> response.nestedArray("notifications") ?: JsonArray(emptyList())
        }

        return sortNotificationsByCreatedAt(values.mapNotNull { item ->
            val obj = item as? JsonObject ?: return@mapNotNull null
            val id = obj.string("id") ?: obj.string("_id") ?: return@mapNotNull null
            val relatedEntity = obj.nestedObject("relatedEntity")
            NotificationItem(
                id = id,
                type = obj.string("type") ?: "system_alert",
                title = obj.string("title") ?: "Notification",
                content = obj.string("content") ?: "",
                actionUrl = obj.string("actionUrl") ?: obj.string("link"),
                priority = obj.string("priority") ?: "medium",
                isRead = obj.nestedObject("readStatus")?.bool("isRead") ?: obj.bool("read") ?: false,
                createdAt = obj.string("createdAt"),
                relatedEntityType = relatedEntity?.string("type"),
                relatedEntityId = relatedEntity?.string("id") ?: relatedEntity?.string("_id"),
            )
        })
    }
}

internal fun sortNotificationsByCreatedAt(items: List<NotificationItem>): List<NotificationItem> =
    items.withIndex()
        .sortedWith(
            compareByDescending<IndexedValue<NotificationItem>> { notificationTimestampMillis(it.value.createdAt) ?: Long.MIN_VALUE }
                .thenBy { it.index },
        )
        .map { it.value }

private fun notificationTimestampMillis(raw: String?): Long? {
    if (raw.isNullOrBlank()) {
        return null
    }

    return runCatching { Instant.parse(raw).toEpochMilli() }
        .recoverCatching { OffsetDateTime.parse(raw).toInstant().toEpochMilli() }
        .getOrNull()
}

private fun JsonObject.string(key: String): String? = (this[key] as? JsonPrimitive)?.contentOrNull()

private fun JsonObject.int(key: String): Int? = (this[key] as? JsonPrimitive)?.intOrNull()

private fun JsonObject.bool(key: String): Boolean? = (this[key] as? JsonPrimitive)?.booleanOrNull()

private fun JsonObject.nestedObject(key: String): JsonObject? = this[key] as? JsonObject

private fun JsonObject.nestedArray(key: String): JsonArray? = this[key] as? JsonArray

private fun JsonPrimitive.contentOrNull(): String? = if (this == JsonNull) null else content

private fun JsonPrimitive.intOrNull(): Int? = content.toIntOrNull()

private fun JsonPrimitive.booleanOrNull(): Boolean? = content.toBooleanStrictOrNull()
