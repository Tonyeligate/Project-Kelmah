package com.kelmah.mobile.features.stitch.presentation

import androidx.compose.runtime.Composable
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.kelmah.mobile.app.navigation.KelmahDestination

fun NavGraphBuilder.stitchPlaceholderRoutes(navController: NavHostController) {
    fun screen(route: String, content: @Composable () -> Unit) {
        composable(route) {
            content()
        }
    }

    fun screenWithStringArg(route: String, argName: String, content: @Composable (String?) -> Unit) {
        composable(
            route = route,
            arguments = listOf(navArgument(argName) { type = NavType.StringType }),
        ) { backStackEntry ->
            content(backStackEntry.arguments?.getString(argName))
        }
    }

    composable(KelmahDestination.Wallet.route) {
        StitchWalletHubScreen(
            onBack = { navController.popBackStack() },
            onDeposit = { navController.navigate(KelmahDestination.Deposit.route) },
        )
    }
    composable(KelmahDestination.Deposit.route) {
        StitchDepositScreen(onBack = { navController.popBackStack() })
    }
    screen(KelmahDestination.Earnings.route) { StitchWalletDetailScreen(mode = "earnings", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.EarningsAnalytics.route) { StitchWalletDetailScreen(mode = "analytics", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.PayoutMethods.route) { StitchWalletDetailScreen(mode = "payouts", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.PayoutMethodsDetail.route) { StitchWalletDetailScreen(mode = "payouts", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.TransactionHistory.route) { StitchWalletDetailScreen(mode = "transactions", onBack = { navController.popBackStack() }) }
    screenWithStringArg(KelmahDestination.InvoiceDetail.route, "invoiceId") { invoiceId -> StitchWalletDetailScreen(mode = "invoice", itemId = invoiceId, onBack = { navController.popBackStack() }) }

    composable(KelmahDestination.PostJob.route) {
        StitchPostJobScreen(
            step = 1,
            onBack = { navController.popBackStack() },
            onNext = { navController.navigate(KelmahDestination.PostJobStep2.route) },
        )
    }
    composable(KelmahDestination.PostJobStep1.route) {
        StitchPostJobScreen(
            step = 1,
            onBack = { navController.popBackStack() },
            onNext = { navController.navigate(KelmahDestination.PostJobStep2.route) },
        )
    }
    composable(KelmahDestination.PostJobStep2.route) {
        StitchPostJobScreen(
            step = 2,
            onBack = { navController.popBackStack() },
            onNext = { navController.navigate(KelmahDestination.PostJobReview.route) },
        )
    }
    composable(KelmahDestination.PostJobReview.route) {
        StitchPostJobScreen(
            step = 3,
            onBack = { navController.popBackStack() },
            onNext = { navController.popBackStack(KelmahDestination.Jobs.route, inclusive = false) },
        )
    }
    screen(KelmahDestination.MyJobs.route) { StitchProjectListScreen(mode = "projects", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.SavedJobs.route) { StitchProjectListScreen(mode = "saved", onBack = { navController.popBackStack() }) }
    composable(KelmahDestination.BrowseTrades.route) {
        StitchBrowseTradesScreen(onBack = { navController.popBackStack() })
    }
    composable(KelmahDestination.DiscoverArtisans.route) {
        StitchBrowseTradesScreen(onBack = { navController.popBackStack() })
    }
    composable(KelmahDestination.Marketplace.route) {
        StitchBrowseTradesScreen(onBack = { navController.popBackStack() })
    }
    composable(
        route = KelmahDestination.Chat.route,
        arguments = listOf(navArgument("conversationId") { type = NavType.StringType }),
    ) { backStackEntry ->
        StitchChatScreen(
            conversationId = backStackEntry.arguments?.getString("conversationId"),
            onBack = { navController.popBackStack() },
        )
    }

    composable(
        route = KelmahDestination.Contract.route,
        arguments = listOf(navArgument("contractId") { type = NavType.StringType }),
    ) { backStackEntry ->
        StitchContractAgreementScreen(
            contractId = backStackEntry.arguments?.getString("contractId"),
            onBack = { navController.popBackStack() },
        )
    }
    composable(
        route = KelmahDestination.MilestoneApproval.route,
        arguments = listOf(navArgument("milestoneId") { type = NavType.StringType }),
    ) { backStackEntry ->
        StitchMilestoneApprovalScreen(
            milestoneId = backStackEntry.arguments?.getString("milestoneId"),
            onBack = { navController.popBackStack() },
        )
    }
    screenWithStringArg(KelmahDestination.MilestoneDetail.route, "milestoneId") { milestoneId -> StitchMilestoneDetailScreen(milestoneId = milestoneId, onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.DisputeList.route) { StitchDisputeScreen(mode = "queue", onBack = { navController.popBackStack() }) }
    composable(
        route = KelmahDestination.FileDispute.route,
        arguments = listOf(navArgument("jobId") { type = NavType.StringType }),
    ) { backStackEntry ->
        StitchFileDisputeScreen(
            jobId = backStackEntry.arguments?.getString("jobId"),
            onBack = { navController.popBackStack() },
        )
    }
    screenWithStringArg(KelmahDestination.DisputeDetail.route, "disputeId") { disputeId -> StitchDisputeScreen(mode = "detail", itemId = disputeId, onBack = { navController.popBackStack() }) }

    screen(KelmahDestination.Settings.route) { StitchSettingsDetailScreen(mode = "settings", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.Verification.route) { StitchSettingsDetailScreen(mode = "verification", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.Security.route) { StitchSettingsDetailScreen(mode = "security", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.NotificationPreferences.route) { StitchSettingsDetailScreen(mode = "notifications", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.Privacy.route) { StitchSettingsDetailScreen(mode = "privacy", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.HelpSupport.route) { StitchSettingsDetailScreen(mode = "help", onBack = { navController.popBackStack() }) }
    composable(KelmahDestination.ProfileSettings.route) {
        StitchProfileSettingsScreen(onBack = { navController.popBackStack() })
    }
    screen(KelmahDestination.CertificatesBadges.route) { StitchProfileDetailScreen(mode = "badges", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.PortfolioManagement.route) { StitchProfileDetailScreen(mode = "portfolio", onBack = { navController.popBackStack() }) }
    screenWithStringArg(KelmahDestination.PortfolioProjectDetail.route, "projectId") { projectId -> StitchProfileDetailScreen(mode = "portfolio_detail", itemId = projectId, onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.ManageCredentials.route) { StitchProfileDetailScreen(mode = "credentials", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.ManageLinkedAccounts.route) { StitchProfileDetailScreen(mode = "linked", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.IdentityVerification.route) { StitchProfileDetailScreen(mode = "verification", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.SecurityCenter.route) { StitchProfileDetailScreen(mode = "security", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.NotificationPrefs.route) { StitchProfileDetailScreen(mode = "notifications", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.PrivacySettings.route) { StitchProfileDetailScreen(mode = "privacy", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.HelpCenter.route) { StitchProfileDetailScreen(mode = "help", onBack = { navController.popBackStack() }) }

    screen(KelmahDestination.Login.route) { StitchAuthFlowScreen(mode = "login", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.CreateAccount.route) { StitchAuthFlowScreen(mode = "create", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.RoleSelection.route) { StitchAuthFlowScreen(mode = "role", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.ForgotPassword.route) { StitchAuthFlowScreen(mode = "forgot", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.Splash.route) { StitchOnboardingScreen(mode = "splash", onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.Onboarding.route) { StitchOnboardingScreen(mode = "onboarding", onBack = { navController.popBackStack() }) }

    screen(KelmahDestination.AdminDisputeQueue.route) { StitchAdminQueueScreen(mode = "disputes", onBack = { navController.popBackStack() }) }
    screenWithStringArg(KelmahDestination.AdminDisputeDetail.route, "disputeId") { disputeId -> StitchAdminQueueScreen(mode = "dispute_detail", itemId = disputeId, onBack = { navController.popBackStack() }) }
    screen(KelmahDestination.AdminVerificationQueue.route) { StitchAdminQueueScreen(mode = "verification", onBack = { navController.popBackStack() }) }
}
