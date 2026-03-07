import Foundation

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct RegisterRequest: Encodable {
    let firstName: String
    let lastName: String
    let email: String
    let phone: String?
    let password: String
    let role: String
}

struct ForgotPasswordRequest: Encodable {
    let email: String
}

struct ResetPasswordRequest: Encodable {
    let token: String
    let password: String
}

struct ResendVerificationEmailRequest: Encodable {
    let email: String
}

struct ChangePasswordRequest: Encodable {
    let currentPassword: String
    let newPassword: String
}

struct RefreshTokenRequest: Encodable {
    let refreshToken: String
}

struct LogoutRequest: Encodable {
    let refreshToken: String?
    let logoutAll: Bool
}

struct VerificationResult: Hashable {
    let message: String
    let user: SessionUser?
    let didAuthenticate: Bool
}

struct LoginPayload: Codable {
    let token: String?
    let refreshToken: String?
    let user: SessionUser?
}

struct LoginEnvelope: Codable {
    let data: LoginPayload?
    let token: String?
    let refreshToken: String?
    let user: SessionUser?
}

struct MePayload: Codable {
    let user: SessionUser?
}

struct MeEnvelope: Codable {
    let status: String?
    let success: Bool?
    let data: MePayload?
}

struct ActionPayload: Codable {
    let message: String?
    let user: SessionUser?
    let accessToken: String?
    let token: String?
    let refreshToken: String?
}

struct ActionEnvelope: Codable {
    let status: String?
    let success: Bool?
    let message: String?
    let data: ActionPayload?
}

struct LogoutPayload: Codable {
    let message: String?
    let revokedTokens: Int?
}

struct LogoutEnvelope: Codable {
    let success: Bool?
    let data: LogoutPayload?
}

struct ErrorPayload: Codable {
    let message: String?
    let code: String?
}

struct ErrorEnvelope: Codable {
    let success: Bool?
    let message: String?
    let error: ErrorPayload?
}
