package com.kelmah.mobile.features.messaging.data

import kotlinx.serialization.json.JsonObject
import okhttp3.MultipartBody
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import retrofit2.http.Path
import retrofit2.http.QueryMap

interface MessagingApiService {
    @GET("messages/conversations")
    suspend fun getConversations(@QueryMap query: Map<String, String>): JsonObject

    @GET("messages/conversations/{conversationId}")
    suspend fun getConversationById(
        @Path("conversationId") conversationId: String,
    ): JsonObject

    @GET("messages/conversations/{conversationId}/messages")
    suspend fun getMessages(
        @Path("conversationId") conversationId: String,
        @QueryMap query: Map<String, String>,
    ): JsonObject

    @POST("messages/conversations/{conversationId}/messages")
    suspend fun sendMessage(
        @Path("conversationId") conversationId: String,
        @Body request: SendMessageRequest,
    ): JsonObject

    @Multipart
    @POST("messages/{conversationId}/attachments")
    suspend fun uploadAttachments(
        @Path("conversationId") conversationId: String,
        @Part files: List<MultipartBody.Part>,
    ): JsonObject

    @POST("uploads/presign")
    suspend fun requestPresignedUpload(
        @Body request: PresignUploadRequest,
    ): JsonObject

    @POST("messages/conversations")
    suspend fun createConversation(@Body request: CreateConversationRequest): JsonObject
}
