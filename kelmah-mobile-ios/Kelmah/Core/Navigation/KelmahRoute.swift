import Foundation

/// Type-safe navigation destinations for the Kelmah iOS app.
///
/// Mirrors the Android `KelmahDestination` route set so both platforms cover
/// the same surface area. Associated values carry route parameters (ids).
///
/// Includes tab-level routes plus pushed destinations so deep links and future
/// screens can use a single route vocabulary.
enum KelmahRoute: Hashable {
    // Shell / tab-level parity routes
    case home
    case jobs
    case messages
    case profile

    // Jobs / hiring flow
    case jobDetail(String)
    case jobApply(String)
    case postJob
    case editJob(String)
    case jobApplicants(String)
    case myProjects
    case projectDetail(String)
    case jobProgress(String)
    case savedJobs

    // Messaging flow
    case chat(String)

    // Notifications
    case notifications

    // Wallet flow
    case wallet
    case deposit
    case withdraw
    case earnings
    case payoutMethods
    case transactions
    case transactionDetail(String)
    case invoiceDetail(String)

    // Contracts & milestones
    case contract(String)
    case contracts
    case milestoneApproval(String)
    case milestoneDetail(String)
    case defineMilestones(String)

    // Disputes
    case disputeList
    case fileDispute(String)
    case disputeDetail(String)

    // Discovery & marketplace
    case browseTrades
    case discoverArtisans
    case marketplace

    // Profile & settings
    case profileSettings
    case certificatesBadges
    case portfolioManagement
    case portfolioDetail(String)
    case portfolioProjectDetail(String)
    case manageCredentials
    case linkedAccounts
    case identityVerification
    case securityCenter
    case notificationPreferences
    case privacy
    case helpCenter

    // Auth & onboarding
    case splash
    case onboarding
    case roleSelection
    case createAccount
    case login
    case forgotPassword
    case resetPassword
    case verifyEmail(String)

    // Admin
    case adminDashboard
    case adminDisputeQueue
    case adminDisputeDetail(String)
    case adminVerificationQueue
    case adminVerificationDetail(String)
}

extension KelmahRoute {
    /// A stable, human-readable title used for navigation bars.
    var title: String {
        switch self {
        case .home: return "Home"
        case .jobs: return "Jobs"
        case .messages: return "Messages"
        case .profile: return "Profile"
        case .jobDetail: return "Job Detail"
        case .jobApply: return "Apply"
        case .postJob: return "Post a Job"
        case .editJob: return "Edit Job"
        case .jobApplicants: return "Applicants"
        case .myProjects: return "My Projects"
        case .projectDetail: return "Project Detail"
        case .jobProgress: return "Job Progress"
        case .savedJobs: return "Saved Jobs"
        case .chat: return "Chat"
        case .notifications: return "Notifications"
        case .wallet: return "Wallet & Payments"
        case .deposit: return "Deposit Funds"
        case .withdraw: return "Withdraw Funds"
        case .earnings: return "Earnings Analytics"
        case .payoutMethods: return "Payout Methods"
        case .transactions: return "Transaction History"
        case .transactionDetail: return "Transaction Detail"
        case .invoiceDetail: return "Invoice Detail"
        case .contract: return "Contract Agreement"
        case .contracts: return "Contracts"
        case .milestoneApproval: return "Approve Milestone"
        case .milestoneDetail: return "Milestone Detail"
        case .defineMilestones: return "Define Milestones"
        case .disputeList: return "Disputes"
        case .fileDispute: return "File a Dispute"
        case .disputeDetail: return "Dispute Detail"
        case .browseTrades: return "Browse Trades"
        case .discoverArtisans: return "Discover Artisans"
        case .marketplace: return "Marketplace"
        case .profileSettings: return "Profile Settings"
        case .certificatesBadges: return "Certificates & Badges"
        case .portfolioManagement: return "Portfolio"
        case .portfolioDetail: return "Portfolio Project"
        case .portfolioProjectDetail: return "Portfolio Project"
        case .manageCredentials: return "Manage Credentials"
        case .linkedAccounts: return "Linked Accounts"
        case .identityVerification: return "Identity Verification"
        case .securityCenter: return "Security Center"
        case .notificationPreferences: return "Notification Preferences"
        case .privacy: return "Privacy"
        case .helpCenter: return "Help Center"
        case .splash: return "Splash"
        case .onboarding: return "Welcome"
        case .roleSelection: return "Choose Your Role"
        case .createAccount: return "Create Account"
        case .login: return "Sign In"
        case .forgotPassword: return "Reset Password"
        case .resetPassword: return "Reset Password"
        case .verifyEmail: return "Verify Email"
        case .adminDashboard: return "Admin"
        case .adminDisputeQueue: return "Dispute Queue"
        case .adminDisputeDetail: return "Dispute Detail"
        case .adminVerificationQueue: return "Verification Queue"
        case .adminVerificationDetail: return "Verification Detail"
        }
    }
}

// MARK: - Deep links

extension KelmahRoute {
    static func fromDeepLink(_ url: URL) -> KelmahRoute? {
        KelmahRoute(from: url)
    }

    /// Parses a deep link URL into a `KelmahRoute`.
    ///
    /// Supported `kelmah://` patterns:
    ///   - kelmah://chat/{id}              -> .chat(id)
    ///   - kelmah://job/{id}               -> .jobDetail(id)
    ///   - kelmah://milestone/{id}/approve -> .milestoneApproval(id)
    ///   - kelmah://contract/{id}          -> .contract(id)
    ///   - kelmah://wallet/deposit         -> .deposit
    ///   - kelmah://dispute/{id}           -> .disputeDetail(id)
    ///   - kelmah://notifications          -> .notifications
    ///
    /// `https://` links are accepted with an equivalent path layout
    /// (host ignored, first path component treated as the route key).
    init?(from url: URL) {
        let scheme = url.scheme?.lowercased()
        guard scheme == "kelmah" || scheme == "https" else { return nil }

        // For kelmah:// the host is the first route segment (e.g. "chat").
        // For https:// the host is a real domain, so we rely on path segments.
        var segments = url.pathComponents.filter { $0 != "/" && $0.isEmpty == false }
        if scheme == "kelmah", let host = url.host, host.isEmpty == false {
            segments.insert(host.lowercased(), at: 0)
        }

        guard let key = segments.first?.lowercased() else { return nil }
        let rest = Array(segments.dropFirst())

        switch key {
        case "chat":
            guard let id = rest.first, id.isEmpty == false else { return nil }
            self = .chat(id)
        case "job", "jobs":
            // kelmah://job/{id} or kelmah://jobs/detail/{id}
            let id = rest.last
            guard let id, id.isEmpty == false, id != "detail" else { return nil }
            self = .jobDetail(id)
        case "milestone":
            // kelmah://milestone/{id}/approve  or kelmah://milestone/{id}
            guard let id = rest.first, id.isEmpty == false else { return nil }
            if rest.count >= 2, rest[1].lowercased() == "approve" {
                self = .milestoneApproval(id)
            } else {
                self = .milestoneDetail(id)
            }
        case "contract":
            guard let id = rest.first, id.isEmpty == false else { return nil }
            self = .contract(id)
        case "wallet":
            let action = rest.first?.lowercased()
            if action == "deposit" {
                self = .deposit
            } else if action == "withdraw" {
                self = .withdraw
            } else {
                self = .wallet
            }
        case "dispute", "disputes":
            guard let id = rest.first, id.isEmpty == false else { return nil }
            self = .disputeDetail(id)
        case "notifications", "alerts":
            self = .notifications
        default:
            return nil
        }
    }
}
