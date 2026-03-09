package com.kelmah.mobile.app.navigation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class KelmahDeepLinkResolverTest {
    @Test
    fun resolvesConversationFromQueryParameter() {
        val route = resolveKelmahDeepLink("https://kelmah-api-gateway-gf3g.onrender.com/messages?conversation=69aa0b13e0a41572beebe499")

        assertEquals("messages?conversationId=69aa0b13e0a41572beebe499", route)
    }

    @Test
    fun resolvesConversationFromPath() {
        val route = resolveKelmahDeepLink("https://kelmah-api-gateway-gf3g.onrender.com/messages/69aa0b13e0a41572beebe499")

        assertEquals("messages?conversationId=69aa0b13e0a41572beebe499", route)
    }

    @Test
    fun resolvesJobDetailFromPath() {
        val route = resolveKelmahDeepLink("https://kelmah-api-gateway-gf3g.onrender.com/jobs/69a73f7c2ea54264fff6275e")

        assertEquals("jobs/detail/69a73f7c2ea54264fff6275e", route)
    }

    @Test
    fun returnsNullForUnsupportedPath() {
        val route = resolveKelmahDeepLink("https://kelmah-api-gateway-gf3g.onrender.com/profile")

        assertNull(route)
    }
}