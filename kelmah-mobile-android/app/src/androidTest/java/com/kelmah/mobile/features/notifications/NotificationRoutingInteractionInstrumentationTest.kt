package com.kelmah.mobile.features.notifications

import androidx.compose.ui.test.assertHasNoClickAction
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.kelmah.mobile.features.notifications.data.NotificationItem
import com.kelmah.mobile.features.notifications.presentation.NotificationCard
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test

class NotificationRoutingInteractionInstrumentationTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun notificationCard_clickTriggersMarkReadAndOpenForValidTarget() {
        var markReadCount = 0
        var openCount = 0

        composeRule.setContent {
            NotificationCard(
                notification = NotificationItem(
                    id = "n-1",
                    type = "message_received",
                    title = "Open thread",
                    content = "You have a new message",
                    actionUrl = "/messages?conversation=69aa0b13e0a41572beebe499",
                    isRead = false,
                ),
                isMutating = false,
                onMarkRead = { markReadCount += 1 },
                onDelete = {},
                onOpen = { openCount += 1 },
            )
        }

        composeRule.onNodeWithText("Open thread").performClick()

        assertEquals(1, markReadCount)
        assertEquals(1, openCount)
    }

    @Test
    fun notificationCard_disablesTapWhenNoValidTarget() {
        composeRule.setContent {
            NotificationCard(
                notification = NotificationItem(
                    id = "n-2",
                    type = "message_received",
                    title = "Invalid target",
                    content = "Broken link",
                    actionUrl = "/messages?conversation=invalid",
                ),
                isMutating = false,
                onMarkRead = {},
                onDelete = {},
                onOpen = {},
            )
        }

        composeRule.onNodeWithText("Invalid target").assertHasNoClickAction()
    }
}
