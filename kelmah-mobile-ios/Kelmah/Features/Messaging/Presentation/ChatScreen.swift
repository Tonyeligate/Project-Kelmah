import SwiftUI

/// Real chat surface wired to the shared `MessagesViewModel`.
///
/// Pushed via `KelmahRoute.chat(conversationId)`. Loads the conversation,
/// renders bubbles using `KelmahChatBubble`, and sends through the existing
/// realtime-backed view model.
struct ChatScreen: View {
    @ObservedObject var viewModel: MessagesViewModel
    let conversationId: String
    @EnvironmentObject private var navigator: Navigator

    var body: some View {
        VStack(spacing: 0) {
            KelmahTopAppBar(
                variant: .chat,
                title: viewModel.selectedConversation?.displayTitle ?? "Chat",
                subtitle: isOnline ? "Online" : "Tap for job context",
                isOnline: isOnline,
                trailingSystemImage: "ellipsis",
                onBack: { navigator.pop() }
            )

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: KelmahSpacing.md) {
                        if let conversation = viewModel.selectedConversation {
                            KelmahJobContextCard(
                                title: conversation.title?.nilIfEmpty ?? "Direct conversation",
                                status: "Active",
                                detail: "Escrow secured"
                            )
                        }

                        if viewModel.isLoadingMessages && viewModel.messages.isEmpty {
                            ProgressView().frame(maxWidth: .infinity).padding()
                        } else if viewModel.messages.isEmpty {
                            KelmahEmptyState(
                                systemImage: "bubble.left.and.bubble.right",
                                title: "No messages yet",
                                message: "Start the conversation by sending the first message."
                            )
                        } else {
                            ForEach(viewModel.messages) { message in
                                KelmahChatBubble(
                                    text: message.content,
                                    isOutgoing: isOutgoing(message),
                                    time: RelativeTimeFormatter.relativeOrFallback(message.createdAt),
                                    isRead: message.isRead
                                )
                                .id(message.id)
                            }
                        }
                    }
                    .padding(KelmahSpacing.lg)
                }
                .background(KelmahTheme.background)
                .onChange(of: viewModel.messages.count) { _ in
                    if let lastId = viewModel.messages.last?.id {
                        withAnimation { proxy.scrollTo(lastId, anchor: .bottom) }
                    }
                }
            }

            if let error = viewModel.errorMessage {
                KelmahBannerMessage(message: error, tint: KelmahTheme.danger)
                    .padding(.horizontal, KelmahSpacing.lg)
                    .padding(.bottom, KelmahSpacing.sm)
            }

            KelmahChatInputBar(
                text: $viewModel.draftMessage,
                isSending: viewModel.isSending,
                onAttach: nil,
                onSend: { Task { await viewModel.sendMessage() } }
            )
        }
        .background(KelmahTheme.background.ignoresSafeArea())
        .navigationBarBackButtonHidden(true)
        .task(id: conversationId) {
            await viewModel.openConversation(conversationId: conversationId)
        }
        .onDisappear { viewModel.closeConversation() }
    }

    private var isOnline: Bool {
        viewModel.selectedConversation?.otherParticipant?.isActive == true
    }

    private func isOutgoing(_ message: MessageThreadItem) -> Bool {
        guard let currentUserId = viewModel.currentUserId else { return false }
        return message.senderId == currentUserId
    }
}
