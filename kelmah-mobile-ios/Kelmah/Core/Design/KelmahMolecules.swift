import SwiftUI

/// Stitch molecular components — composed from KelmahAtoms + KelmahPremiumComponents
/// using KelmahTheme tokens, KelmahTypography fonts, KelmahSpacing, and
/// KelmahShapes/KelmahShadow so light/dark inherit correctly.
///
/// All identifiers in this file are prefixed `Kelmah` to avoid colliding with
/// per-screen private helpers elsewhere in the codebase.

// MARK: - Top app bars

/// Variants of the Stitch top app bar.
enum KelmahTopBarVariant {
    /// Home / dashboard header with avatar + greeting + trailing action.
    case home
    /// Chat header with back, title, subtitle (online state) + trailing action.
    case chat
    /// Detail header with back + centered title + optional trailing action.
    case detail
    /// Settings header with back + large title.
    case settings
}

struct KelmahHomeTopBar: View {
    let title: String
    var subtitle: String? = nil
    var avatarInitials: String? = nil
    var isOnline: Bool = false
    var trailingSystemImage: String? = "bell"
    var onTrailingTap: (() -> Void)? = nil

    var body: some View {
        KelmahTopAppBar(
            variant: .home,
            title: title,
            subtitle: subtitle,
            avatarInitials: avatarInitials,
            isOnline: isOnline,
            trailingSystemImage: trailingSystemImage,
            onTrailingTap: onTrailingTap
        )
    }
}

struct KelmahChatTopBar: View {
    let title: String
    var subtitle: String? = nil
    var isOnline: Bool = false
    var trailingSystemImage: String? = "phone"
    var onBack: (() -> Void)? = nil
    var onTrailingTap: (() -> Void)? = nil

    var body: some View {
        KelmahTopAppBar(
            variant: .chat,
            title: title,
            subtitle: subtitle,
            isOnline: isOnline,
            trailingSystemImage: trailingSystemImage,
            onBack: onBack,
            onTrailingTap: onTrailingTap
        )
    }
}

struct KelmahDetailTopBar: View {
    let title: String
    var trailingSystemImage: String? = nil
    var onBack: (() -> Void)? = nil
    var onTrailingTap: (() -> Void)? = nil

    var body: some View {
        KelmahTopAppBar(
            variant: .detail,
            title: title,
            trailingSystemImage: trailingSystemImage,
            onBack: onBack,
            onTrailingTap: onTrailingTap
        )
    }
}

struct KelmahSettingsTopBar: View {
    let title: String
    var trailingSystemImage: String? = nil
    var onBack: (() -> Void)? = nil
    var onTrailingTap: (() -> Void)? = nil

    var body: some View {
        KelmahTopAppBar(
            variant: .settings,
            title: title,
            trailingSystemImage: trailingSystemImage,
            onBack: onBack,
            onTrailingTap: onTrailingTap
        )
    }
}

struct KelmahTopAppBar: View {
    let variant: KelmahTopBarVariant
    var title: String = ""
    var subtitle: String? = nil
    var avatarInitials: String? = nil
    var isOnline: Bool = false
    var trailingSystemImage: String? = nil
    var onBack: (() -> Void)? = nil
    var onTrailingTap: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: KelmahSpacing.md) {
            leading
            content
            Spacer(minLength: 0)
            trailing
        }
        .padding(.horizontal, KelmahSpacing.lg)
        .padding(.vertical, KelmahSpacing.md)
        .frame(maxWidth: .infinity)
        .background(KelmahTheme.stitchSurface)
        .overlay(alignment: .bottom) {
            if shouldShowDivider {
                KelmahDivider()
            }
        }
    }

    @ViewBuilder private var leading: some View {
        switch variant {
        case .home:
            if let avatarInitials {
                KelmahAvatar(initials: avatarInitials, size: 44, isOnline: isOnline)
            }
        case .chat, .detail, .settings:
            if let onBack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(KelmahTheme.textPrimary)
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder private var content: some View {
        switch variant {
        case .home:
            VStack(alignment: .leading, spacing: 2) {
                if let subtitle { Text(subtitle).font(.inter(.medium, 13)).foregroundStyle(KelmahTheme.textMuted) }
                Text(title).font(.montserrat(.bold, 20)).foregroundStyle(KelmahTheme.textPrimary)
            }
        case .chat:
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.montserrat(.semibold, 17)).foregroundStyle(KelmahTheme.textPrimary)
                if let subtitle {
                    HStack(spacing: 5) {
                        if isOnline {
                            Circle().fill(KelmahTheme.stitchSuccess).frame(width: 7, height: 7)
                        }
                        Text(subtitle).font(.inter(.medium, 12)).foregroundStyle(KelmahTheme.textMuted)
                    }
                }
            }
        case .detail:
            Text(title)
                .font(.montserrat(.semibold, 17))
                .foregroundStyle(KelmahTheme.textPrimary)
                .frame(maxWidth: .infinity)
                .multilineTextAlignment(.center)
        case .settings:
            Text(title).font(.montserrat(.bold, 24)).foregroundStyle(KelmahTheme.textPrimary)
        }
    }

    @ViewBuilder private var trailing: some View {
        if let trailingSystemImage {
            Button { onTrailingTap?() } label: {
                Image(systemName: trailingSystemImage)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(KelmahTheme.textPrimary)
                    .frame(width: 40, height: 40)
                    .background(KelmahTheme.stitchSurfaceContainer)
                    .clipShape(Circle())
            }
            .buttonStyle(.plain)
        } else if variant == .detail, onBack != nil {
            // Balance the centered title against the leading back button.
            Color.clear.frame(width: 40, height: 40)
        }
    }

    private var shouldShowDivider: Bool {
        switch variant {
        case .home:
            return false
        case .chat, .detail, .settings:
            return true
        }
    }
}

// MARK: - Job cards

struct KelmahJobCard: View {
    let title: String
    let employer: String
    let location: String
    let budget: String
    var badge: String? = nil
    var badgeTone: KelmahChipTone = .primary
    var skills: [String] = []
    var isSaved: Bool = false
    var onTap: () -> Void = {}
    var onToggleSave: (() -> Void)? = nil

    var body: some View {
        Button(action: onTap) {
            KelmahPanel {
                VStack(alignment: .leading, spacing: KelmahSpacing.md) {
                    HStack(alignment: .top, spacing: KelmahSpacing.md) {
                        RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous)
                            .fill(KelmahTheme.stitchGold.opacity(0.22))
                            .frame(width: 52, height: 52)
                            .overlay(
                                Image(systemName: "hammer.fill")
                                    .foregroundStyle(KelmahTheme.stitchOnPrimaryContainer)
                            )
                        VStack(alignment: .leading, spacing: 4) {
                            if let badge {
                                KelmahBadge(text: badge, tone: badgeTone)
                            }
                            Text(title)
                                .font(.montserrat(.bold, 16))
                                .foregroundStyle(KelmahTheme.textPrimary)
                                .multilineTextAlignment(.leading)
                            Text(employer)
                                .font(.inter(.medium, 13))
                                .foregroundStyle(KelmahTheme.textMuted)
                        }
                        Spacer(minLength: 0)
                        if let onToggleSave {
                            Button(action: onToggleSave) {
                                Image(systemName: isSaved ? "bookmark.fill" : "bookmark")
                                    .foregroundStyle(isSaved ? KelmahTheme.stitchGoldDim : KelmahTheme.textMuted)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if skills.isEmpty == false {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: KelmahSpacing.sm) {
                                ForEach(skills, id: \.self) { skill in
                                    KelmahBadge(text: skill, tone: .surface)
                                }
                            }
                        }
                    }

                    HStack {
                        Label(location, systemImage: "mappin.and.ellipse")
                            .font(.inter(.medium, 12))
                            .foregroundStyle(KelmahTheme.textMuted)
                        Spacer()
                        Text(budget)
                            .font(.montserrat(.bold, 15))
                            .foregroundStyle(KelmahTheme.primary)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }
}

struct KelmahCompactJobCard: View {
    let title: String
    let meta: String
    let budget: String
    var onTap: () -> Void = {}

    var body: some View {
        Button(action: onTap) {
            KelmahPanel {
                HStack(spacing: KelmahSpacing.md) {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(title).font(.montserrat(.semibold, 15)).foregroundStyle(KelmahTheme.textPrimary)
                        Text(meta).font(.inter(.regular, 12)).foregroundStyle(KelmahTheme.textMuted)
                    }
                    Spacer()
                    Text(budget).font(.montserrat(.bold, 14)).foregroundStyle(KelmahTheme.primary)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

struct KelmahJobCardCompact: View {
    let title: String
    let meta: String
    let budget: String
    var onTap: () -> Void = {}

    var body: some View {
        KelmahCompactJobCard(title: title, meta: meta, budget: budget, onTap: onTap)
    }
}

// MARK: - Message list row

struct KelmahMessageRow: View {
    let initials: String
    let name: String
    let preview: String
    let time: String
    var unreadCount: Int = 0
    var isOnline: Bool = false
    var onTap: () -> Void = {}

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: KelmahSpacing.md) {
                KelmahAvatar(initials: initials, size: 48, isOnline: isOnline)
                VStack(alignment: .leading, spacing: 3) {
                    Text(name).font(.montserrat(.semibold, 15)).foregroundStyle(KelmahTheme.textPrimary)
                    Text(preview)
                        .font(.inter(unreadCount > 0 ? .semibold : .regular, 13))
                        .foregroundStyle(unreadCount > 0 ? KelmahTheme.textPrimary : KelmahTheme.textMuted)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                VStack(alignment: .trailing, spacing: 6) {
                    Text(time).font(.inter(.medium, 11)).foregroundStyle(KelmahTheme.textMuted)
                    if unreadCount > 0 {
                        Text("\(unreadCount)")
                            .font(.inter(.bold, 11))
                            .foregroundStyle(KelmahTheme.stitchOnPrimaryContainer)
                            .frame(minWidth: 20, minHeight: 20)
                            .background(KelmahTheme.stitchGold)
                            .clipShape(Circle())
                    }
                }
            }
            .padding(.vertical, KelmahSpacing.sm)
        }
        .buttonStyle(.plain)
    }
}

struct KelmahMessageListItem: View {
    let initials: String
    let name: String
    let preview: String
    let time: String
    var unreadCount: Int = 0
    var isOnline: Bool = false
    var onTap: () -> Void = {}

    var body: some View {
        KelmahMessageRow(
            initials: initials,
            name: name,
            preview: preview,
            time: time,
            unreadCount: unreadCount,
            isOnline: isOnline,
            onTap: onTap
        )
    }
}

// MARK: - Notification row

struct KelmahNotificationRow: View {
    let title: String
    let body: String
    let time: String
    var systemImage: String = "bell.fill"
    var tint: Color = KelmahTheme.stitchInfo
    var isUnread: Bool = false
    var onTap: () -> Void = {}

    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .top, spacing: KelmahSpacing.md) {
                Image(systemName: systemImage)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(tint)
                    .frame(width: 40, height: 40)
                    .background(tint.opacity(0.14))
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 3) {
                    Text(title).font(.montserrat(.semibold, 15)).foregroundStyle(KelmahTheme.textPrimary)
                    Text(body).font(.inter(.regular, 13)).foregroundStyle(KelmahTheme.textMuted)
                    Text(time).font(.inter(.medium, 11)).foregroundStyle(KelmahTheme.textMuted)
                }
                Spacer(minLength: 4)
                if isUnread {
                    Circle().fill(KelmahTheme.stitchGold).frame(width: 9, height: 9).padding(.top, 6)
                }
            }
            .padding(.vertical, KelmahSpacing.sm)
        }
        .buttonStyle(.plain)
    }
}

struct KelmahNotificationItem: View {
    let title: String
    let body: String
    let time: String
    var systemImage: String = "bell.fill"
    var tint: Color = KelmahTheme.stitchInfo
    var isUnread: Bool = false
    var onTap: () -> Void = {}

    var body: some View {
        KelmahNotificationRow(
            title: title,
            body: body,
            time: time,
            systemImage: systemImage,
            tint: tint,
            isUnread: isUnread,
            onTap: onTap
        )
    }
}

// MARK: - Payment method radio card

struct KelmahPaymentMethodCard: View {
    let title: String
    let detail: String
    var systemImage: String = "creditcard.fill"
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        KelmahRadioCard(
            title: title,
            subtitle: detail,
            isSelected: isSelected,
            systemImage: systemImage,
            action: action
        )
    }
}

// MARK: - Wallet balance card

struct KelmahWalletBalanceCard: View {
    let amount: String
    var caption: String = "Available balance"
    var isVerified: Bool = true
    var escrowAmount: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: KelmahSpacing.md) {
            HStack {
                Text(caption.uppercased())
                    .font(.inter(.bold, 11))
                    .tracking(0.8)
                    .foregroundStyle(KelmahTheme.stitchGold)
                Spacer()
                if isVerified {
                    Label("Verified", systemImage: "checkmark.seal.fill")
                        .font(.inter(.semibold, 11))
                        .foregroundStyle(KelmahTheme.stitchSuccess)
                }
            }
            Text(amount)
                .font(.montserrat(.bold, 34))
                .foregroundStyle(.white)
            if let escrowAmount {
                Text("In escrow: \(escrowAmount)")
                    .font(.inter(.medium, 13))
                    .foregroundStyle(.white.opacity(0.7))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(KelmahSpacing.xl)
        .background(
            LinearGradient(
                colors: [KelmahTheme.stitchDarkBackground, KelmahTheme.stitchDarkSurface],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.xl, style: .continuous))
        .kelmahShadow(.elevated)
    }
}

// MARK: - Section panel

struct KelmahSectionPanel<Content: View>: View {
    let title: String
    var subtitle: String? = nil

    private let content: Content

    init(title: String, subtitle: String? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.subtitle = subtitle
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: KelmahSpacing.md) {
            KelmahSectionHeader(title: title, subtitle: subtitle)
            KelmahPanel {
                VStack(alignment: .leading, spacing: KelmahSpacing.md) {
                    content
                }
            }
        }
    }
}

// MARK: - Chat bubbles + tail + read receipt

struct KelmahChatBubble: View {
    let text: String
    let isOutgoing: Bool
    var time: String? = nil
    var isRead: Bool = false

    var body: some View {
        HStack(alignment: .bottom, spacing: 0) {
            if isOutgoing { Spacer(minLength: 56) }
            VStack(alignment: isOutgoing ? .trailing : .leading, spacing: 3) {
                Text(text)
                    .font(.inter(.regular, 15))
                    .foregroundStyle(isOutgoing ? KelmahTheme.stitchOnPrimaryContainer : KelmahTheme.textPrimary)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(bubbleBackground)
                    .clipShape(BubbleShape(isOutgoing: isOutgoing))
                if let time {
                    HStack(spacing: 3) {
                        Text(time).font(.inter(.medium, 10)).foregroundStyle(KelmahTheme.textMuted)
                        if isOutgoing {
                            Image(systemName: isRead ? "checkmark.circle.fill" : "checkmark")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(isRead ? KelmahTheme.stitchInfo : KelmahTheme.textMuted)
                        }
                    }
                }
            }
            if isOutgoing == false { Spacer(minLength: 56) }
        }
    }

    private var bubbleBackground: Color {
        isOutgoing ? KelmahTheme.stitchGold : KelmahTheme.stitchSurfaceContainer
    }
}

/// Rounded bubble with a small tail on the sender side.
private struct BubbleShape: Shape {
    let isOutgoing: Bool

    func path(in rect: CGRect) -> Path {
        let radius: CGFloat = 16
        let tail: CGFloat = 4
        var path = Path()
        let r = min(radius, min(rect.width, rect.height) / 2)

        if isOutgoing {
            path.addRoundedRect(
                in: CGRect(x: rect.minX, y: rect.minY, width: rect.width - tail, height: rect.height),
                cornerSize: CGSize(width: r, height: r)
            )
        } else {
            path.addRoundedRect(
                in: CGRect(x: rect.minX + tail, y: rect.minY, width: rect.width - tail, height: rect.height),
                cornerSize: CGSize(width: r, height: r)
            )
        }
        return path
    }
}

// MARK: - Chat input bar

struct KelmahChatInputBar: View {
    @Binding var text: String
    var isSending: Bool = false
    var onAttach: (() -> Void)? = nil
    var onSend: () -> Void

    var body: some View {
        HStack(spacing: KelmahSpacing.sm) {
            if let onAttach {
                Button(action: onAttach) {
                    Image(systemName: "paperclip")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(KelmahTheme.textMuted)
                        .frame(width: 40, height: 40)
                }
                .buttonStyle(.plain)
            }
            TextField("Message", text: $text, axis: .vertical)
                .font(.inter(.regular, 15))
                .lineLimit(1...4)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(KelmahTheme.stitchSurfaceContainer)
                .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.xl, style: .continuous))

            Button(action: onSend) {
                Group {
                    if isSending {
                        ProgressView().tint(KelmahTheme.stitchOnPrimaryContainer)
                    } else {
                        Image(systemName: "arrow.up")
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(KelmahTheme.stitchOnPrimaryContainer)
                    }
                }
                .frame(width: 44, height: 44)
                .background(KelmahTheme.stitchGold)
                .clipShape(Circle())
            }
            .buttonStyle(.plain)
            .disabled(isSending)
        }
        .padding(.horizontal, KelmahSpacing.lg)
        .padding(.vertical, KelmahSpacing.sm)
        .background(KelmahTheme.stitchSurface)
        .overlay(alignment: .top) { KelmahDivider() }
    }
}

// MARK: - Date separator

struct KelmahDateSeparator: View {
    let label: String

    var body: some View {
        HStack {
            KelmahDivider()
            Text(label)
                .font(.inter(.semibold, 11))
                .foregroundStyle(KelmahTheme.textMuted)
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
                .background(KelmahTheme.stitchSurfaceContainer)
                .clipShape(Capsule())
                .fixedSize()
            KelmahDivider()
        }
    }
}

// MARK: - Job context card

struct KelmahJobContextCard: View {
    let title: String
    let status: String
    var detail: String = "Escrow funded"
    var onOpen: (() -> Void)? = nil

    var body: some View {
        KelmahPanel(elevated: true) {
            HStack(spacing: KelmahSpacing.md) {
                Image(systemName: "briefcase.fill")
                    .foregroundStyle(KelmahTheme.stitchOnPrimaryContainer)
                    .frame(width: 38, height: 38)
                    .background(KelmahTheme.stitchGold)
                    .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.medium, style: .continuous))
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.montserrat(.semibold, 14)).foregroundStyle(KelmahTheme.textPrimary)
                    Text("\(status) • \(detail)").font(.inter(.medium, 12)).foregroundStyle(KelmahTheme.textMuted)
                }
                Spacer()
                if let onOpen {
                    Button("Open", action: onOpen)
                        .font(.inter(.semibold, 13))
                        .foregroundStyle(KelmahTheme.primary)
                }
            }
        }
    }
}

// MARK: - Amount input (₵ prefix + quick add)

struct KelmahAmountInput: View {
    @Binding var amount: String
    var quickAdds: [Int] = [100, 500, 1000]

    var body: some View {
        VStack(spacing: KelmahSpacing.md) {
            HStack(spacing: 6) {
                Text("₵")
                    .font(.montserrat(.bold, 34))
                    .foregroundStyle(KelmahTheme.textMuted)
                TextField("0", text: $amount)
                    .font(.montserrat(.bold, 40))
                    .foregroundStyle(KelmahTheme.textPrimary)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, KelmahSpacing.lg)
            .background(KelmahTheme.stitchSurfaceContainer)
            .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.xl, style: .continuous))

            HStack(spacing: KelmahSpacing.sm) {
                ForEach(quickAdds, id: \.self) { value in
                    Button {
                        let current = Int(amount) ?? 0
                        amount = String(current + value)
                    } label: {
                        Text("+\(value)")
                            .font(.inter(.bold, 14))
                            .frame(maxWidth: .infinity, minHeight: 40)
                            .foregroundStyle(KelmahTheme.primary)
                            .background(KelmahTheme.stitchGold.opacity(0.16))
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - Filter tabs (active indicator)

struct KelmahFilterTabs: View {
    let tabs: [String]
    @Binding var selection: Int

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: KelmahSpacing.xl) {
                ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
                    VStack(spacing: 6) {
                        Text(tab)
                            .font(.inter(selection == index ? .bold : .medium, 14))
                            .foregroundStyle(selection == index ? KelmahTheme.textPrimary : KelmahTheme.textMuted)
                        Capsule()
                            .fill(selection == index ? KelmahTheme.stitchGold : Color.clear)
                            .frame(height: 3)
                    }
                    .onTapGesture { selection = index }
                }
            }
            .padding(.horizontal, KelmahSpacing.lg)
        }
        .overlay(alignment: .bottom) { KelmahDivider() }
    }
}

// MARK: - Quick action chips

struct KelmahQuickAction: Identifiable {
    let id = UUID()
    let title: String
    let systemImage: String
    var tint: Color = KelmahTheme.stitchGold
    let action: () -> Void
}

struct KelmahQuickActionRow: View {
    let actions: [KelmahQuickAction]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: KelmahSpacing.md) {
                ForEach(actions) { action in
                    Button(action: action.action) {
                        VStack(spacing: 8) {
                            Image(systemName: action.systemImage)
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(KelmahTheme.stitchOnPrimaryContainer)
                                .frame(width: 48, height: 48)
                                .background(action.tint)
                                .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous))
                            Text(action.title)
                                .font(.inter(.semibold, 12))
                                .foregroundStyle(KelmahTheme.textMuted)
                        }
                        .frame(width: 76)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

struct KelmahQuickActionChips: View {
    let actions: [KelmahQuickAction]

    var body: some View {
        KelmahQuickActionRow(actions: actions)
    }
}

// MARK: - Stat bento (3-col grid)

struct KelmahStatBento: View {
    let stats: [KelmahHeroStat]

    private let columns = [
        GridItem(.flexible(), spacing: KelmahSpacing.sm),
        GridItem(.flexible(), spacing: KelmahSpacing.sm),
        GridItem(.flexible(), spacing: KelmahSpacing.sm),
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: KelmahSpacing.sm) {
            ForEach(stats) { stat in
                KelmahMetricTile(label: stat.label, value: stat.value, tone: stat.tint)
            }
        }
    }
}

// MARK: - Empty state

struct KelmahEmptyState: View {
    let systemImage: String
    let title: String
    let message: String
    var actionTitle: String? = nil
    var onAction: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: KelmahSpacing.md) {
            Image(systemName: systemImage)
                .font(.system(size: 42, weight: .regular))
                .foregroundStyle(KelmahTheme.textMuted)
            Text(title)
                .font(.montserrat(.bold, 18))
                .foregroundStyle(KelmahTheme.textPrimary)
            Text(message)
                .font(.inter(.regular, 14))
                .foregroundStyle(KelmahTheme.textMuted)
                .multilineTextAlignment(.center)
            if let actionTitle, let onAction {
                KelmahButton(title: actionTitle, variant: .secondary, action: onAction)
                    .frame(maxWidth: 240)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(KelmahSpacing.xl)
    }
}

// MARK: - Trust badge row

struct KelmahTrustBadgeRow: View {
    var badges: [String] = ["Escrow protected", "Verified pros", "Secure payments"]

    var body: some View {
        HStack(spacing: KelmahSpacing.sm) {
            ForEach(badges, id: \.self) { badge in
                HStack(spacing: 5) {
                    Image(systemName: "checkmark.shield.fill")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(KelmahTheme.stitchSuccess)
                    Text(badge)
                        .font(.inter(.semibold, 11))
                        .foregroundStyle(KelmahTheme.textMuted)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(KelmahTheme.stitchSuccess.opacity(0.1))
                .clipShape(Capsule())
            }
        }
    }
}
