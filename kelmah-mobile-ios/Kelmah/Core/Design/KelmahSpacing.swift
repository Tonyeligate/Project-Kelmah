import CoreGraphics

/// Stitch 8pt-based spacing scale (source of truth from Tailwind configs).
enum KelmahSpacing {
    /// 8pt base unit.
    static let base: CGFloat = 8

    static let xxs: CGFloat = 2
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    static let xxxl: CGFloat = 48

    /// 16pt standard gutter between content blocks.
    static let gutter: CGFloat = 16

    /// Minimum interactive touch target.
    static let touchTarget: CGFloat = 48

    /// Mobile screen side margin.
    static let marginMobile: CGFloat = 16

    /// Desktop / large-screen side margin.
    static let marginDesktop: CGFloat = 64
}
