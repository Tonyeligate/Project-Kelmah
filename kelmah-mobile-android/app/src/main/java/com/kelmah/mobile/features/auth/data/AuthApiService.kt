package com.kelmah.mobile.features.auth.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface AuthApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginEnvelope

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): ActionEnvelope

    @POST("auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): ActionEnvelope

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): ActionEnvelope

    @POST("auth/resend-verification-email")
    suspend fun resendVerificationEmail(@Body request: ResendVerificationEmailRequest): ActionEnvelope

    @GET("auth/verify-email/{token}")
    suspend fun verifyEmail(@Path("token") token: String): ActionEnvelope

    @POST("auth/change-password")
    suspend fun changePassword(@Body request: ChangePasswordRequest): ActionEnvelope

    @POST("auth/refresh-token")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): LoginEnvelope

    @POST("auth/logout")
    suspend fun logout(@Body request: LogoutRequest): LogoutEnvelope

    @GET("auth/me")
    suspend fun getCurrentUser(): MeEnvelope
}
