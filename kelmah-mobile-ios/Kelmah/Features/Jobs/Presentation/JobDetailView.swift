import SwiftUI

struct JobDetailView: View {
    @ObservedObject var viewModel: JobsViewModel
    let jobId: String
    let userRole: KelmahUserRole
    let onApply: (String) -> Void

    var body: some View {
        Group {
            if viewModel.isDetailLoading(for: jobId) {
                ProgressView("Opening job...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(KelmahTheme.background.ignoresSafeArea())
            } else if let job = viewModel.jobDetail(for: jobId) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 10) {
                            Text(job.summary.title)
                                .font(.title2.bold())
                            Text(job.summary.employerName)
                                .font(.headline)
                            Text(job.summary.locationLabel)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Text(job.summary.budgetLabel)
                                .font(.headline)
                                .foregroundStyle(KelmahTheme.accent)
                            if let postedAt = RelativeTimeFormatter.relativeOrFallback(job.summary.postedAt) {
                                Text("Posted \(postedAt)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            if job.summary.isUrgent {
                                Text("Urgent")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(KelmahTheme.accent)
                            }
                            Text(job.fullDescription.isEmpty ? job.summary.description : job.fullDescription)
                                .font(.body)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(KelmahTheme.card)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                        VStack(alignment: .leading, spacing: 10) {
                            Text("What you need")
                                .font(.headline)
                            if job.requirements.isEmpty {
                                Text("No extra requirements listed.")
                                    .foregroundStyle(.secondary)
                            } else {
                                ForEach(job.requirements, id: \.self) { requirement in
                                    Text("• \(requirement)")
                                }
                            }
                            Divider()
                            Text("\(job.proposalCount) people applied")
                            Text("\(job.viewCount) people viewed")
                            if let deadline = job.deadline {
                                Text("Apply by: \(RelativeTimeFormatter.deadlineLabel(deadline) ?? deadline)")
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(KelmahTheme.card)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                        HStack(spacing: 12) {
                            Button {
                                Task {
                                    await viewModel.toggleSaved(jobId: job.summary.id, shouldSave: job.summary.isSaved == false)
                                }
                            } label: {
                                Label(job.summary.isSaved ? "Saved Job" : "Save Job", systemImage: job.summary.isSaved ? "bookmark.fill" : "bookmark")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)

                            if userRole == .worker {
                                Button {
                                    onApply(job.summary.id)
                                } label: {
                                    Label("Apply Now", systemImage: "paperplane.fill")
                                        .frame(maxWidth: .infinity)
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(KelmahTheme.accent)
                            }
                        }

                        if userRole == .worker {
                            Text("Read the job. If it fits you, tap Apply Now.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding()
                                .background(KelmahTheme.card)
                                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        } else {
                            Text("Hirer mode is for market review. Workers are the ones who can apply.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding()
                                .background(KelmahTheme.card)
                                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        }
                    }
                    .padding(20)
                }
                .background(KelmahTheme.background.ignoresSafeArea())
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text(viewModel.errorMessage ?? "Could not load job details")
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                    Button {
                        Task { await viewModel.loadJobDetail(jobId: jobId) }
                    } label: {
                        Label("Try again", systemImage: "arrow.clockwise")
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(KelmahTheme.accent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(KelmahTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle("Job Details")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: jobId) {
            await viewModel.loadJobDetail(jobId: jobId)
        }
    }
}
