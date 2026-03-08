import Foundation

final class NotificationsRepository {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func getNotifications(unreadOnly: Bool = false, limit: Int = 50) async throws -> [AppNotificationItem] {
        var queryItems = [URLQueryItem(name: "limit", value: String(limit))]
        if unreadOnly {
            queryItems.append(URLQueryItem(name: "unreadOnly", value: "true"))
        }
        let response = try await apiClient.send(
            path: "notifications",
            method: .get,
            queryItems: queryItems,
            requiresAuth: true,
            responseType: NotificationsEnvelope.self
        )
        return parseNotifications(response)
    }

    func getUnreadCount() async throws -> Int {
        let response = try await apiClient.send(
            path: "notifications/unread/count",
            method: .get,
            requiresAuth: true,
            responseType: NotificationsEnvelope.self
        )
        return response.unreadCount
            ?? response.data?.objectValue?.int("unreadCount")
            ?? 0
    }

    func markAsRead(notificationId: String) async throws {
        _ = try await apiClient.send(
            path: "notifications/\(notificationId)/read",
            method: .patch,
            requiresAuth: true,
            responseType: NotificationsEnvelope.self
        ) as NotificationsEnvelope
    }

    func markAllAsRead() async throws {
        _ = try await apiClient.send(
            path: "notifications/read/all",
            method: .patch,
            requiresAuth: true,
            responseType: NotificationsEnvelope.self
        ) as NotificationsEnvelope
    }

    func deleteNotification(notificationId: String) async throws {
        _ = try await apiClient.send(
            path: "notifications/\(notificationId)",
            method: .delete,
            requiresAuth: true,
            responseType: NotificationsEnvelope.self
        ) as NotificationsEnvelope
    }

    private func parseNotifications(_ response: NotificationsEnvelope) -> [AppNotificationItem] {
        let values = response.data?.arrayValue
            ?? response.data?.objectValue?["notifications"]?.arrayValue
            ?? []

        return values.compactMap { value in
            guard let object = value.objectValue else { return nil }
            guard let id = object.string("id") ?? object.string("_id") else { return nil }
            let related = object["relatedEntity"]?.objectValue
            return AppNotificationItem(
                id: id,
                type: object.string("type") ?? "system_alert",
                title: object.string("title") ?? "Notification",
                content: object.string("content") ?? "",
                actionURL: object.string("actionUrl") ?? object.string("link"),
                priority: object.string("priority") ?? "medium",
                isRead: object["readStatus"]?.objectValue?.bool("isRead") ?? object.bool("read") ?? false,
                createdAt: object.string("createdAt"),
                relatedEntityType: related?.string("type"),
                relatedEntityId: related?.string("id") ?? related?.string("_id")
            )
        }
    }
}

private extension Dictionary where Key == String, Value == JSONValue {
    func string(_ key: String) -> String? { self[key]?.stringValue }
    func int(_ key: String) -> Int? { self[key]?.intValue }
    func bool(_ key: String) -> Bool? { self[key]?.boolValue }
}
