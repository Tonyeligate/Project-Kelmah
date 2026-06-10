import SwiftUI

enum KelmahTheme {
    static let stitchPrimary = Color(hex: "705D00")
    static let stitchGold = Color(hex: "FFD700")
    static let stitchGoldDim = Color(hex: "E9C400")
    /// Foreground color used on top of the gold primary container (dark brown for AA contrast).
    static let stitchOnPrimaryContainer = Color(hex: "231B00")
    static let stitchSurface = Color(hex: "F9F9F9")
    static let stitchBackground = Color(hex: "F9F9F9")
    static let stitchSurfaceContainerLow = Color(hex: "F3F3F4")
    static let stitchSurfaceContainer = Color(hex: "EEEEEE")
    static let stitchSurfaceVariant = Color(hex: "E2E2E2")
    static let stitchOutline = Color(hex: "7E775F")
    static let stitchOutlineVariant = Color(hex: "D0C6AB")
    static let stitchOnSurface = Color(hex: "1A1C1C")
    static let stitchOnSurfaceVariant = Color(hex: "4D4732")
    static let stitchError = Color(hex: "BA1A1A")
    static let stitchSuccess = Color(hex: "10B981")
    static let stitchInfo = Color(hex: "3B82F6")
    static let stitchDarkPrimary = Color(hex: "E9C400")
    static let stitchDarkBackground = Color(hex: "1A1C1C")
    static let stitchDarkSurface = Color(hex: "2F3131")
    static let stitchDarkOnSurface = Color(hex: "F0F1F1")

    // Existing aliases are preserved so current screens inherit Stitch without rewrites.
    static let primary = stitchPrimary
    static let accent = stitchGold
    static let sun = stitchGold
    static let cyan = stitchInfo
    static let success = stitchSuccess
    static let danger = stitchError

    static let background = stitchBackground
    static let backgroundRaised = stitchSurfaceContainerLow
    static let card = stitchSurface
    static let cardRaised = stitchSurfaceContainerLow

    static let borderSoft = stitchOutlineVariant.opacity(0.78)
    static let borderStrong = stitchPrimary.opacity(0.42)

    static let textPrimary = stitchOnSurface
    static let textMuted = stitchOnSurfaceVariant
}

extension Color {
    init(hex: String) {
        var rawValue = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if rawValue.hasPrefix("#") {
            rawValue.removeFirst()
        }

        var value: UInt64 = 0
        Scanner(string: rawValue).scanHexInt64(&value)

        let red: Double
        let green: Double
        let blue: Double
        let alpha: Double

        switch rawValue.count {
        case 8:
            red = Double((value & 0xFF000000) >> 24) / 255
            green = Double((value & 0x00FF0000) >> 16) / 255
            blue = Double((value & 0x0000FF00) >> 8) / 255
            alpha = Double(value & 0x000000FF) / 255
        default:
            red = Double((value & 0xFF0000) >> 16) / 255
            green = Double((value & 0x00FF00) >> 8) / 255
            blue = Double(value & 0x0000FF) / 255
            alpha = 1
        }

        self.init(.sRGB, red: red, green: green, blue: blue, opacity: alpha)
    }
}
