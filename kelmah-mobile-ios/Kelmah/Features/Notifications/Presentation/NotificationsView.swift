import SwiftUI

struct NotificationsView: View {
    @ObservedObject var viewModel: NotificationsViewModel
    var onOpenTarget: (NotificationActionTarget) -> Void = { _ in }

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
                        Text("New").tag(true)
                    }
                    .pickerStyle(.segmented)

                    HStack {
                        Label("New alerts", systemImage: "bell.badge")
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

                Section("Alerts") {
                    if viewModel.isLoading, viewModel.notifications.isEmpty {
                        ProgressView("Loading alerts...")
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else if viewModel.notifications.isEmpty {
                        ContentUnavailableView(
                            viewModel.unreadOnly ? "No new alerts" : "No alerts yet",
                            systemImage: "bell",
                            description: Text("New job and message updates will show here.")
                        )
                    } else {
                        ForEach(viewModel.notifications) { notification in
                            NotificationRowView(notification: notification)
                                .contentShape(Rectangle())
                                .onTapGesture {
                                    Task {
                                        if notification.isRead == false {
                                            await viewModel.markAsRead(notificationId: notification.id)
                                        }
                                        if let target = notification.actionTarget {
                                            onOpenTarget(target)
                                        }
                                    }
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
                                            Label("Mark as read", systemImage: "checkmark.circle")
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
            .navigationTitle("Alerts")
            .toolbar {
                ToolbarItemGroup(placement: .topBarTrailing) {
                    Button {
                        Task { await viewModel.refresh() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel("Refresh notifications")

                    Button {
                        Task { await viewModel.markAllAsRead() }
                    } label: {
                        Image(systemName: "checkmark.circle")
                    }
                    .accessibilityLabel("Mark all as read")
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
                    Text("New")
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
                Text(RelativeTimeFormatter.relativeOrFallback(notification.createdAt) ?? notification.createdAt ?? "Just now")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Spacer()

                if let target = notification.actionTarget {
                    Text(target.label)
                        .font(.caption2)
                        .foregroundStyle(KelmahTheme.accent)
                        .lineLimit(1)
                }
            }

            if notification.actionTarget != nil {
                Text("Tap to open alert")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(KelmahTheme.accent)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(notification.isRead ? KelmahTheme.card : KelmahTheme.accent.opacity(0.08))
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
