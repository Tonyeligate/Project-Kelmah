package com.kelmah.mobile.core.network

import com.kelmah.mobile.core.storage.TokenManager
import okhttp3.Interceptor
import okhttp3.Response
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val requestBuilder = original.newBuilder()
        requestBuilder.header("X-Request-ID", UUID.randomUUID().toString())
        requestBuilder.header("X-Client-Platform", "android")
        requestBuilder.header("X-Client-App", "kelmah-native")
        tokenManager.getAccessToken()?.let { token ->
            requestBuilder.header("Authorization", "Bearer $token")
        }
        requestBuilder.header("Accept", "application/json")
        // Only set Content-Type if not already set (preserves multipart/form-data boundaries)
        if (original.header("Content-Type") == null && original.body != null) {
            requestBuilder.header("Content-Type", "application/json")
        }
        return chain.proceed(requestBuilder.build())
    }
}
