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
    val relatedEntityType: String? = null,
    val relatedEntityId: String? = null,
)

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
