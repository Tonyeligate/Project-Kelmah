import Foundation

extension String {
    var nilIfEmpty: String? {
        trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : self
    }

    /// Percent-encode a value for safe use in a URL path segment.
    /// Prevents path traversal or request hijacking when interpolating IDs into URLs.
    var urlPathEncoded: String {
        addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? self
    }
}