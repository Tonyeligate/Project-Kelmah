import Foundation

@MainActor
final class JobsViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var isRefreshing = false
    @Published var isLoadingMore = false
    @Published var discoverJobs: [JobSummary] = []
    @Published var savedJobs: [JobSummary] = []
    @Published var categories: [JobCategory] = [JobCategory(id: "all", name: "All", description: "")]
    @Published var filters = JobFilters()
    @Published var activeFeed: JobsFeed = .discover
    @Published var currentPage = 1
    @Published var totalPages = 1
    @Published var totalItems = 0
    @Published var selectedJob: JobDetail?
    @Published var isDetailLoading = false
    @Published var isSubmittingApplication = false
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
            var merged: [JobSummary] = []
            for job in discoverJobs + page.jobs where merged.contains(where: { $0.id == job.id }) == false {
                merged.append(job)
            }
            discoverJobs = merged
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
        if selectedJob?.summary.id == jobId { return }
        isDetailLoading = true
        errorMessage = nil
        infoMessage = nil
        defer { isDetailLoading = false }

        do {
            selectedJob = try await repository.getJobDetail(jobId: jobId)
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
            if shouldSave {
                if let saved = discoverJobs.first(where: { $0.id == jobId }) ?? selectedJob?.summary.withSaved(true) {
                    savedJobs = Array(([saved] + savedJobs).reduce(into: [String: JobSummary]()) { result, item in
                        result[item.id] = item
                    }.values)
                }
            } else {
                savedJobs.removeAll { $0.id == jobId }
            }
            if selectedJob?.summary.id == jobId, let selectedJob {
                self.selectedJob = selectedJob.withSaved(shouldSave)
            }
            infoMessage = shouldSave ? "Job saved" : "Job removed from saved jobs"
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
            errorMessage = "Enter a valid proposed rate"
            return false
        }
        guard coverLetter.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            errorMessage = "Cover letter is required"
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
