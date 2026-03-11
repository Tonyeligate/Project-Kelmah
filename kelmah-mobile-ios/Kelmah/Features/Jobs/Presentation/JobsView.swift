import SwiftUI

struct JobsView: View {
    @ObservedObject var viewModel: JobsViewModel
    let userRole: KelmahUserRole
    var pendingJobId: String? = nil
    var onHandledPendingJob: (() -> Void)? = nil
    var onMessageHirer: ((String, String?) async -> Void)? = nil
    @State private var path: [JobsRoute] = []

    private var isWorker: Bool {
        userRole == .worker
    }

    var body: some View {
        NavigationStack(path: $path) {
            List {
                Section {
                    Picker("Feed", selection: Binding(
                        get: { viewModel.activeFeed },
                        set: { newValue in
                            Task { await viewModel.switchFeed(newValue) }
                        }
                    )) {
                        ForEach(JobsFeed.allCases, id: \.self) { feed in
                            Text(feedTitle(for: feed)).tag(feed)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                if isWorker {
                    Section {
                        MessageBannerView(
                            message: "Find work. Open a job. Save it, or tap Apply Now.",
                            tint: KelmahTheme.accent.opacity(0.12)
                        )
                    }
                } else {
                    Section {
                        MessageBannerView(
                            message: "Open your jobs. Review details. Save important ones.",
                            tint: KelmahTheme.accent.opacity(0.12)
                        )
                    }
                }

                if isWorker, viewModel.activeFeed == .discover {
                    Section("Quick Search") {
                        TextField(isWorker ? "Type job name" : "Search jobs", text: $viewModel.filters.search)
                        TextField(isWorker ? "Town or area" : "Location", text: $viewModel.filters.location)

                        Menu {
                            ForEach(viewModel.categories) { category in
                                Button(category.name) {
                                    viewModel.filters.category = category.name
                                }
                            }
                        } label: {
                            HStack {
                                Text(isWorker ? "Job type" : "Category")
                                Spacer()
                                Text(viewModel.filters.category)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Menu {
                            ForEach(JobSortOption.allCases) { option in
                                Button(option.label) {
                                    viewModel.filters.sort = option
                                }
                            }
                        } label: {
                            HStack {
                                Text(isWorker ? "Show first" : "Sort")
                                Spacer()
                                Text(viewModel.filters.sort.label)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Button("Show Jobs") {
                            Task { await viewModel.refreshJobs() }
                        }
                    }
                }

                if let message = viewModel.errorMessage {
                    Section {
                        MessageBannerView(message: message, tint: .red.opacity(0.12))
                    }
                }

                if let message = viewModel.infoMessage {
                    Section {
                        MessageBannerView(message: message, tint: KelmahTheme.accent.opacity(0.18))
                    }
                }

                Section(viewModel.activeFeed == .saved ? (isWorker ? "Saved Jobs" : "Saved Market Listings") : (isWorker ? "Open Jobs" : "Live Market Listings")) {
                    if viewModel.isLoading && viewModel.displayedJobs.isEmpty {
                        ProgressView(isWorker ? "Finding jobs..." : "Loading jobs...")
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else if viewModel.displayedJobs.isEmpty {
                        ContentUnavailableView(
                            viewModel.activeFeed == .saved ? (isWorker ? "No saved jobs" : "No saved jobs yet") : (isWorker ? "No jobs found" : "No jobs yet"),
                            systemImage: "briefcase",
                            description: Text(viewModel.activeFeed == .saved ? (isWorker ? "Jobs you save will stay here." : "Saved jobs stay here so you can reopen them fast.") : (isWorker ? "Try fewer filters or tap refresh." : "Your newest hiring posts will show here."))
                        )
                    } else {
                        ForEach(viewModel.displayedJobs) { job in
                            JobCardView(
                                userRole: userRole,
                                job: job,
                                onOpen: { path.append(.detail(job.id)) },
                                onToggleSave: {
                                    Task { await viewModel.toggleSaved(jobId: job.id, shouldSave: job.isSaved == false) }
                                },
                                onApply: { path.append(.apply(job.id)) }
                            )
                            .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
                            .listRowBackground(Color.clear)
                        }

                        if viewModel.activeFeed == .discover, viewModel.currentPage < viewModel.totalPages {
                            Button {
                                Task { await viewModel.loadMoreJobs() }
                            } label: {
                                if viewModel.isLoadingMore {
                                    ProgressView()
                                        .frame(maxWidth: .infinity)
                                } else {
                                    Text(isWorker ? "Show More Jobs" : "Show More")
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(KelmahTheme.background)
            .navigationTitle(isWorker ? "Find Work" : "Your Jobs")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            if viewModel.activeFeed == .saved {
                                await viewModel.loadSavedJobs()
                            } else {
                                await viewModel.refreshJobs()
                            }
                        }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel("Refresh jobs")
                }
            }
            .refreshable {
                if viewModel.activeFeed == .saved {
                    await viewModel.loadSavedJobs()
                } else {
                    await viewModel.refreshJobs()
                }
            }
            .task(id: userRole) {
                await viewModel.bootstrap(for: userRole)
            }
            .task(id: pendingJobId) {
                if let pendingJobId, pendingJobId.isEmpty == false {
                    path = [.detail(pendingJobId)]
                    onHandledPendingJob?()
                }
            }
            .navigationDestination(for: JobsRoute.self) { route in
                switch route {
                case let .detail(jobId):
                    JobDetailView(viewModel: viewModel, jobId: jobId, userRole: userRole, onApply: { selectedJobId in
                        path.append(.apply(selectedJobId))
                    }, onMessageHirer: onMessageHirer)
                case let .apply(jobId):
                    JobApplicationView(viewModel: viewModel, jobId: jobId, userRole: userRole) {
                        if path.isEmpty == false {
                            path.removeLast()
                        }
                    }
                }
            }
        }
    }

    private func feedTitle(for feed: JobsFeed) -> String {
        switch (feed, userRole) {
        case (.discover, .worker):
            return "Find"
        case (.discover, .hirer):
            return "Jobs"
        case (.saved, .worker):
            return "Saved"
        case (.saved, .hirer):
            return "Saved"
        }
    }
}

private struct JobCardView: View {
    let userRole: KelmahUserRole
    let job: JobSummary
    let onOpen: () -> Void
    let onToggleSave: () -> Void
    let onApply: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(job.title)
                        .font(.headline)
                        .lineLimit(2)
                    Text(job.employerName)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Button(action: onToggleSave) {
                    Label(job.isSaved ? "Saved" : "Save", systemImage: job.isSaved ? "bookmark.fill" : "bookmark")
                }
                .buttonStyle(.bordered)
            }

            Text(job.description)
                .font(.body)
                .foregroundStyle(.secondary)
                .lineLimit(3)
            Text(job.category)
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(KelmahTheme.accent.opacity(0.14))
                .clipShape(Capsule())
            Text(job.locationLabel)
                .font(.footnote)
                .foregroundStyle(.secondary)
            Text(job.budgetLabel)
                .font(.headline)
                .foregroundStyle(KelmahTheme.accent)

            let meta = [
                RelativeTimeFormatter.relativeOrFallback(job.postedAt),
                job.isUrgent ? "Urgent" : nil,
            ].compactMap { $0 }
            if meta.isEmpty == false {
                Text(meta.joined(separator: " • "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 10) {
                Button("Open Job", action: onOpen)
                    .buttonStyle(.bordered)
                if userRole == .worker {
                    Button("Apply Now", action: onApply)
                        .buttonStyle(.borderedProminent)
                        .tint(KelmahTheme.accent)
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(KelmahTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .contentShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct MessageBannerView: View {
    let message: String
    let tint: Color

    var body: some View {
        Text(message)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
            .background(tint)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
