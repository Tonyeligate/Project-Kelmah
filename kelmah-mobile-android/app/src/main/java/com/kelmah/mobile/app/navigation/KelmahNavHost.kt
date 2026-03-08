package com.kelmah.mobile.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.kelmah.mobile.core.session.kelmahUserRole
import com.kelmah.mobile.core.storage.SessionUser
import com.kelmah.mobile.features.home.presentation.HomeScreen
import com.kelmah.mobile.features.jobs.presentation.JobApplicationScreen
import com.kelmah.mobile.features.jobs.presentation.JobDetailScreen
import com.kelmah.mobile.features.jobs.presentation.JobsScreen
import com.kelmah.mobile.features.messaging.presentation.MessagesViewModel
import com.kelmah.mobile.features.messaging.presentation.MessagesScreen
import com.kelmah.mobile.features.notifications.data.NotificationActionTarget
import com.kelmah.mobile.features.notifications.data.actionTarget
import com.kelmah.mobile.features.notifications.presentation.NotificationsViewModel
import com.kelmah.mobile.features.notifications.presentation.NotificationsScreen
import com.kelmah.mobile.features.profile.presentation.ProfileScreen

@Composable
fun KelmahNavHost(
    navController: NavHostController,
    currentUser: SessionUser?,
    onLogout: (Boolean) -> Unit,
    messagesViewModel: MessagesViewModel,
    notificationsViewModel: NotificationsViewModel,
) {
    val currentRole = currentUser.kelmahUserRole

    NavHost(
        navController = navController,
        startDestination = KelmahDestination.Home.route,
    ) {
        composable(KelmahDestination.Home.route) {
            HomeScreen(
                currentUser = currentUser,
                onBrowseJobs = { navController.navigate(KelmahDestination.Jobs.route) },
            )
        }
        composable(KelmahDestination.Jobs.route) {
            JobsScreen(
                userRole = currentRole,
                onOpenJob = { jobId -> navController.navigate(KelmahDestination.jobDetail(jobId)) },
                onApplyToJob = { jobId -> navController.navigate(KelmahDestination.jobApply(jobId)) },
            )
        }
        composable(
            route = KelmahDestination.JobDetail.route,
            arguments = listOf(navArgument("jobId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId").orEmpty()
            JobDetailScreen(
                jobId = jobId,
                userRole = currentRole,
                onBack = { navController.popBackStack() },
                onApply = { selectedJobId -> navController.navigate(KelmahDestination.jobApply(selectedJobId)) },
            )
        }
        composable(
            route = KelmahDestination.JobApply.route,
            arguments = listOf(navArgument("jobId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val jobId = backStackEntry.arguments?.getString("jobId").orEmpty()
            JobApplicationScreen(
                jobId = jobId,
                userRole = currentRole,
                onBack = { navController.popBackStack() },
                onSubmitted = {
                    navController.popBackStack()
                    navController.popBackStack()
                },
            )
        }
        composable(
            route = "${KelmahDestination.Messages.route}?conversationId={conversationId}",
            arguments = listOf(navArgument("conversationId") { type = NavType.StringType; nullable = true; defaultValue = null }),
        ) { backStackEntry ->
            MessagesScreen(
                initialConversationId = backStackEntry.arguments?.getString("conversationId"),
                viewModel = messagesViewModel,
            )
        }
        composable(KelmahDestination.Notifications.route) {
            NotificationsScreen(
                viewModel = notificationsViewModel,
                onOpenNotification = { notification ->
                    when (val target = notification.actionTarget) {
                        is NotificationActionTarget.Conversation -> navController.navigate(KelmahDestination.messages(target.conversationId))
                        is NotificationActionTarget.Job -> navController.navigate(KelmahDestination.jobDetail(target.jobId))
                        null -> Unit
                    }
                },
            )
        }
        composable(KelmahDestination.Profile.route) {
            ProfileScreen(
                onLogout = { onLogout(false) },
                onLogoutAll = { onLogout(true) },
            )
        }
    }
}
