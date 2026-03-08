package com.kelmah.mobile.features.notifications.data

import kotlinx.serialization.json.JsonObject
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.Path
import retrofit2.http.QueryMap

interface NotificationsApiService {
    @GET("notifications")
    suspend fun getNotifications(@QueryMap query: Map<String, String>): JsonObject

    @GET("notifications/unread/count")
    suspend fun getUnreadCount(): JsonObject

    @PATCH("notifications/{notificationId}/read")
    suspend fun markAsRead(@Path("notificationId") notificationId: String): JsonObject

    @PATCH("notifications/read/all")
    suspend fun markAllAsRead(): JsonObject

    @DELETE("notifications/{notificationId}")
    suspend fun deleteNotification(@Path("notificationId") notificationId: String): JsonObject
}
