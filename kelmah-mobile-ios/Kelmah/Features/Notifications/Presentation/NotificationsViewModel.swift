import Combine
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
    private let realtimeSocketManager: RealtimeSocketManager
    private var hasBootstrapped = false
    private var subscriptions = Set<AnyCancellable>()

    init(repository: NotificationsRepository, realtimeSocketManager: RealtimeSocketManager) {
        self.repository = repository
        self.realtimeSocketManager = realtimeSocketManager
        subscribeToRealtimeSignals()
    }

    func bootstrap() async {
        realtimeSocketManager.start()
        guard hasBootstrapped == false else { return }
        hasBootstrapped = true
        await refresh()
    }

    func startRealtimeSync() {
        realtimeSocketManager.start()
    }

    func stopRealtimeSync() {
        realtimeSocketManager.stop()
    }

    func clearMessages() {
        errorMessage = nil
        infoMessage = nil
    }

    func reset() {
        hasBootstrapped = false
        notifications = []
        unreadCount = 0
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
        defer { isLoading = false }

        // Fetch independently so one failure doesn't discard the other's result
        do {
            notifications = try await repository.getNotifications(unreadOnly: unreadOnly)
        } catch {
            errorMessage = error.localizedDescription
        }

        do {
            unreadCount = try await repository.getUnreadCount()
        } catch {
            // Fall back to local count when server count is unavailable
            unreadCount = notifications.filter { $0.isRead == false }.count
            if errorMessage == nil {
                errorMessage = error.localizedDescription
            }
        }
    }

    func markAsRead(notificationId: String) async {
        await mutate(successMessage: "Marked as read") {
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
                        updatedAt: item.updatedAt,
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
        await mutate(successMessage: "Marked all as read") {
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
                    updatedAt: item.updatedAt,
                    relatedEntityType: item.relatedEntityType,
                    relatedEntityId: item.relatedEntityId
                )
            }
            unreadCount = 0
        }
    }

    func deleteNotification(notificationId: String) async {
        await mutate(successMessage: "Alert removed") {
            try await repository.deleteNotification(notificationId: notificationId)
            notifications.removeAll { $0.id == notificationId }
            unreadCount = notifications.filter { $0.isRead == false }.count
        }
    }

    private func mutate(successMessage: String, operation: () async throws -> Void) async {
        isMutating = true
        errorMessage = nil
        infoMessage = nil
        defer { isMutating = false }
        do {
            try await operation()
            let localUnreadCount = notifications.filter { $0.isRead == false }.count
            unreadCount = (try? await repository.getUnreadCount()) ?? localUnreadCount
            infoMessage = successMessage
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func subscribeToRealtimeSignals() {
        realtimeSocketManager.signals
            .receive(on: DispatchQueue.main)
            .sink { [weak self] signal in
                guard let self else { return }
                Task { await self.handleRealtimeSignal(signal) }
            }
            .store(in: &subscriptions)
    }

    private func handleRealtimeSignal(_ signal: RealtimeSignal) async {
        switch signal {
        case .notification:
            await refresh()
        case .message, .messagesRead, .connectionChanged:
            break
        }
    }
}
