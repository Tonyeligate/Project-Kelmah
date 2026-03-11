import Foundation

@MainActor
final class JobsViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var isRefreshing = false
    @Published var isLoadingMore = false
    @Published var isLoadingHomeFeed = false
    @Published var discoverJobs: [JobSummary] = []
    @Published var savedJobs: [JobSummary] = []
    @Published var recommendedJobs: [JobSummary] = []
    @Published var hirerJobs: [JobSummary] = []
    @Published var categories: [JobCategory] = [JobCategory(id: "all", name: "All", description: "")]
    @Published var filters = JobFilters()
    @Published var activeFeed: JobsFeed = .discover
    @Published var currentPage = 1
    @Published var totalPages = 1
    @Published var totalItems = 0
    @Published private(set) var jobDetailsById: [String: JobDetail] = [:]
    @Published private(set) var loadingDetailJobIds: Set<String> = []
    @Published var isSubmittingApplication = false
    @Published var recommendationState: RecommendationFeedState = .idle
    @Published var recommendationContextMessage: String?
    @Published var homeErrorMessage: String?
    @Published var errorMessage: String?
    @Published var infoMessage: String?

    private let repository: JobsRepository
    private var hasBootstrapped = false

    init(repository: JobsRepository) {
        self.repository = repository
    }

    var displayedJobs: [JobSummary] {
        activeFeed == .discover ? discoverJobs : savedJobs
    }

    func jobDetail(for jobId: String) -> JobDetail? {
        jobDetailsById[jobId]
    }

    func isDetailLoading(for jobId: String) -> Bool {
        loadingDetailJobIds.contains(jobId)
    }

    func jobTitle(for jobId: String) -> String {
        jobSummary(for: jobId)?.title ?? "Kelmah Job"
    }

    func bootstrap() async {
        guard hasBootstrapped == false else { return }
        hasBootstrapped = true
        await loadCategories()
        await refreshJobs()
    }

    func switchFeed(_ feed: JobsFeed) async {
        activeFeed = feed
        errorMessage = nil
        infoMessage = nil
        if feed == .saved, savedJobs.isEmpty {
            await loadSavedJobs()
        }
    }

    func refreshHome(for role: KelmahUserRole) async {
        isLoadingHomeFeed = true
        homeErrorMessage = nil
        defer { isLoadingHomeFeed = false }

        switch role {
        case .worker:
            do {
                let recommendationFeed = try await repository.getRecommendedJobs(limit: 6)
                recommendedJobs = recommendationFeed.jobs
                recommendationState = recommendationFeed.state
                recommendationContextMessage = recommendationFeed.contextMessage
            } catch {
                var fallbackFilters = JobFilters()
                fallbackFilters.sort = .urgent
                do {
                    recommendedJobs = try await repository.getJobs(filters: fallbackFilters, page: 1, limit: 6).jobs
                    recommendationState = .fallback
                    recommendationContextMessage = "Showing urgent jobs for now."
                } catch {
                    recommendedJobs = []
                    recommendationState = .failed
                    recommendationContextMessage = "Job matches are not ready now. Tap Find Work."
                    homeErrorMessage = recommendationContextMessage
                }
            }

            if savedJobs.isEmpty {
                do {
                    savedJobs = try await repository.getSavedJobs(limit: 6).jobs
                } catch {
                    if homeErrorMessage == nil {
                        homeErrorMessage = error.localizedDescription
                    }
                }
            }

        case .hirer:
            recommendationState = .idle
            recommendationContextMessage = nil
            do {
                hirerJobs = try await repository.getMyJobs(limit: 6)
            } catch {
                hirerJobs = []
                homeErrorMessage = error.localizedDescription
            }
        }
    }

    func refreshJobs() async {
        isLoading = discoverJobs.isEmpty
        isRefreshing = discoverJobs.isEmpty == false
        errorMessage = nil
        infoMessage = nil
        currentPage = 1

        do {
            let page = try await repository.getJobs(filters: filters, page: 1)
            discoverJobs = page.jobs
            currentPage = page.page
            totalPages = page.totalPages
            totalItems = page.totalItems
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
        isRefreshing = false
    }

    func loadMoreJobs() async {
        guard activeFeed == .discover, isLoadingMore == false, currentPage < totalPages else { return }
        isLoadingMore = true
        defer { isLoadingMore = false }

        do {
            let page = try await repository.getJobs(filters: filters, page: currentPage + 1)
            discoverJobs = mergeJobsPreservingLatest(discoverJobs + page.jobs)
            currentPage = page.page
            totalPages = page.totalPages
            totalItems = page.totalItems
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadSavedJobs() async {
        isLoading = savedJobs.isEmpty
        errorMessage = nil
        do {
            let page = try await repository.getSavedJobs()
            savedJobs = page.jobs
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func loadJobDetail(jobId: String) async {
        if jobDetailsById[jobId] != nil { return }
        setDetailLoading(jobId, isLoading: true)
        errorMessage = nil
        infoMessage = nil
        defer { setDetailLoading(jobId, isLoading: false) }

        do {
            cacheJobDetail(try await repository.getJobDetail(jobId: jobId))
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func toggleSaved(jobId: String, shouldSave: Bool) async {
        do {
            _ = try await repository.toggleSaved(jobId: jobId, shouldSave: shouldSave)
            discoverJobs = discoverJobs.map { job in
                job.id == jobId ? job.withSaved(shouldSave) : job
            }
            recommendedJobs = recommendedJobs.map { job in
                job.id == jobId ? job.withSaved(shouldSave) : job
            }
            hirerJobs = hirerJobs.map { job in
                job.id == jobId ? job.withSaved(shouldSave) : job
            }
            if shouldSave {
                if let saved = discoverJobs.first(where: { $0.id == jobId })
                    ?? recommendedJobs.first(where: { $0.id == jobId })
                    ?? hirerJobs.first(where: { $0.id == jobId })
                    ?? jobDetailsById[jobId]?.summary.withSaved(true) {
                    savedJobs = mergeJobsPreservingLatest([saved] + savedJobs)
                }
            } else {
                savedJobs.removeAll { $0.id == jobId }
            }
            updateCachedJobDetail(jobId: jobId) { $0.withSaved(shouldSave) }
            infoMessage = shouldSave ? "Saved for later" : "Removed from saved jobs"
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func submitApplication(
        jobId: String,
        proposedRate: String,
        coverLetter: String,
        estimatedDuration: String
    ) async -> Bool {
        guard let rate = Double(proposedRate), rate > 0 else {
            errorMessage = "Enter your price"
            return false
        }
        if let jobDetail = jobDetailsById[jobId], jobDetail.summary.budgetAmount > 0, rate > jobDetail.summary.budgetAmount * 2 {
            errorMessage = "Your price is far above the listed budget of \(Int(jobDetail.summary.budgetAmount)) \(jobDetail.summary.currency). Check the amount and try again."
            return false
        }
        guard coverLetter.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            errorMessage = "Write a short message to the hirer"
            return false
        }

        isSubmittingApplication = true
        errorMessage = nil
        infoMessage = nil
        defer { isSubmittingApplication = false }

        do {
            let result = try await repository.applyToJob(
                jobId: jobId,
                request: ApplyToJobRequest(
                    proposedRate: rate,
                    coverLetter: coverLetter.trimmingCharacters(in: .whitespacesAndNewlines),
                    estimatedDuration: estimatedDuration.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : estimatedDuration.trimmingCharacters(in: .whitespacesAndNewlines)
                )
            )
            infoMessage = result.message
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func clearMessages() {
        errorMessage = nil
        infoMessage = nil
    }

    func reset() {
        hasBootstrapped = false
        discoverJobs = []
        savedJobs = []
        recommendedJobs = []
        hirerJobs = []
        jobDetailsById = [:]
        loadingDetailJobIds = []
        errorMessage = nil
    }

    private func loadCategories() async {
        do {
            let remoteCategories = try await repository.getCategories()
            categories = [JobCategory(id: "all", name: "All", description: "")] + remoteCategories
        } catch {
            if categories.isEmpty {
                categories = [JobCategory(id: "all", name: "All", description: "")]
            }
        }
    }

    private func mergeJobsPreservingLatest(_ jobs: [JobSummary]) -> [JobSummary] {
        var orderedIds: [String] = []
        var jobsById: [String: JobSummary] = [:]

        for job in jobs {
            if jobsById[job.id] == nil {
                orderedIds.append(job.id)
            }
            jobsById[job.id] = job
        }

        return orderedIds.compactMap { jobsById[$0] }
    }

    private func jobSummary(for jobId: String) -> JobSummary? {
        jobDetailsById[jobId]?.summary
            ?? discoverJobs.first(where: { $0.id == jobId })
            ?? savedJobs.first(where: { $0.id == jobId })
            ?? recommendedJobs.first(where: { $0.id == jobId })
            ?? hirerJobs.first(where: { $0.id == jobId })
    }

    private func cacheJobDetail(_ detail: JobDetail) {
        var updatedDetails = jobDetailsById
        updatedDetails[detail.summary.id] = detail
        jobDetailsById = updatedDetails
    }

    private func updateCachedJobDetail(jobId: String, transform: (JobDetail) -> JobDetail) {
        guard let existingDetail = jobDetailsById[jobId] else { return }

        var updatedDetails = jobDetailsById
        updatedDetails[jobId] = transform(existingDetail)
        jobDetailsById = updatedDetails
    }

    private func setDetailLoading(_ jobId: String, isLoading: Bool) {
        var updatedLoadingJobIds = loadingDetailJobIds
        if isLoading {
            updatedLoadingJobIds.insert(jobId)
        } else {
            updatedLoadingJobIds.remove(jobId)
        }
        loadingDetailJobIds = updatedLoadingJobIds
    }
}

private extension JobSummary {
    func withSaved(_ saved: Bool) -> JobSummary {
        JobSummary(
            id: id,
            title: title,
            description: description,
            category: category,
            locationLabel: locationLabel,
            budgetLabel: budgetLabel,
            budgetAmount: budgetAmount,
            currency: currency,
            paymentType: paymentType,
            employerName: employerName,
            employerAvatar: employerAvatar,
            skills: skills,
            postedAt: postedAt,
            status: status,
            proposalCount: proposalCount,
            matchScore: matchScore,
            aiReasoning: aiReasoning,
            isVerified: isVerified,
            isUrgent: isUrgent,
            isSaved: saved
        )
    }
}

private extension JobDetail {
    func withSaved(_ saved: Bool) -> JobDetail {
        JobDetail(
            summary: summary.withSaved(saved),
            fullDescription: fullDescription,
            requirements: requirements,
            proposalCount: proposalCount,
            viewCount: viewCount,
            deadline: deadline,
            hirerId: hirerId
        )
    }
}
