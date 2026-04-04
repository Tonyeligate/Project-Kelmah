package com.kelmah.mobile.features.notifications.data

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
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
            NotificationItem(id = "invalid", type = "system_alert", title = "Invalid", content = "", createdAt = "not-a-date", updatedAt = "2026-03-09T09:15:00Z"),
        )

        val sorted = sortNotificationsByCreatedAt(notifications)

        assertEquals(listOf("dated", "invalid", "undated"), sorted.map { it.id })
    }

    @Test
    fun actionTarget_parsesConversationIdFromPath() {
        val notification = NotificationItem(
            id = "notification-1",
            type = "message_received",
            title = "Message",
            content = "",
            actionUrl = "https://kelmah.example/messages/69aa0b13e0a41572beebe499",
        )

        val target = notification.actionTarget

        assertTrue(target is NotificationActionTarget.Conversation)
        assertEquals("69aa0b13e0a41572beebe499", (target as NotificationActionTarget.Conversation).conversationId)
    }

    @Test
    fun actionTarget_parsesConversationIdFromKelmahSchemePath() {
        val notification = NotificationItem(
            id = "notification-2",
            type = "message_received",
            title = "Message",
            content = "",
            actionUrl = "kelmah://messages/69aa0b13e0a41572beebe499",
        )

        val target = notification.actionTarget

        assertTrue(target is NotificationActionTarget.Conversation)
        assertEquals("69aa0b13e0a41572beebe499", (target as NotificationActionTarget.Conversation).conversationId)
    }

    @Test
    fun actionTarget_returnsNullForInvalidIdInPath() {
        val notification = NotificationItem(
            id = "notification-3",
            type = "job_offer",
            title = "Job",
            content = "",
            actionUrl = "/jobs/not-valid-id",
        )

        assertNull(notification.actionTarget)
    }

    @Test
    fun actionTarget_returnsNullForInvalidRelatedEntityId() {
        val notification = NotificationItem(
            id = "notification-4",
            type = "job_offer",
            title = "Job",
            content = "",
            relatedEntityType = "job",
            relatedEntityId = "bad-id",
        )

        assertNull(notification.actionTarget)
    }
}