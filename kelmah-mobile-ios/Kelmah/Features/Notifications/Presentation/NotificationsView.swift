import SwiftUI

struct NotificationsView: View {
    @ObservedObject var viewModel: NotificationsViewModel

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Filter", selection: Binding(
                        get: { viewModel.unreadOnly },
                        set: { value in
                            Task { await viewModel.setUnreadOnly(value) }
                        }
                    )) {
                        Text("All").tag(false)
                        Text("Unread").tag(true)
                    }
                    .pickerStyle(.segmented)

                    HStack {
                        Label("Unread", systemImage: "bell.badge")
                            .font(.subheadline.weight(.semibold))
                        Spacer()
                        Text("\(viewModel.unreadCount)")
                            .font(.headline)
                            .foregroundStyle(KelmahTheme.accent)
                    }
                }

                if let message = viewModel.errorMessage {
                    Section {
                        NotificationBannerView(message: message, tint: .red.opacity(0.12))
                    }
                }

                if let message = viewModel.infoMessage {
                    Section {
                        NotificationBannerView(message: message, tint: KelmahTheme.accent.opacity(0.16))
                    }
                }

                Section("Inbox") {
                    if viewModel.isLoading, viewModel.notifications.isEmpty {
                        ProgressView("Loading notifications...")
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else if viewModel.notifications.isEmpty {
                        ContentUnavailableView(
                            viewModel.unreadOnly ? "No unread alerts" : "No notifications yet",
                            systemImage: "bell",
                            description: Text("Job activity, payment updates, and message alerts will appear here.")
                        )
                    } else {
                        ForEach(viewModel.notifications) { notification in
                            NotificationRowView(notification: notification)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    guard notification.isRead == false else { return }
                                    Task { await viewModel.markAsRead(notificationId: notification.id) }
                                }
                                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                    Button(role: .destructive) {
                                        Task { await viewModel.deleteNotification(notificationId: notification.id) }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }

                                    if notification.isRead == false {
                                        Button {
                                            Task { await viewModel.markAsRead(notificationId: notification.id) }
                                        } label: {
                                            Label("Read", systemImage: "checkmark.circle")
                                        }
                                        .tint(KelmahTheme.accent)
                                    }
                                }
                                .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
                                .listRowBackground(Color.clear)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(KelmahTheme.background)
            .navigationTitle("Notifications")
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        Task { await viewModel.refresh() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }

                    Button {
                        Task { await viewModel.markAllAsRead() }
                    } label: {
                        Image(systemName: "checkmark.circle")
                    }
                    .disabled(viewModel.unreadCount == 0 || viewModel.isMutating)
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.bootstrap()
            }
        }
    }
}

private struct NotificationRowView: View {
    let notification: AppNotificationItem

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Text(notification.displayTag)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(notification.isRead ? .secondary : KelmahTheme.accent)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background((notification.isRead ? Color.secondary.opacity(0.1) : KelmahTheme.accent.opacity(0.12)))
                    .clipShape(Capsule())

                Spacer()

                if notification.isRead == false {
                    Text("Unread")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(KelmahTheme.accent)
                }
            }

            Text(notification.title)
                .font(.headline)
                .foregroundStyle(.primary)

            Text(notification.content)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            HStack {
                Text(notification.createdAt ?? "Just now")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Spacer()

                if let actionURL = notification.actionURL, actionURL.isEmpty == false {
                    Text(actionURL)
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(notification.isRead ? Color.white : KelmahTheme.accent.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct NotificationBannerView: View {
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
