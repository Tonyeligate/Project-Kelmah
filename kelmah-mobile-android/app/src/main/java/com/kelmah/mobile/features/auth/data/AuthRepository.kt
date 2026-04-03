package com.kelmah.mobile.features.auth.data

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.storage.SessionUser
import com.kelmah.mobile.core.storage.StoredSession
import com.kelmah.mobile.core.storage.TokenManager
import java.util.concurrent.CancellationException
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.delay
import kotlinx.coroutines.ensureActive
import retrofit2.HttpException
import kotlin.coroutines.coroutineContext

@Singleton
class AuthRepository @Inject constructor(
    private val authApiService: AuthApiService,
    private val tokenManager: TokenManager,
) {
    suspend fun register(request: RegisterRequest): ApiResult<String> =
        executeWithRetry {
            val response = authApiService.register(request)
            ApiResult.Success(
                response.message
                    ?: response.data?.message
                    ?: "Registration successful. Please check your email to verify your account.",
            )
        }

    suspend fun login(email: String, password: String): ApiResult<SessionUser> =
        executeWithRetry {
            val response = authApiService.login(LoginRequest(email = email, password = password))
            val payload = response.data ?: LoginPayload(
                token = response.token,
                refreshToken = response.refreshToken,
                user = response.user,
            )
            val token = payload.token

            if (token.isNullOrBlank()) {
                ApiResult.Error(message = "Missing access token in login response")
            } else {
                val resolvedUser = payload.user ?: SessionUser(email = email)
                tokenManager.saveSession(token, payload.refreshToken, resolvedUser)
                ApiResult.Success(resolvedUser)
            }
        }

    suspend fun forgotPassword(email: String): ApiResult<String> =
        executeWithRetry {
            val response = authApiService.forgotPassword(ForgotPasswordRequest(email = email))
            ApiResult.Success(
                response.message
                    ?: response.data?.message
                    ?: "Password reset link sent to email",
            )
        }

    suspend fun resetPassword(token: String, password: String): ApiResult<String> =
        executeWithRetry {
            val response = authApiService.resetPassword(
                ResetPasswordRequest(token = token, password = password),
            )
            ApiResult.Success(
                response.message
                    ?: response.data?.message
                    ?: "Password reset successful. You can now sign in.",
            )
        }

    suspend fun resendVerificationEmail(email: String): ApiResult<String> =
        executeWithRetry {
            val response = authApiService.resendVerificationEmail(
                ResendVerificationEmailRequest(email = email),
            )
            ApiResult.Success(
                response.message
                    ?: response.data?.message
                    ?: "Verification email sent successfully",
            )
        }

    suspend fun verifyEmail(token: String): ApiResult<VerificationResult> =
        executeWithRetry {
            val response = authApiService.verifyEmail(token)
            val accessToken = response.data?.accessToken ?: response.data?.token
            val refreshToken = response.data?.refreshToken
            val user = response.data?.user
            if (!accessToken.isNullOrBlank()) {
                tokenManager.saveSession(accessToken, refreshToken, user)
            }
            ApiResult.Success(
                VerificationResult(
                    message = response.message
                        ?: response.data?.message
                        ?: "Email verified successfully",
                    user = user,
                    didAuthenticate = !accessToken.isNullOrBlank(),
                ),
            )
        }

    suspend fun changePassword(currentPassword: String, newPassword: String): ApiResult<String> =
        executeWithRetry {
            val response = authApiService.changePassword(
                ChangePasswordRequest(
                    currentPassword = currentPassword,
                    newPassword = newPassword,
                ),
            )
            ApiResult.Success(
                response.message
                    ?: response.data?.message
                    ?: "Password changed successfully",
            )
        }

    suspend fun refreshSession(refreshToken: String): ApiResult<StoredSession> =
        executeWithRetry {
            val response = authApiService.refreshToken(RefreshTokenRequest(refreshToken = refreshToken))
            val payload = response.data ?: LoginPayload(
                token = response.token,
                refreshToken = response.refreshToken,
                user = response.user,
            )

            val accessToken = payload.token
            if (accessToken.isNullOrBlank()) {
                ApiResult.Error(message = "Refresh response did not include a new access token")
            } else {
                // Prefer fresh user from server, fall back to cached
                val resolvedUser = payload.user ?: tokenManager.getStoredSession()?.user
                val rotatedSession = StoredSession(
                    accessToken = accessToken,
                    refreshToken = payload.refreshToken ?: refreshToken,
                    user = resolvedUser,
                )
                tokenManager.saveSession(
                    accessToken = rotatedSession.accessToken,
                    refreshToken = rotatedSession.refreshToken,
                    user = rotatedSession.user,
                )
                ApiResult.Success(rotatedSession)
            }
        }

    suspend fun fetchCurrentUser(): ApiResult<SessionUser> =
        executeWithRetry {
            val response = authApiService.getCurrentUser()
            val user = response.data?.user
            if (user == null) {
                ApiResult.Error(message = "Current user response did not include a user object")
            } else {
                tokenManager.updateUser(user)
                ApiResult.Success(user)
            }
        }

    suspend fun logout(
        logoutAll: Boolean = false,
        refreshTokenOverride: String? = null,
    ): ApiResult<Unit> {
        val refreshToken = refreshTokenOverride ?: tokenManager.getRefreshToken()
        return executeWithRetry(maxRetries = 1) {
            authApiService.logout(
                LogoutRequest(
                    refreshToken = refreshToken,
                    logoutAll = logoutAll,
                ),
            )
            ApiResult.Success(Unit)
        }
    }

    private suspend fun <T> executeWithRetry(
        maxRetries: Int = 2,
        baseDelayMs: Long = 1_000,
        block: suspend () -> ApiResult<T>,
    ): ApiResult<T> {
        var currentDelay = baseDelayMs
        repeat(maxRetries) { attempt ->
            // Ensure structured concurrency: if the coroutine was cancelled,
            // exit immediately instead of silently swallowing CancellationException.
            coroutineContext.ensureActive()
            val result = try {
                block()
            } catch (error: CancellationException) {
                // Never swallow CancellationException -- rethrow to honour coroutine cancellation
                throw error
            } catch (error: HttpException) {
                ApiResult.Error(message = error.message ?: "Request failed", code = error.code())
            } catch (error: Exception) {
                ApiResult.Error(message = error.message ?: "Request failed")
            }

            if (result is ApiResult.Success) {
                return result
            }

            // Do not retry on 4xx client errors (auth failures, validation, conflicts)
            // Only retry on transient errors (5xx, network errors with no code)
            val errorCode = (result as? ApiResult.Error)?.code
            if (errorCode != null && errorCode in 400..499) {
                return result
            }

            if (attempt < maxRetries - 1) {
                delay(currentDelay)
                currentDelay *= 2
            } else {
                return result
            }
        }

        return ApiResult.Error(message = "Request failed")
    }
}
