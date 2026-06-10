import SwiftUI

/// Stitch atomic components — buttons, chips, badges, toggles, avatars.
/// Specs derived from the Stitch Tailwind HTML (login_1, dashboard_1,
/// browse_trades_1, deposit_funds_1, profile_settings).

enum KelmahButtonVariant {
    case primary, secondary, ghost
}

struct KelmahButton: View {
    let title: String
    var variant: KelmahButtonVariant = .primary
    var systemImage: String? = nil
    var isEnabled: Bool = true
    let action: () -> Void

    @State private var pressed = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage { Image(systemName: systemImage) }
                Text(title).font(.inter(.bold, 16))
            }
            .frame(maxWidth: .infinity, minHeight: 48)
            .padding(.horizontal, 20)
            .foregroundStyle(foreground)
            .background(background)
            .overlay(
                RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous)
                    .stroke(borderColor, lineWidth: variant == .secondary ? 1 : 0)
            )
            .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous))
            .scaleEffect(pressed ? 0.95 : 1)
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.5)
        .simultaneousGesture(
            DragGesture(minimumDistance: 0)
                .onChanged { _ in pressed = true }
                .onEnded { _ in pressed = false }
        )
    }

    private var foreground: Color {
        switch variant {
        case .primary: return KelmahTheme.stitchOnPrimaryContainer
        case .secondary: return KelmahTheme.textPrimary
        case .ghost: return KelmahTheme.primary
        }
    }

    private var background: Color {
        switch variant {
        case .primary: return KelmahTheme.stitchGold
        case .secondary, .ghost: return .clear
        }
    }

    private var borderColor: Color {
        variant == .secondary ? KelmahTheme.stitchOutline : .clear
    }
}

struct KelmahFab: View {
    let systemImage: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(.title3.weight(.bold))
                .foregroundStyle(KelmahTheme.stitchOnPrimaryContainer)
                .frame(width: 56, height: 56)
                .background(KelmahTheme.stitchGold)
                .clipShape(Circle())
                .kelmahShadow(.elevated)
        }
        .buttonStyle(.plain)
    }
}

enum KelmahChipTone {
    case primary, surface, success, warning, info, error

    var bg: Color {
        switch self {
        case .primary: return KelmahTheme.stitchGold.opacity(0.9)
        case .surface: return KelmahTheme.stitchSurfaceContainer
        case .success: return KelmahTheme.stitchSuccess.opacity(0.16)
        case .warning: return Color(hex: "FFB03A").opacity(0.18)
        case .info: return KelmahTheme.stitchInfo.opacity(0.16)
        case .error: return KelmahTheme.stitchError.opacity(0.14)
        }
    }

    var fg: Color {
        switch self {
        case .primary: return KelmahTheme.stitchOnPrimaryContainer
        case .surface: return KelmahTheme.textMuted
        case .success: return Color(hex: "047857")
        case .warning: return Color(hex: "8A5A00")
        case .info: return Color(hex: "1D4ED8")
        case .error: return KelmahTheme.stitchError
        }
    }
}

struct KelmahBadge: View {
    let text: String
    var tone: KelmahChipTone = .primary

    var body: some View {
        Text(text)
            .font(.inter(.bold, 10))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .foregroundStyle(tone.fg)
            .background(tone.bg)
            .clipShape(Capsule())
    }
}

struct KelmahFilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.inter(isSelected ? .bold : .semibold, 14))
                .padding(.horizontal, 14)
                .padding(.vertical, 8)
                .frame(minHeight: 36)
                .foregroundStyle(isSelected ? KelmahTheme.stitchOnPrimaryContainer : KelmahTheme.textMuted)
                .background(isSelected ? KelmahTheme.stitchGold : KelmahTheme.stitchSurfaceContainer)
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

struct KelmahToggle: View {
    @Binding var isOn: Bool
    var label: String? = nil

    var body: some View {
        Toggle(isOn: $isOn) {
            if let label { Text(label).font(.inter(.medium, 16)) }
        }
        .labelsHidden()
        .tint(KelmahTheme.stitchGold)
    }
}

struct KelmahAvatar: View {
    let initials: String
    var size: CGFloat = 40
    var isOnline: Bool = false

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            Text(initials.prefix(2).uppercased())
                .font(.inter(.bold, size * 0.36))
                .foregroundStyle(KelmahTheme.stitchOnPrimaryContainer)
                .frame(width: size, height: size)
                .background(KelmahTheme.stitchGold)
                .clipShape(Circle())

            if isOnline {
                Circle()
                    .fill(KelmahTheme.stitchSuccess)
                    .frame(width: size * 0.28, height: size * 0.28)
                    .overlay(Circle().stroke(KelmahTheme.stitchSurface, lineWidth: 2))
            }
        }
    }
}

struct KelmahRadioCard: View {
    let title: String
    let subtitle: String
    let isSelected: Bool
    var systemImage: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.title3)
                        .foregroundStyle(isSelected ? KelmahTheme.primary : KelmahTheme.textMuted)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.inter(.semibold, 16)).foregroundStyle(KelmahTheme.textPrimary)
                    Text(subtitle).font(.inter(.regular, 13)).foregroundStyle(KelmahTheme.textMuted)
                }
                Spacer()
                if isSelected {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(KelmahTheme.primary)
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(isSelected ? KelmahTheme.stitchGold.opacity(0.1) : KelmahTheme.card)
            .overlay(
                RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous)
                    .stroke(isSelected ? KelmahTheme.primary : KelmahTheme.borderSoft, lineWidth: isSelected ? 2 : 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

struct KelmahProgressStepper: View {
    let activeStep: Int
    let totalSteps: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                ForEach(0..<totalSteps, id: \.self) { index in
                    Capsule()
                        .fill(index < activeStep ? KelmahTheme.stitchGold : KelmahTheme.stitchSurfaceVariant)
                        .frame(height: 8)
                }
            }
            Text("Step \(min(max(activeStep, 1), totalSteps)) of \(totalSteps)")
                .font(.inter(.medium, 12))
                .foregroundStyle(KelmahTheme.textMuted)
        }
    }
}

struct KelmahSearchField: View {
    @Binding var text: String
    var placeholder: String = "Search"
    var trailingSystemImage: String? = nil
    var onTrailingTap: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass").foregroundStyle(KelmahTheme.textMuted)
            TextField(placeholder, text: $text)
                .font(.inter(.regular, 16))
                .foregroundStyle(KelmahTheme.textPrimary)
            if let trailingSystemImage {
                Button { onTrailingTap?() } label: {
                    Image(systemName: trailingSystemImage).foregroundStyle(KelmahTheme.textMuted)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14)
        .frame(height: 48)
        .background(KelmahTheme.card)
        .overlay(
            RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous)
                .stroke(KelmahTheme.borderSoft, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: KelmahShapes.large, style: .continuous))
    }
}

struct KelmahDivider: View {
    var body: some View {
        Rectangle()
            .fill(KelmahTheme.stitchOutlineVariant.opacity(0.3))
            .frame(height: 1)
    }
}
