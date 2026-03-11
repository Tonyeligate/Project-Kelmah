import Foundation

struct WorkerProfileSnapshot: Hashable {
    let profile: WorkerRecommendationProfile
    let credentials: WorkerCredentials
    let availability: WorkerAvailability
    let completeness: WorkerCompleteness
    let portfolio: WorkerPortfolio
    let partialWarnings: [String]

    var visibleSkills: [String] {
        let credentialSkills = credentials.skills.map(\.name)
        return credentialSkills.isEmpty ? profile.skills : credentialSkills
    }
}

struct WorkerRecommendationProfile: Hashable {
    let id: String?
    let firstName: String
    let lastName: String
    let email: String
    let phone: String
    let bio: String
    let location: String
    let profession: String
    let hourlyRate: Double?
    let currency: String
    let experienceLevel: String?
    let yearsOfExperience: Int?
    let skills: [String]
    let isEmailVerified: Bool
    let isPhoneVerified: Bool

    var displayName: String {
        [firstName, lastName]
            .filter { $0.isEmpty == false }
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .nilIfEmpty ?? email.nilIfEmpty ?? "Kelmah Worker"
    }
}

struct WorkerCredentials: Hashable {
    let skills: [CredentialSkill]
    let licenses: [CredentialItem]
    let certifications: [CredentialItem]

    init(
        skills: [CredentialSkill] = [],
        licenses: [CredentialItem] = [],
        certifications: [CredentialItem] = []
    ) {
        self.skills = skills
        self.licenses = licenses
        self.certifications = certifications
    }
}

struct CredentialSkill: Hashable, Identifiable {
    let id: String
    let name: String
    let category: String
    let proficiencyLevel: String
    let yearsOfExperience: Int
    let isVerified: Bool
}

struct CredentialItem: Hashable, Identifiable {
    let id: String
    let name: String
    let issuingOrganization: String
    let issueDate: String?
    let expiryDate: String?
    let status: String
    let isVerified: Bool
}

struct WorkerAvailability: Hashable {
    let status: String
    let isAvailable: Bool
    let timezone: String
    let schedule: [AvailabilityDay]
    let nextAvailable: String?
    let lastUpdated: String?
    let message: String?

    init(
        status: String = "not_set",
        isAvailable: Bool = true,
        timezone: String = "Africa/Accra",
        schedule: [AvailabilityDay] = [],
        nextAvailable: String? = nil,
        lastUpdated: String? = nil,
        message: String? = nil
    ) {
        self.status = status
        self.isAvailable = isAvailable
        self.timezone = timezone
        self.schedule = schedule
        self.nextAvailable = nextAvailable
        self.lastUpdated = lastUpdated
        self.message = message
    }
}

struct AvailabilityDay: Hashable, Identifiable {
    let day: String
    let available: Bool
    let slots: [AvailabilitySlot]

    var id: String { day }
}

struct AvailabilitySlot: Hashable {
    let start: String
    let end: String
}

struct WorkerCompleteness: Hashable {
    let completionPercentage: Int
    let requiredCompletion: Int
    let optionalCompletion: Int
    let missingRequired: [String]
    let missingOptional: [String]
    let recommendations: [String]

    init(
        completionPercentage: Int = 0,
        requiredCompletion: Int = 0,
        optionalCompletion: Int = 0,
        missingRequired: [String] = [],
        missingOptional: [String] = [],
        recommendations: [String] = []
    ) {
        self.completionPercentage = completionPercentage
        self.requiredCompletion = requiredCompletion
        self.optionalCompletion = optionalCompletion
        self.missingRequired = missingRequired
        self.missingOptional = missingOptional
        self.recommendations = recommendations
    }
}

struct WorkerPortfolio: Hashable {
    let items: [PortfolioProject]
    let totalCount: Int
    let publishedCount: Int

    init(items: [PortfolioProject] = [], totalCount: Int = 0, publishedCount: Int = 0) {
        self.items = items
        self.totalCount = totalCount
        self.publishedCount = publishedCount
    }
}

struct PortfolioProject: Hashable, Identifiable {
    let id: String
    let title: String
    let description: String
    let projectType: String
    let skillsUsed: [String]
    let location: String?
    let clientRating: Double?
    let status: String
    let isFeatured: Bool
    let createdAt: String?
}

struct ProfileRawEnvelope: Decodable {
    let success: Bool?
    let message: String?
    let data: JSONValue?
    let meta: JSONValue?
}