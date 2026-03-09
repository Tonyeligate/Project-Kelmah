import Foundation

enum JobsFeed: String, CaseIterable, Hashable {
    case discover
    case saved

    var title: String {
        switch self {
        case .discover: return "Discover"
        case .saved: return "Saved"
        }
    }
}

enum JobSortOption: String, CaseIterable, Hashable, Identifiable {
    case newest
    case oldest
    case budgetHigh = "budget_desc"
    case budgetLow = "budget_asc"
    case deadlineSoon = "deadline_asc"
    case urgent

    var id: String { rawValue }

    var label: String {
        switch self {
        case .newest: return "Newest"
        case .oldest: return "Oldest"
        case .budgetHigh: return "Top Budget"
        case .budgetLow: return "Low Budget"
        case .deadlineSoon: return "Deadline Soon"
        case .urgent: return "Urgent"
        }
    }
}

struct JobFilters: Equatable {
    var search: String = ""
    var category: String = "All"
    var location: String = ""
    var sort: JobSortOption = .newest
}

struct JobCategory: Identifiable, Hashable {
    let id: String
    let name: String
    let description: String
}

struct JobSummary: Identifiable, Hashable {
    let id: String
    let title: String
    let description: String
    let category: String
    let locationLabel: String
    let budgetLabel: String
    let budgetAmount: Double
    let currency: String
    let paymentType: String
    let employerName: String
    let employerAvatar: String?
    let skills: [String]
    let postedAt: String?
    let status: String?
    let proposalCount: Int
    let matchScore: Int?
    let aiReasoning: String?
    let isVerified: Bool
    let isUrgent: Bool
    let isSaved: Bool
}

struct JobDetail: Hashable {
    let summary: JobSummary
    let fullDescription: String
    let requirements: [String]
    let proposalCount: Int
    let viewCount: Int
    let deadline: String?
    let hirerId: String?
}

struct JobsPage: Hashable {
    let jobs: [JobSummary]
    let page: Int
    let totalPages: Int
    let totalItems: Int
}

struct ApplyToJobRequest: Encodable {
    let proposedRate: Double
    let coverLetter: String
    let estimatedDuration: String?
}

struct JobApplicationResult: Hashable {
    let success: Bool
    let message: String
}

enum JobsRoute: Hashable {
    case detail(String)
    case apply(String)
}

struct JobsRawEnvelope: Decodable {
    let success: Bool?
    let message: String?
    let data: JSONValue?
    let meta: JSONValue?
}

enum JSONValue: Decodable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([String: JSONValue].self) {
            self = .object(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON payload")
        }
    }

    var objectValue: [String: JSONValue]? {
        if case let .object(value) = self { return value }
        return nil
    }

    var arrayValue: [JSONValue]? {
        if case let .array(value) = self { return value }
        return nil
    }

    var stringValue: String? {
        switch self {
        case let .string(value): return value
        case let .number(value): return value.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(value)) : String(value)
        case let .bool(value): return value ? "true" : "false"
        default: return nil
        }
    }

    var doubleValue: Double? {
        switch self {
        case let .number(value): return value
        case let .string(value): return Double(value)
        default: return nil
        }
    }

    var intValue: Int? {
        switch self {
        case let .number(value): return Int(value)
        case let .string(value): return Int(value)
        default: return nil
        }
    }

    var boolValue: Bool? {
        switch self {
        case let .bool(value): return value
        case let .string(value): return Bool(value)
        default: return nil
        }
    }

    subscript(key: String) -> JSONValue? {
        objectValue?[key]
    }
}
