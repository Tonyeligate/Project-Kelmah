package com.kelmah.mobile.features.notifications.data

import org.junit.Assert.assertEquals
import org.junit.Test

class NotificationsRepositoryTest {
    @Test
    fun sortNotificationsByCreatedAt_ordersNewestFirst() {
        val notifications = listOf(
            NotificationItem(id = "older", type = "system_alert", title = "Older", content = "", createdAt = "2026-03-09T09:15:00Z"),
            NotificationItem(id = "newest", type = "system_alert", title = "Newest", content = "", createdAt = "2026-03-09T11:15:00Z"),
            NotificationItem(id = "middle", type = "system_alert", title = "Middle", content = "", createdAt = "2026-03-09T10:15:00Z"),
        )

        val sorted = sortNotificationsByCreatedAt(notifications)

        assertEquals(listOf("newest", "middle", "older"), sorted.map { it.id })
    }

    @Test
    fun sortNotificationsByCreatedAt_placesUndatedItemsLast() {
        val notifications = listOf(
            NotificationItem(id = "undated", type = "system_alert", title = "Undated", content = "", createdAt = null),
            NotificationItem(id = "dated", type = "system_alert", title = "Dated", content = "", createdAt = "2026-03-09T10:15:00Z"),
            NotificationItem(id = "invalid", type = "system_alert", title = "Invalid", content = "", createdAt = "not-a-date"),
        )

        val sorted = sortNotificationsByCreatedAt(notifications)

        assertEquals(listOf("dated", "undated", "invalid"), sorted.map { it.id })
    }
}