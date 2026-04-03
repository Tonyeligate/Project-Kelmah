package com.kelmah.mobile.core.network

import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.kelmah.mobile.BuildConfig
import com.kelmah.mobile.features.auth.data.AuthApiService
import com.kelmah.mobile.features.jobs.data.JobsApiService
import com.kelmah.mobile.features.messaging.data.MessagingApiService
import com.kelmah.mobile.features.notifications.data.NotificationsApiService
import com.kelmah.mobile.features.profile.data.ProfileApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    @OptIn(ExperimentalSerializationApi::class)
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    @Provides
    @Singleton
    fun provideLoggingInterceptor(): HttpLoggingInterceptor =
        HttpLoggingInterceptor().apply {
            level = if (BuildConfig.ENABLE_VERBOSE_LOGGING) {
                HttpLoggingInterceptor.Level.HEADERS
            } else {
                HttpLoggingInterceptor.Level.BASIC
            }
            if (BuildConfig.ENABLE_VERBOSE_LOGGING) {
                redactHeader("Authorization")
                redactHeader("Cookie")
            }
        }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        loggingInterceptor: HttpLoggingInterceptor,
    ): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(NetworkConfig.REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .readTimeout(NetworkConfig.REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .writeTimeout(NetworkConfig.REQUEST_TIMEOUT_SECONDS, TimeUnit.SECONDS)
        .build()

    @Provides
    @Singleton
    @OptIn(ExperimentalSerializationApi::class)
    fun provideRetrofit(
        json: Json,
        okHttpClient: OkHttpClient,
    ): Retrofit = Retrofit.Builder()
        .baseUrl(NetworkConfig.apiBaseUrl)
        .client(okHttpClient)
        .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
        .build()

    @Provides
    @Singleton
    fun provideAuthApiService(retrofit: Retrofit): AuthApiService =
        retrofit.create(AuthApiService::class.java)

    @Provides
    @Singleton
    fun provideJobsApiService(retrofit: Retrofit): JobsApiService =
        retrofit.create(JobsApiService::class.java)

    @Provides
    @Singleton
    fun provideMessagingApiService(retrofit: Retrofit): MessagingApiService =
        retrofit.create(MessagingApiService::class.java)

    @Provides
    @Singleton
    fun provideNotificationsApiService(retrofit: Retrofit): NotificationsApiService =
        retrofit.create(NotificationsApiService::class.java)

    @Provides
    @Singleton
    fun provideProfileApiService(retrofit: Retrofit): ProfileApiService =
        retrofit.create(ProfileApiService::class.java)
}
