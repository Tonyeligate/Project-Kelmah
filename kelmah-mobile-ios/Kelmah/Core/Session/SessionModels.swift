import Foundation

enum SessionPhase: Equatable {
    case checking
    case authenticated
    case unauthenticated
    case recoverableFailure(String)
}

struct SessionUser: Codable, Equatable {
    let id: String?
    let _id: String?
    let email: String?
    let firstName: String?
    let lastName: String?
    let role: String?
    let isEmailVerified: Bool?

    var resolvedID: String? {
        id ?? _id
    }

    var displayName: String {
        let name = [firstName, lastName]
            .compactMap { $0 }
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return name.isEmpty ? (email ?? "Kelmah User") : name
    }
}
