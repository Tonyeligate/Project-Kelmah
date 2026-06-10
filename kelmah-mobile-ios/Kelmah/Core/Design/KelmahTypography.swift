import SwiftUI

/// Stitch typography tokens.
///
/// Montserrat drives display/headline text, Inter drives body and labels.
/// The bundled variable fonts expose the family names "Montserrat" and
/// "Inter"; the weight modifier selects the correct axis instance on iOS 17+.
enum KelmahFont {
    enum Family {
        static let display = "Montserrat"
        static let body = "Inter"
    }

    static func montserrat(_ weight: Font.Weight = .regular, _ size: CGFloat) -> Font {
        Font.custom(Family.display, size: size).weight(weight)
    }

    static func inter(_ weight: Font.Weight = .regular, _ size: CGFloat) -> Font {
        Font.custom(Family.body, size: size).weight(weight)
    }
}

enum KelmahTypography {
    static let displayLarge = KelmahFont.montserrat(.bold, 48)
    static let headlineLarge = KelmahFont.montserrat(.bold, 32)
    static let headlineLargeMobile = KelmahFont.montserrat(.bold, 28)
    static let headlineMedium = KelmahFont.montserrat(.semibold, 24)
    static let titleLarge = KelmahFont.montserrat(.semibold, 20)
    static let titleMedium = KelmahFont.montserrat(.semibold, 17)

    static let bodyLarge = KelmahFont.inter(.regular, 18)
    static let bodyMedium = KelmahFont.inter(.regular, 16)
    static let labelMedium = KelmahFont.inter(.semibold, 14)
    static let caption = KelmahFont.inter(.medium, 12)
}

extension Font {
    static func montserrat(_ weight: Font.Weight = .regular, _ size: CGFloat) -> Font {
        KelmahFont.montserrat(weight, size)
    }

    static func inter(_ weight: Font.Weight = .regular, _ size: CGFloat) -> Font {
        KelmahFont.inter(weight, size)
    }
}
