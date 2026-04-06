package com.kelmah.mobile.features.notifications.presentation

import androidx.compose.material3.Surface
import androidx.compose.ui.test.assertCountEquals
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import com.kelmah.mobile.core.design.theme.KelmahTheme
import com.kelmah.mobile.features.notifications.data.NotificationItem
import java.time.LocalDate
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

class NotificationsGroupingUiInstrumentationTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun groupedNotifications_rendersSectionsBucketsAndActionButtons() {
        composeRule.setContent {
            KelmahTheme {
                Surface {
                    GroupedNotificationsList(
                        notifications = listOf(
                            NotificationItem(
                                id = "69f0aa11e0a41572beebe499",
                                type = "message_received",
                                title = "New chat message",
                                content = "Open chat with carpenter",
                                actionUrl = "/messages?conversation=69aa0b13e0a41572beebe499",
                                createdAt = "2026-04-04T08:15:00Z",
                                isRead = false,
                            ),
                            NotificationItem(
                                id = "69f0aa12e0a41572beebe499",
                                type = "job_offer",
                                title = "Urgent job offer",
                                content = "Client accepted your quote",
                                priority = "high",
                                createdAt = "2026-04-03T11:30:00Z",
                                isRead = false,
                            ),
                            NotificationItem(
                                id = "69f0aa13e0a41572beebe499",
                                type = "contract_update",
                                title = "Contract updated",
                                content = "Schedule changed",
                                createdAt = "2026-03-25T10:00:00Z",
                                isRead = true,
                            ),
                        ),
                        isMutating = false,
                        onMarkRead = {},
                        onDelete = {},
                        onOpen = {},
                        currentDateProvider = { LocalDate.of(2026, 4, 4) },
                    )
                }
            }
        }

        composeRule.onNodeWithText("Priority").assertIsDisplayed()
        composeRule.onNodeWithText("Messages").assertIsDisplayed()
        composeRule.onNodeWithText("General").assertIsDisplayed()

        composeRule.onNodeWithText("Today").assertIsDisplayed()
        composeRule.onNodeWithText("Yesterday").assertIsDisplayed()
        composeRule.onNodeWithText("Earlier").assertIsDisplayed()

        composeRule.onAllNodesWithText("Open conversation").assertCountEquals(1)
        composeRule.onAllNodesWithText("Mark as read").assertCountEquals(2)
    }

    @Test
    fun groupedNotifications_ordersBucketsTodayYesterdayEarlierWithinSection() {
        composeRule.setContent {
            KelmahTheme {
                Surface {
                    GroupedNotificationsList(
                        notifications = listOf(
                            NotificationItem(
                                id = "69f1aa11e0a41572beebe499",
                                type = "message_received",
                                title = "Today notification",
                                content = "Newest message",
                                actionUrl = "/messages?conversation=69aa0b13e0a41572beebe499",
                                createdAt = "2026-04-04T09:00:00Z",
                                isRead = false,
                            ),
                            NotificationItem(
                                id = "69f1aa12e0a41572beebe499",
                                type = "message_received",
                                title = "Yesterday notification",
                                content = "Earlier message",
                                actionUrl = "/messages?conversation=69aa0b13e0a41572beebe499",
                                createdAt = "2026-04-03T09:00:00Z",
                                isRead = false,
                            ),
                            NotificationItem(
                                id = "69f1aa13e0a41572beebe499",
                                type = "message_received",
                                title = "Earlier notification",
                                content = "Older message",
                                actionUrl = "/messages?conversation=69aa0b13e0a41572beebe499",
                                createdAt = "2026-03-28T09:00:00Z",
                                isRead = false,
                            ),
                        ),
                        isMutating = false,
                        onMarkRead = {},
                        onDelete = {},
                        onOpen = {},
                        currentDateProvider = { LocalDate.of(2026, 4, 4) },
                    )
                }
            }
        }

        val todayTop = composeRule.onNodeWithText("Today").fetchSemanticsNode().boundsInRoot.top
        val yesterdayTop = composeRule.onNodeWithText("Yesterday").fetchSemanticsNode().boundsInRoot.top
        val earlierTop = composeRule.onNodeWithText("Earlier").fetchSemanticsNode().boundsInRoot.top

        assertTrue("Expected Today before Yesterday", todayTop < yesterdayTop)
        assertTrue("Expected Yesterday before Earlier", yesterdayTop < earlierTop)
    }
}
