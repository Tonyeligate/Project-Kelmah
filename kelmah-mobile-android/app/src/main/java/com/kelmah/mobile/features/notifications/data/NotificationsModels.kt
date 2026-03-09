package com.kelmah.mobile.features.notifications.data

data class NotificationItem(
    val id: String,
    val type: String,
    val title: String,
    val content: String,
    val actionUrl: String? = null,
    val priority: String = "medium",
    val isRead: Boolean = false,
    val createdAt: String? = null,
    val updatedAt: String? = null,
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
        val rawActionUrl = actionUrl?.trim().orEmpty()
        val path = notificationActionPath(rawActionUrl)
        val conversationId = notificationActionQueryParameter(rawActionUrl, "conversation")

        return when {
            !conversationId.isNullOrBlank() -> NotificationActionTarget.Conversation(conversationId)
            path.startsWith("/messages/") -> path.substringAfterLast('/').takeIf { it.isNotBlank() }?.let(NotificationActionTarget::Conversation)
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

private fun notificationActionPath(rawActionUrl: String): String {
    val withoutQuery = rawActionUrl.substringBefore('?')
    if (withoutQuery.startsWith("http://") || withoutQuery.startsWith("https://")) {
        return "/" + withoutQuery.substringAfter("://").substringAfter('/', "").trimStart('/')
    }
    return withoutQuery
}

private fun notificationActionQueryParameter(rawActionUrl: String, key: String): String? =
    rawActionUrl.substringAfter('?', "")
        .split('&')
        .asSequence()
        .mapNotNull { part ->
            val name = part.substringBefore('=', "")
            val value = part.substringAfter('=', "")
            if (name == key && value.isNotBlank()) value else null
        }
        .firstOrNull()
