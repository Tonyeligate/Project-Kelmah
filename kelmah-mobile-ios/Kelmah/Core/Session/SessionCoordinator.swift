import Foundation

@MainActor
final class SessionCoordinator: ObservableObject {
    private let authRepository: AuthRepository
    private let sessionStore: SessionStore
    private var isRefreshing = false
    private var didBootstrap = false

    init(authRepository: AuthRepository, sessionStore: SessionStore) {
        self.authRepository = authRepository
        self.sessionStore = sessionStore
    }

    func bootstrapSession(force: Bool = false) async {
        if didBootstrap && force == false { return }
        didBootstrap = true

        guard sessionStore.isAuthenticated else {
            sessionStore.clear()
            return
        }

        sessionStore.markChecking()

        do {
            let user = try await authRepository.fetchCurrentUser()
            sessionStore.updateUser(user)
        } catch {
            let refreshed = await handleUnauthorized()
            guard refreshed else {
                recoverOrClear(error.localizedDescription)
                return
            }

            do {
                let user = try await authRepository.fetchCurrentUser()
                sessionStore.updateUser(user)
            } catch {
                recoverOrClear(error.localizedDescription)
            }
        }
    }

    func handleUnauthorized() async -> Bool {
        guard isRefreshing == false else {
            return sessionStore.isAuthenticated
        }
        guard let refreshToken = sessionStore.refreshToken, refreshToken.isEmpty == false else {
            recoverOrClear("Session refresh is unavailable right now.")
            return false
        }

        isRefreshing = true
        defer { isRefreshing = false }

        do {
            try await authRepository.refreshSession(refreshToken: refreshToken)
            return true
        } catch let APIClientError.invalidStatusCode(statusCode, _) where [401, 403].contains(statusCode) {
            sessionStore.clear()
            return false
        } catch {
            recoverOrClear(error.localizedDescription)
            return false
        }
    }

    func logout(logoutAll: Bool = false) async {
        try? await authRepository.logout(logoutAll: logoutAll)
        sessionStore.clear()
    }

    private func recoverOrClear(_ message: String) {
        if sessionStore.currentUser != nil, sessionStore.isAuthenticated {
            sessionStore.markRecoverableFailure(message)
        } else {
            sessionStore.clear()
        }
    }
}
