import Foundation

struct AppNotificationItem: Identifiable, Hashable {
    let id: String
    let type: String
    let title: String
    let content: String
    let actionURL: String?
    let priority: String
    let isRead: Bool
    let createdAt: String?
    let relatedEntityType: String?
    let relatedEntityId: String?

    var displayTag: String {
        switch type {
        case "message_received":
            return "Message"
        case "job_application":
            return "Job application"
        case "job_offer":
            return "Job offer"
        case "payment_received":
            return "Payment"
        case "contract_update":
            return "Contract"
        case "review_received":
            return "Review"
        default:
            return priority == "high" ? "High priority" : "Alert"
        }
    }
}

struct NotificationsEnvelope: Decodable {
    let success: Bool?
    let message: String?
    let data: JSONValue?
    let unreadCount: Int?
}
