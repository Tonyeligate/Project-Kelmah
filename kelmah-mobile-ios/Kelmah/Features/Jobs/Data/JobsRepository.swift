import Foundation

final class JobsRepository {
    private let apiClient: APIClient

    init(apiClient: APIClient) {
        self.apiClient = apiClient
    }

    func getJobs(filters: JobFilters, page: Int = 1, limit: Int = 20) async throws -> JobsPage {
        let queryItems = buildQueryItems(filters: filters, page: page, limit: limit)
        let response = try await apiClient.send(
            path: "jobs",
            method: .get,
            queryItems: queryItems,
            requiresAuth: true,
            responseType: JobsRawEnvelope.self
        )
        return parseJobsPage(response, forcedSaved: false)
    }

    func getRecommendedJobs(limit: Int = 6) async throws -> RecommendationFeed {
        let response = try await apiClient.send(
            path: "jobs/recommendations/personalized",
            method: .get,
            queryItems: [
                URLQueryItem(name: "page", value: "1"),
                URLQueryItem(name: "limit", value: String(limit)),
            ],
            requiresAuth: true,
            responseType: JobsRawEnvelope.self
        )
        let personalizedPage = parseJobsPage(response, forcedSaved: false, strictJobQuality: true)
        let recommendationSource = response.meta?.objectValue?["recommendationSource"]?.stringValue
            ?? response.data?.objectValue?["recommendationSource"]?.stringValue
        let isNewUser = response.data?.objectValue?["isNewUser"]?.boolValue ?? false
        let isProfileIncomplete = recommendationSource == "profile-incomplete" || (isNewUser && personalizedPage.jobs.isEmpty)

        if isProfileIncomplete {
            let generalRecommendations = await fetchGeneralRecommendations(limit: limit)
            return RecommendationFeed(
                jobs: generalRecommendations,
                state: .profileIncomplete,
                contextMessage: buildProfileIncompleteMessage(
                    serverMessage: response.message,
                    hasGeneralRecommendations: generalRecommendations.isEmpty == false
                )
            )
        }

        return RecommendationFeed(
            jobs: personalizedPage.jobs,
            state: .personalized,
            contextMessage: nil
        )
    }

    func getMyJobs(limit: Int = 6) async throws -> [JobSummary] {
        let response = try await apiClient.send(
            path: "jobs/my-jobs",
            method: .get,
            queryItems: [
                URLQueryItem(name: "page", value: "1"),
                URLQueryItem(name: "limit", value: String(limit)),
                URLQueryItem(name: "sort", value: "-updatedAt"),
            ],
            requiresAuth: true,
            responseType: JobsRawEnvelope.self
        )
        return parseJobsPage(response, forcedSaved: false).jobs
    }

    func getSavedJobs(page: Int = 1, limit: Int = 20) async throws -> JobsPage {
        let response = try await apiClient.send(
            path: "jobs/saved",
            method: .get,
            queryItems: [
                URLQueryItem(name: "page", value: String(page)),
                URLQueryItem(name: "limit", value: String(limit)),
            ],
            requiresAuth: true,
            responseType: JobsRawEnvelope.self
        )
        return parseJobsPage(response, forcedSaved: true)
    }

    func getCategories() async throws -> [JobCategory] {
        let response = try await apiClient.send(
            path: "jobs/categories",
            method: .get,
            requiresAuth: true,
            responseType: JobsRawEnvelope.self
        )
        return parseCategories(response)
    }

    func getJobDetail(jobId: String) async throws -> JobDetail {
        let response = try await apiClient.send(
            path: "jobs/\(jobId)",
            method: .get,
            requiresAuth: true,
            responseType: JobsRawEnvelope.self
        )
        return try parseJobDetail(response)
    }

    func toggleSaved(jobId: String, shouldSave: Bool) async throws -> Bool {
        let method: HTTPMethod = shouldSave ? .post : .delete
        _ = try await apiClient.send(
            path: "jobs/\(jobId)/save",
            method: method,
            requiresAuth: true,
            responseType: JobsRawEnvelope.self
        ) as JobsRawEnvelope
        return shouldSave
    }

    func applyToJob(jobId: String, request: ApplyToJobRequest) async throws -> JobApplicationResult {
        let response = try await apiClient.send(
            path: "jobs/\(jobId)/apply",
            method: .post,
            body: request,
            requiresAuth: true,
            responseType: JobsRawEnvelope.self
        )

        return JobApplicationResult(
            success: response.success ?? true,
            message: response.message ?? response.data?["message"]?.stringValue ?? "Application submitted successfully"
        )
    }

    private func buildQueryItems(filters: JobFilters, page: Int, limit: Int) -> [URLQueryItem] {
        var items = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "sort", value: filters.sort.rawValue),
        ]
        if filters.search.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false {
            items.append(URLQueryItem(name: "search", value: filters.search.trimmingCharacters(in: .whitespacesAndNewlines)))
        }
        if filters.category.isEmpty == false, filters.category != "All" {
            items.append(URLQueryItem(name: "category", value: filters.category))
        }
        if filters.location.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false {
            items.append(URLQueryItem(name: "location", value: filters.location.trimmingCharacters(in: .whitespacesAndNewlines)))
        }
        return items
    }

    private func parseJobsPage(_ response: JobsRawEnvelope, forcedSaved: Bool, strictJobQuality: Bool = false) -> JobsPage {
        let dataArray = response.data?.arrayValue
        let dataObject = response.data?.objectValue
        let items = dataArray
            ?? dataObject?["items"]?.arrayValue
            ?? dataObject?["jobs"]?.arrayValue
            ?? []

        let pagination = dataObject?["pagination"]?.objectValue
        let metaPagination = response.meta?.objectValue?["pagination"]?.objectValue

        return JobsPage(
            jobs: items.compactMap { parseJobSummary($0, forcedSaved: forcedSaved, strictJobQuality: strictJobQuality) },
            page: pagination?["page"]?.intValue ?? metaPagination?["page"]?.intValue ?? 1,
            totalPages: pagination?["totalPages"]?.intValue ?? metaPagination?["totalPages"]?.intValue ?? 1,
            totalItems: pagination?["total"]?.intValue ?? metaPagination?["total"]?.intValue ?? items.count
        )
    }

    private func parseCategories(_ response: JobsRawEnvelope) -> [JobCategory] {
        let values = response.data?.arrayValue ?? response.data?["items"]?.arrayValue ?? []
        return values.enumerated().compactMap { index, value in
            guard let object = value.objectValue, let name = object.string("name") else { return nil }
            return JobCategory(
                id: object.string("_id") ?? object.string("id") ?? "category-\(index)",
                name: name,
                description: object.string("description") ?? ""
            )
        }
    }

    private func parseJobDetail(_ response: JobsRawEnvelope) throws -> JobDetail {
        guard let object = response.data?.objectValue ?? response.data?.arrayValue?.first?.objectValue else {
            throw APIClientError.invalidStatusCode(500, "Job detail payload was invalid")
        }
        guard let summary = parseJobSummary(.object(object), forcedSaved: object.bool("isSaved") ?? false, strictJobQuality: false) else {
            throw APIClientError.invalidStatusCode(500, "Job detail payload was invalid")
        }

        let requirementsContainer = object["requirements"]?.objectValue
        let requirements = ((requirementsContainer?["primarySkills"]?.arrayValue ?? []) + (requirementsContainer?["secondarySkills"]?.arrayValue ?? []))
            .compactMap { $0.stringValue }
        return JobDetail(
            summary: summary,
            fullDescription: object.string("description") ?? summary.description,
            requirements: requirements.isEmpty ? summary.skills : requirements,
            proposalCount: object.int("proposalCount") ?? 0,
            viewCount: object.int("viewCount") ?? 0,
            deadline: object.string("deadline") ?? object.string("endDate"),
            hirerId: object["hirer"]?.objectValue?.string("_id") ?? object["hirer"]?.objectValue?.string("id") ?? object.string("hirerId")
        )
    }

    private func parseJobSummary(_ value: JSONValue, forcedSaved: Bool, strictJobQuality: Bool = false) -> JobSummary? {
        guard let object = value.objectValue else { return nil }
        guard let id = object.string("_id") ?? object.string("id") else { return nil }
        let title = object.string("title")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let description = object.string("description")?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""

        let budgetObject = object["budget"]?.objectValue
        let employerObject = object["hirer"]?.objectValue
        let employerName = employerObject?.string("name")
            ?? [employerObject?.string("firstName"), employerObject?.string("lastName")]
                .compactMap { $0 }
                .joined(separator: " ")
                .trimmingCharacters(in: .whitespacesAndNewlines)
                .nilIfEmpty
            ?? object.string("hirer_name")
            ?? object.string("company")

        if strictJobQuality && (title.isEmpty || description.isEmpty || employerName?.isEmpty != false) {
            return nil
        }

        let paymentType = object.string("paymentType") ?? budgetObject?.string("type") ?? "fixed"
        let budgetAmount = object.double("budget") ?? budgetObject?.double("amount") ?? budgetObject?.double("max") ?? 0
        let currency = object.string("currency") ?? budgetObject?.string("currency") ?? "GHS"

        return JobSummary(
            id: id,
            title: title.isEmpty ? "Untitled Job" : title,
            description: description,
            category: object.string("category") ?? "General",
            locationLabel: locationLabel(from: object),
            budgetLabel: formatBudgetLabel(amount: budgetAmount, currency: currency, paymentType: paymentType),
            budgetAmount: budgetAmount,
            currency: currency,
            paymentType: paymentType,
            employerName: employerName ?? "Employer Name Pending",
            employerAvatar: employerObject?.string("avatar") ?? employerObject?.string("profileImage"),
            skills: skills(from: object),
            postedAt: object.string("createdAt") ?? object.string("created_at") ?? object.string("postedDate"),
            status: object.string("status"),
            proposalCount: object.int("proposalCount") ?? object.int("applicationsCount") ?? 0,
            matchScore: object.double("matchScore") ?? object.int("matchScore").map(Double.init),
            aiReasoning: parseAIReasoning(from: object),
            isVerified: employerObject?.bool("verified") ?? employerObject?.bool("isVerified") ?? false,
            isUrgent: object.bool("urgent") ?? false,
            isSaved: forcedSaved || (object.bool("isSaved") ?? object.bool("saved") ?? false)
        )
    }

    private func locationLabel(from object: [String: JSONValue]) -> String {
        if let inlineLocation = object.string("location")?.nilIfEmpty {
            return inlineLocation
        }
        let location = object["location"]?.objectValue
        let locationDetails = object["locationDetails"]?.objectValue
        let labels = [
            location?.string("city"),
            location?.string("region") ?? locationDetails?.string("region"),
            location?.string("country")
        ].compactMap { $0?.nilIfEmpty }
        if labels.isEmpty == false {
            return labels.joined(separator: ", ")
        }
        return location?.string("address")
            ?? locationDetails?.string("district")
            ?? location?.string("type")?.capitalized
            ?? "Location not specified"
    }

    private func skills(from object: [String: JSONValue]) -> [String] {
        (object["skills"]?.arrayValue ?? []).compactMap { skill in
            if let text = skill.stringValue { return text.nilIfEmpty }
            if let value = skill.objectValue?.string("name") ?? skill.objectValue?.string("label") ?? skill.objectValue?.string("type") {
                return value.nilIfEmpty
            }
            return nil
        }
    }

    private func formatBudgetLabel(amount: Double, currency: String, paymentType: String) -> String {
        let numberText: String
        if amount.truncatingRemainder(dividingBy: 1) == 0 {
            numberText = String(Int(amount))
        } else {
            numberText = String(format: "%.2f", amount)
        }
        let suffix = paymentType.lowercased() == "hourly" ? "/hr" : ""
        return "\(currency) \(numberText)\(suffix)"
    }

    private func parseAIReasoning(from object: [String: JSONValue]) -> String? {
        if let inlineReasoning = object.string("aiReasoning")?.trimmingCharacters(in: .whitespacesAndNewlines), inlineReasoning.isEmpty == false {
            return inlineReasoning
        }

        return object["aiReasons"]?.arrayValue?
            .compactMap { $0.stringValue?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .first(where: { $0.isEmpty == false })
    }

    private func fetchGeneralRecommendations(limit: Int) async -> [JobSummary] {
        do {
            let response = try await apiClient.send(
                path: "jobs/recommendations",
                method: .get,
                queryItems: [
                    URLQueryItem(name: "page", value: "1"),
                    URLQueryItem(name: "limit", value: String(limit)),
                ],
                requiresAuth: true,
                responseType: JobsRawEnvelope.self
            )
            return parseJobsPage(response, forcedSaved: false, strictJobQuality: true).jobs
        } catch {
            return []
        }
    }

    private func buildProfileIncompleteMessage(serverMessage: String?, hasGeneralRecommendations: Bool) -> String {
        let baseMessage = serverMessage?.trimmingCharacters(in: .whitespacesAndNewlines).nilIfEmpty
            ?? "Complete your profile to unlock personalized job matches."
        if hasGeneralRecommendations {
            return "\(baseMessage) Showing general recommendations while you complete your profile."
        }
        return baseMessage
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
