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

        return sortNotificationsByCreatedAt(values.compactMap { value in
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
                updatedAt: object.string("updatedAt"),
                relatedEntityType: related?.string("type"),
                relatedEntityId: related?.string("id") ?? related?.string("_id")
            )
        })
    }
}

func sortNotificationsByCreatedAt(_ items: [AppNotificationItem]) -> [AppNotificationItem] {
    items.enumerated()
        .sorted { lhs, rhs in
            let leftDate = notificationSortDate(from: lhs.element.createdAt)
                ?? notificationSortDate(from: lhs.element.updatedAt)
                ?? notificationObjectIDDate(from: lhs.element.id)
            let rightDate = notificationSortDate(from: rhs.element.createdAt)
                ?? notificationSortDate(from: rhs.element.updatedAt)
                ?? notificationObjectIDDate(from: rhs.element.id)

            switch (leftDate, rightDate) {
            case let (left?, right?):
                if left != right {
                    return left > right
                }
                return lhs.offset < rhs.offset
            case (_?, nil):
                return true
            case (nil, _?):
                return false
            case (nil, nil):
                return lhs.offset < rhs.offset
            }
        }
        .map(\.element)
}

private func notificationObjectIDDate(from id: String) -> Date? {
    guard id.count >= 8 else { return nil }
    let prefix = String(id.prefix(8))
    guard let seconds = Int(prefix, radix: 16) else { return nil }
    return Date(timeIntervalSince1970: TimeInterval(seconds))
}

private func notificationSortDate(from raw: String?) -> Date? {
    guard let raw, raw.isEmpty == false else { return nil }
    if let parsed = notificationPrimaryFormatter.date(from: raw) {
        return parsed
    }
    return notificationFractionalFormatter.date(from: raw)
}

private let notificationPrimaryFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime]
    return formatter
}()

private let notificationFractionalFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
}()

private extension Dictionary where Key == String, Value == JSONValue {
    func string(_ key: String) -> String? { self[key]?.stringValue }
    func int(_ key: String) -> Int? { self[key]?.intValue }
    func bool(_ key: String) -> Bool? { self[key]?.boolValue }
}

