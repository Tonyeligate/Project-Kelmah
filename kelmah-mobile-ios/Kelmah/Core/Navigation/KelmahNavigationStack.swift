import SwiftUI

/// Root navigation host for app-wide routes that sit above the tab shell.
struct KelmahNavigationStack<Content: View>: View {
    @ObservedObject private var navigator: Navigator
    private let content: Content

    init(navigator: Navigator, @ViewBuilder content: () -> Content) {
        self.navigator = navigator
        self.content = content()
    }

    var body: some View {
        NavigationStack(path: $navigator.path) {
            content
                .navigationDestination(for: KelmahRoute.self) { route in
                    destination(for: route)
                }
        }
        .environmentObject(navigator)
    }

    @ViewBuilder
    private func destination(for route: KelmahRoute) -> some View {
        switch route {
        case .home:
            StitchDashboardScreenView()
        case .jobs:
            StitchProjectListScreenView(title: "Jobs", subtitle: "Browse hiring activity, shortlist work, and track active trade opportunities.")
        case .messages:
            StitchMessageInboxScreenView()
        case .profile:
            StitchProfileDetailScreenView(title: "Profile", subtitle: "Trust signals, work history, credentials, and public profile readiness.")
        case let .chat(conversationId):
            StitchChatScreenView(conversationId: conversationId, onBack: { navigator.pop() })
        case let .jobDetail(jobId):
            StitchJobDetailScreenView(jobId: jobId)
        case let .jobApply(jobId):
            StitchJobWorkflowScreenView(title: "Apply", subtitle: "Prepare a bid, availability note, and escrow-ready estimate before submitting.", reference: jobId)
        case .postJob:
            StitchPostJobScreenView(step: 1)
        case let .editJob(jobId):
            StitchJobWorkflowScreenView(title: "Edit Job", subtitle: "Update scope, budget, milestones, and matching criteria for an active job post.", reference: jobId)
        case let .jobApplicants(jobId):
            StitchJobWorkflowScreenView(title: "Applicants", subtitle: "Compare proposals, trust badges, budgets, and message-ready shortlist actions.", reference: jobId)
        case .myProjects:
            StitchProjectListScreenView(title: "My Projects", subtitle: "Track client and artisan work across active, pending, and completed projects.")
        case let .projectDetail(projectId):
            StitchProjectListScreenView(title: "Project Detail", subtitle: "A project cockpit for milestones, files, participants, and escrow state.", reference: projectId)
        case let .jobProgress(jobId):
            StitchProjectListScreenView(title: "Job Progress", subtitle: "Follow timeline updates, submitted proof, blockers, and next actions.", reference: jobId)
        case .savedJobs:
            StitchJobWorkflowScreenView(title: "Saved Jobs", subtitle: "Review bookmarked jobs, compare availability, and move quickly when ready.", reference: "saved")
        case .notifications:
            StitchNotificationsScreenView()
        case .wallet:
            StitchWalletHubScreenView(onDeposit: { navigator.navigate(to: .deposit) })
        case .deposit:
            StitchDepositScreenView()
        case .withdraw:
            StitchWalletDetailScreenView(title: "Withdraw Funds", subtitle: "Move available earnings to verified payout methods with confirmation controls.")
        case .earnings:
            StitchWalletDetailScreenView(title: "Earnings Analytics", subtitle: "Review completed work, payout trends, escrow releases, and tax-ready summaries.")
        case .payoutMethods:
            StitchWalletDetailScreenView(title: "Payout Methods", subtitle: "Manage Mobile Money, cards, bank accounts, and default payout routing.")
        case .transactions:
            StitchWalletDetailScreenView(title: "Transaction History", subtitle: "Audit deposits, releases, withdrawals, fees, and escrow movements.")
        case let .transactionDetail(transactionId):
            StitchWalletDetailScreenView(title: "Transaction Detail", subtitle: "Receipt, escrow metadata, counterparty, and support actions for one wallet movement.", reference: transactionId)
        case let .invoiceDetail(invoiceId):
            StitchWalletDetailScreenView(title: "Invoice Detail", subtitle: "Line items, payment status, funded milestones, and receipt export controls.", reference: invoiceId)
        case .contracts:
            StitchContractMilestoneScreenView(title: "Contracts", subtitle: "Review active agreements, signatures, scopes, and escrow commitments.", reference: "all")
        case let .milestoneApproval(milestoneId):
            StitchMilestoneApprovalScreenView(milestoneId: milestoneId)
        case let .contract(contractId):
            StitchContractAgreementScreenView(contractId: contractId)
        case let .milestoneDetail(milestoneId):
            StitchContractMilestoneScreenView(title: "Milestone Detail", subtitle: "Inspect deliverables, proof, due dates, and escrow release state.", reference: milestoneId)
        case let .defineMilestones(jobId):
            StitchContractMilestoneScreenView(title: "Define Milestones", subtitle: "Split a job into fundable stages with approval criteria and payment amounts.", reference: jobId)
        case .disputeList:
            StitchDisputeScreenView(title: "Disputes", subtitle: "Track open cases, evidence packets, moderator updates, and resolution windows.")
        case let .fileDispute(jobId):
            StitchFileDisputeScreenView(jobId: jobId)
        case let .disputeDetail(disputeId):
            StitchDisputeScreenView(title: "Dispute Detail", subtitle: "Review a single moderated case with timeline, evidence, and decision context.", reference: disputeId)
        case .browseTrades, .discoverArtisans, .marketplace:
            StitchBrowseTradesScreenView()
        case .profileSettings:
            StitchProfileSettingsScreenView()
        case .certificatesBadges:
            StitchProfileDetailScreenView(title: "Certificates & Badges", subtitle: "Show verified training, licenses, platform achievements, and proof of expertise.")
        case .portfolioManagement:
            StitchProfileDetailScreenView(title: "Portfolio", subtitle: "Manage project galleries, descriptions, references, and featured trade work.")
        case let .portfolioDetail(projectId), let .portfolioProjectDetail(projectId):
            StitchProfileDetailScreenView(title: "Portfolio Project", subtitle: "Present a completed job with images, scope, outcomes, and client proof.", reference: projectId)
        case .manageCredentials:
            StitchProfileDetailScreenView(title: "Manage Credentials", subtitle: "Upload, review, and renew trade licenses, badges, and identity-backed credentials.")
        case .linkedAccounts:
            StitchSettingsDetailScreenView(title: "Linked Accounts", subtitle: "Connect social, payment, and recovery channels with account safety controls.")
        case .identityVerification:
            StitchProfileDetailScreenView(title: "Identity Verification", subtitle: "Review document, liveness, address, and trade verification progress.")
        case .securityCenter:
            StitchSettingsDetailScreenView(title: "Security Center", subtitle: "Manage trusted devices, recovery options, confirmations, and account protection.")
        case .notificationPreferences:
            StitchSettingsDetailScreenView(title: "Notification Preferences", subtitle: "Tune job, chat, milestone, dispute, and wallet notification channels.")
        case .privacy:
            StitchSettingsDetailScreenView(title: "Privacy", subtitle: "Control profile visibility, data sharing, location, and platform safety settings.")
        case .helpCenter:
            StitchSettingsDetailScreenView(title: "Help Center", subtitle: "Find support paths for payments, disputes, contracts, verification, and account access.")
        case .splash:
            StitchOnboardingScreenView(title: "Splash", subtitle: "A branded entry state introducing trusted trade work and escrow protection.")
        case .onboarding:
            StitchOnboardingScreenView(title: "Welcome", subtitle: "Guide new users through hiring, earning, escrow, and trust verification.")
        case .roleSelection:
            StitchOnboardingScreenView(title: "Choose Your Role", subtitle: "Select client, artisan, or hybrid workflows before account setup.")
        case .createAccount:
            StitchAuthFlowScreenView(title: "Create Account", subtitle: "Start a verified Kelmah account with role, identity, and recovery basics.")
        case .login:
            StitchAuthFlowScreenView(title: "Sign In", subtitle: "Access Kelmah securely with account recovery and trust safeguards.")
        case .forgotPassword:
            StitchAuthFlowScreenView(title: "Reset Password", subtitle: "Request a secure recovery link and verify account ownership.")
        case .resetPassword:
            StitchAuthFlowScreenView(title: "Reset Password", subtitle: "Set a new password after completing the recovery verification step.")
        case let .verifyEmail(email):
            StitchAuthFlowScreenView(title: "Verify Email", subtitle: "Confirm the email address attached to this Kelmah account.", email: email)
        case .adminDashboard:
            StitchAdminQueueScreenView(title: "Admin", subtitle: "Operational snapshot for disputes, verification, risk checks, and SLA queues.")
        case .adminDisputeQueue:
            StitchAdminQueueScreenView(title: "Dispute Queue", subtitle: "Prioritize dispute reviews by risk, evidence completeness, and response SLA.")
        case let .adminDisputeDetail(disputeId):
            StitchAdminQueueScreenView(title: "Dispute Detail", subtitle: "Moderator decision workspace for one dispute case and attached evidence.", reference: disputeId)
        case .adminVerificationQueue:
            StitchAdminQueueScreenView(title: "Verification Queue", subtitle: "Review identity documents, trade credentials, and liveness checks.")
        case let .adminVerificationDetail(userId):
            StitchAdminQueueScreenView(title: "Verification Detail", subtitle: "Inspect one verification record with decision actions and audit context.", reference: userId)
        }
    }

}
