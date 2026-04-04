package com.kelmah.mobile.app.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.NavType
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.kelmah.mobile.core.session.kelmahUserRole
import com.kelmah.mobile.core.storage.SessionUser
import com.kelmah.mobile.features.home.presentation.HomeScreen
import com.kelmah.mobile.features.jobs.presentation.JobsViewModel
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

private val NAVIGATION_OBJECT_ID_REGEX = Regex("^[0-9a-fA-F]{24}$")

private fun isValidNavigationEntityId(value: String): Boolean = NAVIGATION_OBJECT_ID_REGEX.matches(value)

@Composable
fun KelmahNavHost(
    navController: NavHostController,
    currentUser: SessionUser?,
    pendingDeepLinkUrl: String?,
    onDeepLinkConsumed: (String) -> Unit,
    onLogout: (Boolean) -> Unit,
    jobsViewModel: JobsViewModel,
    messagesViewModel: MessagesViewModel,
    notificationsViewModel: NotificationsViewModel,
) {
    val currentRole = currentUser.kelmahUserRole

    PendingDeepLinkEffect(
        currentUserId = currentUser?.resolvedId,
        pendingDeepLinkUrl = pendingDeepLinkUrl,
        onNavigate = { route ->
            navController.navigate(route) {
                launchSingleTop = true
            }
        },
        onDeepLinkConsumed = onDeepLinkConsumed,
    )

    NavHost(
        navController = navController,
        startDestination = KelmahDestination.Home.route,
    ) {
        composable(KelmahDestination.Home.route) {
            HomeScreen(
                currentUser = currentUser,
                jobsViewModel = jobsViewModel,
                messagesViewModel = messagesViewModel,
                notificationsViewModel = notificationsViewModel,
                onBrowseJobs = { navController.navigate(KelmahDestination.Jobs.route) },
                onOpenMessages = { navController.navigate(KelmahDestination.Messages.route) },
                onOpenNotifications = { navController.navigate(KelmahDestination.Notifications.route) },
                onOpenJob = { jobId -> navController.navigate(KelmahDestination.jobDetail(jobId)) },
                onOpenConversation = { conversationId -> navController.navigate(KelmahDestination.messages(conversationId)) },
                onOpenNotification = { notification ->
                    navigateToNotificationTarget(navController, notification.actionTarget)
                },
            )
        }
        composable(KelmahDestination.Jobs.route) {
            JobsScreen(
                userRole = currentRole,
                onOpenJob = { jobId -> navController.navigate(KelmahDestination.jobDetail(jobId)) },
                onApplyToJob = { jobId -> navController.navigate(KelmahDestination.jobApply(jobId)) },
                viewModel = jobsViewModel,
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
                onMessageHirer = { selectedJobId, hirerId ->
                    if (hirerId.isNullOrBlank()) return@JobDetailScreen
                    val conversationId = messagesViewModel.createConversation(hirerId, selectedJobId) ?: return@JobDetailScreen
                    navController.navigate(KelmahDestination.messages(conversationId))
                },
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
                    // Pop back to the Jobs list instead of double-popBackStack
                    // which is fragile if navigated via deep link
                    navController.popBackStack(KelmahDestination.Jobs.route, inclusive = false)
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
                    navigateToNotificationTarget(navController, notification.actionTarget)
                },
            )
        }
        composable(KelmahDestination.Profile.route) {
            ProfileScreen(
                onLogout = { onLogout(false) },
                onLogoutAll = { onLogout(true) },
                onHireNow = { navController.navigate(KelmahDestination.Jobs.route) },
                onMessageWorker = { navController.navigate(KelmahDestination.Messages.route) },
            )
        }
    }
}

@Composable
internal fun PendingDeepLinkEffect(
    currentUserId: String?,
    pendingDeepLinkUrl: String?,
    onNavigate: (String) -> Unit,
    onDeepLinkConsumed: (String) -> Unit,
) {
    LaunchedEffect(currentUserId, pendingDeepLinkUrl) {
        if (currentUserId.isNullOrBlank() || pendingDeepLinkUrl.isNullOrBlank()) return@LaunchedEffect

        val route = resolveKelmahDeepLink(pendingDeepLinkUrl)
        if (route != null) {
            onNavigate(route)
            onDeepLinkConsumed(pendingDeepLinkUrl)
        }
        // Do not consume unresolvable deep links -- leave them pending for retry
    }
}

private fun navigateToNotificationTarget(
    navController: NavHostController,
    target: NotificationActionTarget?,
) {
    when (target) {
        is NotificationActionTarget.Conversation -> {
            if (isValidNavigationEntityId(target.conversationId)) {
                navController.navigate(KelmahDestination.messages(target.conversationId)) {
                    launchSingleTop = true
                }
            } else {
                navController.navigate(KelmahDestination.Notifications.route) {
                    launchSingleTop = true
                }
            }
        }
        is NotificationActionTarget.Job -> {
            if (isValidNavigationEntityId(target.jobId)) {
                navController.navigate(KelmahDestination.jobDetail(target.jobId)) {
                    launchSingleTop = true
                }
            } else {
                navController.navigate(KelmahDestination.Notifications.route) {
                    launchSingleTop = true
                }
            }
        }
        null -> {
            navController.navigate(KelmahDestination.Notifications.route) {
                launchSingleTop = true
            }
        }
    }
}
