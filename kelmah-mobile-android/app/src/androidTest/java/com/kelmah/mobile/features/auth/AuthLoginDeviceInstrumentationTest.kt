package com.kelmah.mobile.features.auth

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.kelmah.mobile.core.network.NetworkConfig
import com.kelmah.mobile.features.auth.data.AuthApiService
import com.kelmah.mobile.features.auth.data.LoginRequest
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import org.junit.Assert.assertNotNull
import org.junit.Assert.fail
import org.junit.Test
import org.junit.runner.RunWith
import retrofit2.HttpException
import retrofit2.Retrofit

@RunWith(AndroidJUnit4::class)
class AuthLoginDeviceInstrumentationTest {

    @OptIn(ExperimentalSerializationApi::class)
    @Test
    fun login_withProvidedCredentials_reportsGatewayResult() = runBlocking {
        val args = InstrumentationRegistry.getArguments()
        val email = args.getString(ARG_EMAIL)?.trim().orEmpty()
        val password = args.getString(ARG_PASSWORD).orEmpty()

        if (email.isBlank() || password.isBlank()) {
            fail("Missing instrumentation args: $ARG_EMAIL and $ARG_PASSWORD")
        }

        val json = Json {
            ignoreUnknownKeys = true
            explicitNulls = false
        }

        val retrofit = Retrofit.Builder()
            .baseUrl(NetworkConfig.apiBaseUrl)
            .client(
                OkHttpClient.Builder()
                    .connectTimeout(NetworkConfig.REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .readTimeout(NetworkConfig.REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .writeTimeout(NetworkConfig.REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                    .build(),
            )
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()

        val authApi = retrofit.create(AuthApiService::class.java)

        try {
            val response = authApi.login(LoginRequest(email = email, password = password))
            val token = response.data?.token ?: response.token
            assertNotNull("Login succeeded but no token returned", token)
        } catch (error: HttpException) {
            val errorBody = error.response()?.errorBody()?.string().orEmpty()
            fail("Login HTTP ${error.code()} with response: $errorBody")
        }
    }

    private companion object {
        const val ARG_EMAIL = "kelmah.login.email"
        const val ARG_PASSWORD = "kelmah.login.password"
    }
}
