import SwiftUI

struct MessagesView: View {
    @ObservedObject var viewModel: MessagesViewModel
    var pendingConversationId: String? = nil
    var onHandledPendingConversation: (() -> Void)? = nil
    @State private var path: [MessagesRoute] = []

    var body: some View {
        NavigationStack(path: $path) {
            List {
                Section {
                    TextField("Search chats", text: $viewModel.searchQuery)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                }

                if let message = viewModel.errorMessage {
                    Section {
                        MessageBannerView(message: message, tint: .red.opacity(0.12))
                    }
                }

                if let message = viewModel.infoMessage {
                    Section {
                        MessageBannerView(message: message, tint: KelmahTheme.accent.opacity(0.18))
                    }
                }

                Section("Chats") {
                    if viewModel.isLoadingConversations, viewModel.filteredConversations.isEmpty {
                        ProgressView("Loading chats...")
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else if viewModel.filteredConversations.isEmpty {
                        ContentUnavailableView(
                            "No messages yet",
                            systemImage: "message",
                            description: Text("Your job messages will show here.")
                        )
                    } else {
                        ForEach(viewModel.filteredConversations) { conversation in
                            Button {
                                Task {
                                    await viewModel.openConversation(conversation)
                                    path.append(.thread(conversation.id))
                                }
                            } label: {
                                ConversationRowView(conversation: conversation)
                            }
                            .buttonStyle(.plain)
                            .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
                            .listRowBackground(Color.clear)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(KelmahTheme.background)
            .navigationTitle("Messages")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await viewModel.refreshConversations() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel("Refresh conversations")
                }
            }
            .refreshable {
                await viewModel.refreshConversations()
            }
            .task {
                await viewModel.bootstrap()
            }
            .task(id: pendingConversationId) {
                if let pendingConversationId, pendingConversationId.isEmpty == false {
                    await viewModel.openConversation(conversationId: pendingConversationId)
                    if viewModel.selectedConversation?.id == pendingConversationId {
                        path = [.thread(pendingConversationId)]
                    }
                    onHandledPendingConversation?()
                }
            }
            .navigationDestination(for: MessagesRoute.self) { route in
                switch route {
                case let .thread(conversationId):
                    MessageThreadView(viewModel: viewModel, conversationId: conversationId)
                }
            }
        }
    }
}

private struct ConversationRowView: View {
    let conversation: MessageConversation

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(KelmahTheme.accent.opacity(0.18))
                .frame(width: 44, height: 44)
                .overlay(
                    Text(String(conversation.displayTitle.prefix(1)).uppercased())
                        .font(.headline)
                        .foregroundStyle(KelmahTheme.accent)
                )

            VStack(alignment: .leading, spacing: 6) {
                Text(conversation.displayTitle)
                    .font(.headline)
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Text(conversation.lastMessagePreview)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            Spacer()

            if conversation.unreadCount > 0 {
                Text("\(conversation.unreadCount) new")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .background(KelmahTheme.accent)
                    .clipShape(Capsule())
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(KelmahTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(alignment: .bottomTrailing) {
            Text("Tap to open")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(KelmahTheme.accent)
                .padding(.trailing, 14)
                .padding(.bottom, 12)
        }
    }
}

private struct MessageThreadView: View {
    @ObservedObject var viewModel: MessagesViewModel
    let conversationId: String

    var body: some View {
        VStack(spacing: 0) {
            if let participant = viewModel.selectedConversation?.otherParticipant {
                HStack {
                    Text(participant.isActive == true ? "\(participant.name) • online" : participant.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.secondary)
                    Spacer()
                }
                .padding(.horizontal)
                .padding(.top, 12)
            }

            if viewModel.isLoadingMessages, viewModel.messages.isEmpty {
                Spacer()
                ProgressView("Opening chat...")
                Spacer()
            } else if viewModel.messages.isEmpty {
                Spacer()
                ContentUnavailableView(
                    "No messages yet",
                    systemImage: "ellipsis.message",
                    description: Text("Write the first message.")
                )
                Spacer()
            } else {
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            ForEach(viewModel.messages) { message in
                                MessageBubbleView(
                                    message: message,
                                    isOwnMessage: message.senderId == viewModel.currentUserId
                                )
                                .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .scrollDismissesKeyboard(.interactively)
                    .onChange(of: viewModel.messages.count) { _ in
                        if let last = viewModel.messages.last?.id {
                            withAnimation {
                                proxy.scrollTo(last, anchor: .bottom)
                            }
                        }
                    }
                }
            }
        }
        .background(KelmahTheme.background)
        .navigationTitle(viewModel.selectedConversation?.displayTitle ?? "Chat")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await viewModel.refreshSelectedConversation() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .accessibilityLabel("Refresh thread")
            }
        }
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: 10) {
                TextField("Write message", text: $viewModel.draftMessage, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(1...4)

                Button {
                    Task { await viewModel.sendMessage() }
                } label: {
                    if viewModel.isSending {
                        HStack(spacing: 8) {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                            Text("Sending")
                        }
                    } else {
                        Label("Send", systemImage: "paperplane.fill")
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(KelmahTheme.accent)
                .disabled(viewModel.isSending || viewModel.draftMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding()
            .background(.ultraThinMaterial)
        }
        .task(id: conversationId) {
            await viewModel.loadMessages(conversationId: conversationId)
        }
    }
}

private struct MessageBubbleView: View {
    let message: MessageThreadItem
    let isOwnMessage: Bool

    var body: some View {
        VStack(alignment: isOwnMessage ? .trailing : .leading, spacing: 4) {
            if isOwnMessage == false {
                Text(message.senderName)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(displayText)
                    .font(.body)
                if let createdAt = message.createdAt {
                    Text(RelativeTimeFormatter.relativeOrFallback(createdAt) ?? createdAt)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(isOwnMessage ? KelmahTheme.accent.opacity(0.18) : KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .frame(maxWidth: .infinity, alignment: isOwnMessage ? .trailing : .leading)
    }

    private var displayText: String {
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

private struct MessageBannerView: View {
    let message: String
    let tint: Color

    var body: some View {
        Text(message)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(tint)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
