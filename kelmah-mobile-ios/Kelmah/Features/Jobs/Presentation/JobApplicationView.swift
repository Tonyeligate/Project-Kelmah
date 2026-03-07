import SwiftUI

struct JobApplicationView: View {
    @ObservedObject var viewModel: JobsViewModel
    let jobId: String
    let onSubmitted: () -> Void

    @State private var proposedRate = ""
    @State private var estimatedDuration = ""
    @State private var coverLetter = ""

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(viewModel.selectedJob?.summary.id == jobId ? (viewModel.selectedJob?.summary.title ?? "Kelmah Job") : "Kelmah Job")
                    .font(.title2.bold())
                Text("Submit a strong, professional application through the Kelmah API Gateway.")
                    .foregroundStyle(.secondary)

                VStack(spacing: 12) {
                    TextField("Proposed rate (GHS)", text: $proposedRate)
                        .keyboardType(.decimalPad)
                    TextField("Estimated duration", text: $estimatedDuration)
                    TextField("Cover letter", text: $coverLetter, axis: .vertical)
                        .lineLimit(8, reservesSpace: true)
                }
                .textFieldStyle(.roundedBorder)

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
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Submit Application")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(KelmahTheme.accent)
                .disabled(viewModel.isSubmittingApplication)
            }
            .padding(20)
        }
        .background(KelmahTheme.background.ignoresSafeArea())
        .navigationTitle("Apply")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: jobId) {
            await viewModel.loadJobDetail(jobId: jobId)
        }
    }
}
