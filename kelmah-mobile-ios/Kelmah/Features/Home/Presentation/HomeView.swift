import SwiftUI

struct HomeView: View {
    let currentUser: SessionUser?
    let onBrowseJobs: () -> Void

    private let gatewayOrigin = APIEnvironment.current.gatewayOrigin.absoluteString

    private var userRole: KelmahUserRole {
        currentUser?.kelmahUserRole ?? .worker
    }

    private var displayName: String {
        currentUser?.displayName ?? "Kelmah \(userRole.title)"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(displayName)
                        .font(.largeTitle.bold())
                    Text(userRole == .hirer ? "Lead hiring operations with a dedicated hirer experience inside the same secure Kelmah iOS app." : "Fast national job discovery, secure session recovery, and a single API gateway contract for iPhone and iPad.")
                        .foregroundStyle(.secondary)
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text(userRole == .hirer ? "Hirer workspace ready" : "Worker marketplace ready")
                        .font(.headline)
                    Text(userRole == .hirer ? "Review live demand, benchmark rates, and keep your hiring conversations, alerts, and profile activity aligned through one gateway-backed mobile shell." : "Browse live jobs, save high-value opportunities, and submit applications through the Kelmah API gateway.")
                    Button(action: onBrowseJobs) {
                        Text(userRole == .hirer ? "Open Hiring Market" : "Browse Jobs")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(KelmahTheme.accent)
                }
                .padding()
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                ForEach(userRole == .hirer ? [
                    "Single endpoint architecture: iOS derives all API and realtime routes from one gateway origin: \(gatewayOrigin).",
                    "Hirer journey: review market demand, coordinate with workers in messages, and monitor alerts without switching apps.",
                    "Future split ready: the signed-in shell now resolves role-specific copy and flows from a shared role abstraction instead of hard-coded worker text."
                ] : [
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
