import Foundation

enum RelativeTimeFormatter {
    private static let parser = ISO8601DateFormatter()

    static func relativeOrFallback(_ raw: String?) -> String? {
        guard let date = parse(raw) else { return raw }
        let seconds = Int(Date().timeIntervalSince(date))
        if seconds >= 0 {
            switch seconds {
            case 0..<60: return "Just now"
            case 60..<3600: return "\(seconds / 60)m ago"
            case 3600..<86_400: return "\(seconds / 3600)h ago"
            case 86_400..<604_800: return "\(seconds / 86_400)d ago"
            default: return DateFormatter.kelmahFallback.string(from: date)
            }
        }

        let futureSeconds = abs(seconds)
        switch futureSeconds {
        case 0..<3600: return "In \(futureSeconds / 60)m"
        case 3600..<86_400: return "In \(futureSeconds / 3600)h"
        case 86_400..<604_800: return "In \(futureSeconds / 86_400)d"
        default: return DateFormatter.kelmahFallback.string(from: date)
        }
    }

    static func deadlineLabel(_ raw: String?) -> String? {
        guard let date = parse(raw) else { return raw }
        let seconds = Int(date.timeIntervalSinceNow)
        switch seconds {
        case Int.min..<0: return "Expired"
        case 0..<3600: return "Due in \(seconds / 60)m"
        case 3600..<86_400: return "Due in \(seconds / 3600)h"
        case 86_400..<604_800: return "Due in \(seconds / 86_400)d"
        default: return "Due \(DateFormatter.kelmahFallback.string(from: date))"
        }
    }

    private static func parse(_ raw: String?) -> Date? {
        guard let raw, raw.isEmpty == false else { return nil }
        if let date = parser.date(from: raw) {
            return date
        }

        let fractionalParser = ISO8601DateFormatter()
        fractionalParser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return fractionalParser.date(from: raw)
    }
}

private extension DateFormatter {
    static let kelmahFallback: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "dd MMM yyyy, HH:mm"
        formatter.locale = Locale(identifier: "en_GB")
        return formatter
    }()
}