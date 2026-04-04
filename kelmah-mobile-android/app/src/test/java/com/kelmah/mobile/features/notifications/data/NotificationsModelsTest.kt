package com.kelmah.mobile.features.notifications.data

import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NotificationsModelsTest {
    @Test
    fun actionTarget_rejectsInvalidConversationQueryId() {
        val notification = NotificationItem(
            id = "n-1",
            type = "message_received",
            title = "Message",
            content = "New message",
            actionUrl = "/messages?conversation=invalid-id",
        )

        assertNull(notification.actionTarget)
    }

    @Test
    fun actionTarget_rejectsInvalidJobPathId() {
        val notification = NotificationItem(
            id = "n-2",
            type = "job_offer",
            title = "Job",
            content = "Open job",
            actionUrl = "/jobs/not-an-object-id",
        )

        assertNull(notification.actionTarget)
    }

    @Test
    fun actionTarget_acceptsValidConversationFromPath() {
        val notification = NotificationItem(
            id = "n-3",
            type = "message_received",
            title = "Message",
            content = "Open chat",
            actionUrl = "/messages/69aa0b13e0a41572beebe499",
        )

        assertTrue(notification.actionTarget is NotificationActionTarget.Conversation)
    }
}
