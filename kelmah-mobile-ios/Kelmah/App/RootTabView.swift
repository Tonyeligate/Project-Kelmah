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

    var body: some View {
        Group {
            if environment.sessionStore.phase == .checking {
                ProgressView("Securing your Kelmah session...")
            } else if environment.sessionStore.isSessionUsable {
                TabView(selection: $selectedTab) {
                    HomeView(onBrowseJobs: { selectedTab = .jobs })
                        .tag(RootTab.home)
                        .tabItem { Label("Home", systemImage: "house") }
                    JobsView(viewModel: environment.jobsViewModel)
                        .tag(RootTab.jobs)
                        .tabItem { Label("Jobs", systemImage: "briefcase") }
                    MessagesView()
                        .tag(RootTab.messages)
                        .tabItem { Label("Messages", systemImage: "message") }
                    NotificationsView()
                        .tag(RootTab.alerts)
                        .tabItem { Label("Alerts", systemImage: "bell") }
                    ProfileView(
                        sessionCoordinator: environment.sessionCoordinator,
                        authRepository: environment.authRepository,
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
        }
        .task(id: environment.sessionStore.accessToken) {
            if environment.sessionStore.accessToken != nil {
                await environment.sessionCoordinator.bootstrapSession(force: true)
            }
        }
    }
}
