import SwiftUI

struct MessagesView: View {
    @ObservedObject var viewModel: MessagesViewModel
    var pendingConversationId: String? = nil
    var onHandledPendingConversation: (() -> Void)? = nil
    @State private var path: [MessagesRoute] = []

    private var headerStats: [KelmahHeroStat] {
        [
            KelmahHeroStat(label: "Chats", value: "\(viewModel.filteredConversations.count)", tint: KelmahTheme.cyan),
            KelmahHeroStat(label: "Unread", value: "\(viewModel.totalUnreadCount)", tint: KelmahTheme.sun),
            KelmahHeroStat(
                label: "Active",
                value: "\(viewModel.filteredConversations.filter { $0.otherParticipant?.isActive == true }.count)",
                tint: KelmahTheme.success
            ),
        ]
    }

    private var headerChips: [String] {
        var chips: [String] = ["Realtime enabled"]
        if viewModel.searchQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false {
            chips.append("Search: \(viewModel.searchQuery)")
        }
        if viewModel.totalUnreadCount > 0 {
            chips.append("\(viewModel.totalUnreadCount) unread messages")
        }
        return chips
    }

    var body: some View {
        NavigationStack(path: $path) {
            KelmahPremiumBackground {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        KelmahCommandDeck(
                            eyebrow: "MESSAGING DESK",
                            title: "Stay on top of every conversation",
                            subtitle: "Open chats quickly, respond faster, and keep hiring or work momentum alive.",
                            stats: headerStats,
                            chips: headerChips
                        ) {
                            HStack(spacing: 10) {
                                Button {
                                    Task { await viewModel.refreshConversations() }
                                } label: {
                                    Text("Refresh")
                                        .fontWeight(.bold)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 48)
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(KelmahTheme.sun)
                                .foregroundStyle(Color.black)

                                Button {
                                    viewModel.searchQuery = ""
                                } label: {
                                    Text("Clear Search")
                                        .fontWeight(.semibold)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 46)
                                }
                                .buttonStyle(.bordered)
                                .tint(KelmahTheme.cyan)
                            }
                            .controlSize(.large)
                        }

                        KelmahPanel {
                            VStack(alignment: .leading, spacing: 8) {
                                KelmahSectionHeader(title: "Search", subtitle: "Find people or message previews")
                                TextField("Search messages", text: $viewModel.searchQuery)
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                                    .textFieldStyle(.roundedBorder)
                            }
                        }

                        if let message = viewModel.errorMessage {
                            KelmahBannerMessage(message: message, tint: KelmahTheme.danger)
                        }

                        if let message = viewModel.infoMessage {
                            KelmahBannerMessage(message: message, tint: KelmahTheme.success)
                        }

                        KelmahPanel {
                            KelmahSectionHeader(
                                title: "Conversations",
                                subtitle: "Recent messages with unread signals"
                            )
                        }

                        if viewModel.isLoadingConversations, viewModel.filteredConversations.isEmpty {
                            KelmahPanel {
                                HStack(spacing: 10) {
                                    ProgressView()
                                        .tint(KelmahTheme.sun)
                                    Text("Loading messages...")
                                        .foregroundStyle(KelmahTheme.textMuted)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        } else if viewModel.filteredConversations.isEmpty {
                            KelmahBannerMessage(
                                message: "No messages yet. Job conversations will appear here.",
                                tint: KelmahTheme.cyan
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
                            }
                        }
                    }
                        .padding(.horizontal, 16)
                        .padding(.top, 18)
                    .padding(.bottom, 20)
                }
                .scrollIndicators(.hidden)
            }
            .navigationTitle("Messages")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await viewModel.refreshConversations() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel("Refresh messages")
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
        KelmahPanel {
            HStack(spacing: 13) {
                Circle()
                    .fill(KelmahTheme.sun.opacity(0.18))
                    .frame(width: 44, height: 44)
                    .overlay(
                        Text(String(conversation.displayTitle.prefix(1)).uppercased())
                            .font(.headline)
                            .foregroundStyle(KelmahTheme.sun)
                    )

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(conversation.displayTitle)
                            .font(.headline)
                            .foregroundStyle(KelmahTheme.textPrimary)
                            .lineLimit(1)
                        Spacer()
                        if conversation.unreadCount > 0 {
                            KelmahSignalChip(
                                text: "\(conversation.unreadCount) unread",
                                accent: KelmahTheme.success
                            )
                        }
                    }

                    Text(conversation.lastMessagePreview)
                        .font(.subheadline)
                        .foregroundStyle(KelmahTheme.textMuted)
                        .lineLimit(2)

                    HStack {
                        Text(RelativeTimeFormatter.relativeOrFallback(conversation.lastMessageAt) ?? "Just now")
                            .font(.caption)
                            .foregroundStyle(KelmahTheme.textMuted)
                        Spacer()
                        Text("Tap to open chat")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(KelmahTheme.sun)
                    }
                }
            }
        }
        .contentShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }
}

private struct MessageThreadView: View {
    @ObservedObject var viewModel: MessagesViewModel
    let conversationId: String

    var body: some View {
        KelmahPremiumBackground {
            VStack(spacing: 0) {
                if let participant = viewModel.selectedConversation?.otherParticipant {
                    KelmahPanel {
                        HStack {
                            Text(participant.isActive == true ? "\(participant.name) | online" : participant.name)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(KelmahTheme.textPrimary)
                            Spacer()
                            KelmahSignalChip(
                                text: participant.isActive == true ? "Live" : "Offline",
                                accent: participant.isActive == true ? KelmahTheme.success : KelmahTheme.cyan
                            )
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 10)
                    .padding(.bottom, 2)
                }

                if viewModel.isLoadingMessages, viewModel.messages.isEmpty {
                    Spacer()
                    ProgressView("Opening messages...")
                        .tint(KelmahTheme.sun)
                    Spacer()
                } else if viewModel.messages.isEmpty {
                    Spacer()
                    KelmahBannerMessage(
                        message: "No messages yet. Send the first message.",
                        tint: KelmahTheme.cyan
                    )
                    .padding(.horizontal, 16)
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
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
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
        }
        .navigationTitle(viewModel.selectedConversation?.displayTitle ?? "Messages")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await viewModel.refreshSelectedConversation() }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .accessibilityLabel("Refresh messages")
            }
        }
        .safeAreaInset(edge: .bottom) {
            KelmahPanel {
                HStack(spacing: 10) {
                    TextField("Type message", text: $viewModel.draftMessage, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(1...4)

                    Button {
                        Task { await viewModel.sendMessage() }
                    } label: {
                        if viewModel.isSending {
                            HStack(spacing: 8) {
                                ProgressView()
                                    .progressViewStyle(.circular)
                                    .tint(.black)
                                Text("Sending")
                            }
                        } else {
                            Label("Send", systemImage: "paperplane.fill")
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(KelmahTheme.sun)
                    .foregroundStyle(Color.black)
                    .disabled(viewModel.isSending || viewModel.draftMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .frame(minHeight: 48)
                }
            }
            .padding(.horizontal, 12)
            .padding(.top, 8)
            .padding(.bottom, 8)
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
                    .foregroundStyle(KelmahTheme.textMuted)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(displayText)
                    .font(.body)
                    .foregroundStyle(KelmahTheme.textPrimary)
                    .lineSpacing(1.2)
                if let createdAt = message.createdAt {
                    Text(RelativeTimeFormatter.relativeOrFallback(createdAt) ?? createdAt)
                        .font(.caption2)
                        .foregroundStyle(KelmahTheme.textMuted)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(isOwnMessage ? KelmahTheme.sun.opacity(0.2) : KelmahTheme.card)
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(isOwnMessage ? KelmahTheme.sun.opacity(0.35) : KelmahTheme.borderSoft, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
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
