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

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(displayName)
                        .font(.largeTitle.bold())
                    Text(userRole == .hirer ? "Track active hiring work, unread follow-up, and fresh alerts from one screen." : "Review your strongest job matches, unread work, and recent alerts before you start applying.")
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text(userRole == .hirer ? "Hirer command view" : "Worker command view")
                        .font(.headline)
                    Text(userRole == .hirer ? "Use this surface to spot active jobs that need attention, keep candidate conversations moving, and react to alerts faster." : "Use this surface to review your best matches, keep saved opportunities close, and react to work alerts faster.")
                    HStack(spacing: 10) {
                        SummaryTile(label: userRole == .hirer ? "Active jobs" : "Matches", value: userRole == .hirer ? activeJobs : homeJobs.count)
                        SummaryTile(label: userRole == .hirer ? "Unread chats" : "Saved jobs", value: userRole == .hirer ? unreadMessages : jobsViewModel.savedJobs.count)
                        SummaryTile(label: "Alerts", value: notificationsViewModel.unreadCount)
                    }
                    HStack(spacing: 10) {
                        Button(action: onBrowseJobs) {
                            Text(userRole == .hirer ? "Open Hiring Market" : "Browse Jobs")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(KelmahTheme.accent)

                        Button(action: onOpenMessages) {
                            Text("Messages")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)

                        Button(action: onOpenNotifications) {
                            Text("Alerts")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                }
                .padding()
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                if let homeErrorMessage = jobsViewModel.homeErrorMessage {
                    HomeMessageCard(message: homeErrorMessage, tint: .red.opacity(0.12))
                }

                HomeSectionHeader(
                    title: userRole == .hirer
                        ? "Recent hiring activity"
                        : (jobsViewModel.recommendationState == .profileIncomplete
                            ? "General matches while profile completes"
                            : recommendationSectionTitle),
                    actionLabel: userRole == .hirer ? "Open market" : "Browse jobs",
                    onAction: onBrowseJobs
                )

                if userRole == .worker,
                   let recommendationContextMessage = jobsViewModel.recommendationContextMessage,
                   recommendationContextMessage.isEmpty == false {
                    HomeMessageCard(message: recommendationContextMessage, tint: recommendationBannerTint)
                }

                if jobsViewModel.isLoadingHomeFeed, homeJobs.isEmpty {
                    ProgressView("Loading the latest work intelligence...")
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                } else if homeJobs.isEmpty {
                    HomeMessageCard(
                        message: userRole == .hirer
                            ? "Your most recent jobs will appear here once your hiring activity is available."
                            : (jobsViewModel.recommendationState == .profileIncomplete
                                ? "Kelmah needs a more complete worker profile before it can rank personalized matches accurately."
                                : (jobsViewModel.recommendationState == .fallback
                                    ? "Kelmah could not recover enough urgent jobs while the recommendation feed is degraded."
                                    : (jobsViewModel.recommendationState == .failed
                                        ? "Browse the jobs feed while personalized matching is unavailable."
                                        : "Your strongest matches will appear here once the recommendation feed returns results."))),
                        tint: .white
                    )
                } else {
                    ForEach(homeJobs) { job in
                        HomeJobCard(role: userRole, job: job) {
                            onOpenJob(job.id)
                        }
                    }
                }

                HomeSectionHeader(title: "Recent conversations", actionLabel: "Open messages", onAction: onOpenMessages)

                if messagesViewModel.conversations.isEmpty {
                    HomeMessageCard(message: "Messages created from job and hiring flows will appear here for quick follow-up.", tint: .white)
                } else {
                    ForEach(Array(messagesViewModel.conversations.prefix(3))) { conversation in
                        HomeConversationCard(conversation: conversation) {
                            onOpenConversation(conversation.id)
                        }
                    }
                }

                HomeSectionHeader(title: "Recent alerts", actionLabel: "Open alerts", onAction: onOpenNotifications)

                if notificationsViewModel.notifications.isEmpty {
                    HomeMessageCard(message: "Job, payment, and message alerts will appear here as activity comes in.", tint: .white)
                } else {
                    ForEach(Array(notificationsViewModel.notifications.prefix(3))) { notification in
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
            .padding(20)
        }
        .background(KelmahTheme.background.ignoresSafeArea())
        .task(id: currentUser?.id ?? "guest") {
            await jobsViewModel.refreshHome(for: userRole)
        }
        .refreshable {
            await jobsViewModel.refreshHome(for: userRole)
            await messagesViewModel.refreshConversations()
            await notificationsViewModel.refresh()
        }
    }
}

private struct SummaryTile: View {
    let label: String
    let value: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(value)")
                .font(.title3.bold())
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(KelmahTheme.accent.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct HomeSectionHeader: View {
    let title: String
    let actionLabel: String
    let onAction: () -> Void

    var body: some View {
        HStack {
            Text(title)
                .font(.headline)
            Spacer()
            Button(actionLabel, action: onAction)
                .font(.subheadline.weight(.semibold))
        }
    }
}

private struct HomeMessageCard: View {
    let message: String
    let tint: Color

    var body: some View {
        Text(message)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(tint)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct HomeJobCard: View {
    let role: KelmahUserRole
    let job: JobSummary
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .top) {
                    Text(job.title)
                        .font(.headline)
                        .multilineTextAlignment(.leading)
                    Spacer()
                    if role == .worker, let matchScore = job.matchScore {
                        Text("\(formatMatchScore(matchScore))% match")
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(KelmahTheme.accent.opacity(0.12))
                            .clipShape(Capsule())
                    } else if let status = job.status, status.isEmpty == false {
                        Text(status.capitalized)
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.secondary.opacity(0.1))
                            .clipShape(Capsule())
                    }
                }

                Text(job.aiReasoning ?? job.description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)

                Text(job.locationLabel)
                    .font(.footnote)
                    .foregroundStyle(.secondary)

                HStack {
                    Text(job.budgetLabel)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(KelmahTheme.accent)
                    if role == .hirer, job.proposalCount > 0 {
                        Text("\(job.proposalCount) proposals")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                let meta = [
                    RelativeTimeFormatter.relativeOrFallback(job.postedAt),
                    job.isUrgent ? "Priority listing" : nil,
                ].compactMap { $0 }
                if meta.isEmpty == false {
                    Text(meta.joined(separator: " • "))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private extension HomeView {
    var recommendationSectionTitle: String {
        switch jobsViewModel.recommendationState {
        case .profileIncomplete:
            return "General matches while profile completes"
        case .fallback:
            return "Urgent jobs while matching recovers"
        case .failed:
            return "Matching temporarily unavailable"
        case .idle, .personalized:
            return "Recommended matches"
        }
    }

    var recommendationBannerTint: Color {
        switch jobsViewModel.recommendationState {
        case .failed:
            return .red.opacity(0.12)
        case .fallback, .profileIncomplete:
            return KelmahTheme.accent.opacity(0.12)
        case .idle, .personalized:
            return .white
        }
    }
}

private func formatMatchScore(_ score: Double) -> String {
    if score.truncatingRemainder(dividingBy: 1) == 0 {
        return String(Int(score))
    }
    return String(format: "%.1f", score)
}

private struct HomeConversationCard: View {
    let conversation: MessageConversation
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(conversation.displayTitle)
                        .font(.headline)
                        .lineLimit(1)
                    Spacer()
                    if conversation.unreadCount > 0 {
                        Text("\(conversation.unreadCount) unread")
                            .font(.caption.weight(.semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(KelmahTheme.accent.opacity(0.12))
                            .clipShape(Capsule())
                    }
                }
                Text(conversation.lastMessagePreview)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)
                Text(RelativeTimeFormatter.relativeOrFallback(conversation.lastMessageAt) ?? "Just now")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private struct HomeNotificationCard: View {
    let notification: AppNotificationItem
    let onOpen: () -> Void

    var body: some View {
        Button(action: onOpen) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(notification.title)
                        .font(.headline)
                        .multilineTextAlignment(.leading)
                        .lineLimit(2)
                    Spacer()
                    if notification.isRead == false {
                        Text("Unread")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(KelmahTheme.accent)
                    }
                }
                Text(notification.content)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)
                HStack {
                    Text(RelativeTimeFormatter.relativeOrFallback(notification.createdAt) ?? "Just now")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Spacer()
                    if let target = notification.actionTarget {
                        Text(target.label)
                            .font(.caption)
                            .foregroundStyle(KelmahTheme.accent)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
