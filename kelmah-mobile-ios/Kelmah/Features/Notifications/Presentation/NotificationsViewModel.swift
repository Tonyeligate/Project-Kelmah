import Foundation

@MainActor
final class NotificationsViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var isMutating = false
    @Published var unreadOnly = false
    @Published var notifications: [AppNotificationItem] = []
    @Published var unreadCount = 0
    @Published var errorMessage: String?
    @Published var infoMessage: String?

    private let repository: NotificationsRepository
    private var hasBootstrapped = false

    init(repository: NotificationsRepository) {
        self.repository = repository
    }

    func bootstrap() async {
        guard hasBootstrapped == false else { return }
        hasBootstrapped = true
        await refresh()
    }

    func clearMessages() {
        errorMessage = nil
        infoMessage = nil
    }

    func setUnreadOnly(_ value: Bool) async {
        unreadOnly = value
        await refresh()
    }

    func refresh() async {
        isLoading = true
        errorMessage = nil
        do {
            async let loadedNotifications = repository.getNotifications(unreadOnly: unreadOnly)
            async let loadedUnreadCount = repository.getUnreadCount()
            notifications = try await loadedNotifications
            unreadCount = try await loadedUnreadCount
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func markAsRead(notificationId: String) async {
        await mutate(successMessage: "Notification marked as read") {
            try await repository.markAsRead(notificationId: notificationId)
            notifications = notifications.map { item in
                item.id == notificationId
                    ? AppNotificationItem(
                        id: item.id,
                        type: item.type,
                        title: item.title,
                        content: item.content,
                        actionURL: item.actionURL,
                        priority: item.priority,
                        isRead: true,
                        createdAt: item.createdAt,
                        relatedEntityType: item.relatedEntityType,
                        relatedEntityId: item.relatedEntityId
                    )
                    : item
            }
            if unreadOnly {
                notifications.removeAll { $0.id == notificationId }
            }
            unreadCount = max(0, notifications.filter { $0.isRead == false }.count)
        }
    }

    func markAllAsRead() async {
        await mutate(successMessage: "All notifications marked as read") {
            try await repository.markAllAsRead()
            notifications = unreadOnly ? [] : notifications.map { item in
                AppNotificationItem(
                    id: item.id,
                    type: item.type,
                    title: item.title,
                    content: item.content,
                    actionURL: item.actionURL,
                    priority: item.priority,
                    isRead: true,
                    createdAt: item.createdAt,
                    relatedEntityType: item.relatedEntityType,
                    relatedEntityId: item.relatedEntityId
                )
            }
            unreadCount = 0
        }
    }

    func deleteNotification(notificationId: String) async {
        await mutate(successMessage: "Notification removed") {
            try await repository.deleteNotification(notificationId: notificationId)
            notifications.removeAll { $0.id == notificationId }
            unreadCount = notifications.filter { $0.isRead == false }.count
        }
    }

    private func mutate(successMessage: String, operation: () async throws -> Void) async {
        isMutating = true
        errorMessage = nil
        infoMessage = nil
        do {
            try await operation()
            infoMessage = successMessage
        } catch {
            errorMessage = error.localizedDescription
        }
        isMutating = false
    }
}
