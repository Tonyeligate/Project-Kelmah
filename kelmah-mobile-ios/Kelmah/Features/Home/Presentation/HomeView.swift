import SwiftUI

struct HomeView: View {
    let onBrowseJobs: () -> Void

    private let gatewayOrigin = APIEnvironment.current.gatewayOrigin.absoluteString

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Kelmah Mobile")
                        .font(.largeTitle.bold())
                    Text("Fast national job discovery, secure session recovery, and a single API gateway contract for iPhone and iPad.")
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Jobs Marketplace Ready")
                        .font(.headline)
                    Text("Browse live jobs, save high-value opportunities, and submit applications through the Kelmah API gateway.")
                    Button(action: onBrowseJobs) {
                        Text("Browse Jobs")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(KelmahTheme.accent)
                }
                .padding()
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                ForEach([
                    "Single endpoint architecture: iOS derives all API and realtime routes from one gateway origin: \(gatewayOrigin).",
                    "Professional worker journey: discover, review, save, and apply with resilient session refresh.",
                    "Production-focused shell: SwiftUI navigation, Keychain-backed storage, and hardened API recovery already wired."
                ], id: \.self) { item in
                    Text(item)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                }
            }
            .padding(20)
        }
        .background(KelmahTheme.background.ignoresSafeArea())
    }
}
