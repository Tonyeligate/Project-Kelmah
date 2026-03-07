package com.kelmah.mobile.features.notifications.presentation

import androidx.compose.runtime.Composable
import com.kelmah.mobile.core.design.components.FeaturePlaceholderScreen

@Composable
fun NotificationsScreen() {
    FeaturePlaceholderScreen(
        title = "Notifications",
        subtitle = "Prepared for professional push, in-app alerting, and service-state communication.",
        highlights = listOf(
            "Device token registration and push-channel routing.",
            "Critical system messages, job alerts, and conversation notifications.",
            "Safe degradation when notification permission is denied or background delivery is delayed.",
        ),
    )
}
