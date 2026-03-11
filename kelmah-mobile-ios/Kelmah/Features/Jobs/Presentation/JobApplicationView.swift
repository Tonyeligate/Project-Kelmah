import SwiftUI

struct JobApplicationView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: JobsViewModel
    let jobId: String
    let userRole: KelmahUserRole
    let onSubmitted: () -> Void

    @State private var proposedRate = ""
    @State private var estimatedDuration = ""
    @State private var coverLetter = ""

    var body: some View {
        Group {
            if userRole == .hirer {
                ContentUnavailableView(
                    "Worker-only flow",
                    systemImage: "person.crop.circle.badge.exclamationmark",
                    description: Text("Applications are only available for worker accounts. Hirer accounts stay in research and hiring coordination mode inside this shared app shell.")
                )
                .toolbar {
                    ToolbarItem(placement: .bottomBar) {
                        Button("Back to Hiring Market") {
                            dismiss()
                        }
                    }
                }
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(viewModel.jobTitle(for: jobId))
                            .font(.title2.bold())
                        Text("Share your price, time, and a short message.")
                            .foregroundStyle(.secondary)
                        Text("Write simple words about the work you can do.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        VStack(spacing: 12) {
                            let currency = viewModel.jobDetail(for: jobId)?.summary.currency ?? "GHS"
                            TextField("Your price (\(currency))", text: $proposedRate)
                                .keyboardType(.decimalPad)
                            TextField("Time to finish", text: $estimatedDuration)
                            TextField("Short message to hirer", text: $coverLetter, axis: .vertical)
                                .lineLimit(8, reservesSpace: true)
                        }
                        .textFieldStyle(.roundedBorder)
                        .disabled(viewModel.isSubmittingApplication)

                        Button {
                            Task {
                                let didSubmit = await viewModel.submitApplication(
                                    jobId: jobId,
                                    proposedRate: proposedRate,
                                    coverLetter: coverLetter,
                                    estimatedDuration: estimatedDuration
                                )
                                if didSubmit {
                                    onSubmitted()
                                }
                            }
                        } label: {
                            if viewModel.isSubmittingApplication {
                                HStack(spacing: 8) {
                                    ProgressView()
                                    Text("Sending...")
                                }
                                .frame(maxWidth: .infinity)
                            } else {
                                Text("Send Application")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(KelmahTheme.accent)
                        .disabled(viewModel.isSubmittingApplication)
                    }
                    .padding(20)
                }
                .scrollDismissesKeyboard(.interactively)
                .background(KelmahTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle(userRole == .hirer ? "Hiring Mode" : "Apply Now")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: jobId) {
            guard userRole == .worker else { return }
            await viewModel.loadJobDetail(jobId: jobId)
        }
    }
}
