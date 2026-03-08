package com.kelmah.mobile.app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.WorkOutline
import androidx.compose.ui.graphics.vector.ImageVector
import com.kelmah.mobile.core.session.KelmahUserRole

data class KelmahNavItem(
    val destination: KelmahDestination,
    val label: String,
)

sealed class KelmahDestination(
    val route: String,
    val label: String,
    val icon: ImageVector,
) {
    data object Home : KelmahDestination("home", "Home", Icons.Outlined.Home)
    data object Jobs : KelmahDestination("jobs", "Jobs", Icons.Outlined.WorkOutline)
    data object JobDetail : KelmahDestination("jobs/detail/{jobId}", "Job Detail", Icons.Outlined.WorkOutline)
    data object JobApply : KelmahDestination("jobs/apply/{jobId}", "Apply", Icons.Outlined.WorkOutline)
    data object Messages : KelmahDestination("messages", "Messages", Icons.Outlined.MailOutline)
    data object Notifications : KelmahDestination("notifications", "Alerts", Icons.Outlined.NotificationsNone)
    data object Profile : KelmahDestination("profile", "Profile", Icons.Outlined.PersonOutline)

    companion object {
        fun jobDetail(jobId: String): String = "jobs/detail/$jobId"
        fun jobApply(jobId: String): String = "jobs/apply/$jobId"
        fun messages(conversationId: String? = null): String =
            if (conversationId.isNullOrBlank()) Messages.route else "${Messages.route}?conversationId=$conversationId"
    }
}

fun mainDestinations(role: KelmahUserRole): List<KelmahNavItem> = listOf(
    KelmahNavItem(KelmahDestination.Home, if (role == KelmahUserRole.HIRER) "Dashboard" else KelmahDestination.Home.label),
    KelmahNavItem(KelmahDestination.Jobs, if (role == KelmahUserRole.HIRER) "Hiring" else KelmahDestination.Jobs.label),
    KelmahNavItem(KelmahDestination.Messages, KelmahDestination.Messages.label),
    KelmahNavItem(KelmahDestination.Notifications, KelmahDestination.Notifications.label),
    KelmahNavItem(KelmahDestination.Profile, KelmahDestination.Profile.label),
)
