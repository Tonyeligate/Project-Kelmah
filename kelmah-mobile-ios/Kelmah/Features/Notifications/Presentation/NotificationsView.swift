import SwiftUI

struct NotificationsView: View {
    @ObservedObject var viewModel: NotificationsViewModel
    var onOpenTarget: (NotificationActionTarget) -> Void = { _ in }

    private var totalAlerts: Int {
        viewModel.notifications.count
    }

    private var actionableAlerts: Int {
        viewModel.notifications.filter { $0.actionTarget != nil }.count
    }

    private var headerStats: [KelmahHeroStat] {
        [
            KelmahHeroStat(label: "Total", value: "\(totalAlerts)", tint: KelmahTheme.cyan),
            KelmahHeroStat(label: "Unread", value: "\(viewModel.unreadCount)", tint: KelmahTheme.sun),
            KelmahHeroStat(label: "Action", value: "\(actionableAlerts)", tint: KelmahTheme.success),
        ]
    }

    private var headerChips: [String] {
        [
            viewModel.unreadOnly ? "Filter: new" : "Filter: all",
            "Live alert sync",
        ]
    }

    var body: some View {
        NavigationStack {
            KelmahPremiumBackground {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        KelmahCommandDeck(
                            eyebrow: "ALERT CENTER",
                            title: "Keep every critical signal in view",
                            subtitle: "Messages, jobs, contracts, and payments in one action-ready stream.",
                            stats: headerStats,
                            chips: headerChips
                        ) {
                            HStack(spacing: 10) {
                                Button {
                                    Task { await viewModel.refresh() }
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
                                    Task { await viewModel.markAllAsRead() }
                                } label: {
                                    Text("Mark All Read")
                                        .fontWeight(.semibold)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 46)
                                }
                                .buttonStyle(.bordered)
                                .tint(KelmahTheme.cyan)
                                .disabled(viewModel.unreadCount == 0 || viewModel.isMutating)
                            }
                            .controlSize(.large)
                        }

                        KelmahPanel {
                            VStack(alignment: .leading, spacing: 10) {
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

                                KelmahBannerMessage(
                                    message: viewModel.unreadOnly
                                        ? "Showing unread alerts only."
                                        : "Showing all alerts in chronological order.",
                                    tint: KelmahTheme.cyan
                                )
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
                                title: "Alerts",
                                subtitle: "Tap an alert to navigate to the right screen"
                            )
                        }

                        if viewModel.isLoading, viewModel.notifications.isEmpty {
                            KelmahPanel {
                                HStack(spacing: 10) {
                                    ProgressView()
                                        .tint(KelmahTheme.sun)
                                    Text("Loading alerts...")
                                        .foregroundStyle(KelmahTheme.textMuted)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        } else if viewModel.notifications.isEmpty {
                            KelmahBannerMessage(
                                message: viewModel.unreadOnly
                                    ? "No new alerts right now."
                                    : "No alerts yet. New activity will appear here.",
                                tint: KelmahTheme.cyan
                            )
                        } else {
                            ForEach(viewModel.notifications) { notification in
                                NotificationRowView(
                                    notification: notification,
                                    isMutating: viewModel.isMutating,
                                    onOpen: {
                                        Task {
                                            if notification.isRead == false {
                                                await viewModel.markAsRead(notificationId: notification.id)
                                            }
                                            if let target = notification.actionTarget {
                                                onOpenTarget(target)
                                            }
                                        }
                                    },
                                    onMarkRead: {
                                        Task { await viewModel.markAsRead(notificationId: notification.id) }
                                    },
                                    onDelete: {
                                        Task { await viewModel.deleteNotification(notificationId: notification.id) }
                                    }
                                )
                            }
                        }
                    }
                        .padding(.horizontal, 16)
                        .padding(.top, 18)
                    .padding(.bottom, 20)
                }
                .scrollIndicators(.hidden)
            }
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
    let isMutating: Bool
    let onOpen: () -> Void
    let onMarkRead: () -> Void
    let onDelete: () -> Void

    var body: some View {
        Button(action: onOpen) {
            KelmahPanel {
                VStack(alignment: .leading, spacing: 9) {
                    HStack {
                        KelmahSignalChip(
                            text: notification.displayTag,
                            accent: notification.isRead ? KelmahTheme.cyan : KelmahTheme.sun
                        )
                        Spacer()
                        if notification.isRead == false {
                            KelmahSignalChip(text: "New", accent: KelmahTheme.sun)
                        }
                    }

                    Text(notification.title)
                        .font(.headline)
                        .foregroundStyle(KelmahTheme.textPrimary)
                        .multilineTextAlignment(.leading)

                    Text(notification.content)
                        .font(.subheadline)
                        .foregroundStyle(KelmahTheme.textMuted)
                        .multilineTextAlignment(.leading)

                    HStack {
                        Text(RelativeTimeFormatter.relativeOrFallback(notification.createdAt) ?? notification.createdAt ?? "Just now")
                            .font(.caption)
                            .foregroundStyle(KelmahTheme.textMuted)
                        Spacer()
                        if let target = notification.actionTarget {
                            Text(target.label)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(KelmahTheme.cyan)
                        }
                    }

                    HStack(spacing: 10) {
                        if notification.isRead == false {
                            Button(action: onMarkRead) {
                                Text("Mark read")
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 44)
                            }
                            .buttonStyle(.bordered)
                            .tint(KelmahTheme.cyan)
                            .disabled(isMutating)
                        }

                        Button(role: .destructive, action: onDelete) {
                            Text("Delete")
                                .frame(maxWidth: .infinity)
                                .frame(minHeight: 44)
                        }
                        .buttonStyle(.bordered)
                        .disabled(isMutating)
                    }

                    Text("Tap to open alert")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(KelmahTheme.sun)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .contentShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
