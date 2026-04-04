package com.kelmah.mobile.features.notifications.data

import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

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

private val OBJECT_ID_REGEX = Regex("^[0-9a-fA-F]{24}$")

private fun isValidObjectId(value: String): Boolean = OBJECT_ID_REGEX.matches(value)

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
        val validConversationId = conversationId?.trim()?.takeIf(::isValidObjectId)
        val relatedId = relatedEntityId?.trim().orEmpty().takeIf(::isValidObjectId)

        return when {
            validConversationId != null -> NotificationActionTarget.Conversation(validConversationId)
            path.startsWith("/messages/") -> path.substringAfterLast('/').takeIf(::isValidObjectId)?.let(NotificationActionTarget::Conversation)
            path.startsWith("/jobs/detail/") -> path.substringAfterLast('/').takeIf(::isValidObjectId)?.let(NotificationActionTarget::Job)
            path.startsWith("/jobs/") -> path.substringAfterLast('/').takeIf(::isValidObjectId)?.let(NotificationActionTarget::Job)
            relatedEntityType.equals("message", ignoreCase = true) -> relatedId?.let(NotificationActionTarget::Conversation)
            relatedEntityType.equals("job", ignoreCase = true) -> relatedId?.let(NotificationActionTarget::Job)
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
    if (rawActionUrl.isBlank()) return ""

    val normalizedUrl = if (rawActionUrl.startsWith("/")) {
        "https://placeholder.local$rawActionUrl"
    } else {
        rawActionUrl
    }

    val uri = runCatching { URI(normalizedUrl) }.getOrNull()
        ?: return rawActionUrl.substringBefore('?')

    val rawPath = uri.path.orEmpty()
    val host = uri.host.orEmpty()
    return if (uri.scheme?.lowercase() == "kelmah" && host.isNotBlank()) {
        val pathTail = rawPath.takeIf { it != "/" }.orEmpty()
        "/$host$pathTail"
    } else {
        rawPath
    }
}

private fun notificationActionQueryParameter(rawActionUrl: String, key: String): String? =
    runCatching {
        val normalizedUrl = if (rawActionUrl.startsWith("/")) {
            "https://placeholder.local$rawActionUrl"
        } else {
            rawActionUrl
        }
        URI(normalizedUrl).rawQuery.orEmpty()
    }.getOrDefault(rawActionUrl.substringAfter('?', ""))
        .split('&')
        .asSequence()
        .mapNotNull { part ->
            val name = part.substringBefore('=', "")
            val value = part.substringAfter('=', "")
            if (name == key && value.isNotBlank()) {
                URLDecoder.decode(value, StandardCharsets.UTF_8.name())
            } else {
                null
            }
        }
        .firstOrNull()
