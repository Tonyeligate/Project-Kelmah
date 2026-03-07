package com.kelmah.mobile.features.messaging.presentation

import androidx.compose.runtime.Composable
import com.kelmah.mobile.core.design.components.FeaturePlaceholderScreen

@Composable
fun MessagesScreen() {
    FeaturePlaceholderScreen(
        title = "Messaging",
        subtitle = "Realtime conversation architecture prepared for Socket.IO, unread counts, attachment workflows, and delivery states.",
        highlights = listOf(
            "Conversation caching for fast thread open on low-connectivity devices.",
            "Prepared for read receipts, offline retry, and background notification deep links.",
            "Designed to keep messaging responsive under heavy national concurrency.",
        ),
    )
}
