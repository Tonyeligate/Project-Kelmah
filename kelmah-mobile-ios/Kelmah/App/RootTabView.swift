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
                        onHandledPendingJob: { pendingJobId = nil }
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
                        sessionStore: environment.sessionStore
                    )
                        .tag(RootTab.profile)
                        .tabItem { Label("Profile", systemImage: "person") }
                }
                .tint(KelmahTheme.accent)
            } else {
                NavigationStack {
                    LoginView(authRepository: environment.authRepository)
                }
            }
        }
        .task {
            await environment.sessionCoordinator.bootstrapSession()
            await bootstrapShellDataIfNeeded()
        }
        .task(id: environment.sessionStore.accessToken) {
            if environment.sessionStore.accessToken != nil {
                await environment.sessionCoordinator.bootstrapSession(force: true)
                await bootstrapShellDataIfNeeded()
            } else {
                environment.realtimeSocketManager.stop()
            }
        }
    }

    private func bootstrapShellDataIfNeeded() async {
        guard environment.sessionStore.isSessionUsable else { return }
        await environment.jobsViewModel.bootstrap()
        await environment.messagesViewModel.bootstrap()
        await environment.notificationsViewModel.bootstrap()
    }
}
