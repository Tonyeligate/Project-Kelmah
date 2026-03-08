package com.kelmah.mobile.features.notifications.data

import android.net.Uri

data class NotificationItem(
    val id: String,
    val type: String,
    val title: String,
    val content: String,
    val actionUrl: String? = null,
    val priority: String = "medium",
    val isRead: Boolean = false,
    val createdAt: String? = null,
    val relatedEntityType: String? = null,
    val relatedEntityId: String? = null,
)

sealed interface NotificationActionTarget {
    data class Job(val jobId: String) : NotificationActionTarget
    data class Conversation(val conversationId: String) : NotificationActionTarget
}

val NotificationItem.displayTag: String
    get() = when {
        priority.equals("high", ignoreCase = true) -> "High priority"
        type == "message_received" -> "Message"
        type == "job_application" -> "Job application"
        type == "job_offer" -> "Job offer"
        type == "payment_received" -> "Payment"
        type == "contract_update" -> "Contract"
        type == "review_received" -> "Review"
        else -> "Alert"
    }

val NotificationItem.actionTarget: NotificationActionTarget?
    get() {
        val parsedUrl = actionUrl?.let { runCatching { Uri.parse(it) }.getOrNull() }
        val path = parsedUrl?.path.orEmpty()
        val conversationId = parsedUrl?.getQueryParameter("conversation")

        return when {
            !conversationId.isNullOrBlank() -> NotificationActionTarget.Conversation(conversationId)
            path.startsWith("/jobs/") -> path.substringAfterLast('/').takeIf { it.isNotBlank() }?.let(NotificationActionTarget::Job)
            relatedEntityType.equals("message", ignoreCase = true) -> relatedEntityId?.let(NotificationActionTarget::Conversation)
            relatedEntityType.equals("job", ignoreCase = true) -> relatedEntityId?.let(NotificationActionTarget::Job)
            else -> null
        }
    }

val NotificationItem.actionLabel: String?
    get() = when (actionTarget) {
        is NotificationActionTarget.Conversation -> "Open conversation"
        is NotificationActionTarget.Job -> "Open job"
        null -> null
    }
