package com.kelmah.mobile.features.messaging.data

import kotlinx.serialization.Serializable

@Serializable
data class CreateConversationRequest(
    val participantIds: List<String>,
    val type: String = "direct",
    val jobId: String? = null,
)

@Serializable
data class SendMessageRequest(
    val conversationId: String,
    val content: String,
    val messageType: String = "text",
)

data class MessagingParticipant(
    val id: String,
    val name: String,
    val profilePicture: String? = null,
    val isActive: Boolean? = null,
)

data class ConversationSummary(
    val id: String,
    val title: String? = null,
    val participants: List<MessagingParticipant> = emptyList(),
    val otherParticipant: MessagingParticipant? = null,
    val unreadCount: Int = 0,
    val lastMessagePreview: String = "No messages yet",
    val lastMessageAt: String? = null,
) {
    val displayTitle: String
        get() = otherParticipant?.name?.takeIf { it.isNotBlank() }
            ?: title?.takeIf { it.isNotBlank() }
            ?: participants.firstOrNull()?.name?.takeIf { it.isNotBlank() }
            ?: "Conversation"
}

data class ThreadMessage(
    val id: String,
    val conversationId: String,
    val senderId: String,
    val senderName: String,
    val content: String,
    val messageType: String,
    val createdAt: String? = null,
    val isRead: Boolean = false,
)
