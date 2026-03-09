package com.kelmah.mobile.features.profile.data

import kotlinx.serialization.json.JsonObject
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.QueryMap

interface ProfileApiService {
    @GET("users/me/profile-signals")
    suspend fun getMyProfileSignals(): JsonObject

    @GET("users/profile")
    suspend fun getProfile(): JsonObject

    @GET("users/me/credentials")
    suspend fun getMyCredentials(): JsonObject

    @GET("users/workers/{workerId}/availability")
    suspend fun getWorkerAvailability(
        @Path("workerId") workerId: String,
    ): JsonObject

    @GET("users/workers/{workerId}/completeness")
    suspend fun getWorkerCompleteness(
        @Path("workerId") workerId: String,
    ): JsonObject

    @GET("users/workers/{workerId}/portfolio")
    suspend fun getWorkerPortfolio(
        @Path("workerId") workerId: String,
        @QueryMap query: Map<String, String>,
    ): JsonObject
}