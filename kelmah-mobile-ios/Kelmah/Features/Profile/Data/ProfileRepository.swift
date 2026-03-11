import Foundation

final class ProfileRepository {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func getWorkerProfileSnapshot(workerId: String) async throws -> WorkerProfileSnapshot {
        do {
            let response = try await apiClient.send(
                path: "users/me/profile-signals",
                method: .get,
                requiresAuth: true,
                responseType: ProfileRawEnvelope.self
            )
            return parseProfileSignals(response)
        } catch let APIClientError.invalidStatusCode(statusCode, _) where statusCode == 404 {
            return try await getLegacyWorkerProfileSnapshot(workerId: workerId)
        }
    }

    private func getLegacyWorkerProfileSnapshot(workerId: String) async throws -> WorkerProfileSnapshot {
        async let credentialsResponse = optionalFetch(path: "users/me/credentials")
        async let availabilityResponse = optionalFetch(path: "users/workers/\(workerId.urlPathEncoded)/availability")
        async let completenessResponse = optionalFetch(path: "users/workers/\(workerId.urlPathEncoded)/completeness")
        async let portfolioResponse = optionalFetch(
            path: "users/workers/\(workerId.urlPathEncoded)/portfolio",
            queryItems: [URLQueryItem(name: "limit", value: "6")]
        )

        let profileResponse = try await apiClient.send(
            path: "users/profile",
            method: .get,
            requiresAuth: true,
            responseType: ProfileRawEnvelope.self
        )

        let resolvedCredentials = await credentialsResponse
        let resolvedAvailability = await availabilityResponse
        let resolvedCompleteness = await completenessResponse
        let resolvedPortfolio = await portfolioResponse

        return WorkerProfileSnapshot(
            profile: parseProfile(profileResponse),
            credentials: parseCredentials(resolvedCredentials),
            availability: parseAvailability(resolvedAvailability),
            completeness: parseCompleteness(resolvedCompleteness),
            portfolio: parsePortfolio(resolvedPortfolio),
            partialWarnings: [
                resolvedCredentials == nil ? "Your certificates could not load. Job matches may be less accurate." : nil,
                resolvedAvailability == nil ? "Your work time could not load. Job matches may be less up to date." : nil,
                resolvedCompleteness == nil ? "Your profile check could not load." : nil,
                resolvedPortfolio == nil ? "Your past work could not load. Hirers may see less proof." : nil,
            ].compactMap { $0 }
        )
    }

    private func parseProfileSignals(_ response: ProfileRawEnvelope) -> WorkerProfileSnapshot {
        let object = response.data?.objectValue ?? [:]
        return WorkerProfileSnapshot(
            profile: parseProfileObject(object["profile"]?.objectValue ?? [:]),
            credentials: parseCredentialsObject(object["credentials"]?.objectValue ?? [:]),
            availability: parseAvailabilityObject(object["availability"]?.objectValue ?? [:]),
            completeness: parseCompletenessObject(object["completeness"]?.objectValue ?? [:]),
            portfolio: parsePortfolioObject(object["portfolio"]?.objectValue ?? [:]),
            partialWarnings: []
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
        parseProfileObject(response.data?.objectValue ?? [:])
    }

    private func parseProfileObject(_ object: [String: JSONValue]) -> WorkerRecommendationProfile {
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
        parseCredentialsObject(response?.data?.objectValue ?? [:])
    }

    private func parseCredentialsObject(_ object: [String: JSONValue]) -> WorkerCredentials {
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
        parseAvailabilityObject(response?.data?.objectValue ?? [:])
    }

    private func parseAvailabilityObject(_ object: [String: JSONValue]) -> WorkerAvailability {
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
        parseCompletenessObject(response?.data?.objectValue ?? [:])
    }

    private func parseCompletenessObject(_ object: [String: JSONValue]) -> WorkerCompleteness {
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
        parsePortfolioObject(response?.data?.objectValue ?? [:])
    }

    private func parsePortfolioObject(_ object: [String: JSONValue]) -> WorkerPortfolio {
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