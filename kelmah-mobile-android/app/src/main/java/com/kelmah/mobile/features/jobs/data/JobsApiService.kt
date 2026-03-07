package com.kelmah.mobile.features.jobs.data

import kotlinx.serialization.json.JsonObject
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.QueryMap

interface JobsApiService {
    @GET("jobs")
    suspend fun getJobs(@QueryMap query: Map<String, String>): JsonObject

    @GET("jobs/categories")
    suspend fun getCategories(): JsonObject

    @GET("jobs/saved")
    suspend fun getSavedJobs(@QueryMap query: Map<String, String>): JsonObject

    @GET("jobs/{id}")
    suspend fun getJobById(@Path("id") id: String): JsonObject

    @POST("jobs/{id}/save")
    suspend fun saveJob(@Path("id") id: String): JsonObject

    @DELETE("jobs/{id}/save")
    suspend fun unsaveJob(@Path("id") id: String): JsonObject

    @POST("jobs/{id}/apply")
    suspend fun applyToJob(
        @Path("id") id: String,
        @Body request: ApplyToJobRequest,
    ): JsonObject
}
