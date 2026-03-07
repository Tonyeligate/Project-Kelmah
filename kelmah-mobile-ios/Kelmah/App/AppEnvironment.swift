import Foundation

@MainActor
final class AppEnvironment: ObservableObject {
    let apiEnvironment: APIEnvironment
    let sessionStore: SessionStore
    let apiClient: APIClient
    let authRepository: AuthRepository
    let jobsRepository: JobsRepository
    let sessionCoordinator: SessionCoordinator
    let jobsViewModel: JobsViewModel

    init(
        apiEnvironment: APIEnvironment,
        sessionStore: SessionStore,
        apiClient: APIClient,
        authRepository: AuthRepository,
        jobsRepository: JobsRepository,
        sessionCoordinator: SessionCoordinator,
        jobsViewModel: JobsViewModel
    ) {
        self.apiEnvironment = apiEnvironment
        self.sessionStore = sessionStore
        self.apiClient = apiClient
        self.authRepository = authRepository
        self.jobsRepository = jobsRepository
        self.sessionCoordinator = sessionCoordinator
        self.jobsViewModel = jobsViewModel
    }

    static func bootstrap() -> AppEnvironment {
        let apiEnvironment = APIEnvironment.current
        let sessionStore = SessionStore(keychainStore: KeychainStore())
        let apiClient = APIClient(environment: apiEnvironment, sessionStore: sessionStore)
        let authRepository = AuthRepository(apiClient: apiClient, sessionStore: sessionStore)
        let jobsRepository = JobsRepository(apiClient: apiClient)
        let sessionCoordinator = SessionCoordinator(authRepository: authRepository, sessionStore: sessionStore)
        let jobsViewModel = JobsViewModel(repository: jobsRepository)
        apiClient.authRecoveryHandler = { [weak sessionCoordinator] in
            await sessionCoordinator?.handleUnauthorized() ?? false
        }
        return AppEnvironment(
            apiEnvironment: apiEnvironment,
            sessionStore: sessionStore,
            apiClient: apiClient,
            authRepository: authRepository,
            jobsRepository: jobsRepository,
            sessionCoordinator: sessionCoordinator,
            jobsViewModel: jobsViewModel
        )
    }
}
