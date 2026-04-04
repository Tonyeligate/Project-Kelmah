package com.kelmah.mobile.app.navigation

import androidx.compose.ui.test.junit4.createComposeRule
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Rule
import org.junit.Test

class DeepLinkEntryInstrumentationTest {
    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun pendingDeepLinkEffect_navigatesAndConsumesResolvableLink() {
        val deepLinkUrl = "https://kelmah-api-gateway-gf3g.onrender.com/messages?conversation=69aa0b13e0a41572beebe499"
        var navigatedRoute: String? = null
        var consumedDeepLink: String? = null

        composeRule.setContent {
            PendingDeepLinkEffect(
                currentUserId = "worker-1",
                pendingDeepLinkUrl = deepLinkUrl,
                onNavigate = { route -> navigatedRoute = route },
                onDeepLinkConsumed = { consumed -> consumedDeepLink = consumed },
            )
        }

        composeRule.waitForIdle()

        assertEquals("messages?conversationId=69aa0b13e0a41572beebe499", navigatedRoute)
        assertEquals(deepLinkUrl, consumedDeepLink)
    }

    @Test
    fun pendingDeepLinkEffect_keepsInvalidLinkPending() {
        var navigatedRoute: String? = null
        var consumedDeepLink: String? = null

        composeRule.setContent {
            PendingDeepLinkEffect(
                currentUserId = "worker-1",
                pendingDeepLinkUrl = "https://kelmah-api-gateway-gf3g.onrender.com/messages?conversation=invalid",
                onNavigate = { route -> navigatedRoute = route },
                onDeepLinkConsumed = { consumed -> consumedDeepLink = consumed },
            )
        }

        composeRule.waitForIdle()

        assertNull(navigatedRoute)
        assertNull(consumedDeepLink)
    }
}
