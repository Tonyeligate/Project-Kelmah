import SwiftUI

/// Stitch corner-radius tokens.
enum KelmahShapes {
    static let `default`: CGFloat = 4
    static let medium: CGFloat = 8
    static let large: CGFloat = 12
    static let xl: CGFloat = 16
    /// Pill / fully rounded.
    static let full: CGFloat = 9999

    static let card = RoundedRectangle(cornerRadius: large, style: .continuous)
    static let panel = RoundedRectangle(cornerRadius: xl, style: .continuous)
    static let control = RoundedRectangle(cornerRadius: large, style: .continuous)
}

/// Stitch shadow tokens mapped from the Tailwind shadow scale.
struct KelmahShadow {
    let color: Color
    let radius: CGFloat
    let x: CGFloat
    let y: CGFloat

    static let card = KelmahShadow(color: Color.black.opacity(0.04), radius: 20, x: 0, y: 4)
    static let elevated = KelmahShadow(color: Color.black.opacity(0.08), radius: 30, x: 0, y: 8)
    static let modal = KelmahShadow(color: Color.black.opacity(0.15), radius: 40, x: 0, y: 20)
}

extension View {
    func kelmahShadow(_ shadow: KelmahShadow) -> some View {
        self.shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
    }
}
