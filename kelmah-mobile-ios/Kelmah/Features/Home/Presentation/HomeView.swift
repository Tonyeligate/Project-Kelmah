import SwiftUI

struct HomeView: View {
    let currentUser: SessionUser?
    @ObservedObject var jobsViewModel: JobsViewModel
    @ObservedObject var messagesViewModel: MessagesViewModel
    @ObservedObject var notificationsViewModel: NotificationsViewModel
    let onBrowseJobs: () -> Void
    let onOpenMessages: () -> Void
    let onOpenNotifications: () -> Void
    let onOpenJob: (String) -> Void
    let onOpenConversation: (String) -> Void
    let onOpenNotification: (NotificationActionTarget) -> Void

    private var userRole: KelmahUserRole {
        currentUser?.kelmahUserRole ?? .worker
    }

    private var displayName: String {
        currentUser?.displayName ?? "Kelmah \(userRole.title)"
    }

    private var homeJobs: [JobSummary] {
        userRole == .hirer ? jobsViewModel.hirerJobs : jobsViewModel.recommendedJobs
    }

    private var unreadMessages: Int {
        messagesViewModel.totalUnreadCount
    }

    private var activeJobs: Int {
        jobsViewModel.hirerJobs.filter { job in
            guard let status = job.status?.lowercased() else { return false }
            return status == "open" || status == "in-progress"
        }.count
    }

    private var deckStats: [KelmahHeroStat] {
        [
            KelmahHeroStat(
                label: userRole == .hirer ? "Active jobs" : "Good jobs",
                value: "\(userRole == .hirer ? activeJobs : homeJobs.count)",
                tint: KelmahTheme.cyan
            ),
            KelmahHeroStat(
                label: userRole == .hirer ? "New chats" : "Saved",
                value: "\(userRole == .hirer ? unreadMessages : jobsViewModel.savedJobs.count)",
                tint: KelmahTheme.sun
            ),
            KelmahHeroStat(
                label: "Alerts",
                value: "\(notificationsViewModel.unreadCount)",
                tint: KelmahTheme.success
            ),
        ]
    }

    private var signalChips: [String] {
        var chips: [String] = []
        if unreadMessages > 0 {
            chips.append("\(unreadMessages) unread chats")
        }
        if notificationsViewModel.unreadCount > 0 {
            chips.append("\(notificationsViewModel.unreadCount) new alerts")
        }
        let urgentCount = homeJobs.filter(\.isUrgent).count
        if userRole == .worker, urgentCount > 0 {
            chips.append("\(urgentCount) urgent opportunities")
        }
        if userRole == .hirer, activeJobs > 0 {
            chips.append("\(activeJobs) active hiring threads")
        }
        return chips
    }

    var body: some View {
        KelmahPremiumBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    KelmahCommandDeck(
                        eyebrow: userRole == .hirer ? "HIRING COMMAND" : "WORK COMMAND",
                        title: "Welcome back, \(displayName)",
                        subtitle: userRole == .hirer
                            ? "Track hiring velocity, open conversations, and keep live jobs moving."
                            : "Scan high-fit work, react to chats, and move from discovery to application fast.",
                        stats: deckStats,
                        chips: signalChips
                    ) {
                        VStack(spacing: 10) {
                            Button(action: onBrowseJobs) {
                                Text(userRole == .hirer ? "Open Hiring Market" : "Find Work Now")
                                    .fontWeight(.bold)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 48)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(KelmahTheme.sun)
                            .foregroundStyle(Color.black)
                            .controlSize(.large)

                            HStack(spacing: 10) {
                                Button(action: onOpenMessages) {
                                    Text("Messages")
                                        .fontWeight(.semibold)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 46)
                                }
                                .buttonStyle(.bordered)
                                .tint(KelmahTheme.cyan)

                                Button(action: onOpenNotifications) {
                                    Text("Alerts")
                                        .fontWeight(.semibold)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 46)
                                }
                                .buttonStyle(.bordered)
                                .tint(KelmahTheme.sun)
                            }
                            .controlSize(.large)
                        }
                    }

                    if let homeErrorMessage = jobsViewModel.homeErrorMessage {
                        KelmahBannerMessage(message: homeErrorMessage, tint: KelmahTheme.danger)
                    }

                    KelmahPanel {
                        KelmahSectionHeader(
                            title: userRole == .hirer
                                ? "Recent hiring activity"
                                : (jobsViewModel.recommendationState == .profileIncomplete
                                    ? "More jobs while your profile improves"
                                    : recommendationSectionTitle),
                            subtitle: userRole == .hirer
                                ? "Your open roles and recent demand at a glance"
                                : "Curated opportunities from your live worker profile",
                            actionLabel: userRole == .hirer ? "Open market" : "Find work",
                            onAction: onBrowseJobs
                        )
                    }

                    if userRole == .worker,
                       let recommendationContextMessage = jobsViewModel.recommendationContextMessage,
                       recommendationContextMessage.isEmpty == false {
                        KelmahBannerMessage(
                            message: recommendationContextMessage,
                            tint: recommendationBannerTint
                        )
                    }

                    if jobsViewModel.isLoadingHomeFeed, homeJobs.isEmpty {
                        KelmahPanel {
                            HStack(spacing: 10) {
                                ProgressView()
                                    .tint(KelmahTheme.sun)
                                Text("Loading jobs for you...")
                                    .foregroundStyle(KelmahTheme.textMuted)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    } else if homeJobs.isEmpty {
                        KelmahBannerMessage(
                            message: userRole == .hirer
                                ? "Your most recent jobs will appear once your hiring activity syncs."
                                : (jobsViewModel.recommendationState == .profileIncomplete
                                    ? "Finish your profile to unlock better job matches."
                                    : (jobsViewModel.recommendationState == .fallback
                                        ? "No urgent jobs right now. Tap Find Work to view the full market."
                                        : (jobsViewModel.recommendationState == .failed
                                            ? "Job matches are temporarily unavailable. Tap Find Work."
                                            : "Jobs for you will show here soon."))),
                            tint: KelmahTheme.cyan
                        )
                    } else {
                        ForEach(homeJobs) { job in
                            HomeJobCard(role: userRole, job: job) {
                                onOpenJob(job.id)
                            }
                        }
                    }

                    KelmahPanel {
                        KelmahSectionHeader(
                            title: "Messages",
                            subtitle: "Priority conversations and unread movement",
                            actionLabel: "Open",
                            onAction: onOpenMessages
                        )
                    }

                    if messagesViewModel.conversations.isEmpty {
                        KelmahBannerMessage(
                            message: userRole == .worker
                                ? "New messages will appear here."
                                : "Messages created from hiring and jobs will appear here.",
                            tint: KelmahTheme.cyan
                        )
                    } else {
                        ForEach(Array(messagesViewModel.conversations.prefix(3)), id: \.id) { conversation in
                            HomeConversationCard(conversation: conversation) {
                                onOpenConversation(conversation.id)
                            }
                        }
                    }

                    KelmahPanel {
                        KelmahSectionHeader(
                            title: "Alerts",
                            subtitle: "Job, payment, and conversation signals",
                            actionLabel: "Open",
                            onAction: onOpenNotifications
                        )
                    }

                    if notificationsViewModel.notifications.isEmpty {
                        KelmahBannerMessage(
                            message: userRole == .worker
                                ? "New alerts will show here."
                                : "Job and message alerts will appear here as activity comes in.",
                            tint: KelmahTheme.cyan
                        )
                    } else {
                        ForEach(Array(notificationsViewModel.notifications.prefix(3)), id: \.id) { notification in
                            HomeNotificationCard(notification: notification) {
                                if let target = notification.actionTarget {
                                    onOpenNotification(target)
                                } else {
                                    onOpenNotifications()
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 18)
                .padding(.bottom, 20)
            }
            .scrollIndicators(.hidden)
            .refreshable {
                async let jobs: () = jobsViewModel.refreshHome(for: userRole)
                async let msgs: () = messagesViewModel.refreshConversations()
                async let notifs: () = notificationsViewModel.refresh()
                _ = await (jobs, msgs, notifs)
            }
        }
        .task(id: currentUser?.id ?? "guest") {
            async let jobs: () = jobsViewModel.refreshHome(for: userRole)
            async let msgs: () = messagesViewModel.refreshConversations()
            async let notifs: () = notificationsViewModel.refresh()
            _ = await (jobs, msgs, notifs)
        }
    }
}

private extension HomeView {
    var recommendationSectionTitle: String {
        switch jobsViewModel.recommendationState {
        case .profileIncomplete:
            return "More jobs while you finish your profile"
        case .fallback:
            return "Urgent jobs right now"
        case .failed:
            return "Jobs feed"
        case .idle, .personalized:
            return "Jobs for you"
        }
    }

    var recommendationBannerTint: Color {
        switch jobsViewModel.recommendationState {
        case .failed:
            return KelmahTheme.danger
        case .fallback, .profileIncomplete:
            return KelmahTheme.sun
        case .idle, .personalized:
            return KelmahTheme.cyan
        }
    }
}

private func formatMatchScore(_ score: Double) -> String {
    if score.truncatingRemainder(dividingBy: 1) == 0 {
        return String(Int(score))
    }
    return String(format: "%.1f", score)
}

private struct HomeJobCard: View {
    let role: KelmahUserRole
    let job: JobSummary
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            KelmahPanel {
                VStack(alignment: .leading, spacing: 11) {
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(job.title)
                                .font(.headline.weight(.bold))
                                .foregroundStyle(KelmahTheme.textPrimary)
                                .multilineTextAlignment(.leading)
                            Text(job.employerName)
                                .font(.subheadline)
                                .foregroundStyle(KelmahTheme.textMuted)
                                .lineLimit(1)
                        }
                        Spacer(minLength: 0)
                        if role == .worker, let matchScore = job.matchScore {
                            KelmahSignalChip(text: "\(formatMatchScore(matchScore))% fit", accent: KelmahTheme.success)
                        } else if let status = job.status, status.isEmpty == false {
                            KelmahSignalChip(text: status.capitalized, accent: KelmahTheme.cyan)
                        }
                    }

                    Text(job.aiReasoning ?? job.description)
                        .font(.subheadline)
                        .foregroundStyle(KelmahTheme.textMuted)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 8) {
                        KelmahSignalChip(text: job.category, accent: KelmahTheme.cyan)
                        if job.isUrgent {
                            KelmahSignalChip(text: "Urgent", accent: KelmahTheme.danger)
                        }
                    }

                    Text(job.locationLabel)
                        .font(.footnote)
                        .foregroundStyle(KelmahTheme.textMuted)

                    HStack {
                        Text(job.budgetLabel)
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(KelmahTheme.sun)
                        Spacer()
                        if role == .hirer, job.proposalCount > 0 {
                            Text("\(job.proposalCount) proposals")
                                .font(.footnote)
                                .foregroundStyle(KelmahTheme.textMuted)
                        }
                    }

                    Text(RelativeTimeFormatter.relativeOrFallback(job.postedAt) ?? "Just now")
                        .font(.caption)
                        .foregroundStyle(KelmahTheme.textMuted)

                    Text(role == .worker ? "Tap to open job" : "Tap to open listing")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(KelmahTheme.sun)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .contentShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct HomeConversationCard: View {
    let conversation: MessageConversation
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            KelmahPanel {
                HStack(alignment: .top, spacing: 12) {
                    Circle()
                        .fill(KelmahTheme.sun.opacity(0.2))
                        .frame(width: 42, height: 42)
                        .overlay(
                            Text(String(conversation.displayTitle.prefix(1)).uppercased())
                                .font(.headline)
                                .foregroundStyle(KelmahTheme.sun)
                        )

                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(conversation.displayTitle)
                                .font(.headline)
                                .lineLimit(1)
                                .foregroundStyle(KelmahTheme.textPrimary)
                            Spacer()
                            if conversation.unreadCount > 0 {
                                KelmahSignalChip(
                                    text: "\(conversation.unreadCount) unread",
                                    accent: KelmahTheme.success
                                )
                            }
                        }
                        Text(conversation.lastMessagePreview)
                            .font(.subheadline)
                            .foregroundStyle(KelmahTheme.textMuted)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                        Text(RelativeTimeFormatter.relativeOrFallback(conversation.lastMessageAt) ?? "Just now")
                            .font(.caption)
                            .foregroundStyle(KelmahTheme.textMuted)
                        Text("Tap to open chat")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(KelmahTheme.sun)
                    }
                }
            }
            .contentShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct HomeNotificationCard: View {
    let notification: AppNotificationItem
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            KelmahPanel {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text(notification.displayTag)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(notification.isRead ? KelmahTheme.textMuted : KelmahTheme.sun)
                        Spacer()
                        if notification.isRead == false {
                            KelmahSignalChip(text: "New", accent: KelmahTheme.sun)
                        }
                    }

                    Text(notification.title)
                        .font(.headline)
                        .foregroundStyle(KelmahTheme.textPrimary)
                        .multilineTextAlignment(.leading)

                    Text(notification.content)
                        .font(.subheadline)
                        .foregroundStyle(KelmahTheme.textMuted)
                        .multilineTextAlignment(.leading)
                        .lineLimit(3)

                    HStack {
                        Text(RelativeTimeFormatter.relativeOrFallback(notification.createdAt) ?? "Just now")
                            .font(.caption)
                            .foregroundStyle(KelmahTheme.textMuted)
                        Spacer()
                        if let target = notification.actionTarget {
                            Text(target.label)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(KelmahTheme.cyan)
                        }
                    }

                    Text("Tap to open alert")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(KelmahTheme.sun)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .contentShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
