import SwiftUI

private enum KelmahRhythm {
    static let panelCornerRadius: CGFloat = 24
    static let panelPadding: CGFloat = 16
    static let controlHeight: CGFloat = 48
}

struct KelmahHeroStat: Identifiable, Hashable {
    let id = UUID()
    let label: String
    let value: String
    let tint: Color

    init(label: String, value: String, tint: Color = KelmahTheme.sun) {
        self.label = label
        self.value = value
        self.tint = tint
    }
}

struct KelmahPremiumBackground<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    KelmahTheme.background,
                    KelmahTheme.backgroundRaised,
                    KelmahTheme.background,
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            Circle()
                .fill(KelmahTheme.sun.opacity(0.16))
                .frame(width: 280, height: 280)
                .blur(radius: 28)
                .offset(x: 140, y: -260)

            Circle()
                .fill(KelmahTheme.cyan.opacity(0.14))
                .frame(width: 220, height: 220)
                .blur(radius: 28)
                .offset(x: -130, y: -230)

            content
        }
    }
}

struct KelmahPanel<Content: View>: View {
    private let elevated: Bool
    private let padded: Bool
    private let content: Content

    init(elevated: Bool = false, padded: Bool = true, @ViewBuilder content: () -> Content) {
        self.elevated = elevated
        self.padded = padded
        self.content = content()
    }

    var body: some View {
        content
            .padding(padded ? KelmahRhythm.panelPadding : 0)
            .background(
                RoundedRectangle(cornerRadius: KelmahRhythm.panelCornerRadius, style: .continuous)
                    .fill(elevated ? KelmahTheme.cardRaised : KelmahTheme.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: KelmahRhythm.panelCornerRadius, style: .continuous)
                    .stroke(
                        elevated ? KelmahTheme.borderStrong : KelmahTheme.borderSoft,
                        lineWidth: 1
                    )
            )
            .shadow(
                color: elevated ? Color.black.opacity(0.34) : Color.black.opacity(0.2),
                radius: elevated ? 20 : 10,
                x: 0,
                y: elevated ? 10 : 4
            )
    }
}

struct KelmahSignalChip: View {
    let text: String
    var accent: Color = KelmahTheme.sun

    var body: some View {
        Text(text)
            .font(.footnote.weight(.semibold))
            .lineLimit(1)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .frame(minHeight: 30)
            .background(accent.opacity(0.16))
            .foregroundStyle(KelmahTheme.textPrimary)
            .overlay(
                Capsule()
                    .stroke(accent.opacity(0.46), lineWidth: 1)
            )
            .clipShape(Capsule())
    }
}

struct KelmahMetricTile: View {
    let label: String
    let value: String
    var tone: Color = KelmahTheme.sun

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundStyle(KelmahTheme.textPrimary)
            Text(label)
                .font(.caption2.weight(.medium))
                .foregroundStyle(KelmahTheme.textMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 11)
        .padding(.vertical, 10)
        .background(tone.opacity(0.12))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(tone.opacity(0.3), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

struct KelmahSectionHeader: View {
    let title: String
    let subtitle: String?
    let actionLabel: String?
    let onAction: (() -> Void)?

    init(
        title: String,
        subtitle: String? = nil,
        actionLabel: String? = nil,
        onAction: (() -> Void)? = nil
    ) {
        self.title = title
        self.subtitle = subtitle
        self.actionLabel = actionLabel
        self.onAction = onAction
    }

    var body: some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(KelmahTheme.textPrimary)
                if let subtitle, subtitle.isEmpty == false {
                    Text(subtitle)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(KelmahTheme.textMuted)
                        .lineSpacing(1)
                }
            }
            Spacer()
            if let actionLabel, let onAction {
                Button(actionLabel, action: onAction)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(KelmahTheme.sun)
            }
        }
    }
}

struct KelmahBannerMessage: View {
    let message: String
    var tint: Color = KelmahTheme.cyan

    var body: some View {
        Text(message)
            .font(.subheadline)
            .foregroundStyle(KelmahTheme.textPrimary)
            .lineSpacing(1.6)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 12)
            .padding(.vertical, 11)
            .background(tint.opacity(0.12))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(tint.opacity(0.36), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

struct KelmahCommandDeck<Actions: View>: View {
    let eyebrow: String
    let title: String
    let subtitle: String
    let stats: [KelmahHeroStat]
    let chips: [String]
    private let actions: Actions

    init(
        eyebrow: String,
        title: String,
        subtitle: String,
        stats: [KelmahHeroStat],
        chips: [String] = [],
        @ViewBuilder actions: () -> Actions
    ) {
        self.eyebrow = eyebrow
        self.title = title
        self.subtitle = subtitle
        self.stats = stats
        self.chips = chips
        self.actions = actions()
    }

    var body: some View {
        KelmahPanel(elevated: true) {
            VStack(alignment: .leading, spacing: 14) {
                Text(eyebrow.uppercased())
                    .font(.caption.weight(.black))
                    .tracking(0.9)
                    .foregroundStyle(KelmahTheme.sun)

                Text(title)
                    .font(.title2.weight(.heavy))
                    .foregroundStyle(KelmahTheme.textPrimary)

                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(KelmahTheme.textMuted)
                    .lineSpacing(1.6)

                if chips.isEmpty == false {
                    ScrollView(.horizontal, showsIndicators: false) {
                        LazyHStack(spacing: 8) {
                            ForEach(chips, id: \.self) { chip in
                                KelmahSignalChip(text: chip)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }

                let columns = [GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8), GridItem(.flexible(), spacing: 8)]
                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(stats.prefix(3)) { stat in
                        KelmahMetricTile(label: stat.label, value: stat.value, tone: stat.tint)
                    }
                }

                actions
                    .frame(minHeight: KelmahRhythm.controlHeight)
            }
        }
    }
}
