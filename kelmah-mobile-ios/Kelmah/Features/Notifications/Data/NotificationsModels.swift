import Foundation

enum NotificationActionTarget: Hashable {
    case job(String)
    case conversation(String)

    var label: String {
        switch self {
        case .job:
            return "Open job"
        case .conversation:
            return "Open conversation"
        }
    }
}

struct AppNotificationItem: Identifiable, Hashable {
    let id: String
    let type: String
    let title: String
    let content: String
    let actionURL: String?
    let priority: String
    let isRead: Bool
    let createdAt: String?
    let updatedAt: String?
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

    var actionTarget: NotificationActionTarget? {
        if let actionURL, actionURL.isEmpty == false {
            if let components = URLComponents(string: actionURL) {
                if let conversationId = components.queryItems?.first(where: { $0.name == "conversation" })?.value,
                   conversationId.isEmpty == false {
                    return .conversation(conversationId)
                }

                let path = components.path
                if path.hasPrefix("/messages/") {
                    let conversationId = path.split(separator: "/").last.map(String.init)
                    if let conversationId, conversationId.isEmpty == false {
                        return .conversation(conversationId)
                    }
                }
                if path.hasPrefix("/jobs/") {
                    let jobId = path.split(separator: "/").last.map(String.init)
                    if let jobId, jobId.isEmpty == false {
                        return .job(jobId)
                    }
                }
            }
        }

        if relatedEntityType?.lowercased() == "message", let relatedEntityId, relatedEntityId.isEmpty == false {
            return .conversation(relatedEntityId)
        }
        if relatedEntityType?.lowercased() == "job", let relatedEntityId, relatedEntityId.isEmpty == false {
            return .job(relatedEntityId)
        }
        return nil
    }
}

struct NotificationsEnvelope: Decodable {
    let success: Bool?
    let message: String?
    let data: JSONValue?
    let unreadCount: Int?
}
