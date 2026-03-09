import Foundation

final class ProfileRepository {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func getWorkerProfileSnapshot(workerId: String) async throws -> WorkerProfileSnapshot {
        async let credentialsResponse = optionalFetch(path: "users/me/credentials")
        async let availabilityResponse = optionalFetch(path: "users/workers/\(workerId)/availability")
        async let completenessResponse = optionalFetch(path: "users/workers/\(workerId)/completeness")
        async let portfolioResponse = optionalFetch(
            path: "users/workers/\(workerId)/portfolio",
            queryItems: [URLQueryItem(name: "limit", value: "6")]
        )

        let profileResponse = try await apiClient.send(
            path: "users/profile",
            method: .get,
            requiresAuth: true,
            responseType: ProfileRawEnvelope.self
        )

        return WorkerProfileSnapshot(
            profile: parseProfile(profileResponse),
            credentials: parseCredentials(await credentialsResponse),
            availability: parseAvailability(await availabilityResponse),
            completeness: parseCompleteness(await completenessResponse),
            portfolio: parsePortfolio(await portfolioResponse)
        )
    }

    private func optionalFetch(path: String, queryItems: [URLQueryItem] = []) async -> ProfileRawEnvelope? {
        try? await apiClient.send(
            path: path,
            method: .get,
            queryItems: queryItems,
            requiresAuth: true,
            responseType: ProfileRawEnvelope.self
        )
    }

    private func parseProfile(_ response: ProfileRawEnvelope) -> WorkerRecommendationProfile {
        let object = response.data?.objectValue ?? [:]
        let fallbackLocation = [object.string("city"), object.string("state"), object.string("country")]
            .compactMap { $0?.nilIfEmpty }
            .joined(separator: ", ")
        return WorkerRecommendationProfile(
            id: object.string("id") ?? object.string("_id"),
            firstName: object.string("firstName") ?? "",
            lastName: object.string("lastName") ?? "",
            email: object.string("email") ?? "",
            phone: object.string("phone") ?? "",
            bio: object.string("bio") ?? "",
            location: object.string("location") ?? fallbackLocation,
            profession: object.string("profession") ?? "",
            hourlyRate: object.double("hourlyRate"),
            currency: object.string("currency") ?? "GHS",
            experienceLevel: object.string("experienceLevel"),
            yearsOfExperience: object.int("yearsOfExperience"),
            skills: object["skills"]?.arrayValue?.compactMap { skill in
                skill.stringValue ?? skill.objectValue?.string("name") ?? skill.objectValue?.string("label")
            } ?? [],
            isEmailVerified: object.bool("isEmailVerified") ?? false,
            isPhoneVerified: object.bool("isPhoneVerified") ?? false
        )
    }

    private func parseCredentials(_ response: ProfileRawEnvelope?) -> WorkerCredentials {
        let object = response?.data?.objectValue ?? [:]
        let skills = object["skills"]?.arrayValue?.enumerated().compactMap { index, value in
            let data = value.objectValue
            let name = data?.string("name") ?? data?.string("label") ?? value.stringValue
            guard let name else { return nil }
            return CredentialSkill(
                id: data?.string("id") ?? data?.string("_id") ?? "skill-\(index)-\(name)",
                name: name,
                category: data?.string("category") ?? "general",
                proficiencyLevel: data?.string("proficiencyLevel") ?? data?.string("level") ?? "intermediate",
                yearsOfExperience: data?.int("yearsOfExperience") ?? 0,
                isVerified: data?.bool("isVerified") ?? false
            )
        } ?? []

        return WorkerCredentials(
            skills: skills,
            licenses: parseCredentialItems(object["licenses"]?.arrayValue),
            certifications: parseCredentialItems(object["certifications"]?.arrayValue)
        )
    }

    private func parseCredentialItems(_ values: [JSONValue]?) -> [CredentialItem] {
        values?.enumerated().compactMap { index, value in
            guard let object = value.objectValue else { return nil }
            guard let name = object.string("name") else { return nil }
            return CredentialItem(
                id: object.string("id") ?? object.string("_id") ?? "credential-\(index)-\(name)",
                name: name,
                issuingOrganization: object.string("issuingOrganization") ?? object.string("issuer") ?? "",
                issueDate: object.string("issueDate") ?? object.string("issuedAt"),
                expiryDate: object.string("expiryDate") ?? object.string("expiresAt"),
                status: object.string("status") ?? (object.bool("isVerified") == true ? "verified" : "pending"),
                isVerified: object.bool("isVerified") ?? false
            )
        } ?? []
    }

    private func parseAvailability(_ response: ProfileRawEnvelope?) -> WorkerAvailability {
        let object = response?.data?.objectValue ?? [:]
        let schedule = (object["schedule"]?.arrayValue ?? object["daySlots"]?.arrayValue ?? []).compactMap { value -> AvailabilityDay? in
            guard let item = value.objectValue else { return nil }
            guard let day = item.string("day") else { return nil }
            let slots = (item["slots"]?.arrayValue ?? []).compactMap { slotValue -> AvailabilitySlot? in
                guard let slot = slotValue.objectValue else { return nil }
                guard let start = slot.string("start"), let end = slot.string("end") else { return nil }
                return AvailabilitySlot(start: start, end: end)
            }
            return AvailabilityDay(
                day: day,
                available: item.bool("available") ?? (slots.isEmpty == false),
                slots: slots
            )
        }

        return WorkerAvailability(
            status: object.string("status") ?? "not_set",
            isAvailable: object.bool("isAvailable") ?? (object.string("status") == "available"),
            timezone: object.string("timezone") ?? "Africa/Accra",
            schedule: schedule,
            nextAvailable: object.string("nextAvailable"),
            lastUpdated: object.string("lastUpdated"),
            message: object.string("message")
        )
    }

    private func parseCompleteness(_ response: ProfileRawEnvelope?) -> WorkerCompleteness {
        let object = response?.data?.objectValue ?? [:]
        return WorkerCompleteness(
            completionPercentage: object.int("completionPercentage") ?? object.int("percentage") ?? 0,
            requiredCompletion: object.int("requiredCompletion") ?? 0,
            optionalCompletion: object.int("optionalCompletion") ?? 0,
            missingRequired: object["missingRequired"]?.arrayValue?.compactMap { $0.stringValue } ?? [],
            missingOptional: object["missingOptional"]?.arrayValue?.compactMap { $0.stringValue } ?? [],
            recommendations: object["recommendations"]?.arrayValue?.compactMap { $0.stringValue } ?? []
        )
    }

    private func parsePortfolio(_ response: ProfileRawEnvelope?) -> WorkerPortfolio {
        let object = response?.data?.objectValue ?? [:]
        let items = object["portfolioItems"]?.arrayValue?.compactMap { value -> PortfolioProject? in
            guard let item = value.objectValue else { return nil }
            guard let id = item.string("id") ?? item.string("_id") else { return nil }
            return PortfolioProject(
                id: id,
                title: item.string("title") ?? "Untitled project",
                description: item.string("description") ?? "",
                projectType: item.string("projectType") ?? "professional",
                skillsUsed: item["skillsUsed"]?.arrayValue?.compactMap { $0.stringValue ?? $0.objectValue?.string("name") } ?? [],
                location: item.string("location"),
                clientRating: item.double("clientRating"),
                status: item.string("status") ?? "draft",
                isFeatured: item.bool("isFeatured") ?? false,
                createdAt: item.string("createdAt")
            )
        } ?? []
        let stats = object["stats"]?.objectValue
        return WorkerPortfolio(
            items: items,
            totalCount: stats?.int("total") ?? items.count,
            publishedCount: stats?.int("published") ?? items.filter { $0.status.lowercased() == "published" }.count
        )
    }
}

private extension Dictionary where Key == String, Value == JSONValue {
    func string(_ key: String) -> String? { self[key]?.stringValue }
    func int(_ key: String) -> Int? { self[key]?.intValue }
    func double(_ key: String) -> Double? { self[key]?.doubleValue }
    func bool(_ key: String) -> Bool? { self[key]?.boolValue }
}

private extension String {
    var nilIfEmpty: String? {
        trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : self
    }
}