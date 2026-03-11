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
                    description: Text("Only worker accounts can apply. Hirer accounts use this app to review the market and manage hiring.")
                )
                .toolbar {
                    ToolbarItem(placement: .bottomBar) {
                        Button("Back to Market") {
                            dismiss()
                        }
                    }
                }
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(viewModel.jobTitle(for: jobId))
                            .font(.title2.bold())
                        Text("Add your price, time, and short message.")
                            .foregroundStyle(.secondary)
                        Text("Write simple words about the work you can do.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)

                        VStack(spacing: 12) {
                            let currency = viewModel.jobDetail(for: jobId)?.summary.currency ?? "GHS"
                            TextField("Your price (\(currency))", text: $proposedRate)
                                .keyboardType(.decimalPad)
                            TextField("How long it will take", text: $estimatedDuration)
                            TextField("Short message", text: $coverLetter, axis: .vertical)
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
                                    Text("Sending")
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
        .navigationTitle("Apply Now")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: jobId) {
            guard userRole == .worker else { return }
            await viewModel.loadJobDetail(jobId: jobId)
        }
    }
}
