import Combine
import Foundation

@MainActor
final class PendingAttachment: ObservableObject, Identifiable {
    enum Kind: String {
        case image
        case file
    }

    let id = UUID()
    let fileName: String
    let mimeType: String
    let data: Data
    let kind: Kind
    let sizeInBytes: Int

    @Published var progress: Double = 0
    @Published var isUploading: Bool = false
    @Published var isUploaded: Bool = false
    @Published var uploadError: String?

    var sizeDescription: String {
        ByteCountFormatter.string(fromByteCount: Int64(sizeInBytes), countStyle: .file)
    }

    init(fileName: String, mimeType: String, data: Data) {
        self.fileName = fileName
        self.mimeType = mimeType
        self.data = data
        self.sizeInBytes = data.count
        self.kind = mimeType.hasPrefix("image/") ? .image : .file
    }
}

@MainActor
final class MessagesViewModel: ObservableObject {
    @Published var isLoadingConversations = false
    @Published var isLoadingMessages = false
    @Published var isSending = false
    @Published var isCreatingConversation = false
    @Published var conversations: [MessageConversation] = []
    @Published var selectedConversation: MessageConversation?
    @Published var messages: [MessageThreadItem] = []
    @Published var searchQuery = ""
    @Published var draftMessage = ""
    @Published var errorMessage: String?
    @Published var infoMessage: String?
    @Published var pendingAttachment: PendingAttachment?

    private let repository: MessagesRepository
    private let realtimeSocketManager: RealtimeSocketManager
    private var hasBootstrapped = false
    private var subscriptions = Set<AnyCancellable>()
    private var pendingServerMessageIDs = Set<String>()

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
        pendingAttachment = nil
        pendingServerMessageIDs = []
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
        pendingAttachment = nil
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
            errorMessage = "Chat not found"
        }
    }

    func closeConversation() {
        selectedConversation = nil
        messages = []
        draftMessage = ""
        pendingAttachment = nil
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

    func uploadAttachment(fileName: String, mimeType: String, data: Data) {
        guard pendingAttachment == nil else { return }
        let attachment = PendingAttachment(fileName: fileName, mimeType: mimeType, data: data)
        self.pendingAttachment = attachment
        Task { await performUpload(attachment) }
    }

    func clearAttachment() {
        pendingAttachment = nil
    }

    func retryAttachment() {
        guard let attachment = pendingAttachment else { return }
        attachment.progress = 0
        attachment.isUploading = true
        attachment.isUploaded = false
        attachment.uploadError = nil
        Task { await performUpload(attachment) }
    }

    private func performUpload(_ attachment: PendingAttachment) async {
        attachment.isUploading = true
        attachment.uploadError = nil
        attachment.progress = 0

        do {
            let response = try await repository.uploadAttachment(
                fileName: attachment.fileName,
                mimeType: attachment.mimeType,
                data: attachment.data,
                progress: { [weak attachment] value in
                    Task { @MainActor in
                        attachment?.progress = value
                    }
                }
            )
            attachment.isUploaded = true
            attachment.isUploading = false
            infoMessage = "Attachment uploaded"
        } catch {
            attachment.isUploading = false
            attachment.uploadError = error.localizedDescription
            errorMessage = "Attachment upload failed: \(error.localizedDescription)"
        }
    }

    func sendMessage() async {
        guard let selectedConversation else { return }
        let trimmed = draftMessage.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.isEmpty == false || pendingAttachment?.isUploaded == true else {
            errorMessage = "Add a message or attach a file first"
            return
        }

        isSending = true
        errorMessage = nil
        infoMessage = nil
        defer { isSending = false }

        do {
            let message: MessageThreadItem
            if let attachment = pendingAttachment, attachment.isUploaded {
                let messageType = attachment.kind == .image ? "image" : "file"
                message = try await repository.sendMessage(
                    conversationId: selectedConversation.id,
                    content: "[Attachment]",
                    messageType: messageType,
                    attachmentFileName: attachment.fileName,
                    attachmentMimeType: attachment.mimeType
                )
            } else {
                message = try await repository.sendMessage(conversationId: selectedConversation.id, content: trimmed)
            }

            pendingAttachment = nil
            pendingServerMessageIDs.insert(message.id)
            messages = sortMessagesChronologically(Array((messages + [message]).reduce(into: [String: MessageThreadItem]()) { result, item in
                result[item.id] = item
            }.values))
            let updatedConversation = MessageConversation(
                id: selectedConversation.id,
                title: selectedConversation.title,
                participants: selectedConversation.participants,
                otherParticipant: selectedConversation.otherParticipant,
                unreadCount: 0,
                lastMessagePreview: self.lastMessagePreview(for: message),
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

    func createConversation(participantId: String, jobId: String? = nil) async -> String? {
        isCreatingConversation = true
        errorMessage = nil
        infoMessage = nil
        defer { isCreatingConversation = false }

        do {
            let conversationId = try await repository.createConversation(participantId: participantId, jobId: jobId)
            await refreshConversations()
            return conversationId
        } catch {
            errorMessage = error.localizedDescription
            return nil
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
        case let .message(conversationId):
            await refreshConversations()
            if let conversationId, selectedConversation?.id == conversationId {
                await reconcileConversationMessages(conversationId)
            }
        case let .messagesRead(conversationId):
            await refreshConversations()
            if let conversationId, selectedConversation?.id == conversationId {
                await reconcileConversationMessages(conversationId)
            }
        case .notification:
            await refreshConversations()
        case .connectionChanged:
            break
        }
    }

    private func reconcileConversationMessages(_ conversationId: String) async {
        do {
            let serverMessages = try await repository.getMessages(conversationId: conversationId)
            var merged = Dictionary(uniqueKeysWithValues: messages.map { ($0.id, $0) })
            serverMessages.forEach { merged[$0.id] = $0 }
            pendingServerMessageIDs.formUnion(serverMessages.map(\.id))
            messages = sortMessagesChronologically(Array(merged.values))
            if let updated = conversations.first(where: { $0.id == conversationId }) {
                let last = messages.sorted { lhs, rhs in
                    let leftDate = messageTimestamp(from: lhs.createdAt) ?? Date.distantPast
                    let rightDate = messageTimestamp(from: rhs.createdAt) ?? Date.distantPast
                    if leftDate != rightDate { return leftDate > rightDate }
                    return lhs.id > rhs.id
                }.first
                let conversation = MessageConversation(
                    id: updated.id,
                    title: updated.title,
                    participants: updated.participants,
                    otherParticipant: updated.otherParticipant,
                    unreadCount: 0,
                    lastMessagePreview: last.map { lastMessagePreview(for: $0) } ?? updated.lastMessagePreview,
                    lastMessageAt: last?.createdAt ?? updated.lastMessageAt
                )
                self.selectedConversation = conversation
                self.conversations = conversations.map { $0.id == conversationId ? conversation : $0 }
            }
        } catch {
            // Keep local cache on server error; do not lose outbound optimistic state.
        }
    }

    private func lastMessagePreview(for message: MessageThreadItem) -> String {
        switch message.messageType {
        case "image":
            return message.content == "[Attachment]" ? "Photo" : message.content
        case "file":
            return message.content == "[Attachment]" ? "Attachment" : message.content
        default:
            return message.content
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
