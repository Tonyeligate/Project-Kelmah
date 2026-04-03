package com.kelmah.mobile.features.notifications

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.kelmah.mobile.features.notifications.data.NotificationActionTarget
import com.kelmah.mobile.features.notifications.data.NotificationItem
import com.kelmah.mobile.features.notifications.data.actionLabel
import com.kelmah.mobile.features.notifications.data.actionTarget
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NotificationsCriticalPathInstrumentationTest {

    @Test
    fun notificationActionTarget_mapsConversationAndJobTargets() {
        val conversationNotification = NotificationItem(
            id = "n1",
            type = "message_received",
            title = "Message",
            content = "New message",
            actionUrl = "/messages?conversation=69aa0b13e0a41572beebe499",
        )
        val jobNotification = NotificationItem(
            id = "n2",
            type = "job_offer",
            title = "Job",
            content = "Open job",
            actionUrl = "/jobs/69a73f7c2ea54264fff6275e",
        )

        assertTrue(conversationNotification.actionTarget is NotificationActionTarget.Conversation)
        assertTrue(jobNotification.actionTarget is NotificationActionTarget.Job)
    }

    @Test
    fun notificationActionLabel_showsActionForConversationTargets() {
        val notification = NotificationItem(
            id = "n3",
            type = "message_received",
            title = "Message",
            content = "New message",
            relatedEntityType = "message",
            relatedEntityId = "69aa0b13e0a41572beebe499",
        )

        assertEquals("Open conversation", notification.actionLabel)
    }
}
