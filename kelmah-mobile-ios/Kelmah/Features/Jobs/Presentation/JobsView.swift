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

    private var urgentCount: Int {
        viewModel.displayedJobs.filter(\.isUrgent).count
    }

    private var fitCount: Int {
        viewModel.displayedJobs.filter { ($0.matchScore ?? 0) >= 80 }.count
    }

    private var headerStats: [KelmahHeroStat] {
        [
            KelmahHeroStat(
                label: viewModel.activeFeed == .saved ? "Saved" : (isWorker ? "Open jobs" : "Live jobs"),
                value: "\(viewModel.displayedJobs.count)",
                tint: KelmahTheme.cyan
            ),
            KelmahHeroStat(
                label: "Urgent",
                value: "\(urgentCount)",
                tint: KelmahTheme.danger
            ),
            KelmahHeroStat(
                label: isWorker ? "High fit" : "Bookmarked",
                value: "\(isWorker ? fitCount : viewModel.savedJobs.count)",
                tint: KelmahTheme.sun
            ),
        ]
    }

    private var headerChips: [String] {
        [
            "Page \(viewModel.currentPage) of \(max(viewModel.totalPages, 1))",
            "Total \(viewModel.totalItems)",
            "Sort: \(viewModel.filters.sort.label)",
        ]
    }

    var body: some View {
        NavigationStack(path: $path) {
            KelmahPremiumBackground {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        KelmahCommandDeck(
                            eyebrow: isWorker ? "WORK MARKET" : "HIRING MARKET",
                            title: isWorker ? "Find high-fit work fast" : "Manage your hiring pipeline",
                            subtitle: isWorker
                                ? "Filter by trade, location, urgency, and fit score."
                                : "Track active listings and move quickly from review to hire.",
                            stats: headerStats,
                            chips: headerChips
                        ) {
                            HStack(spacing: 10) {
                                Button {
                                    Task {
                                        if viewModel.activeFeed == .saved {
                                            await viewModel.loadSavedJobs()
                                        } else {
                                            await viewModel.refreshJobs()
                                        }
                                    }
                                } label: {
                                    Text("Refresh")
                                        .fontWeight(.bold)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 48)
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(KelmahTheme.sun)
                                .foregroundStyle(Color.black)

                                Button {
                                    Task {
                                        await viewModel.switchFeed(viewModel.activeFeed == .discover ? .saved : .discover)
                                    }
                                } label: {
                                    Text(viewModel.activeFeed == .saved ? "Open Live Feed" : "Open Saved Feed")
                                        .fontWeight(.semibold)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 46)
                                }
                                .buttonStyle(.bordered)
                                .tint(KelmahTheme.cyan)
                            }
                            .controlSize(.large)
                        }

                        KelmahPanel {
                            VStack(alignment: .leading, spacing: 10) {
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

                                KelmahBannerMessage(
                                    message: isWorker
                                        ? "Open a job, save it, or apply in one tap."
                                        : "Open your jobs and review live hiring activity.",
                                    tint: KelmahTheme.cyan
                                )
                            }
                        }

                        if let message = viewModel.errorMessage {
                            KelmahBannerMessage(message: message, tint: KelmahTheme.danger)
                        }

                        if let message = viewModel.infoMessage {
                            KelmahBannerMessage(message: message, tint: KelmahTheme.success)
                        }

                        if isWorker, viewModel.activeFeed == .discover {
                            KelmahPanel {
                                VStack(alignment: .leading, spacing: 10) {
                                    KelmahSectionHeader(
                                        title: "Quick search",
                                        subtitle: "Tune location, trade, and ranking",
                                        actionLabel: "Apply",
                                        onAction: {
                                            Task { await viewModel.refreshJobs() }
                                        }
                                    )

                                    TextField("Type job name", text: $viewModel.filters.search)
                                        .textInputAutocapitalization(.never)
                                        .autocorrectionDisabled()
                                        .textFieldStyle(.roundedBorder)

                                    TextField("Town or area", text: $viewModel.filters.location)
                                        .textInputAutocapitalization(.never)
                                        .autocorrectionDisabled()
                                        .textFieldStyle(.roundedBorder)

                                    Menu {
                                        ForEach(viewModel.categories) { category in
                                            Button(category.name) {
                                                viewModel.filters.category = category.name
                                            }
                                        }
                                    } label: {
                                        HStack {
                                            Text("Category")
                                            Spacer()
                                            Text(viewModel.filters.category)
                                                .foregroundStyle(KelmahTheme.textMuted)
                                        }
                                        .padding(11)
                                        .background(KelmahTheme.card)
                                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                    }

                                    Menu {
                                        ForEach(JobSortOption.allCases) { option in
                                            Button(option.label) {
                                                viewModel.filters.sort = option
                                            }
                                        }
                                    } label: {
                                        HStack {
                                            Text("Sort")
                                            Spacer()
                                            Text(viewModel.filters.sort.label)
                                                .foregroundStyle(KelmahTheme.textMuted)
                                        }
                                        .padding(11)
                                        .background(KelmahTheme.card)
                                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                    }

                                    Button {
                                        Task { await viewModel.refreshJobs() }
                                    } label: {
                                        Text("Show Jobs")
                                            .fontWeight(.bold)
                                            .frame(maxWidth: .infinity)
                                            .frame(minHeight: 48)
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(KelmahTheme.sun)
                                    .foregroundStyle(Color.black)
                                }
                            }
                        }

                        KelmahPanel {
                            KelmahSectionHeader(
                                title: viewModel.activeFeed == .saved
                                    ? (isWorker ? "Saved jobs" : "Saved listings")
                                    : (isWorker ? "Open jobs" : "Live market listings"),
                                subtitle: "Action-first cards tuned for quick scanning"
                            )
                        }

                        if viewModel.isLoading && viewModel.displayedJobs.isEmpty {
                            KelmahPanel {
                                HStack(spacing: 10) {
                                    ProgressView()
                                        .tint(KelmahTheme.sun)
                                    Text(isWorker ? "Finding jobs..." : "Loading jobs...")
                                        .foregroundStyle(KelmahTheme.textMuted)
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        } else if viewModel.displayedJobs.isEmpty {
                            KelmahBannerMessage(
                                message: viewModel.activeFeed == .saved
                                    ? (isWorker ? "No saved jobs yet. Save jobs to keep them here." : "No saved listings yet.")
                                    : (isWorker ? "No jobs found. Try fewer filters." : "No jobs yet. New listings appear here."),
                                tint: KelmahTheme.cyan
                            )
                        } else {
                            ForEach(viewModel.displayedJobs) { job in
                                JobCardView(
                                    userRole: userRole,
                                    job: job,
                                    onOpen: { path.append(.detail(job.id)) },
                                    onToggleSave: {
                                        Task {
                                            await viewModel.toggleSaved(jobId: job.id, shouldSave: job.isSaved == false)
                                        }
                                    },
                                    onApply: { path.append(.apply(job.id)) }
                                )
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
                                            .fontWeight(.semibold)
                                            .frame(maxWidth: .infinity)
                                    }
                                }
                                .buttonStyle(.bordered)
                                .tint(KelmahTheme.cyan)
                            }
                        }
                    }
                        .padding(.horizontal, 16)
                        .padding(.top, 18)
                    .padding(.bottom, 20)
                }
                .scrollIndicators(.hidden)
            }
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
        Button(action: onOpen) {
            KelmahPanel {
                VStack(alignment: .leading, spacing: 11) {
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(job.title)
                                .font(.headline.weight(.bold))
                                .foregroundStyle(KelmahTheme.textPrimary)
                                .lineLimit(2)
                                .multilineTextAlignment(.leading)
                            Text(job.employerName)
                                .font(.subheadline)
                                .foregroundStyle(KelmahTheme.textMuted)
                        }
                        Spacer(minLength: 0)
                        if let matchScore = job.matchScore, userRole == .worker {
                            KelmahSignalChip(
                                text: "\(formatMatchScore(matchScore))% fit",
                                accent: KelmahTheme.success
                            )
                        }
                    }

                    Text(job.description)
                        .font(.subheadline)
                        .foregroundStyle(KelmahTheme.textMuted)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 8) {
                        KelmahSignalChip(text: job.category, accent: KelmahTheme.cyan)
                        if job.isUrgent {
                            KelmahSignalChip(text: "Urgent", accent: KelmahTheme.danger)
                        }
                        if job.isSaved {
                            KelmahSignalChip(text: "Saved", accent: KelmahTheme.sun)
                        }
                    }

                    Text(job.locationLabel)
                        .font(.footnote)
                        .foregroundStyle(KelmahTheme.textMuted)

                    Text(job.budgetLabel)
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(KelmahTheme.sun)

                    let meta = [
                        RelativeTimeFormatter.relativeOrFallback(job.postedAt),
                        job.isUrgent ? "Urgent" : nil,
                    ].compactMap { $0 }
                    if meta.isEmpty == false {
                        Text(meta.joined(separator: " | "))
                            .font(.caption)
                            .foregroundStyle(KelmahTheme.textMuted)
                    }

                    HStack(spacing: 10) {
                        Button(action: onToggleSave) {
                            Label(job.isSaved ? "Saved" : "Save", systemImage: job.isSaved ? "bookmark.fill" : "bookmark")
                                .frame(maxWidth: .infinity)
                                .frame(minHeight: 46)
                        }
                        .buttonStyle(.bordered)
                        .tint(KelmahTheme.cyan)

                        if userRole == .worker {
                            Button(action: onApply) {
                                Text("Apply")
                                    .fontWeight(.bold)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 46)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(KelmahTheme.sun)
                            .foregroundStyle(Color.black)
                        }
                    }

                    Text("Tap card to open full details")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(KelmahTheme.sun)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .contentShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

private func formatMatchScore(_ score: Double) -> String {
    if score.truncatingRemainder(dividingBy: 1) == 0 {
        return String(Int(score))
    }
    return String(format: "%.1f", score)
}
