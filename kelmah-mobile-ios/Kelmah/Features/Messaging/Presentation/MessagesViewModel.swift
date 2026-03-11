import Combine
import Foundation

@MainActor
final class MessagesViewModel: ObservableObject {
    @Published var isLoadingConversations = false
    @Published var isLoadingMessages = false
    @Published var isSending = false
    @Published var conversations: [MessageConversation] = []
    @Published var selectedConversation: MessageConversation?
    @Published var messages: [MessageThreadItem] = []
    @Published var searchQuery = ""
    @Published var draftMessage = ""
    @Published var errorMessage: String?
    @Published var infoMessage: String?

    private let repository: MessagesRepository
    private let realtimeSocketManager: RealtimeSocketManager
    private var hasBootstrapped = false
    private var subscriptions = Set<AnyCancellable>()

    init(repository: MessagesRepository, realtimeSocketManager: RealtimeSocketManager) {
        self.repository = repository
        self.realtimeSocketManager = realtimeSocketManager
        subscribeToRealtimeSignals()
    }

    var currentUserId: String? {
        repository.currentUserId
    }

    var totalUnreadCount: Int {
        conversations.reduce(0) { $0 + $1.unreadCount }
    }

    var filteredConversations: [MessageConversation] {
        let query = searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard query.isEmpty == false else { return conversations }
        return conversations.filter { conversation in
            conversation.displayTitle.lowercased().contains(query) ||
            conversation.lastMessagePreview.lowercased().contains(query)
        }
    }

    func bootstrap() async {
        realtimeSocketManager.start()
        guard hasBootstrapped == false else { return }
        hasBootstrapped = true
        await refreshConversations()
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
        conversations = []
        messages = []
        selectedConversation = nil
        draftMessage = ""
        searchQuery = ""
        errorMessage = nil
        infoMessage = nil
    }

    func refreshConversations() async {
        isLoadingConversations = true
        errorMessage = nil
        defer { isLoadingConversations = false }
        do {
            let refreshed = try await repository.getConversations()
            conversations = refreshed
            if let selectedConversation {
                self.selectedConversation = refreshed.first(where: { $0.id == selectedConversation.id }) ?? selectedConversation
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func openConversation(_ conversation: MessageConversation) async {
        selectedConversation = conversation
        draftMessage = ""
        await loadMessages(conversationId: conversation.id)
    }

    func openConversation(conversationId: String) async {
        if let existing = conversations.first(where: { $0.id == conversationId }) {
            await openConversation(existing)
            return
        }

        await refreshConversations()
        if let refreshed = conversations.first(where: { $0.id == conversationId }) {
            await openConversation(refreshed)
        } else {
            errorMessage = "Conversation could not be found"
        }
    }

    func closeConversation() {
        selectedConversation = nil
        messages = []
        draftMessage = ""
        errorMessage = nil
    }

    func refreshSelectedConversation() async {
        await refreshConversations()
        if let conversationId = selectedConversation?.id {
            await loadMessages(conversationId: conversationId)
        }
    }

    func loadMessages(conversationId: String) async {
        isLoadingMessages = true
        errorMessage = nil
        defer { isLoadingMessages = false }
        do {
            messages = try await repository.getMessages(conversationId: conversationId)
            conversations = conversations.map { conversation in
                conversation.id == conversationId
                    ? MessageConversation(
                        id: conversation.id,
                        title: conversation.title,
                        participants: conversation.participants,
                        otherParticipant: conversation.otherParticipant,
                        unreadCount: 0,
                        lastMessagePreview: conversation.lastMessagePreview,
                        lastMessageAt: conversation.lastMessageAt
                    )
                    : conversation
            }
            if let selectedConversation, selectedConversation.id == conversationId {
                self.selectedConversation = conversations.first(where: { $0.id == conversationId }) ?? selectedConversation
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func sendMessage() async {
        guard let selectedConversation else { return }
        let trimmed = draftMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.isEmpty == false else {
            errorMessage = "Enter a message before sending"
            return
        }

        isSending = true
        errorMessage = nil
        infoMessage = nil
        defer { isSending = false }
        do {
            let message = try await repository.sendMessage(conversationId: selectedConversation.id, content: trimmed)
            messages = sortMessagesChronologically(Array((messages + [message]).reduce(into: [String: MessageThreadItem]()) { result, item in
                result[item.id] = item
            }.values))
            let updatedConversation = MessageConversation(
                id: selectedConversation.id,
                title: selectedConversation.title,
                participants: selectedConversation.participants,
                otherParticipant: selectedConversation.otherParticipant,
                unreadCount: 0,
                lastMessagePreview: message.content,
                lastMessageAt: message.createdAt
            )
            self.selectedConversation = updatedConversation
            conversations = sortConversationsByActivity(conversations.map { conversation in
                conversation.id == updatedConversation.id ? updatedConversation : conversation
            })
            draftMessage = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func subscribeToRealtimeSignals() {
        realtimeSocketManager.signals
            .receive(on: RunLoop.main)
            .sink { [weak self] signal in
                guard let self else { return }
                Task { await self.handleRealtimeSignal(signal) }
            }
            .store(in: &subscriptions)
    }

    private func handleRealtimeSignal(_ signal: RealtimeSignal) async {
        switch signal {
        case let .message(conversationId):
            await refreshConversations()
            if let conversationId, selectedConversation?.id == conversationId {
                await loadMessages(conversationId: conversationId)
            }
        case let .messagesRead(conversationId):
            await refreshConversations()
            if let conversationId, selectedConversation?.id == conversationId {
                await loadMessages(conversationId: conversationId)
            }
        case .notification, .connectionChanged:
            break
        }
    }
}

private func sortMessagesChronologically(_ messages: [MessageThreadItem]) -> [MessageThreadItem] {
    messages.sorted { lhs, rhs in
        let leftDate = messageTimestamp(from: lhs.createdAt)
        let rightDate = messageTimestamp(from: rhs.createdAt)

        switch (leftDate, rightDate) {
        case let (left?, right?):
            if left != right {
                return left < right
            }
            return lhs.id < rhs.id
        case (_?, nil):
            return true
        case (nil, _?):
            return false
        case (nil, nil):
            return lhs.id < rhs.id
        }
    }
}

private func sortConversationsByActivity(_ conversations: [MessageConversation]) -> [MessageConversation] {
    conversations.sorted { lhs, rhs in
        let leftDate = messageTimestamp(from: lhs.lastMessageAt)
        let rightDate = messageTimestamp(from: rhs.lastMessageAt)

        switch (leftDate, rightDate) {
        case let (left?, right?):
            if left != right {
                return left > right
            }
            return lhs.id < rhs.id
        case (_?, nil):
            return true
        case (nil, _?):
            return false
        case (nil, nil):
            return lhs.id < rhs.id
        }
    }
}

private func messageTimestamp(from raw: String?) -> Date? {
    guard let raw, raw.isEmpty == false else { return nil }
    return notificationSortDate(from: raw)
}
