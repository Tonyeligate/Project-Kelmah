package com.kelmah.mobile.features.messaging.data

import com.kelmah.mobile.BuildConfig
import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.network.executeAuthorizedApiCall
import com.kelmah.mobile.core.session.SessionCoordinator
import com.kelmah.mobile.core.storage.TokenManager
import dagger.Lazy
import java.time.Instant
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okio.BufferedSink
import retrofit2.HttpException

@Singleton
class MessagingRepository @Inject constructor(
    private val messagingApiService: MessagingApiService,
    private val sessionCoordinator: Lazy<SessionCoordinator>,
    private val tokenManager: TokenManager,
) {
    private val uploadHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(60, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .writeTimeout(60, TimeUnit.SECONDS)
            .build()
    }

    fun currentUserId(): String? = tokenManager.getStoredSession()?.user?.resolvedId

    suspend fun getConversations(
        page: Int = 1,
        limit: Int = 50,
    ): ApiResult<List<ConversationSummary>> = executeAuthorizedApiCall(sessionCoordinator) {
        val safePage = page.coerceAtLeast(1)
        val safeLimit = limit.coerceIn(1, 50)
        val response = messagingApiService.getConversations(
            mapOf(
                "page" to safePage.toString(),
                "limit" to safeLimit.toString(),
            ),
        )
        ApiResult.Success(parseConversations(response))
    }

    suspend fun getConversationById(
        conversationId: String,
    ): ApiResult<ConversationDetailPayload> = executeAuthorizedApiCall(sessionCoordinator) {
        val response = messagingApiService.getConversationById(conversationId)
        val userId = currentUserId()
        val rawConversation = response.nestedObject("data")?.nestedObject("conversation")
            ?: response.nestedObject("conversation")
            ?: response.nestedObject("data")
            ?: response

        val conversation = parseConversationSummary(rawConversation, userId)
            ?: throw IllegalStateException("Conversation payload was invalid")

        val messages = rawConversation
            .nestedArray("messages")
            ?.mapNotNull { parseMessage(it as? JsonObject ?: return@mapNotNull null, conversation.id, userId) }
            ?.sortedBy { it.createdAt ?: "" }
            ?: emptyList()

        ApiResult.Success(
            ConversationDetailPayload(
                conversation = conversation,
                messages = messages,
            ),
        )
    }

    suspend fun getMessages(
        conversationId: String,
        limit: Int = 50,
    ): ApiResult<List<ThreadMessage>> = executeAuthorizedApiCall(sessionCoordinator) {
        val response = messagingApiService.getMessages(
            conversationId = conversationId,
            query = mapOf("limit" to limit.toString()),
        )
        ApiResult.Success(parseMessages(response, conversationId))
    }

    suspend fun sendMessage(
        conversationId: String,
        content: String,
        messageType: String = "text",
        attachments: List<MessageAttachment> = emptyList(),
    ): ApiResult<ThreadMessage> = executeAuthorizedApiCall(sessionCoordinator) {
        val response = messagingApiService.sendMessage(
            conversationId = conversationId,
            request = SendMessageRequest(
                conversationId = conversationId,
                content = content.trim(),
                messageType = messageType,
                attachments = attachments,
            ),
        )
        ApiResult.Success(parseSentMessage(response, conversationId))
    }

    suspend fun uploadAttachment(
        conversationId: String,
        fileName: String,
        mimeType: String,
        fileBytes: ByteArray,
        onProgress: (Int) -> Unit = {},
    ): ApiResult<MessageAttachment> = executeAuthorizedApiCall(sessionCoordinator) {
        val safeMimeType = mimeType.ifBlank { "application/octet-stream" }
        val safeFileName = sanitizeFileName(fileName)
        val safeFolder = "messaging/$conversationId"
        onProgress(5)

        val presignedResult = requestPresignedUpload(
            folder = safeFolder,
            fileName = safeFileName,
            mimeType = safeMimeType,
        )

        if (presignedResult is ApiResult.Success) {
            when (
                val secureUploadResult = uploadViaPresignedUrl(
                    uploadPayload = presignedResult.data,
                    fileName = safeFileName,
                    mimeType = safeMimeType,
                    fileBytes = fileBytes,
                    onProgress = onProgress,
                )
            ) {
                is ApiResult.Success -> return@executeAuthorizedApiCall secureUploadResult
                is ApiResult.Error -> Unit
            }
        }

        uploadAttachmentViaGateway(
            conversationId = conversationId,
            fileName = safeFileName,
            mimeType = safeMimeType,
            fileBytes = fileBytes,
            onProgress = onProgress,
        )
    }

    private suspend fun requestPresignedUpload(
        folder: String,
        fileName: String,
        mimeType: String,
    ): ApiResult<PresignedUploadPayload> {
        return try {
            val response = messagingApiService.requestPresignedUpload(
                PresignUploadRequest(
                    folder = folder,
                    filename = fileName,
                    contentType = mimeType,
                ),
            )
            val payload = parsePresignedUploadPayload(response)
                ?: return ApiResult.Error("Secure upload URL response was invalid")

            ApiResult.Success(payload)
        } catch (error: HttpException) {
            if (error.code() == 401) throw error
            ApiResult.Error(
                message = "Secure upload URL unavailable",
                code = error.code(),
            )
        } catch (_: Exception) {
            ApiResult.Error("Secure upload URL unavailable")
        }
    }

    private suspend fun uploadViaPresignedUrl(
        uploadPayload: PresignedUploadPayload,
        fileName: String,
        mimeType: String,
        fileBytes: ByteArray,
        onProgress: (Int) -> Unit,
    ): ApiResult<MessageAttachment> {
        val mediaType = mimeType.toMediaTypeOrNull() ?: "application/octet-stream".toMediaTypeOrNull()
        if (mediaType == null) {
            return ApiResult.Error("Unsupported attachment type")
        }

        val requestBody = ProgressRequestBody(mediaType, fileBytes) { uploadProgress ->
            val mappedProgress = 10 + ((uploadProgress.coerceIn(0, 100) * 85) / 100)
            onProgress(mappedProgress.coerceIn(10, 95))
        }

        return try {
            onProgress(10)
            val request = Request.Builder()
                .url(uploadPayload.putUrl)
                .put(requestBody)
                .header("Content-Type", mimeType)
                .build()

            uploadHttpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return ApiResult.Error(
                        message = "Secure upload failed (${response.code})",
                        code = response.code,
                    )
                }
            }

            onProgress(100)
            ApiResult.Success(
                MessageAttachment(
                    name = fileName,
                    fileUrl = normalizeAttachmentUrl(uploadPayload.getUrl),
                    fileType = mimeType,
                    fileSize = fileBytes.size.toLong(),
                    uploadDate = Instant.now().toString(),
                ),
            )
        } catch (_: Exception) {
            ApiResult.Error("Secure upload failed")
        }
    }

    private suspend fun uploadAttachmentViaGateway(
        conversationId: String,
        fileName: String,
        mimeType: String,
        fileBytes: ByteArray,
        onProgress: (Int) -> Unit,
    ): ApiResult<MessageAttachment> {
        onProgress(15)
        val filePart = MultipartBody.Part.createFormData(
            name = "files",
            filename = fileName,
            body = fileBytes.toRequestBody(mimeType.toMediaTypeOrNull()),
        )

        val response = messagingApiService.uploadAttachments(
            conversationId = conversationId,
            files = listOf(filePart),
        )

        onProgress(100)
        return ApiResult.Success(
            parseUploadedAttachment(
                response = response,
                fallbackName = fileName,
                fallbackMimeType = mimeType,
            ),
        )
    }

    private fun parsePresignedUploadPayload(response: JsonObject): PresignedUploadPayload? {
        val payload = response.nestedObject("data") ?: response
        val putUrl = payload.string("putUrl")?.trim().orEmpty()
        val getUrl = payload.string("getUrl")?.trim().orEmpty()
        if (putUrl.isBlank() || getUrl.isBlank()) {
            return null
        }

        return PresignedUploadPayload(
            putUrl = putUrl,
            getUrl = getUrl,
        )
    }

    private fun parseUploadedAttachment(
        response: JsonObject,
        fallbackName: String,
        fallbackMimeType: String,
    ): MessageAttachment {
        val payload = response.nestedObject("data") ?: response
        val firstAttachment = payload.nestedArray("files")?.firstOrNull() as? JsonObject
            ?: payload.nestedArray("attachments")?.firstOrNull() as? JsonObject
            ?: payload.nestedObject("file")
            ?: throw IllegalStateException("Attachment payload was invalid")

        return parseAttachment(firstAttachment, fallbackName, fallbackMimeType)
            ?: throw IllegalStateException("Attachment payload was invalid")
    }

    private fun parseAttachments(values: JsonArray?): List<MessageAttachment> =
        values?.mapNotNull { item ->
            val obj = item as? JsonObject ?: return@mapNotNull null
            parseAttachment(obj)
        } ?: emptyList()

    private fun parseAttachment(
        obj: JsonObject,
        fallbackName: String = "Attachment",
        fallbackMimeType: String = "application/octet-stream",
    ): MessageAttachment? {
        val rawFileUrl = obj.string("fileUrl")
            ?: obj.string("url")
            ?: obj.string("secureUrl")
            ?: return null
        val fileType = obj.string("fileType") ?: obj.string("mimeType") ?: fallbackMimeType

        return MessageAttachment(
            name = obj.string("name")
                ?: obj.string("fileName")
                ?: obj.string("originalname")
                ?: fallbackName,
            fileUrl = normalizeAttachmentUrl(rawFileUrl),
            fileType = fileType,
            fileSize = obj.long("fileSize") ?: obj.long("size") ?: obj.long("bytes"),
            uploadDate = obj.string("uploadDate") ?: obj.string("createdAt"),
        )
    }

    private fun normalizeAttachmentUrl(rawUrl: String): String {
        val trimmed = rawUrl.trim()
        return when {
            trimmed.startsWith("https://", ignoreCase = true) || trimmed.startsWith("http://", ignoreCase = true) -> trimmed
            trimmed.startsWith("/") -> "${BuildConfig.GATEWAY_ORIGIN.trimEnd('/')}$trimmed"
            else -> trimmed
        }
    }

    private fun sanitizeFileName(fileName: String): String {
        val normalized = fileName.trim().ifBlank { "attachment_${System.currentTimeMillis()}" }
        return normalized.replace(Regex("[^a-zA-Z0-9._-]"), "_")
    }

    suspend fun createConversation(
        participantId: String,
        jobId: String? = null,
    ): ApiResult<String> = executeAuthorizedApiCall(sessionCoordinator) {
        val response = messagingApiService.createConversation(
            CreateConversationRequest(
                participantIds = listOf(participantId),
                jobId = jobId,
            ),
        )
        val data = response.nestedObject("data") ?: response
        val conversationId = data.nestedObject("conversation")?.string("id")
            ?: data.nestedObject("conversation")?.string("_id")
            ?: data.string("conversationId")
            ?: data.string("id")
            ?: throw IllegalStateException("Conversation payload was invalid")
        ApiResult.Success(conversationId)
    }

    private fun parseConversations(response: JsonObject): List<ConversationSummary> {
        val userId = currentUserId()
        val dataNode = response["data"]
        val values = when (dataNode) {
            is JsonObject -> dataNode.nestedArray("conversations") ?: JsonArray(emptyList())
            is JsonArray -> dataNode
            else -> response.nestedArray("conversations") ?: JsonArray(emptyList())
        }

        return values.mapNotNull { item ->
            val obj = item as? JsonObject ?: return@mapNotNull null
            parseConversationSummary(obj, userId)
        }.sortedByDescending { it.lastMessageAt ?: "" }
    }

    private fun parseConversationSummary(
        obj: JsonObject,
        userId: String?,
    ): ConversationSummary? {
        val id = obj.string("id") ?: obj.string("_id") ?: return null
        val participants = parseParticipants(obj.nestedArray("participants"))
        val otherParticipant = obj.nestedObject("otherParticipant")?.let(::parseParticipant)
            ?: participants.firstOrNull { participant -> participant.id != userId }
        val lastMessage = obj.nestedObject("lastMessage") ?: obj.nestedObject("latestMessage")

        return ConversationSummary(
            id = id,
            title = obj.string("title"),
            participants = participants,
            otherParticipant = otherParticipant,
            unreadCount = obj.int("unreadCount") ?: obj.int("unread") ?: 0,
            lastMessagePreview = previewFor(lastMessage),
            lastMessageAt = obj.string("lastMessageAt") ?: obj.string("updatedAt") ?: lastMessage?.string("createdAt"),
        )
    }

    private fun parseMessages(response: JsonObject, conversationId: String): List<ThreadMessage> {
        val cachedUserId = currentUserId()
        val dataNode = response["data"]
        val values = when (dataNode) {
            is JsonObject -> dataNode.nestedArray("messages") ?: JsonArray(emptyList())
            is JsonArray -> dataNode
            else -> response.nestedArray("messages") ?: JsonArray(emptyList())
        }

        return values.mapNotNull { parseMessage(it as? JsonObject ?: return@mapNotNull null, conversationId, cachedUserId) }
            .sortedBy { it.createdAt ?: "" }
    }

    private fun parseSentMessage(response: JsonObject, conversationId: String): ThreadMessage {
        val raw = response.nestedObject("data") ?: response
        return parseMessage(raw, conversationId, currentUserId())
            ?: throw IllegalStateException("Sent message payload was invalid")
    }

    private fun parseParticipants(values: JsonArray?): List<MessagingParticipant> =
        values?.mapNotNull { parseParticipant(it as? JsonObject ?: return@mapNotNull null) } ?: emptyList()

    private fun parseParticipant(obj: JsonObject): MessagingParticipant? {
        val id = obj.string("id") ?: obj.string("_id") ?: obj.string("userId") ?: return null
        val displayName = obj.string("name")
            ?: listOfNotNull(obj.string("firstName"), obj.string("lastName")).joinToString(" ").ifBlank { null }
            ?: obj.string("email")
            ?: "Kelmah User"
        return MessagingParticipant(
            id = id,
            name = displayName,
            profilePicture = obj.string("profilePicture") ?: obj.string("avatar") ?: obj.string("profileImage"),
            isActive = obj.bool("isActive") ?: obj.bool("online"),
        )
    }

    private fun parseMessage(obj: JsonObject, conversationId: String, cachedUserId: String? = null): ThreadMessage? {
        val id = obj.string("id") ?: obj.string("_id") ?: return null
        val senderObject = obj.nestedObject("sender") ?: obj.nestedObject("senderInfo")
        val senderId = obj.string("senderId")
            ?: obj.string("sender")
            ?: senderObject?.string("id")
            ?: senderObject?.string("_id")
            ?: return null
        val resolvedUserId = cachedUserId ?: currentUserId()
        val senderName = senderObject?.string("name")
            ?: listOfNotNull(senderObject?.string("firstName"), senderObject?.string("lastName")).joinToString(" ").ifBlank { null }
            ?: if (senderId == resolvedUserId) "You" else "Kelmah User"
        val messageType = obj.string("messageType") ?: "text"
        val content = obj.string("content") ?: obj.string("text") ?: previewFor(obj)
        val attachments = parseAttachments(obj.nestedArray("attachments"))

        return ThreadMessage(
            id = id,
            conversationId = obj.string("conversationId") ?: obj.string("conversation") ?: conversationId,
            senderId = senderId,
            senderName = senderName,
            content = content,
            messageType = messageType,
            attachments = attachments,
            createdAt = obj.string("createdAt") ?: obj.string("timestamp"),
            isRead = obj.bool("isRead") ?: obj.nestedObject("readStatus")?.bool("isRead") ?: false,
        )
    }

    private fun previewFor(lastMessage: JsonObject?): String {
        if (lastMessage == null) return "No messages yet"
        val content = lastMessage.string("content") ?: lastMessage.string("text") ?: ""
        return when {
            lastMessage.string("messageType") == "image" -> "Photo"
            lastMessage.string("messageType") == "file" -> "Attachment"
            lastMessage.string("messageType") == "mixed" -> "Attachment"
            content.isBlank() -> "Attachment"
            else -> content
        }
    }
}

data class ConversationDetailPayload(
    val conversation: ConversationSummary,
    val messages: List<ThreadMessage>,
)

private data class PresignedUploadPayload(
    val putUrl: String,
    val getUrl: String,
)

private class ProgressRequestBody(
    private val contentType: okhttp3.MediaType,
    private val data: ByteArray,
    private val onProgress: (Int) -> Unit,
) : RequestBody() {
    override fun contentType(): okhttp3.MediaType? = contentType

    override fun contentLength(): Long = data.size.toLong()

    override fun writeTo(sink: BufferedSink) {
        val totalBytes = data.size.toLong().coerceAtLeast(1L)
        val chunkSize = 8 * 1024
        var bytesWritten = 0
        var lastProgress = -1

        while (bytesWritten < data.size) {
            val toWrite = minOf(chunkSize, data.size - bytesWritten)
            sink.write(data, bytesWritten, toWrite)
            bytesWritten += toWrite

            val progress = ((bytesWritten.toLong() * 100) / totalBytes).toInt().coerceIn(0, 100)
            if (progress != lastProgress) {
                lastProgress = progress
                onProgress(progress)
            }
        }
    }
}

private fun JsonObject.string(key: String): String? = (this[key] as? JsonPrimitive)?.contentOrNull()

private fun JsonObject.int(key: String): Int? = (this[key] as? JsonPrimitive)?.intOrNull()

private fun JsonObject.long(key: String): Long? = (this[key] as? JsonPrimitive)?.longOrNull()

private fun JsonObject.bool(key: String): Boolean? = (this[key] as? JsonPrimitive)?.booleanOrNull()

private fun JsonObject.nestedObject(key: String): JsonObject? = this[key] as? JsonObject

private fun JsonObject.nestedArray(key: String): JsonArray? = this[key] as? JsonArray

private fun JsonPrimitive.contentOrNull(): String? = if (this == JsonNull) null else content

private fun JsonPrimitive.intOrNull(): Int? = content.toIntOrNull()

private fun JsonPrimitive.longOrNull(): Long? = content.toLongOrNull()

private fun JsonPrimitive.booleanOrNull(): Boolean? = content.toBooleanStrictOrNull()
