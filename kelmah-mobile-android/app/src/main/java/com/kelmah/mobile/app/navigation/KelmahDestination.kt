package com.kelmah.mobile.app.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Article
import androidx.compose.material.icons.automirrored.outlined.Chat
import androidx.compose.material.icons.automirrored.outlined.Help
import androidx.compose.material.icons.automirrored.outlined.TrendingUp
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.MailOutline
import androidx.compose.material.icons.outlined.NotificationsNone
import androidx.compose.material.icons.outlined.PersonOutline
import androidx.compose.material.icons.outlined.WorkOutline
import androidx.compose.material.icons.outlined.AccountBalanceWallet
import androidx.compose.material.icons.outlined.Construction
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.Gavel
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.VerifiedUser
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.AddCircle
import androidx.compose.material.icons.outlined.Payments
import androidx.compose.material.icons.outlined.Security
import androidx.compose.material.icons.outlined.Badge
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.Assessment
import androidx.compose.material.icons.outlined.ContentCopy
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
    // Main tabs (bottom navigation)
    data object Home : KelmahDestination("home", "Home", Icons.Outlined.Home)
    data object Jobs : KelmahDestination("jobs", "Jobs", Icons.Outlined.WorkOutline)
    data object Messages : KelmahDestination("messages", "Messages", Icons.Outlined.MailOutline)
    data object Wallet : KelmahDestination("wallet", "Wallet", Icons.Outlined.AccountBalanceWallet)
    data object Profile : KelmahDestination("profile", "Profile", Icons.Outlined.PersonOutline)

    // Jobs flow
    data object JobDetail : KelmahDestination("jobs/detail/{jobId}", "Job Detail", Icons.Outlined.WorkOutline)
    data object JobApply : KelmahDestination("jobs/apply/{jobId}", "Apply", Icons.Outlined.WorkOutline)
    data object PostJob : KelmahDestination("jobs/post", "Post Job", Icons.Outlined.AddCircle)
    data object PostJobStep1 : KelmahDestination("jobs/post/basic", "Basic Info", Icons.Outlined.Construction)
    data object PostJobStep2 : KelmahDestination("jobs/post/budget", "Budget", Icons.Outlined.AccountBalanceWallet)
    data object PostJobReview : KelmahDestination("jobs/post/review", "Review", Icons.Outlined.VerifiedUser)
    data object MyJobs : KelmahDestination("jobs/my", "My Jobs", Icons.Outlined.WorkOutline)
    data object SavedJobs : KelmahDestination("jobs/saved", "Saved", Icons.Outlined.WorkOutline)

    // Messaging flow
    data object Chat : KelmahDestination("chat/{conversationId}", "Chat", Icons.AutoMirrored.Outlined.Chat)

    // Notifications flow
    data object Notifications : KelmahDestination("notifications", "Notifications", Icons.Outlined.NotificationsNone)

    // Wallet flow
    data object Deposit : KelmahDestination("wallet/deposit", "Deposit", Icons.Outlined.AccountBalanceWallet)
    data object Earnings : KelmahDestination("wallet/earnings", "Earnings", Icons.Outlined.AccountBalanceWallet)
    data object PayoutMethods : KelmahDestination("wallet/payout", "Payout Methods", Icons.Outlined.AccountBalanceWallet)
    data object TransactionHistory : KelmahDestination("wallet/transactions", "Transactions", Icons.Outlined.Description)

    // Wallet sub-flows (Stitch: wallet, earnings_analytics, payout_methods, invoice_detail)
    data object WalletOverview : KelmahDestination("wallet", "Wallet", Icons.Outlined.AccountBalanceWallet)
    data object EarningsAnalytics : KelmahDestination("wallet/analytics", "Earnings Analytics", Icons.AutoMirrored.Outlined.TrendingUp)
    data object PayoutMethodsDetail : KelmahDestination("wallet/payouts", "Payout Methods", Icons.Outlined.Payments)
    data object InvoiceDetail : KelmahDestination("wallet/invoice/{invoiceId}", "Invoice", Icons.Outlined.Description)
    data object DepositFunds : KelmahDestination("wallet/deposit", "Deposit Funds", Icons.Outlined.AddCircle)

    // Contract & Milestones flow
    data object Contract : KelmahDestination("contract/{contractId}", "Contract", Icons.Outlined.Description)
    data object MilestoneApproval : KelmahDestination("milestone/{milestoneId}/approve", "Approve Milestone", Icons.Outlined.Gavel)
    data object MilestoneDetail : KelmahDestination("milestone/{milestoneId}", "Milestone", Icons.Outlined.VerifiedUser)

    // Disputes flow
    data object DisputeList : KelmahDestination("disputes", "Disputes", Icons.Outlined.Gavel)
    data object FileDispute : KelmahDestination("disputes/file/{jobId}", "File Dispute", Icons.Outlined.Gavel)
    data object DisputeDetail : KelmahDestination("disputes/{disputeId}", "Dispute Detail", Icons.Outlined.Gavel)

    // Profile & Settings flow
    data object Settings : KelmahDestination("settings", "Settings", Icons.Outlined.Settings)
    data object Verification : KelmahDestination("settings/verification", "Verification", Icons.Outlined.VerifiedUser)
    data object Security : KelmahDestination("settings/security", "Security", Icons.Outlined.Shield)
    data object NotificationPreferences : KelmahDestination("settings/notifications", "Notifications", Icons.Outlined.NotificationsNone)
    data object Privacy : KelmahDestination("settings/privacy", "Privacy", Icons.Outlined.Visibility)
    data object HelpSupport : KelmahDestination("settings/help", "Help & Support", Icons.AutoMirrored.Outlined.Help)

    // Profile sub-flows (Stitch: profile_settings, certificates_badges, portfolio, documents, linked_accounts)
    data object ProfileOverview : KelmahDestination("profile", "Profile", Icons.Outlined.PersonOutline)
    data object ProfileSettings : KelmahDestination("profile/settings", "Settings", Icons.Outlined.Settings)
    data object CertificatesBadges : KelmahDestination("profile/badges", "Certificates", Icons.Outlined.Badge)
    data object PortfolioManagement : KelmahDestination("profile/portfolio", "Portfolio", Icons.Outlined.Folder)
    data object PortfolioProjectDetail : KelmahDestination("profile/portfolio/{projectId}", "Project", Icons.AutoMirrored.Outlined.Article)
    data object ManageCredentials : KelmahDestination("profile/credentials", "Credentials", Icons.Outlined.VerifiedUser)
    data object ManageLinkedAccounts : KelmahDestination("profile/linked", "Linked Accounts", Icons.Outlined.ContentCopy)
    data object IdentityVerification : KelmahDestination("profile/verification", "Verification", Icons.Outlined.Badge)
    data object SecurityCenter : KelmahDestination("profile/security", "Security", Icons.Outlined.Security)
    data object NotificationPrefs : KelmahDestination("profile/notifications", "Notifications", Icons.Outlined.NotificationsNone)
    data object PrivacySettings : KelmahDestination("profile/privacy", "Privacy", Icons.Outlined.Visibility)
    data object HelpCenter : KelmahDestination("profile/help", "Help Center", Icons.AutoMirrored.Outlined.Help)

    // Auth flow
    data object Login : KelmahDestination("auth/login", "Login", Icons.Outlined.PersonOutline)
    data object CreateAccount : KelmahDestination("auth/create", "Create Account", Icons.Outlined.PersonOutline)
    data object RoleSelection : KelmahDestination("auth/role", "Select Role", Icons.Outlined.WorkOutline)
    data object ForgotPassword : KelmahDestination("auth/forgot", "Forgot Password", Icons.Outlined.Shield)

    // Onboarding
    data object Splash : KelmahDestination("splash", "Splash", Icons.Outlined.Construction)
    data object Onboarding : KelmahDestination("onboarding", "Welcome", Icons.Outlined.Construction)

    // Discovery & Marketplace (Stitch: browse_trades, discover_artisans, marketplace)
    data object BrowseTrades : KelmahDestination("discover/trades", "Trades", Icons.Outlined.Construction)
    data object DiscoverArtisans : KelmahDestination("discover/artisans", "Artisans", Icons.Outlined.PersonOutline)
    data object Marketplace : KelmahDestination("discover/marketplace", "Marketplace", Icons.Outlined.WorkOutline)

    // Admin flows (Stitch: admin_dispute_moderation, admin_verification_queue, dispute_moderation_queue)
    data object AdminDisputeQueue : KelmahDestination("admin/disputes", "Disputes", Icons.Outlined.Gavel)
    data object AdminDisputeDetail : KelmahDestination("admin/disputes/{disputeId}", "Dispute", Icons.Outlined.Gavel)
    data object AdminVerificationQueue : KelmahDestination("admin/verification", "Verification", Icons.Outlined.VerifiedUser)

    companion object {
        // Jobs
        fun jobDetail(jobId: String): String = "jobs/detail/$jobId"
        fun jobApply(jobId: String): String = "jobs/apply/$jobId"
        fun messages(conversationId: String): String = "messages?conversationId=$conversationId"
        fun chat(conversationId: String): String = "chat/$conversationId"
        
        // Contract & Milestones
        fun contract(contractId: String): String = "contract/$contractId"
        fun milestoneApproval(milestoneId: String): String = "milestone/$milestoneId/approve"
        fun milestoneDetail(milestoneId: String): String = "milestone/$milestoneId"
        
        // Disputes
        fun fileDispute(jobId: String): String = "disputes/file/$jobId"
        fun disputeDetail(disputeId: String): String = "disputes/$disputeId"

        // Wallet
        fun walletOverview(): String = "wallet"
        fun earningsAnalytics(): String = "wallet/analytics"
        fun payoutMethods(): String = "wallet/payouts"
        fun invoiceDetail(invoiceId: String): String = "wallet/invoice/$invoiceId"
        fun depositFunds(): String = "wallet/deposit"

        // Profile
        fun profileOverview(): String = "profile"
        fun profileSettings(): String = "profile/settings"
        fun certificatesBadges(): String = "profile/badges"
        fun portfolioManagement(): String = "profile/portfolio"
        fun portfolioProjectDetail(projectId: String): String = "profile/portfolio/$projectId"
        fun manageCredentials(): String = "profile/credentials"
        fun manageLinkedAccounts(): String = "profile/linked"
        fun identityVerification(): String = "profile/verification"
        fun securityCenter(): String = "profile/security"
        fun notificationPrefs(): String = "profile/notifications"
        fun privacySettings(): String = "profile/privacy"
        fun helpCenter(): String = "profile/help"

        // Discovery
        fun browseTrades(): String = "discover/trades"
        fun discoverArtisans(): String = "discover/artisans"
        fun marketplace(): String = "discover/marketplace"

        // Admin
        fun adminDisputeQueue(): String = "admin/disputes"
        fun adminDisputeDetail(disputeId: String): String = "admin/disputes/$disputeId"
        fun adminVerificationQueue(): String = "admin/verification"
    }
    }

fun mainDestinations(role: KelmahUserRole): List<KelmahNavItem> {
    val homeLabel = if (role == KelmahUserRole.HIRER) "Dashboard" else "Home"
    val jobsLabel = if (role == KelmahUserRole.HIRER) "Hiring" else "Jobs"
    return listOf(
        KelmahNavItem(KelmahDestination.Home, homeLabel),
        KelmahNavItem(KelmahDestination.Jobs, jobsLabel),
        KelmahNavItem(KelmahDestination.Messages, "Messages"),
        KelmahNavItem(KelmahDestination.Wallet, "Wallet"),
        KelmahNavItem(KelmahDestination.Profile, "Profile"),
    )
}

fun walletDestinations(): List<KelmahNavItem> = listOf(
    KelmahNavItem(KelmahDestination.WalletOverview, "Overview"),
    KelmahNavItem(KelmahDestination.EarningsAnalytics, "Analytics"),
    KelmahNavItem(KelmahDestination.PayoutMethodsDetail, "Payouts"),
)

fun profileDestinations(): List<KelmahNavItem> = listOf(
    KelmahNavItem(KelmahDestination.ProfileOverview, "Profile"),
    KelmahNavItem(KelmahDestination.ProfileSettings, "Settings"),
    KelmahNavItem(KelmahDestination.CertificatesBadges, "Badges"),
    KelmahNavItem(KelmahDestination.PortfolioManagement, "Portfolio"),
)
