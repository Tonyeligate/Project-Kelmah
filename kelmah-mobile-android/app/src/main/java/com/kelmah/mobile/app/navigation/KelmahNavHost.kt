package com.kelmah.mobile.app.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.kelmah.mobile.features.home.presentation.HomeScreen
import com.kelmah.mobile.features.jobs.presentation.JobApplicationScreen
import com.kelmah.mobile.features.jobs.presentation.JobDetailScreen
import com.kelmah.mobile.features.jobs.presentation.JobsScreen
import com.kelmah.mobile.features.messaging.presentation.MessagesScreen
import com.kelmah.mobile.features.notifications.presentation.NotificationsScreen
import com.kelmah.mobile.features.profile.presentation.ProfileScreen

@Composable
fun KelmahNavHost(
    navController: NavHostController,
    onLogout: () -> Unit,
) {
    NavHost(
        navController = navController,
        startDestination = KelmahDestination.Home.route,
    ) {
        composable(KelmahDestination.Home.route) {
            HomeScreen(onBrowseJobs = { navController.navigate(KelmahDestination.Jobs.route) })
        }
        composable(KelmahDestination.Jobs.route) {
            JobsScreen(
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
                onBack = { navController.popBackStack() },
                onSubmitted = {
                    navController.popBackStack()
                    navController.popBackStack()
                },
            )
        }
        composable(KelmahDestination.Messages.route) { MessagesScreen() }
        composable(KelmahDestination.Notifications.route) { NotificationsScreen() }
        composable(KelmahDestination.Profile.route) { ProfileScreen(onLogout = onLogout) }
    }
}
