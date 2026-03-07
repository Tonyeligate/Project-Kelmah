import Foundation

final class AuthRepository {
    private let apiClient: APIClient
    private let sessionStore: SessionStore

    init(apiClient: APIClient, sessionStore: SessionStore) {
        self.apiClient = apiClient
        self.sessionStore = sessionStore
    }

    func register(request: RegisterRequest) async throws -> String {
        let response = try await apiClient.send(
            path: "auth/register",
            method: .post,
            body: request,
            requiresAuth: false,
            allowAuthRecovery: false,
            responseType: ActionEnvelope.self
        )
        return response.message ?? response.data?.message ?? "Registration successful. Please check your email to verify your account."
    }

    func login(email: String, password: String) async throws {
        let response = try await apiClient.send(
            path: "auth/login",
            method: .post,
            body: LoginRequest(email: email, password: password),
            requiresAuth: false,
            allowAuthRecovery: false,
            responseType: LoginEnvelope.self
        )

        let payload = response.data ?? LoginPayload(
            token: response.token,
            refreshToken: response.refreshToken,
            user: response.user
        )

        guard let token = payload.token, token.isEmpty == false else {
            throw NSError(domain: "KelmahAuth", code: -1, userInfo: [NSLocalizedDescriptionKey: "Missing access token in response"])
        }

        await sessionStore.save(accessToken: token, refreshToken: payload.refreshToken, user: payload.user)
    }

    func forgotPassword(email: String) async throws -> String {
        let response = try await apiClient.send(
            path: "auth/forgot-password",
            method: .post,
            body: ForgotPasswordRequest(email: email),
            requiresAuth: false,
            allowAuthRecovery: false,
            responseType: ActionEnvelope.self
        )
        return response.message ?? response.data?.message ?? "Password reset link sent to email"
    }

    func resetPassword(token: String, password: String) async throws -> String {
        let response = try await apiClient.send(
            path: "auth/reset-password",
            method: .post,
            body: ResetPasswordRequest(token: token, password: password),
            requiresAuth: false,
            allowAuthRecovery: false,
            responseType: ActionEnvelope.self
        )
        return response.message ?? response.data?.message ?? "Password reset successful. You can now sign in."
    }

    func resendVerificationEmail(email: String) async throws -> String {
        let response = try await apiClient.send(
            path: "auth/resend-verification-email",
            method: .post,
            body: ResendVerificationEmailRequest(email: email),
            requiresAuth: false,
            allowAuthRecovery: false,
            responseType: ActionEnvelope.self
        )
        return response.message ?? response.data?.message ?? "Verification email sent successfully"
    }

    func verifyEmail(token: String) async throws -> VerificationResult {
        let response = try await apiClient.send(
            path: "auth/verify-email/\(token)",
            method: .get,
            requiresAuth: false,
            allowAuthRecovery: false,
            responseType: ActionEnvelope.self
        )

        let accessToken = response.data?.accessToken ?? response.data?.token
        let refreshToken = response.data?.refreshToken
        let user = response.data?.user
        if let accessToken, accessToken.isEmpty == false {
            await sessionStore.save(accessToken: accessToken, refreshToken: refreshToken, user: user)
        }

        return VerificationResult(
            message: response.message ?? response.data?.message ?? "Email verified successfully",
            user: user,
            didAuthenticate: !(accessToken?.isEmpty ?? true)
        )
    }

    func changePassword(currentPassword: String, newPassword: String) async throws -> String {
        let response = try await apiClient.send(
            path: "auth/change-password",
            method: .post,
            body: ChangePasswordRequest(currentPassword: currentPassword, newPassword: newPassword),
            requiresAuth: true,
            allowAuthRecovery: false,
            responseType: ActionEnvelope.self
        )
        return response.message ?? response.data?.message ?? "Password changed successfully"
    }

    func refreshSession(refreshToken: String) async throws {
        let response = try await apiClient.send(
            path: "auth/refresh-token",
            method: .post,
            body: RefreshTokenRequest(refreshToken: refreshToken),
            requiresAuth: false,
            allowAuthRecovery: false,
            responseType: LoginEnvelope.self
        )

        let payload = response.data ?? LoginPayload(
            token: response.token,
            refreshToken: response.refreshToken,
            user: response.user
        )

        guard let token = payload.token, token.isEmpty == false else {
            throw NSError(domain: "KelmahAuth", code: -2, userInfo: [NSLocalizedDescriptionKey: "Refresh response missing access token"])
        }

        await sessionStore.save(
            accessToken: token,
            refreshToken: payload.refreshToken ?? refreshToken,
            user: sessionStore.currentUser
        )
    }

    func fetchCurrentUser() async throws -> SessionUser {
        let response = try await apiClient.send(
            path: "auth/me",
            method: .get,
            requiresAuth: true,
            allowAuthRecovery: false,
            responseType: MeEnvelope.self
        )

        guard let user = response.data?.user else {
            throw NSError(domain: "KelmahAuth", code: -3, userInfo: [NSLocalizedDescriptionKey: "Current user response missing user payload"])
        }

        await sessionStore.updateUser(user)
        return user
    }

    func logout(logoutAll: Bool = false) async throws {
        let request = LogoutRequest(
            refreshToken: sessionStore.refreshToken,
            logoutAll: logoutAll
        )

        _ = try await apiClient.send(
            path: "auth/logout",
            method: .post,
            body: request,
            requiresAuth: true,
            allowAuthRecovery: false,
            responseType: LogoutEnvelope.self
        ) as LogoutEnvelope
    }
}
