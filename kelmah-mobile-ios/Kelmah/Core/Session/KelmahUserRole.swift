import Foundation

enum KelmahUserRole {
    case worker
    case hirer

    init(role: String?) {
        if role?.lowercased() == "hirer" {
            self = .hirer
        } else {
            self = .worker
        }
    }

    var title: String {
        switch self {
        case .worker:
            return "Worker"
        case .hirer:
            return "Hirer"
        }
    }
}

extension SessionUser {
    var kelmahUserRole: KelmahUserRole {
        KelmahUserRole(role: role)
    }
}