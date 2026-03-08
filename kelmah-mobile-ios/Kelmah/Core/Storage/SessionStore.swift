import Foundation

@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var accessToken: String?
    @Published private(set) var refreshToken: String?
    @Published private(set) var currentUser: SessionUser?
    @Published private(set) var phase: SessionPhase

    private let keychainStore: KeychainStore
    private let defaults = UserDefaults.standard

    init(keychainStore: KeychainStore) {
        self.keychainStore = keychainStore
        self.accessToken = keychainStore.read("kelmah_access_token")
        self.refreshToken = keychainStore.read("kelmah_refresh_token")
        if let cachedUser = defaults.string(forKey: "kelmah_cached_user"),
           let data = cachedUser.data(using: .utf8) {
            self.currentUser = try? JSONDecoder().decode(SessionUser.self, from: data)
        } else {
            self.currentUser = nil
        }
        self.phase = accessToken?.isEmpty == false ? .checking : .unauthenticated
    }

    var isAuthenticated: Bool {
        guard let accessToken else { return false }
        return !accessToken.isEmpty
    }

    var isSessionUsable: Bool {
        isAuthenticated && (phase == .authenticated || currentUser != nil)
    }

    func save(accessToken: String, refreshToken: String?, user: SessionUser? = nil) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        keychainStore.save(accessToken, for: "kelmah_access_token")
        if let refreshToken {
            keychainStore.save(refreshToken, for: "kelmah_refresh_token")
        } else {
            keychainStore.delete("kelmah_refresh_token")
        }
        if let user {
            updateUser(user)
        }
        phase = .authenticated
    }

    func updateUser(_ user: SessionUser?) {
        currentUser = user
        if let user,
           let data = try? JSONEncoder().encode(user),
           let encoded = String(data: data, encoding: .utf8) {
            defaults.set(encoded, forKey: "kelmah_cached_user")
        } else {
            defaults.removeObject(forKey: "kelmah_cached_user")
        }
        if isAuthenticated {
            phase = .authenticated
        }
    }

    func markChecking() {
        phase = .checking
    }

    func markRecoverableFailure(_ message: String) {
        phase = .recoverableFailure(message)
    }

    func clear() {
        accessToken = nil
        refreshToken = nil
        currentUser = nil
        keychainStore.delete("kelmah_access_token")
        keychainStore.delete("kelmah_refresh_token")
        defaults.removeObject(forKey: "kelmah_cached_user")
        phase = .unauthenticated
    }
}
