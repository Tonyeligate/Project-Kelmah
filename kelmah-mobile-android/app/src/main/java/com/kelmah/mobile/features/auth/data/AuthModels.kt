package com.kelmah.mobile.features.auth.data

import com.kelmah.mobile.core.storage.SessionUser
import kotlinx.serialization.Serializable

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RegisterRequest(
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String? = null,
    val password: String,
    val role: String = "worker",
)

@Serializable
data class ForgotPasswordRequest(
    val email: String,
)

@Serializable
data class ResetPasswordRequest(
    val token: String,
    val password: String,
)

@Serializable
data class ResendVerificationEmailRequest(
    val email: String,
)

@Serializable
data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String,
)

@Serializable
data class RefreshTokenRequest(
    val refreshToken: String,
)

@Serializable
data class LogoutRequest(
    val refreshToken: String? = null,
    val logoutAll: Boolean = false,
)

data class VerificationResult(
    val message: String,
    val user: SessionUser? = null,
    val didAuthenticate: Boolean = false,
)

@Serializable
data class LoginPayload(
    val token: String? = null,
    val refreshToken: String? = null,
    val user: SessionUser? = null,
)

@Serializable
data class LoginEnvelope(
    val data: LoginPayload? = null,
    val token: String? = null,
    val refreshToken: String? = null,
    val user: SessionUser? = null,
)

@Serializable
data class MeEnvelope(
    val status: String? = null,
    val success: Boolean? = null,
    val data: MePayload? = null,
)

@Serializable
data class MePayload(
    val user: SessionUser? = null,
)

@Serializable
data class ActionEnvelope(
    val status: String? = null,
    val success: Boolean? = null,
    val message: String? = null,
    val data: ActionPayload? = null,
)

@Serializable
data class ActionPayload(
    val message: String? = null,
    val user: SessionUser? = null,
    val accessToken: String? = null,
    val token: String? = null,
    val refreshToken: String? = null,
)

@Serializable
data class LogoutEnvelope(
    val success: Boolean? = null,
    val data: LogoutPayload? = null,
)

@Serializable
data class LogoutPayload(
    val message: String? = null,
    val revokedTokens: Int? = null,
)

@Serializable
data class ErrorEnvelope(
    val success: Boolean? = null,
    val message: String? = null,
    val error: ErrorPayload? = null,
)

@Serializable
data class ErrorPayload(
    val message: String? = null,
    val code: String? = null,
)
