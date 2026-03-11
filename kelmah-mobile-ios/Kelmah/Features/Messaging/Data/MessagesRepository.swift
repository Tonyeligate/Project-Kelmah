import Foundation

final class MessagesRepository {
    private let apiClient: APIClient
    private let sessionStore: SessionStore

    init(apiClient: APIClient, sessionStore: SessionStore) {
        self.apiClient = apiClient
        self.sessionStore = sessionStore
    }

    var currentUserId: String? {
        sessionStore.currentUser?.resolvedID
    }

    func getConversations() async throws -> [MessageConversation] {
        let response = try await apiClient.send(
            path: "messages/conversations",
            method: .get,
            requiresAuth: true,
            responseType: MessagingRawEnvelope.self
        )
        return parseConversations(response)
    }

    func getMessages(conversationId: String, limit: Int = 50) async throws -> [MessageThreadItem] {
        let response = try await apiClient.send(
            path: "messages/conversations/\(conversationId.urlPathEncoded)/messages",
            method: .get,
            queryItems: [URLQueryItem(name: "limit", value: String(limit))],
            requiresAuth: true,
            responseType: MessagingRawEnvelope.self
        )
        return parseMessages(response, conversationId: conversationId)
    }

    func sendMessage(conversationId: String, content: String) async throws -> MessageThreadItem {
        let response = try await apiClient.send(
            path: "messages/conversations/\(conversationId.urlPathEncoded)/messages",
            method: .post,
            body: SendMessagePayload(conversationId: conversationId, content: content.trimmingCharacters(in: .whitespacesAndNewlines)),
            requiresAuth: true,
            responseType: MessagingRawEnvelope.self
        )
        guard let message = parseMessage(response.data?.objectValue ?? [:], conversationId: conversationId) else {
            throw APIClientError.invalidStatusCode(500, "Sent message payload was invalid")
        }
        return message
    }

    private func parseConversations(_ response: MessagingRawEnvelope) -> [MessageConversation] {
        let values = response.data?.objectValue?["conversations"]?.arrayValue
            ?? response.data?.arrayValue
            ?? []

        return values.compactMap { value in
            guard let object = value.objectValue else { return nil }
            guard let id = object.string("id") ?? object.string("_id") else { return nil }
            let participants = parseParticipants(object["participants"]?.arrayValue ?? [])
            let otherParticipant = object["otherParticipant"]?.objectValue.flatMap(parseParticipant)
                ?? participants.first(where: { $0.id != currentUserId })
            let lastMessageObject = object["lastMessage"]?.objectValue ?? object["latestMessage"]?.objectValue
            return MessageConversation(
                id: id,
                title: object.string("title"),
                participants: participants,
                otherParticipant: otherParticipant,
                unreadCount: object.int("unreadCount") ?? object.int("unread") ?? 0,
                lastMessagePreview: preview(for: lastMessageObject),
                lastMessageAt: object.string("lastMessageAt") ?? object.string("updatedAt") ?? lastMessageObject?.string("createdAt")
            )
        }.sorted(by: { ($0.lastMessageAt ?? "") > ($1.lastMessageAt ?? "") })
    }

    private func parseMessages(_ response: MessagingRawEnvelope, conversationId: String) -> [MessageThreadItem] {
        let values = response.data?.objectValue?["messages"]?.arrayValue
            ?? response.data?.arrayValue
            ?? []
        return values.compactMap { value in
            parseMessage(value.objectValue ?? [:], conversationId: conversationId)
        }.sorted(by: { ($0.createdAt ?? "") < ($1.createdAt ?? "") })
    }

    private func parseParticipants(_ values: [JSONValue]) -> [MessageParticipant] {
        values.compactMap { value in
            parseParticipant(value.objectValue ?? [:])
        }
    }

    private func parseParticipant(_ object: [String: JSONValue]) -> MessageParticipant? {
        guard let id = object.string("id") ?? object.string("_id") ?? object.string("userId") else { return nil }
        let name = object.string("name")
            ?? [object.string("firstName"), object.string("lastName")]
                .compactMap { $0 }
                .joined(separator: " ")
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .nilIfEmpty
            ?? object.string("email")
            ?? "Kelmah User"
        return MessageParticipant(
            id: id,
            name: name,
            profilePicture: object.string("profilePicture") ?? object.string("avatar") ?? object.string("profileImage"),
            isActive: object.bool("isActive") ?? object.bool("online")
        )
    }

    private func parseMessage(_ object: [String: JSONValue], conversationId: String) -> MessageThreadItem? {
        guard let id = object.string("id") ?? object.string("_id") else { return nil }
        let senderObject = object["sender"]?.objectValue ?? object["senderInfo"]?.objectValue
        guard let senderId = object.string("senderId")
            ?? object.string("sender")
            ?? senderObject?.string("id")
            ?? senderObject?.string("_id") else { return nil }
        let senderName = senderObject?.string("name")
            ?? [senderObject?.string("firstName"), senderObject?.string("lastName")]
                .compactMap { $0 }
                .joined(separator: " ")
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .nilIfEmpty
            ?? (senderId == currentUserId ? "You" : "Kelmah User")
        let messageType = object.string("messageType") ?? "text"
        let content = object.string("content") ?? object.string("text") ?? preview(for: object)
        return MessageThreadItem(
            id: id,
            conversationId: object.string("conversationId") ?? object.string("conversation") ?? conversationId,
            senderId: senderId,
            senderName: senderName,
            content: content,
            messageType: messageType,
            createdAt: object.string("createdAt") ?? object.string("timestamp"),
            isRead: object.bool("isRead") ?? object["readStatus"]?.objectValue?.bool("isRead") ?? false
        )
    }

    private func preview(for object: [String: JSONValue]?) -> String {
        guard let object else { return "No messages yet" }
        let content = object.string("content") ?? object.string("text") ?? ""
        switch object.string("messageType") {
        case "image":
            return "Photo"
        case "file":
            return "Attachment"
        default:
            return content.nilIfEmpty ?? "Attachment"
        }
    }
}

private extension Dictionary where Key == String, Value == JSONValue {
    func string(_ key: String) -> String? { self[key]?.stringValue }
    func int(_ key: String) -> Int? { self[key]?.intValue }
    func bool(_ key: String) -> Bool? { self[key]?.boolValue }
}
