import Foundation

@MainActor
final class AppEnvironment: ObservableObject {
    let apiEnvironment: APIEnvironment
    let sessionStore: SessionStore
    let apiClient: APIClient
    let authRepository: AuthRepository
    let jobsRepository: JobsRepository
    let messagesRepository: MessagesRepository
    let notificationsRepository: NotificationsRepository
    let profileRepository: ProfileRepository
    let realtimeSocketManager: RealtimeSocketManager
    let sessionCoordinator: SessionCoordinator
    let jobsViewModel: JobsViewModel
    let messagesViewModel: MessagesViewModel
    let notificationsViewModel: NotificationsViewModel

    init(
        apiEnvironment: APIEnvironment,
        sessionStore: SessionStore,
        apiClient: APIClient,
        authRepository: AuthRepository,
        jobsRepository: JobsRepository,
        messagesRepository: MessagesRepository,
        notificationsRepository: NotificationsRepository,
        profileRepository: ProfileRepository,
        realtimeSocketManager: RealtimeSocketManager,
        sessionCoordinator: SessionCoordinator,
        jobsViewModel: JobsViewModel,
        messagesViewModel: MessagesViewModel,
        notificationsViewModel: NotificationsViewModel
    ) {
        self.apiEnvironment = apiEnvironment
        self.sessionStore = sessionStore
        self.apiClient = apiClient
        self.authRepository = authRepository
        self.jobsRepository = jobsRepository
        self.messagesRepository = messagesRepository
        self.notificationsRepository = notificationsRepository
        self.profileRepository = profileRepository
        self.realtimeSocketManager = realtimeSocketManager
        self.sessionCoordinator = sessionCoordinator
        self.jobsViewModel = jobsViewModel
        self.messagesViewModel = messagesViewModel
        self.notificationsViewModel = notificationsViewModel
    }

    static func bootstrap() -> AppEnvironment {
        let apiEnvironment = APIEnvironment.current
        let sessionStore = SessionStore(keychainStore: KeychainStore())
        let apiClient = APIClient(environment: apiEnvironment, sessionStore: sessionStore)
        let authRepository = AuthRepository(apiClient: apiClient, sessionStore: sessionStore)
        let jobsRepository = JobsRepository(apiClient: apiClient)
        let messagesRepository = MessagesRepository(apiClient: apiClient, sessionStore: sessionStore)
        let notificationsRepository = NotificationsRepository(apiClient: apiClient)
        let profileRepository = ProfileRepository(apiClient: apiClient)
        let realtimeSocketManager = RealtimeSocketManager(environment: apiEnvironment, sessionStore: sessionStore)
        let sessionCoordinator = SessionCoordinator(authRepository: authRepository, sessionStore: sessionStore)
        let jobsViewModel = JobsViewModel(repository: jobsRepository)
        let messagesViewModel = MessagesViewModel(repository: messagesRepository, realtimeSocketManager: realtimeSocketManager)
        let notificationsViewModel = NotificationsViewModel(repository: notificationsRepository, realtimeSocketManager: realtimeSocketManager)
        apiClient.authRecoveryHandler = { [weak sessionCoordinator] in
            await sessionCoordinator?.handleUnauthorized() ?? false
        }
        return AppEnvironment(
            apiEnvironment: apiEnvironment,
            sessionStore: sessionStore,
            apiClient: apiClient,
            authRepository: authRepository,
            jobsRepository: jobsRepository,
            messagesRepository: messagesRepository,
            notificationsRepository: notificationsRepository,
            profileRepository: profileRepository,
            realtimeSocketManager: realtimeSocketManager,
            sessionCoordinator: sessionCoordinator,
            jobsViewModel: jobsViewModel,
            messagesViewModel: messagesViewModel,
            notificationsViewModel: notificationsViewModel
        )
    }
}
