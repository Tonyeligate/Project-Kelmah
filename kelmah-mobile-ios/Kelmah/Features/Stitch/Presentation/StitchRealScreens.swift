import SwiftUI

struct StitchChatScreenView: View {
    let conversationId: String
    var onBack: (() -> Void)? = nil

    @State private var message = ""

    var body: some View {
        VStack(spacing: 0) {
            KelmahChatTopBar(
                title: "Kwame Mensah",
                subtitle: "Online • Wiring contract #\(conversationId)",
                isOnline: true,
                onBack: onBack
            )

            KelmahPremiumBackground {
                ScrollView {
                    VStack(alignment: .leading, spacing: KelmahSpacing.lg) {
                        KelmahJobContextCard(
                            title: "Full House Wiring",
                            status: "Active milestone",
                            detail: "Escrow funded"
                        )

                        KelmahDateSeparator(label: "Today")
                        KelmahChatBubble(text: "Morning, I inspected the panel and can begin conduit routing by 9am.", isOutgoing: false, time: "8:42 AM")
                        KelmahChatBubble(text: "Perfect. Please send a photo once the first floor trunking is complete.", isOutgoing: true, time: "8:44 AM", isRead: true)
                        KelmahChatBubble(text: "Attached the materials list and marked two sockets that need replacement.", isOutgoing: false, time: "9:10 AM")

                        StitchInlineAttachmentCard(
                            title: "materials-list.pdf",
                            subtitle: "124 KB • Shared in contract thread",
                            systemImage: "doc.text.fill"
                        )
                    }
                    .padding(KelmahSpacing.lg)
                }
            }

            KelmahChatInputBar(text: $message, onAttach: {}, onSend: { message = "" })
        }
        .navigationBarBackButtonHidden(onBack != nil)
        .navigationTitle("Chat")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct StitchPostJobScreenView: View {
    let step: Int
    @State private var title = "Kitchen cabinet rebuild"
    @State private var location = "Osu, Accra"

    private var activeStep: Int { min(max(step, 1), 3) }

    var body: some View {
        StitchScreenScaffold(title: "Post a Job", subtitle: "Capture scope, budget, timeline, and escrow-ready milestones.") {
            KelmahProgressStepper(activeStep: activeStep, totalSteps: 3)

            KelmahSectionPanel(title: "Job basics", subtitle: "Representative static entry state") {
                StitchTextInput(label: "Job title", text: $title)
                StitchTextInput(label: "Location", text: $location)
                StitchDetailRow(title: "Trade", value: "Carpentry", systemImage: "hammer.fill")
                StitchDetailRow(title: "Start window", value: "Within 7 days", systemImage: "calendar")
            }

            KelmahSectionPanel(title: "Budget and milestones") {
                StitchDetailRow(title: "Estimated budget", value: "GH₵ 2,400", systemImage: "banknote.fill")
                StitchDetailRow(title: "Escrow split", value: "40% materials • 60% completion", systemImage: "lock.shield.fill")
                KelmahBannerMessage(message: "Funds are only released after approved milestones.", tint: KelmahTheme.stitchSuccess)
            }

            KelmahButton(title: activeStep == 3 ? "Publish Job" : "Continue", systemImage: "arrow.right", action: {})
        }
    }
}

struct StitchWalletHubScreenView: View {
    var onDeposit: (() -> Void)? = nil

    var body: some View {
        StitchScreenScaffold(title: "Wallet & Payments", subtitle: "Escrow balances, payment methods, and recent wallet activity.") {
            KelmahWalletBalanceCard(amount: "GH₵ 4,250.00", escrowAmount: "GH₵ 1,800.00")

            KelmahQuickActionRow(actions: [
                KelmahQuickAction(title: "Deposit", systemImage: "plus", tint: KelmahTheme.stitchGold, action: { onDeposit?() }),
                KelmahQuickAction(title: "Withdraw", systemImage: "arrow.down", tint: KelmahTheme.stitchInfo, action: {}),
                KelmahQuickAction(title: "Methods", systemImage: "creditcard.fill", tint: KelmahTheme.stitchSuccess, action: {}),
                KelmahQuickAction(title: "Receipts", systemImage: "doc.text.fill", tint: KelmahTheme.stitchPrimary, action: {}),
            ])

            KelmahSectionPanel(title: "Recent transactions") {
                StitchPaymentActivityRow(title: "Milestone release", subtitle: "Kitchen cabinet rebuild", amount: "+ GH₵ 900", tone: KelmahTheme.stitchSuccess)
                StitchPaymentActivityRow(title: "Wallet deposit", subtitle: "MTN Mobile Money", amount: "+ GH₵ 1,200", tone: KelmahTheme.stitchSuccess)
                StitchPaymentActivityRow(title: "Escrow funding", subtitle: "Full house wiring", amount: "- GH₵ 1,800", tone: KelmahTheme.stitchError)
            }
        }
    }
}

struct StitchDepositScreenView: View {
    @State private var amount = "500"

    var body: some View {
        StitchScreenScaffold(title: "Deposit Funds", subtitle: "Top up your wallet before funding escrow or milestone payments.") {
            KelmahAmountInput(amount: $amount, quickAdds: [100, 250, 500])

            KelmahSectionPanel(title: "Payment method") {
                KelmahPaymentMethodCard(title: "MTN Mobile Money", detail: "024 123 4567 • Instant confirmation", systemImage: "iphone", isSelected: true, action: {})
                KelmahPaymentMethodCard(title: "Visa card", detail: "Ending 4242 • Processing fee applies", systemImage: "creditcard.fill", isSelected: false, action: {})
            }

            KelmahPanel(elevated: true) {
                VStack(alignment: .leading, spacing: KelmahSpacing.sm) {
                    StitchDetailRow(title: "Amount", value: "GH₵ \(amount)", systemImage: "banknote")
                    StitchDetailRow(title: "Wallet balance after", value: "GH₵ 4,750", systemImage: "wallet.pass.fill")
                }
            }

            KelmahButton(title: "Deposit GH₵ \(amount)", systemImage: "lock.fill", action: {})
        }
    }
}

struct StitchMilestoneApprovalScreenView: View {
    let milestoneId: String

    var body: some View {
        StitchScreenScaffold(title: "Approve Milestone", subtitle: "Review submitted work before releasing escrow for milestone #\(milestoneId).") {
            KelmahCommandDeck(
                eyebrow: "Milestone review",
                title: "First floor wiring complete",
                subtitle: "The worker submitted photos, notes, and inspection readiness for client approval.",
                stats: [
                    KelmahHeroStat(label: "Release", value: "GH₵ 900", tint: KelmahTheme.stitchGold),
                    KelmahHeroStat(label: "Due", value: "Today", tint: KelmahTheme.stitchInfo),
                    KelmahHeroStat(label: "Proof", value: "4 files", tint: KelmahTheme.stitchSuccess),
                ],
                chips: ["Escrow funded", "Photo proof", "Client action"]
            ) {
                KelmahButton(title: "Approve Release", systemImage: "checkmark.seal.fill", action: {})
            }

            KelmahSectionPanel(title: "Deliverables") {
                StitchDetailRow(title: "Conduit routing", value: "Completed", systemImage: "checkmark.circle.fill")
                StitchDetailRow(title: "Socket map update", value: "Completed", systemImage: "map.fill")
                StitchInlineAttachmentCard(title: "first-floor-proof.jpg", subtitle: "Uploaded today at 10:30 AM", systemImage: "photo.fill")
            }

            KelmahButton(title: "Request Revision", variant: .secondary, systemImage: "arrow.uturn.left", action: {})
        }
    }
}

struct StitchContractAgreementScreenView: View {
    let contractId: String

    var body: some View {
        StitchScreenScaffold(title: "Contract Agreement", subtitle: "Review scope, parties, milestones, and escrow terms for contract #\(contractId).") {
            KelmahPanel(elevated: true) {
                VStack(alignment: .leading, spacing: KelmahSpacing.md) {
                    KelmahBadge(text: "Ready to sign", tone: .success)
                    Text("Kitchen Cabinet Rebuild")
                        .font(KelmahTypography.headlineMedium)
                        .foregroundStyle(KelmahTheme.textPrimary)
                    Text("Custom cabinet fabrication, installation, finishing, and final inspection.")
                        .font(KelmahTypography.bodyMedium)
                        .foregroundStyle(KelmahTheme.textMuted)
                }
            }

            KelmahSectionPanel(title: "Parties") {
                StitchDetailRow(title: "Client", value: "Ama Boateng", systemImage: "person.fill")
                StitchDetailRow(title: "Artisan", value: "Mensah Woodworks", systemImage: "person.badge.shield.checkmark.fill")
            }

            KelmahSectionPanel(title: "Milestones") {
                StitchDetailRow(title: "Materials and measurements", value: "GH₵ 900", systemImage: "ruler.fill")
                StitchDetailRow(title: "Build and installation", value: "GH₵ 1,500", systemImage: "hammer.fill")
                KelmahBannerMessage(message: "Both parties agree that escrow release requires client milestone approval.", tint: KelmahTheme.stitchGold)
            }

            KelmahButton(title: "Sign Agreement", systemImage: "signature", action: {})
        }
    }
}

struct StitchFileDisputeScreenView: View {
    let jobId: String

    var body: some View {
        StitchScreenScaffold(title: "File a Dispute", subtitle: "Open a moderated case for job #\(jobId) with evidence and a clear resolution request.") {
            KelmahSectionPanel(title: "Reason") {
                KelmahRadioCard(title: "Work quality issue", subtitle: "Delivered work does not match the agreed scope.", isSelected: true, systemImage: "exclamationmark.triangle.fill", action: {})
                KelmahRadioCard(title: "Payment release issue", subtitle: "Milestone payment is blocked or disputed.", isSelected: false, systemImage: "banknote.fill", action: {})
            }

            KelmahSectionPanel(title: "Evidence") {
                StitchInlineAttachmentCard(title: "completion-photo.jpg", subtitle: "Photo evidence • 1.2 MB", systemImage: "photo.fill")
                StitchInlineAttachmentCard(title: "scope-notes.pdf", subtitle: "Original agreement excerpt", systemImage: "doc.text.fill")
                KelmahBannerMessage(message: "Moderators can review chat history, contract terms, and submitted files.", tint: KelmahTheme.stitchInfo)
            }

            KelmahButton(title: "Submit Dispute", systemImage: "paperplane.fill", action: {})
        }
    }
}

struct StitchBrowseTradesScreenView: View {
    @State private var query = ""

    var body: some View {
        StitchScreenScaffold(title: "Browse Trades", subtitle: "Find verified artisans and active jobs across high-demand trade categories.") {
            KelmahSearchField(text: $query, placeholder: "Search trade, skill, or location", trailingSystemImage: "slider.horizontal.3")

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: KelmahSpacing.sm) {
                    KelmahFilterChip(title: "Plumbing", isSelected: true, action: {})
                    KelmahFilterChip(title: "Electrical", isSelected: false, action: {})
                    KelmahFilterChip(title: "Carpentry", isSelected: false, action: {})
                    KelmahFilterChip(title: "Painting", isSelected: false, action: {})
                }
            }

            KelmahStatBento(stats: [
                KelmahHeroStat(label: "Open jobs", value: "128", tint: KelmahTheme.stitchGold),
                KelmahHeroStat(label: "Verified pros", value: "420", tint: KelmahTheme.stitchSuccess),
                KelmahHeroStat(label: "Avg rating", value: "4.8", tint: KelmahTheme.stitchInfo),
            ])

            KelmahJobCard(title: "Emergency Pipe Repair", employer: "Kojo Mensah", location: "East Legon", budget: "GH₵ 600", badge: "Urgent", badgeTone: .warning, skills: ["Plumbing", "Same day"], isSaved: true)
            KelmahJobCard(title: "Commercial HVAC Retrofit", employer: "North Ridge Plaza", location: "Accra Central", budget: "GH₵ 4,500", badge: "Verified", badgeTone: .success, skills: ["HVAC", "Commercial"])
        }
    }
}

struct StitchProfileSettingsScreenView: View {
    @State private var pushEnabled = true
    @State private var escrowAlerts = true

    var body: some View {
        StitchScreenScaffold(title: "Profile Settings", subtitle: "Manage account identity, alerts, payments, and trust controls.") {
            KelmahPanel(elevated: true) {
                HStack(spacing: KelmahSpacing.md) {
                    KelmahAvatar(initials: "AB", size: 56, isOnline: true)
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Ama Boateng")
                            .font(KelmahTypography.titleLarge)
                            .foregroundStyle(KelmahTheme.textPrimary)
                        Text("Verified client • Accra")
                            .font(KelmahTypography.caption)
                            .foregroundStyle(KelmahTheme.textMuted)
                    }
                    Spacer()
                    KelmahBadge(text: "Verified", tone: .success)
                }
            }

            KelmahSectionPanel(title: "Account") {
                StitchSettingsToggleRow(title: "Push notifications", subtitle: "Job, chat, and milestone alerts", isOn: $pushEnabled)
                StitchSettingsToggleRow(title: "Escrow release alerts", subtitle: "Require confirmation before funds move", isOn: $escrowAlerts)
                StitchDetailRow(title: "Payment methods", value: "2 active", systemImage: "creditcard.fill")
                StitchDetailRow(title: "Identity verification", value: "Approved", systemImage: "checkmark.shield.fill")
            }

            KelmahSectionPanel(title: "Privacy and security") {
                StitchDetailRow(title: "Password", value: "Updated 18 days ago", systemImage: "lock.fill")
                StitchDetailRow(title: "Trusted devices", value: "This iPhone", systemImage: "iphone")
            }
        }
    }
}

struct StitchNotificationsScreenView: View {
    var body: some View {
        StitchScreenScaffold(title: "Notifications", subtitle: "A focused feed of job, chat, wallet, and trust updates.") {
            KelmahSectionPanel(title: "Today") {
                KelmahNotificationRow(title: "Milestone ready for approval", body: "Kwame submitted proof for first floor wiring.", time: "5 min ago", systemImage: "checkmark.seal.fill", tint: KelmahTheme.stitchSuccess, isUnread: true)
                KelmahNotificationRow(title: "New message", body: "Mensah Woodworks sent a materials estimate.", time: "18 min ago", systemImage: "message.fill", tint: KelmahTheme.stitchInfo, isUnread: true)
                KelmahNotificationRow(title: "Escrow funded", body: "GH₵ 1,800 is secured for Full House Wiring.", time: "1 hr ago", systemImage: "lock.shield.fill", tint: KelmahTheme.stitchGold)
            }

            KelmahSectionPanel(title: "Earlier") {
                KelmahNotificationRow(title: "Profile verified", body: "Your identity verification was approved.", time: "Yesterday", systemImage: "person.badge.shield.checkmark.fill", tint: KelmahTheme.stitchSuccess)
                KelmahNotificationRow(title: "Saved search match", body: "3 new carpentry jobs are available in Accra.", time: "Yesterday", systemImage: "magnifyingglass", tint: KelmahTheme.stitchPrimary)
            }
        }
    }
}

struct StitchJobDetailScreenView: View {
    let jobId: String

    var body: some View {
        StitchScreenScaffold(title: "Job Detail", subtitle: "Review requirements, budget, client trust signals, and application readiness for job #\(jobId).") {
            KelmahCommandDeck(
                eyebrow: "Verified job",
                title: "Emergency Pipe Repair",
                subtitle: "Client needs a licensed plumber for a same-day leak inspection and repair in East Legon.",
                stats: [
                    KelmahHeroStat(label: "Budget", value: "GH₵ 600", tint: KelmahTheme.stitchGold),
                    KelmahHeroStat(label: "Timeline", value: "Today", tint: KelmahTheme.stitchInfo),
                    KelmahHeroStat(label: "Applicants", value: "8", tint: KelmahTheme.stitchSuccess),
                ],
                chips: ["Plumbing", "Urgent", "Escrow ready"]
            ) {
                KelmahButton(title: "Apply for Job", systemImage: "paperplane.fill", action: {})
            }

            KelmahSectionPanel(title: "Scope") {
                StitchDetailRow(title: "Issue", value: "Leaking kitchen supply line", systemImage: "wrench.and.screwdriver.fill")
                StitchDetailRow(title: "Location", value: "East Legon, Accra", systemImage: "mappin.and.ellipse")
                StitchDetailRow(title: "Client", value: "Verified • 12 completed jobs", systemImage: "checkmark.shield.fill")
            }

            KelmahTrustBadgeRow()
        }
    }
}

struct StitchDashboardScreenView: View {
    var body: some View {
        StitchScreenScaffold(title: "Home", subtitle: "A command center for active work, escrow actions, and verified opportunities.") {
            KelmahCommandDeck(
                eyebrow: "Today in Kelmah",
                title: "2 milestones need attention",
                subtitle: "Approve completed work, reply to active chats, and keep the next project moving.",
                stats: [
                    KelmahHeroStat(label: "In escrow", value: "GH₵ 3.6k", tint: KelmahTheme.stitchGold),
                    KelmahHeroStat(label: "Open jobs", value: "14", tint: KelmahTheme.stitchInfo),
                    KelmahHeroStat(label: "Unread", value: "5", tint: KelmahTheme.stitchSuccess),
                ],
                chips: ["Escrow protected", "Verified pros", "Fast matching"]
            ) {
                KelmahButton(title: "Review Work Queue", systemImage: "checkmark.seal.fill", action: {})
            }

            KelmahSectionPanel(title: "Active work") {
                StitchTimelineRow(title: "Full House Wiring", subtitle: "First floor proof submitted", value: "Due today", tint: KelmahTheme.stitchSuccess)
                StitchTimelineRow(title: "Kitchen Cabinet Rebuild", subtitle: "Materials milestone funded", value: "GH₵ 900", tint: KelmahTheme.stitchGold)
                StitchTimelineRow(title: "Bathroom Tile Refresh", subtitle: "Awaiting artisan acceptance", value: "Pending", tint: KelmahTheme.stitchInfo)
            }
        }
    }
}

struct StitchMessageInboxScreenView: View {
    @State private var query = ""

    var body: some View {
        StitchScreenScaffold(title: "Messages", subtitle: "Contract-aware conversations with job context and escrow signals.") {
            KelmahSearchField(text: $query, placeholder: "Search conversations")

            KelmahSectionPanel(title: "Priority conversations") {
                KelmahMessageRow(initials: "KM", name: "Kwame Mensah", preview: "First floor photos are ready for review.", time: "5m", unreadCount: 2, isOnline: true)
                KelmahMessageRow(initials: "MW", name: "Mensah Woodworks", preview: "I updated the cabinet measurements.", time: "24m", unreadCount: 1)
                KelmahMessageRow(initials: "AB", name: "Ama Boateng", preview: "Thanks, escrow confirmation received.", time: "1h", isOnline: true)
            }

            KelmahSectionPanel(title: "Pinned job context") {
                KelmahJobContextCard(title: "Full House Wiring", status: "Milestone review", detail: "GH₵ 900 ready")
                KelmahBannerMessage(message: "Chats remain attached to contracts so moderators can review context if a dispute is opened.", tint: KelmahTheme.stitchInfo)
            }
        }
    }
}

struct StitchProjectListScreenView: View {
    let title: String
    let subtitle: String
    var reference: String? = nil

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahStatBento(stats: [
                KelmahHeroStat(label: "Active", value: "6", tint: KelmahTheme.stitchGold),
                KelmahHeroStat(label: "Milestones", value: "11", tint: KelmahTheme.stitchInfo),
                KelmahHeroStat(label: "Completed", value: "24", tint: KelmahTheme.stitchSuccess),
            ])

            KelmahSectionPanel(title: "Project board", subtitle: reference.map { "Route reference: \($0)" }) {
                KelmahJobCard(title: "Kitchen Cabinet Rebuild", employer: "Ama Boateng", location: "Osu, Accra", budget: "GH₵ 2,400", badge: "Active", badgeTone: .success, skills: ["Carpentry", "Escrow"])
                KelmahJobCard(title: "Shopfront Paint Refresh", employer: "North Ridge Plaza", location: "Ridge", budget: "GH₵ 1,100", badge: "Applicants", badgeTone: .info, skills: ["Painting", "Commercial"])
                StitchTimelineRow(title: "Emergency Pipe Repair", subtitle: "Worker shortlisted and awaiting contract", value: "3 bids", tint: KelmahTheme.stitchGold)
            }
        }
    }
}

struct StitchJobWorkflowScreenView: View {
    let title: String
    let subtitle: String
    let reference: String

    @State private var proposal = "I can start this week and provide materials receipts before escrow release."
    @State private var budget = "850"

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahSectionPanel(title: "Job package") {
                StitchDetailRow(title: "Reference", value: reference, systemImage: "number")
                StitchDetailRow(title: "Trade", value: "Plumbing and repair", systemImage: "wrench.and.screwdriver.fill")
                StitchDetailRow(title: "Client", value: "Verified • 12 completed jobs", systemImage: "checkmark.shield.fill")
            }

            KelmahSectionPanel(title: "Proposal workspace") {
                StitchTextInput(label: "Budget estimate", text: $budget)
                StitchTextInput(label: "Proposal note", text: $proposal)
                KelmahBannerMessage(message: "This template represents application, edit, shortlist, and saved-job workflows without calling live services.", tint: KelmahTheme.stitchGold)
            }

            KelmahButton(title: "Save Workflow", systemImage: "tray.and.arrow.down.fill", action: {})
        }
    }
}

struct StitchWalletDetailScreenView: View {
    let title: String
    let subtitle: String
    var reference: String? = nil

    @State private var autoPayouts = true

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahWalletBalanceCard(amount: "GH₵ 4,250.00", caption: "Wallet status", escrowAmount: "GH₵ 1,800.00")

            KelmahSectionPanel(title: "Money movement", subtitle: reference.map { "Reference: \($0)" }) {
                StitchPaymentActivityRow(title: "Milestone release", subtitle: "Kitchen cabinet rebuild", amount: "+ GH₵ 900", tone: KelmahTheme.stitchSuccess)
                StitchPaymentActivityRow(title: "Mobile Money payout", subtitle: "MTN ending 4567", amount: "- GH₵ 650", tone: KelmahTheme.stitchInfo)
                StitchPaymentActivityRow(title: "Escrow funding", subtitle: "Full house wiring", amount: "- GH₵ 1,800", tone: KelmahTheme.stitchError)
            }

            KelmahSectionPanel(title: "Controls") {
                StitchSettingsToggleRow(title: "Auto payouts", subtitle: "Move eligible earnings to the preferred method", isOn: $autoPayouts)
                StitchDetailRow(title: "Primary method", value: "MTN Mobile Money", systemImage: "iphone")
                StitchDetailRow(title: "Receipt export", value: "PDF and CSV ready", systemImage: "doc.text.fill")
            }
        }
    }
}

struct StitchContractMilestoneScreenView: View {
    let title: String
    let subtitle: String
    let reference: String

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahCommandDeck(
                eyebrow: "Contract workflow",
                title: "Escrow-backed delivery plan",
                subtitle: "Define scope, track proof, and keep releases tied to accepted deliverables.",
                stats: [
                    KelmahHeroStat(label: "Contract", value: reference, tint: KelmahTheme.stitchGold),
                    KelmahHeroStat(label: "Funded", value: "70%", tint: KelmahTheme.stitchInfo),
                    KelmahHeroStat(label: "Tasks", value: "4", tint: KelmahTheme.stitchSuccess),
                ],
                chips: ["Scope locked", "Escrow funded", "Proof required"]
            ) {
                KelmahButton(title: "Review Terms", systemImage: "doc.text.fill", action: {})
            }

            KelmahSectionPanel(title: "Milestone timeline") {
                StitchTimelineRow(title: "Measurements and materials", subtitle: "Approved by client", value: "GH₵ 900", tint: KelmahTheme.stitchSuccess)
                StitchTimelineRow(title: "Build and installation", subtitle: "In progress", value: "GH₵ 1,500", tint: KelmahTheme.stitchGold)
                StitchTimelineRow(title: "Final inspection", subtitle: "Scheduled after proof upload", value: "Pending", tint: KelmahTheme.stitchInfo)
            }
        }
    }
}

struct StitchDisputeScreenView: View {
    let title: String
    let subtitle: String
    var reference: String? = nil

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahSectionPanel(title: "Case status", subtitle: reference.map { "Case reference: \($0)" }) {
                StitchTimelineRow(title: "Dispute opened", subtitle: "Client submitted scope mismatch evidence", value: "Day 1", tint: KelmahTheme.stitchError)
                StitchTimelineRow(title: "Moderator review", subtitle: "Chat, contract, and uploads attached", value: "Active", tint: KelmahTheme.stitchGold)
                StitchTimelineRow(title: "Resolution target", subtitle: "Partial release or revision request", value: "48h", tint: KelmahTheme.stitchInfo)
            }

            KelmahSectionPanel(title: "Evidence packet") {
                StitchInlineAttachmentCard(title: "scope-agreement.pdf", subtitle: "Original signed terms", systemImage: "doc.text.fill")
                StitchInlineAttachmentCard(title: "worksite-photo.jpg", subtitle: "Uploaded by client", systemImage: "photo.fill")
                KelmahBannerMessage(message: "Dispute templates are static, service-free screens that mirror the expected moderation workflow.", tint: KelmahTheme.stitchInfo)
            }
        }
    }
}

struct StitchSettingsDetailScreenView: View {
    let title: String
    let subtitle: String

    @State private var firstToggle = true
    @State private var secondToggle = false

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahSectionPanel(title: "Preferences") {
                StitchSettingsToggleRow(title: "Require confirmation", subtitle: "Ask before sensitive wallet or profile changes", isOn: $firstToggle)
                StitchSettingsToggleRow(title: "Share status updates", subtitle: "Send route-specific activity notifications", isOn: $secondToggle)
                StitchDetailRow(title: "Audit log", value: "Last reviewed today", systemImage: "clock.arrow.circlepath")
            }

            KelmahSectionPanel(title: "Security posture") {
                StitchDetailRow(title: "Trusted device", value: "This iPhone", systemImage: "iphone")
                StitchDetailRow(title: "Recovery channel", value: "ama@example.com", systemImage: "envelope.fill")
                KelmahBannerMessage(message: "Settings detail routes use representative controls and static account state only.", tint: KelmahTheme.stitchSuccess)
            }
        }
    }
}

struct StitchProfileDetailScreenView: View {
    let title: String
    let subtitle: String
    var reference: String? = nil

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahPanel(elevated: true) {
                VStack(alignment: .leading, spacing: KelmahSpacing.md) {
                    HStack(spacing: KelmahSpacing.md) {
                        KelmahAvatar(initials: "AB", size: 64, isOnline: true)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Ama Boateng")
                                .font(KelmahTypography.titleLarge)
                                .foregroundStyle(KelmahTheme.textPrimary)
                            Text(reference ?? "Verified client • Accra")
                                .font(KelmahTypography.caption)
                                .foregroundStyle(KelmahTheme.textMuted)
                        }
                        Spacer()
                    }
                    KelmahTrustBadgeRow(badges: ["ID verified", "12 jobs", "Fast payer"])
                }
            }

            KelmahSectionPanel(title: "Profile assets") {
                StitchInlineAttachmentCard(title: "trade-certificate.pdf", subtitle: "Electrical license • Approved", systemImage: "checkmark.seal.fill")
                StitchInlineAttachmentCard(title: "cabinet-gallery", subtitle: "8 portfolio images", systemImage: "photo.on.rectangle.fill")
                StitchDetailRow(title: "Public visibility", value: "Available for verified clients", systemImage: "eye.fill")
            }
        }
    }
}

struct StitchAuthFlowScreenView: View {
    let title: String
    let subtitle: String
    var email: String? = nil

    @State private var name = "Ama Boateng"
    @State private var emailText = "ama@example.com"
    @State private var password = "password"

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahSectionPanel(title: "Secure access") {
                StitchTextInput(label: "Full name", text: $name)
                StitchTextInput(label: "Email", text: Binding(get: { email ?? emailText }, set: { emailText = $0 }))
                VStack(alignment: .leading, spacing: 6) {
                    Text("Password or code")
                        .font(.inter(.semibold, 12))
                        .foregroundStyle(KelmahTheme.textMuted)
                    SecureField("Password or code", text: $password)
                        .font(.inter(.regular, 15))
                        .padding(.horizontal, 12)
                        .frame(height: 46)
                        .background(KelmahTheme.stitchSurfaceContainer)
                        .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous))
                }
            }

            KelmahSectionPanel(title: "Trust checklist") {
                StitchDetailRow(title: "Role", value: "Client or artisan selectable", systemImage: "person.2.fill")
                StitchDetailRow(title: "Verification", value: "Email code and identity checks", systemImage: "checkmark.shield.fill")
                StitchDetailRow(title: "Recovery", value: "Secure reset path", systemImage: "lock.rotation")
            }

            KelmahButton(title: "Continue Securely", systemImage: "arrow.right", action: {})
        }
    }
}

struct StitchOnboardingScreenView: View {
    let title: String
    let subtitle: String

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahCommandDeck(
                eyebrow: "Welcome to Kelmah",
                title: "Trade work with escrow confidence",
                subtitle: "Post jobs, find verified artisans, protect payments, and resolve disputes from one mobile workspace.",
                stats: [
                    KelmahHeroStat(label: "Trades", value: "40+", tint: KelmahTheme.stitchGold),
                    KelmahHeroStat(label: "Verified", value: "420", tint: KelmahTheme.stitchSuccess),
                    KelmahHeroStat(label: "Support", value: "24h", tint: KelmahTheme.stitchInfo),
                ],
                chips: ["Hire", "Earn", "Protect"]
            ) {
                KelmahButton(title: "Get Started", systemImage: "sparkles", action: {})
            }

            KelmahSectionPanel(title: "How it works") {
                StitchTimelineRow(title: "Choose your role", subtitle: "Client, artisan, or both", value: "1", tint: KelmahTheme.stitchGold)
                StitchTimelineRow(title: "Verify trust signals", subtitle: "Identity, credentials, and payment method", value: "2", tint: KelmahTheme.stitchInfo)
                StitchTimelineRow(title: "Work through escrow", subtitle: "Milestones protect both sides", value: "3", tint: KelmahTheme.stitchSuccess)
            }
        }
    }
}

struct StitchAdminQueueScreenView: View {
    let title: String
    let subtitle: String
    var reference: String? = nil

    var body: some View {
        StitchScreenScaffold(title: title, subtitle: subtitle) {
            KelmahStatBento(stats: [
                KelmahHeroStat(label: "Open", value: "18", tint: KelmahTheme.stitchError),
                KelmahHeroStat(label: "SLA", value: "6h", tint: KelmahTheme.stitchGold),
                KelmahHeroStat(label: "Cleared", value: "42", tint: KelmahTheme.stitchSuccess),
            ])

            KelmahSectionPanel(title: "Moderation queue", subtitle: reference.map { "Selected record: \($0)" }) {
                StitchTimelineRow(title: "Dispute DS-1042", subtitle: "Scope mismatch and release request", value: "High", tint: KelmahTheme.stitchError)
                StitchTimelineRow(title: "Verification VR-2208", subtitle: "Electrical license review", value: "New", tint: KelmahTheme.stitchGold)
                StitchTimelineRow(title: "Payout hold PH-1180", subtitle: "Manual risk check", value: "SLA", tint: KelmahTheme.stitchInfo)
            }

            KelmahSectionPanel(title: "Decision actions") {
                KelmahButton(title: "Approve", systemImage: "checkmark.seal.fill", action: {})
                KelmahButton(title: "Request More Evidence", variant: .secondary, systemImage: "tray.and.arrow.up.fill", action: {})
            }
        }
    }
}

private struct StitchScreenScaffold<Content: View>: View {
    let title: String
    let subtitle: String
    private let content: Content

    init(title: String, subtitle: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.subtitle = subtitle
        self.content = content()
    }

    var body: some View {
        KelmahPremiumBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: KelmahSpacing.lg) {
                    KelmahPanel(elevated: true) {
                        VStack(alignment: .leading, spacing: KelmahSpacing.sm) {
                            Text(title.uppercased())
                                .font(.inter(.bold, 11))
                                .tracking(0.9)
                                .foregroundStyle(KelmahTheme.stitchGold)
                            Text(title)
                                .font(KelmahTypography.headlineLargeMobile)
                                .foregroundStyle(KelmahTheme.textPrimary)
                            Text(subtitle)
                                .font(KelmahTypography.bodyMedium)
                                .foregroundStyle(KelmahTheme.textMuted)
                                .lineSpacing(2)
                        }
                    }

                    content
                }
                .padding(KelmahSpacing.lg)
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct StitchDetailRow: View {
    let title: String
    let value: String
    let systemImage: String

    var body: some View {
        HStack(spacing: KelmahSpacing.md) {
            Image(systemName: systemImage)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(KelmahTheme.stitchOnPrimaryContainer)
                .frame(width: 36, height: 36)
                .background(KelmahTheme.stitchGold)
                .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.medium, style: .continuous))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.inter(.semibold, 14))
                    .foregroundStyle(KelmahTheme.textPrimary)
                Text(value)
                    .font(.inter(.regular, 13))
                    .foregroundStyle(KelmahTheme.textMuted)
            }
            Spacer(minLength: 0)
        }
    }
}

private struct StitchInlineAttachmentCard: View {
    let title: String
    let subtitle: String
    let systemImage: String

    var body: some View {
        KelmahPanel {
            HStack(spacing: KelmahSpacing.md) {
                Image(systemName: systemImage)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(KelmahTheme.stitchInfo)
                    .frame(width: 42, height: 42)
                    .background(KelmahTheme.stitchInfo.opacity(0.14))
                    .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous))
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.inter(.semibold, 15))
                        .foregroundStyle(KelmahTheme.textPrimary)
                    Text(subtitle)
                        .font(.inter(.regular, 12))
                        .foregroundStyle(KelmahTheme.textMuted)
                }
                Spacer()
            }
        }
    }
}

private struct StitchPaymentActivityRow: View {
    let title: String
    let subtitle: String
    let amount: String
    let tone: Color

    var body: some View {
        HStack(spacing: KelmahSpacing.md) {
            Circle()
                .fill(tone.opacity(0.16))
                .frame(width: 38, height: 38)
                .overlay(Circle().fill(tone).frame(width: 10, height: 10))
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.inter(.semibold, 14))
                    .foregroundStyle(KelmahTheme.textPrimary)
                Text(subtitle)
                    .font(.inter(.regular, 12))
                    .foregroundStyle(KelmahTheme.textMuted)
            }
            Spacer()
            Text(amount)
                .font(.montserrat(.bold, 14))
                .foregroundStyle(tone)
        }
    }
}

private struct StitchTimelineRow: View {
    let title: String
    let subtitle: String
    let value: String
    let tint: Color

    var body: some View {
        HStack(alignment: .top, spacing: KelmahSpacing.md) {
            VStack(spacing: 4) {
                Circle()
                    .fill(tint)
                    .frame(width: 12, height: 12)
                Rectangle()
                    .fill(tint.opacity(0.24))
                    .frame(width: 2, height: 34)
            }
            .padding(.top, 4)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.inter(.semibold, 14))
                    .foregroundStyle(KelmahTheme.textPrimary)
                Text(subtitle)
                    .font(.inter(.regular, 12))
                    .foregroundStyle(KelmahTheme.textMuted)
            }
            Spacer(minLength: 8)
            Text(value)
                .font(.inter(.bold, 12))
                .foregroundStyle(tint)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(tint.opacity(0.12))
                .clipShape(Capsule())
        }
    }
}

private struct StitchTextInput: View {
    let label: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.inter(.semibold, 12))
                .foregroundStyle(KelmahTheme.textMuted)
            TextField(label, text: $text)
                .font(.inter(.regular, 15))
                .padding(.horizontal, 12)
                .frame(height: 46)
                .background(KelmahTheme.stitchSurfaceContainer)
                .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous))
        }
    }
}

private struct StitchSettingsToggleRow: View {
    let title: String
    let subtitle: String
    @Binding var isOn: Bool

    var body: some View {
        HStack(spacing: KelmahSpacing.md) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.inter(.semibold, 14))
                    .foregroundStyle(KelmahTheme.textPrimary)
                Text(subtitle)
                    .font(.inter(.regular, 12))
                    .foregroundStyle(KelmahTheme.textMuted)
            }
            Spacer()
            Toggle("", isOn: $isOn)
                .labelsHidden()
                .tint(KelmahTheme.stitchGold)
        }
    }
}
