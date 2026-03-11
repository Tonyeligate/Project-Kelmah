import Foundation

struct MessageParticipant: Identifiable, Hashable {
    let id: String
    let name: String
    let profilePicture: String?
    let isActive: Bool?
}

struct MessageConversation: Identifiable, Hashable {
    let id: String
    let title: String?
    let participants: [MessageParticipant]
    let otherParticipant: MessageParticipant?
    let unreadCount: Int
    let lastMessagePreview: String
    let lastMessageAt: String?

    var displayTitle: String {
        otherParticipant?.name.nilIfEmpty
            ?? title?.nilIfEmpty
            ?? participants.first?.name.nilIfEmpty
            ?? "Conversation"
    }
}

struct MessageThreadItem: Identifiable, Hashable {
    let id: String
    let conversationId: String
    let senderId: String
    let senderName: String
    let content: String
    let messageType: String
    let createdAt: String?
    let isRead: Bool
}

enum MessagesRoute: Hashable {
    case thread(String)
}

struct MessagingRawEnvelope: Decodable {
    let success: Bool?
    let message: String?
    let data: JSONValue?
}

struct SendMessagePayload: Encodable {
    let conversationId: String
    let content: String
    let messageType: String

    init(conversationId: String, content: String, messageType: String = "text") {
        self.conversationId = conversationId
        self.content = content
        self.messageType = messageType
    }
}

struct CreateConversationPayload: Encodable {
    let participantIds: [String]
    let jobId: String?
    let type: String

    init(participantIds: [String], jobId: String? = nil, type: String = "direct") {
        self.participantIds = participantIds
        self.jobId = jobId
        self.type = type
    }
}
