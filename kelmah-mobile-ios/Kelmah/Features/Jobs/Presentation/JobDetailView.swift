import SwiftUI

struct JobDetailView: View {
    @ObservedObject var viewModel: JobsViewModel
    let jobId: String
    let onApply: (String) -> Void

    var body: some View {
        Group {
            if viewModel.isDetailLoading || viewModel.selectedJob?.summary.id != jobId {
                ProgressView("Loading job details...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(KelmahTheme.background.ignoresSafeArea())
            } else if let job = viewModel.selectedJob {
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
                            Text(job.fullDescription.isEmpty ? job.summary.description : job.fullDescription)
                                .font(.body)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                        VStack(alignment: .leading, spacing: 10) {
                            Text("Requirements")
                                .font(.headline)
                            if job.requirements.isEmpty {
                                Text("No specific requirements were provided.")
                                    .foregroundStyle(.secondary)
                            } else {
                                ForEach(job.requirements, id: \.self) { requirement in
                                    Text("• \(requirement)")
                                }
                            }
                            Divider()
                            Text("Applications: \(job.proposalCount)")
                            Text("Views: \(job.viewCount)")
                            if let deadline = job.deadline {
                                Text("Deadline: \(deadline)")
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                        HStack(spacing: 12) {
                            Button {
                                Task {
                                    await viewModel.toggleSaved(jobId: job.summary.id, shouldSave: job.summary.isSaved == false)
                                }
                            } label: {
                                Label(job.summary.isSaved ? "Saved" : "Save", systemImage: job.summary.isSaved ? "bookmark.fill" : "bookmark")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)

                            Button {
                                onApply(job.summary.id)
                            } label: {
                                Label("Apply", systemImage: "paperplane.fill")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(KelmahTheme.accent)
                        }
                    }
                    .padding(20)
                }
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
