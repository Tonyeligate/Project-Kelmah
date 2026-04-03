package com.kelmah.mobile.features.messaging

import androidx.test.ext.junit.runners.AndroidJUnit4
import com.kelmah.mobile.app.navigation.resolveKelmahDeepLink
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class MessagingCriticalPathInstrumentationTest {

    @Test
    fun deepLinkResolver_mapsConversationQueryToMessagesRoute() {
        val route = resolveKelmahDeepLink("https://kelmah-api-gateway-gf3g.onrender.com/messages?conversation=69aa0b13e0a41572beebe499")

        assertEquals("messages?conversationId=69aa0b13e0a41572beebe499", route)
    }

    @Test
    fun deepLinkResolver_rejectsUnsupportedMessagingScheme() {
        val route = resolveKelmahDeepLink("ftp://kelmah/messages/69aa0b13e0a41572beebe499")

        assertNull(route)
    }
}
