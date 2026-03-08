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
    private var hasBootstrapped = false

    init(repository: MessagesRepository) {
        self.repository = repository
    }

    var currentUserId: String? {
        repository.currentUserId
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
        guard hasBootstrapped == false else { return }
        hasBootstrapped = true
        await refreshConversations()
    }

    func clearMessages() {
        errorMessage = nil
        infoMessage = nil
    }

    func refreshConversations() async {
        isLoadingConversations = true
        errorMessage = nil
        do {
            let refreshed = try await repository.getConversations()
            conversations = refreshed
            if let selectedConversation {
                self.selectedConversation = refreshed.first(where: { $0.id == selectedConversation.id }) ?? selectedConversation
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoadingConversations = false
    }

    func openConversation(_ conversation: MessageConversation) async {
        selectedConversation = conversation
        draftMessage = ""
        await loadMessages(conversationId: conversation.id)
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
        isLoadingMessages = false
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
        do {
            let message = try await repository.sendMessage(conversationId: selectedConversation.id, content: trimmed)
            messages = Array((messages + [message]).reduce(into: [String: MessageThreadItem]()) { result, item in
                result[item.id] = item
            }.values).sorted(by: { ($0.createdAt ?? "") < ($1.createdAt ?? "") })
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
            conversations = conversations.map { conversation in
                conversation.id == updatedConversation.id ? updatedConversation : conversation
            }.sorted(by: { ($0.lastMessageAt ?? "") > ($1.lastMessageAt ?? "") })
            draftMessage = ""
        } catch {
            errorMessage = error.localizedDescription
        }
        isSending = false
    }
}
