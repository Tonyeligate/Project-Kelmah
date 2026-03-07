package com.kelmah.mobile.app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.WorkOutline
import androidx.compose.ui.graphics.vector.ImageVector

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
    }
}

val mainDestinations = listOf(
    KelmahDestination.Home,
    KelmahDestination.Jobs,
    KelmahDestination.Messages,
    KelmahDestination.Notifications,
    KelmahDestination.Profile,
)
