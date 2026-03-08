package com.kelmah.mobile.features.messaging.data

import com.kelmah.mobile.core.network.ApiResult
import com.kelmah.mobile.core.session.SessionCoordinator
import com.kelmah.mobile.core.storage.TokenManager
import dagger.Lazy
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import retrofit2.HttpException

@Singleton
class MessagingRepository @Inject constructor(
    private val messagingApiService: MessagingApiService,
    private val sessionCoordinator: Lazy<SessionCoordinator>,
    private val tokenManager: TokenManager,
) {
    fun currentUserId(): String? = tokenManager.getStoredSession()?.user?.resolvedId

    suspend fun getConversations(): ApiResult<List<ConversationSummary>> = executeAuthorized {
        val response = messagingApiService.getConversations(emptyMap())
        ApiResult.Success(parseConversations(response))
    }

    suspend fun getMessages(
        conversationId: String,
        limit: Int = 50,
    ): ApiResult<List<ThreadMessage>> = executeAuthorized {
        val response = messagingApiService.getMessages(
            conversationId = conversationId,
            query = mapOf("limit" to limit.toString()),
        )
        ApiResult.Success(parseMessages(response, conversationId))
    }

    suspend fun sendMessage(
        conversationId: String,
        content: String,
    ): ApiResult<ThreadMessage> = executeAuthorized {
        val response = messagingApiService.sendMessage(
            conversationId = conversationId,
            request = SendMessageRequest(
                conversationId = conversationId,
                content = content.trim(),
            ),
        )
        ApiResult.Success(parseSentMessage(response, conversationId))
    }

    private suspend fun <T> executeAuthorized(block: suspend () -> ApiResult<T>): ApiResult<T> {
        return try {
            block()
        } catch (error: HttpException) {
            if (error.code() == 401 && sessionCoordinator.get().refreshSession()) {
                try {
                    block()
                } catch (retryError: Exception) {
                    ApiResult.Error(message = retryError.message ?: "Request failed after session refresh")
                }
            } else {
                ApiResult.Error(message = error.message ?: "Request failed", code = error.code())
            }
        } catch (error: Exception) {
            ApiResult.Error(message = error.message ?: "Request failed")
        }
    }

    private fun parseConversations(response: JsonObject): List<ConversationSummary> {
        val userId = currentUserId()
        val dataNode = response["data"]
        val values = when (dataNode) {
            is JsonObject -> dataNode.nestedArray("conversations")
            is JsonArray -> dataNode
            else -> response.nestedArray("conversations") ?: JsonArray(emptyList())
        }

        return values.mapNotNull { item ->
            val obj = item as? JsonObject ?: return@mapNotNull null
            val id = obj.string("id") ?: obj.string("_id") ?: return@mapNotNull null
            val participants = parseParticipants(obj.nestedArray("participants"))
            val otherParticipant = obj.nestedObject("otherParticipant")?.let(::parseParticipant)
                ?: participants.firstOrNull { participant -> participant.id != userId }
            val lastMessage = obj.nestedObject("lastMessage") ?: obj.nestedObject("latestMessage")

            ConversationSummary(
                id = id,
                title = obj.string("title"),
                participants = participants,
                otherParticipant = otherParticipant,
                unreadCount = obj.int("unreadCount") ?: obj.int("unread") ?: 0,
                lastMessagePreview = previewFor(lastMessage),
                lastMessageAt = obj.string("lastMessageAt") ?: obj.string("updatedAt") ?: lastMessage?.string("createdAt"),
            )
        }.sortedByDescending { it.lastMessageAt ?: "" }
    }

    private fun parseMessages(response: JsonObject, conversationId: String): List<ThreadMessage> {
        val dataNode = response["data"]
        val values = when (dataNode) {
            is JsonObject -> dataNode.nestedArray("messages")
            is JsonArray -> dataNode
            else -> response.nestedArray("messages") ?: JsonArray(emptyList())
        }

        return values.mapNotNull { parseMessage(it as? JsonObject ?: return@mapNotNull null, conversationId) }
            .sortedBy { it.createdAt ?: "" }
    }

    private fun parseSentMessage(response: JsonObject, conversationId: String): ThreadMessage {
        val raw = response.nestedObject("data") ?: response
        return parseMessage(raw, conversationId)
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

    private fun parseMessage(obj: JsonObject, conversationId: String): ThreadMessage? {
        val id = obj.string("id") ?: obj.string("_id") ?: return null
        val senderObject = obj.nestedObject("sender") ?: obj.nestedObject("senderInfo")
        val senderId = obj.string("senderId")
            ?: obj.string("sender")
            ?: senderObject?.string("id")
            ?: senderObject?.string("_id")
            ?: return null
        val senderName = senderObject?.string("name")
            ?: listOfNotNull(senderObject?.string("firstName"), senderObject?.string("lastName")).joinToString(" ").ifBlank { null }
            ?: if (senderId == currentUserId()) "You" else "Kelmah User"
        val messageType = obj.string("messageType") ?: "text"
        val content = obj.string("content") ?: obj.string("text") ?: previewFor(obj)

        return ThreadMessage(
            id = id,
            conversationId = obj.string("conversationId") ?: obj.string("conversation") ?: conversationId,
            senderId = senderId,
            senderName = senderName,
            content = content,
            messageType = messageType,
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
            content.isBlank() -> "Attachment"
            else -> content
        }
    }
}

private fun JsonObject.string(key: String): String? = (this[key] as? JsonPrimitive)?.contentOrNull()

private fun JsonObject.int(key: String): Int? = (this[key] as? JsonPrimitive)?.intOrNull()

private fun JsonObject.bool(key: String): Boolean? = (this[key] as? JsonPrimitive)?.booleanOrNull()

private fun JsonObject.nestedObject(key: String): JsonObject? = this[key] as? JsonObject

private fun JsonObject.nestedArray(key: String): JsonArray? = this[key] as? JsonArray

private fun JsonPrimitive.contentOrNull(): String? = if (this == JsonNull) null else content

private fun JsonPrimitive.intOrNull(): Int? = content.toIntOrNull()

private fun JsonPrimitive.booleanOrNull(): Boolean? = content.toBooleanStrictOrNull()
