import SwiftUI

private enum RootTab: Hashable {
    case home
    case jobs
    case messages
    case alerts
    case profile
}

struct RootTabView: View {
    @EnvironmentObject private var environment: AppEnvironment
    @State private var selectedTab: RootTab = .home
    @State private var pendingConversationId: String?
    @State private var pendingJobId: String?

    private var sessionTaskKey: String {
        let token = environment.sessionStore.accessToken ?? "guest"
        let phase: String
        switch environment.sessionStore.phase {
        case .checking:
            phase = "checking"
        case .authenticated:
            phase = "authenticated"
        case .unauthenticated:
            phase = "unauthenticated"
        case let .recoverableFailure(message):
            phase = "recoverable-\(message)"
        }
        return "\(token)-\(phase)"
    }

    private var userRole: KelmahUserRole {
        environment.sessionStore.currentUser?.kelmahUserRole ?? .worker
    }

    var body: some View {
        let messagesBadge = environment.messagesViewModel.totalUnreadCount
        let notificationsBadge = environment.notificationsViewModel.unreadCount

        Group {
            if environment.sessionStore.phase == .checking {
                ProgressView("Securing your Kelmah session...")
            } else if environment.sessionStore.isSessionUsable {
                TabView(selection: $selectedTab) {
                    HomeView(
                        currentUser: environment.sessionStore.currentUser,
                        jobsViewModel: environment.jobsViewModel,
                        messagesViewModel: environment.messagesViewModel,
                        notificationsViewModel: environment.notificationsViewModel,
                        onBrowseJobs: { selectedTab = .jobs },
                        onOpenMessages: { selectedTab = .messages },
                        onOpenNotifications: { selectedTab = .alerts },
                        onOpenJob: { jobId in
                            pendingJobId = jobId
                            selectedTab = .jobs
                        },
                        onOpenConversation: { conversationId in
                            pendingConversationId = conversationId
                            selectedTab = .messages
                        },
                        onOpenNotification: { target in
                            switch target {
                            case let .conversation(conversationId):
                                pendingConversationId = conversationId
                                selectedTab = .messages
                            case let .job(jobId):
                                pendingJobId = jobId
                                selectedTab = .jobs
                            }
                        }
                    )
                        .tag(RootTab.home)
                        .tabItem { Label(userRole == .hirer ? "Dashboard" : "Home", systemImage: "house") }
                    JobsView(
                        viewModel: environment.jobsViewModel,
                        userRole: userRole,
                        pendingJobId: pendingJobId,
                        onHandledPendingJob: { pendingJobId = nil },
                        onMessageHirer: { jobId, hirerId in
                            guard let hirerId, hirerId.isEmpty == false else { return }
                            if let conversationId = await environment.messagesViewModel.createConversation(participantId: hirerId, jobId: jobId) {
                                pendingConversationId = conversationId
                                selectedTab = .messages
                            }
                        }
                    )
                        .tag(RootTab.jobs)
                        .tabItem { Label(userRole == .hirer ? "Hiring" : "Jobs", systemImage: "briefcase") }
                    MessagesView(
                        viewModel: environment.messagesViewModel,
                        pendingConversationId: pendingConversationId,
                        onHandledPendingConversation: { pendingConversationId = nil }
                    )
                        .badge(messagesBadge == 0 ? nil : messagesBadge)
                        .tag(RootTab.messages)
                        .tabItem { Label("Messages", systemImage: "message") }
                    NotificationsView(viewModel: environment.notificationsViewModel) { target in
                        switch target {
                        case let .conversation(conversationId):
                            pendingConversationId = conversationId
                            selectedTab = .messages
                        case let .job(jobId):
                            pendingJobId = jobId
                            selectedTab = .jobs
                        }
                    }
                        .badge(notificationsBadge == 0 ? nil : notificationsBadge)
                        .tag(RootTab.alerts)
                        .tabItem { Label("Alerts", systemImage: "bell") }
                    ProfileView(
                        sessionCoordinator: environment.sessionCoordinator,
                        authRepository: environment.authRepository,
                        profileRepository: environment.profileRepository,
                        sessionStore: environment.sessionStore,
                        onHireNow: { selectedTab = .jobs },
                        onMessageWorker: { selectedTab = .messages }
                    )
                        .tag(RootTab.profile)
                        .tabItem { Label("Profile", systemImage: "person") }
                }
                .tint(KelmahTheme.accent)
            } else if case let .recoverableFailure(message) = environment.sessionStore.phase {
                SessionRecoveryView(
                    userName: environment.sessionStore.currentUser?.displayName,
                    message: message,
                    onRetry: {
                        Task { await environment.sessionCoordinator.bootstrapSession(force: true) }
                    },
                    onSignInAgain: {
                        Task { await environment.sessionCoordinator.logout() }
                    }
                )
            } else {
                NavigationStack {
                    LoginView(authRepository: environment.authRepository)
                }
            }
        }
        .task(id: sessionTaskKey) {
            await environment.sessionCoordinator.bootstrapSession(force: true)
            if environment.sessionStore.isSessionUsable {
                await bootstrapShellDataIfNeeded()
            } else {
                environment.realtimeSocketManager.stop()
                environment.jobsViewModel.reset()
                environment.messagesViewModel.reset()
                environment.notificationsViewModel.reset()
            }
        }
    }

    private func bootstrapShellDataIfNeeded() async {
        guard environment.sessionStore.isSessionUsable else { return }
        await environment.jobsViewModel.bootstrap(for: userRole)
        await environment.messagesViewModel.bootstrap()
        await environment.notificationsViewModel.bootstrap()
    }
}

private struct SessionRecoveryView: View {
    let userName: String?
    let message: String
    let onRetry: () -> Void
    let onSignInAgain: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Spacer()
            VStack(alignment: .leading, spacing: 14) {
                Text("Session check needed")
                    .font(.title2.bold())
                if let userName, userName.isEmpty == false {
                    Text("Saved account: \(userName)")
                        .foregroundStyle(.secondary)
                }
                Text(message)
                    .foregroundStyle(.secondary)
                Text("Sign in again before opening jobs, chats, alerts, or profile actions.")
                    .foregroundStyle(.primary)
                Button("Retry session check", action: onRetry)
                    .buttonStyle(.borderedProminent)
                    .tint(KelmahTheme.accent)
                Button("Sign in again", action: onSignInAgain)
                    .buttonStyle(.bordered)
            }
            .padding(24)
            .frame(maxWidth: 480, alignment: .leading)
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
            Spacer()
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(KelmahTheme.background.ignoresSafeArea())
    }
}
