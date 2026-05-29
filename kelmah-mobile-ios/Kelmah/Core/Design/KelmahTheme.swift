import SwiftUI

enum KelmahTheme {
    // Gold brand colors — aligned with Android (#FFD34D) and Web tokens
    static let primary = Color(red: 255 / 255, green: 211 / 255, blue: 77 / 255)   // #FFD34D
    static let accent = Color(red: 255 / 255, green: 224 / 255, blue: 137 / 255)    // #FFE089 (goldBright)
    static let sun = Color(red: 255 / 255, green: 211 / 255, blue: 77 / 255)        // #FFD34D
    static let cyan = Color(red: 93 / 255, green: 168 / 255, blue: 255 / 255)       // #5DA8FF (info)
    static let success = Color(red: 41 / 255, green: 199 / 255, blue: 129 / 255)    // #29C781
    static let danger = Color(red: 255 / 255, green: 107 / 255, blue: 107 / 255)    // #FF6B6B

    static let background = Color(red: 16 / 255, green: 17 / 255, blue: 22 / 255)   // #101116
    static let backgroundRaised = Color(red: 26 / 255, green: 29 / 255, blue: 38 / 255) // #1A1D26
    static let card = Color(red: 26 / 255, green: 29 / 255, blue: 38 / 255)         // #1A1D26
    static let cardRaised = Color(red: 34 / 255, green: 37 / 255, blue: 48 / 255)   // #222530

    static let borderSoft = Color.white.opacity(0.08)
    static let borderStrong = Color(red: 255 / 255, green: 211 / 255, blue: 77 / 255, opacity: 0.58) // Gold highlight border

    static let textPrimary = Color(red: 247 / 255, green: 243 / 255, blue: 227 / 255) // #F7F3E3
    static let textMuted = Color(red: 179 / 255, green: 175 / 255, blue: 163 / 255)   // warmer muted to match Android
}
