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
        val requestBuilder = chain.request().newBuilder()
        requestBuilder.addHeader("X-Request-ID", UUID.randomUUID().toString())
        requestBuilder.addHeader("X-Client-Platform", "android")
        requestBuilder.addHeader("X-Client-App", "kelmah-native")
        tokenManager.getAccessToken()?.let { token ->
            requestBuilder.addHeader("Authorization", "Bearer $token")
        }
        requestBuilder.addHeader("Accept", "application/json")
        requestBuilder.addHeader("Content-Type", "application/json")
        return chain.proceed(requestBuilder.build())
    }
}
