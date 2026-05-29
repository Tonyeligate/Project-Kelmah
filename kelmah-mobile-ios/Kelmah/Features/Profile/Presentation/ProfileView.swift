import SwiftUI

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var isLoadingProfileSignals = false
    @Published var profileSnapshot: WorkerProfileSnapshot?
    @Published var profileErrorMessage: String?
    @Published var currentPassword = ""
    @Published var newPassword = ""
    @Published var confirmPassword = ""
    @Published var isSaving = false
    @Published var errorMessage: String?
    @Published var infoMessage: String?

    private let authRepository: AuthRepository
    private let profileRepository: ProfileRepository
    private var loadedWorkerID: String?

    init(authRepository: AuthRepository, profileRepository: ProfileRepository) {
        self.authRepository = authRepository
        self.profileRepository = profileRepository
    }

    func bootstrap(user: SessionUser?) async {
        guard let user, user.kelmahUserRole == .worker, let workerID = user.resolvedID else {
            loadedWorkerID = nil
            profileSnapshot = nil
            profileErrorMessage = nil
            isLoadingProfileSignals = false
            return
        }
        guard loadedWorkerID != workerID || profileSnapshot == nil else { return }
        loadedWorkerID = workerID
        await refreshProfileSignals(user: user)
    }

    func refreshProfileSignals(user: SessionUser?) async {
        guard let user, user.kelmahUserRole == .worker, let workerID = user.resolvedID else { return }
        isLoadingProfileSignals = true
        profileErrorMessage = nil
        do {
            profileSnapshot = try await profileRepository.getWorkerProfileSnapshot(workerId: workerID)
        } catch {
            profileSnapshot = nil
            profileErrorMessage = error.localizedDescription
        }
        isLoadingProfileSignals = false
    }

    func changePassword() async -> Bool {
        guard currentPassword.isEmpty == false,
              newPassword.isEmpty == false,
              confirmPassword.isEmpty == false else {
            errorMessage = "Fill in all password boxes"
            return false
        }
        guard PasswordPolicy.isStrong(newPassword) else {
            errorMessage = PasswordPolicy.requirementMessage
            return false
        }
        guard newPassword == confirmPassword else {
            errorMessage = "New passwords do not match"
            return false
        }

        isSaving = true
        errorMessage = nil
        infoMessage = nil
        defer { isSaving = false }

        do {
            infoMessage = try await authRepository.changePassword(currentPassword: currentPassword, newPassword: newPassword)
            currentPassword = ""
            newPassword = ""
            confirmPassword = ""
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }
}

struct ProfileView: View {
    let sessionCoordinator: SessionCoordinator
    let authRepository: AuthRepository
    let profileRepository: ProfileRepository
    let sessionStore: SessionStore
    let onHireNow: () -> Void
    let onMessageWorker: () -> Void

    @StateObject private var viewModel: ProfileViewModel
    @State private var showSignOutAlert = false
    @State private var showSignOutAllAlert = false
    @State private var showPasswordChangedAlert = false

    init(
        sessionCoordinator: SessionCoordinator,
        authRepository: AuthRepository,
        profileRepository: ProfileRepository,
        sessionStore: SessionStore,
        onHireNow: @escaping () -> Void = {},
        onMessageWorker: @escaping () -> Void = {}
    ) {
        self.sessionCoordinator = sessionCoordinator
        self.authRepository = authRepository
        self.profileRepository = profileRepository
        self.sessionStore = sessionStore
        self.onHireNow = onHireNow
        self.onMessageWorker = onMessageWorker
        _viewModel = StateObject(wrappedValue: ProfileViewModel(authRepository: authRepository, profileRepository: profileRepository))
    }

    var body: some View {
        let roleLabel = (sessionStore.currentUser?.role ?? "worker").capitalized
        let isVerified = sessionStore.currentUser?.isEmailVerified == true
        let workerDetailsReady = viewModel.profileSnapshot != nil
        let heroStats = [
            KelmahHeroStat(label: "Role", value: roleLabel, tint: KelmahTheme.cyan),
            KelmahHeroStat(label: "Email", value: isVerified ? "Verified" : "Pending", tint: isVerified ? KelmahTheme.success : KelmahTheme.sun),
            KelmahHeroStat(label: "Worker Data", value: workerDetailsReady ? "Ready" : "Syncing", tint: KelmahTheme.sun),
        ]
        let heroChips = [
            isVerified ? "Identity verified" : "Verify email for full trust",
            "Security controls enabled",
        ]

        KelmahPremiumBackground {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    KelmahCommandDeck(
                        eyebrow: "PROFILE HUB",
                        title: sessionStore.currentUser?.displayName ?? "Kelmah User",
                        subtitle: "Manage identity, reputation, and security from one command center.",
                        stats: heroStats,
                        chips: heroChips
                    ) {
                        HStack(spacing: 10) {
                            Button(role: .destructive) {
                                showSignOutAlert = true
                            } label: {
                                Text("Sign out")
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 46)
                            }
                            .buttonStyle(.bordered)
                            .tint(KelmahTheme.cyan)

                            Button(role: .destructive) {
                                showSignOutAllAlert = true
                            } label: {
                                Text("Sign out all")
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 46)
                            }
                            .buttonStyle(.bordered)
                            .tint(KelmahTheme.danger)
                        }
                        .controlSize(.large)
                    }

                    KelmahPanel {
                        VStack(alignment: .leading, spacing: 8) {
                            KelmahSectionHeader(title: "Account", subtitle: "Identity and verification status")
                            Text(sessionStore.currentUser?.email ?? "No email added")
                                .foregroundStyle(KelmahTheme.textMuted)
                            Text("Role: \(roleLabel)")
                                .foregroundStyle(KelmahTheme.textPrimary)
                            KelmahSignalChip(
                                text: isVerified ? "Email verified" : "Email not verified",
                                accent: isVerified ? KelmahTheme.success : KelmahTheme.sun
                            )
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if sessionStore.currentUser?.kelmahUserRole == .worker {
                        KelmahPanel {
                            VStack(alignment: .leading, spacing: 12) {
                                KelmahSectionHeader(
                                    title: "Your work details",
                                    subtitle: "These details improve your job matching quality"
                                )

                                if viewModel.isLoadingProfileSignals {
                                    HStack {
                                        Spacer()
                                        ProgressView()
                                            .tint(KelmahTheme.sun)
                                        Spacer()
                                    }
                                    .padding(.vertical, 12)
                                } else if let profileErrorMessage = viewModel.profileErrorMessage {
                                    KelmahBannerMessage(
                                        message: profileErrorMessage.isEmpty
                                            ? "We could not load your work details."
                                            : profileErrorMessage,
                                        tint: KelmahTheme.danger
                                    )
                                    Button {
                                        Task { await viewModel.refreshProfileSignals(user: sessionStore.currentUser) }
                                    } label: {
                                        Text("Try again")
                                            .fontWeight(.semibold)
                                            .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(KelmahTheme.sun)
                                    .foregroundStyle(Color.black)
                                } else if let snapshot = viewModel.profileSnapshot {
                                    WorkerProfileSignalsView(
                                        snapshot: snapshot,
                                        onHireNow: onHireNow,
                                        onMessageWorker: onMessageWorker
                                    )
                                } else {
                                    KelmahBannerMessage(
                                        message: "Your work details will show here.",
                                        tint: KelmahTheme.cyan
                                    )
                                }
                            }
                        }
                    }

                    KelmahPanel {
                        VStack(alignment: .leading, spacing: 12) {
                            KelmahSectionHeader(
                                title: "Password",
                                subtitle: "Update your password and keep your account secure"
                            )

                            if let infoMessage = viewModel.infoMessage {
                                KelmahBannerMessage(message: infoMessage, tint: KelmahTheme.success)
                            }

                            if let errorMessage = viewModel.errorMessage {
                                KelmahBannerMessage(message: errorMessage, tint: KelmahTheme.danger)
                            }

                            SecureField("Current password", text: $viewModel.currentPassword)
                                .textContentType(.password)
                                .textFieldStyle(.roundedBorder)
                            SecureField("New password", text: $viewModel.newPassword)
                                .textContentType(.newPassword)
                                .textFieldStyle(.roundedBorder)
                            SecureField("Confirm new password", text: $viewModel.confirmPassword)
                                .textContentType(.newPassword)
                                .textFieldStyle(.roundedBorder)

                            Button {
                                Task {
                                    let changed = await viewModel.changePassword()
                                    if changed {
                                        showPasswordChangedAlert = true
                                    }
                                }
                            } label: {
                                if viewModel.isSaving {
                                    ProgressView()
                                        .tint(.black)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 48)
                                } else {
                                    Text("Change password")
                                        .fontWeight(.bold)
                                        .frame(maxWidth: .infinity)
                                        .frame(minHeight: 48)
                                }
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(KelmahTheme.sun)
                            .foregroundStyle(Color.black)
                            .disabled(viewModel.isSaving)
                        }
                    }

                    KelmahPanel {
                        VStack(alignment: .leading, spacing: 10) {
                            KelmahSectionHeader(title: "Session controls", subtitle: "Protect this device and all linked sessions")

                            Button(role: .destructive) {
                                showSignOutAlert = true
                            } label: {
                                Label("Sign out this device", systemImage: "rectangle.portrait.and.arrow.right")
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 46)
                            }
                            .buttonStyle(.bordered)
                            .tint(KelmahTheme.cyan)

                            Button(role: .destructive) {
                                showSignOutAllAlert = true
                            } label: {
                                Label("Sign out all devices", systemImage: "iphone.and.arrow.forward")
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 46)
                            }
                            .buttonStyle(.bordered)
                            .tint(KelmahTheme.danger)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 18)
                .padding(.bottom, 20)
            }
            .scrollIndicators(.hidden)
        }
        .scrollDismissesKeyboard(.interactively)
        .task(id: sessionStore.currentUser?.resolvedID) {
            await viewModel.bootstrap(user: sessionStore.currentUser)
        }
        .alert("Sign out?", isPresented: $showSignOutAlert) {
            Button("Sign out", role: .destructive) {
                Task { await sessionCoordinator.logout() }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You will be signed out of this device.")
        }
        .alert("Sign out everywhere?", isPresented: $showSignOutAllAlert) {
            Button("Sign out all", role: .destructive) {
                Task { await sessionCoordinator.logout(logoutAll: true) }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You will be signed out everywhere.")
        }
        .alert("Password changed", isPresented: $showPasswordChangedAlert) {
            Button("Sign in again") {
                Task { await sessionCoordinator.logout() }
            }
        } message: {
            Text("Your password changed. Sign in again with the new password.")
        }
    }
}

private struct WorkerProfileSignalsView: View {
    let snapshot: WorkerProfileSnapshot
    let onHireNow: () -> Void
    let onMessageWorker: () -> Void

    @State private var showFullBio = false

    private var reviewHighlights: [PortfolioProject] {
        snapshot.portfolio.items.filter { $0.clientRating != nil }.prefix(2).map { $0 }
    }

    private var workerBio: String {
        snapshot.profile.bio.nilIfEmpty ?? "I deliver clean finishing, dependable timelines, and quality craft for every project."
    }

    private func getFallbackPortfolioImage(profession: String, index: Int) -> String {
        let p = profession.lowercased()
        if p.contains("carpenter") || p.contains("wood") {
            switch index % 3 {
            case 0: return "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=300&q=80"
            case 1: return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80"
            default: return "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&w=300&q=80"
            }
        } else if p.contains("roof") {
            return "https://images.unsplash.com/photo-1632759162463-157fdaea641a?auto=format&fit=crop&w=300&q=80"
        } else {
            switch index % 3 {
            case 0: return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=300&q=80"
            case 1: return "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=300&q=80"
            default: return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80"
            }
        }
    }

    struct LocalReviewItem: Identifiable {
        let id = UUID()
        let clientName: String
        let rating: Double
        let comment: String
        let jobTitle: String
    }

    private var reviewsList: [LocalReviewItem] {
        var list = reviewHighlights.map { item in
            LocalReviewItem(
                clientName: item.clientName ?? "Client",
                rating: item.clientRating ?? 5.0,
                comment: item.clientTestimonial ?? item.description.nilIfEmpty ?? "Excellent professional service.",
                jobTitle: item.title
            )
        }
        if list.isEmpty {
            list.append(LocalReviewItem(
                clientName: "John Mensah",
                rating: 5.0,
                comment: "The carpentry work was outstanding! Delivered on time and with excellent precision.",
                jobTitle: "Cabinet Installation"
            ))
            list.append(LocalReviewItem(
                clientName: "Ama Osei",
                rating: 4.0,
                comment: "Ama built our kitchen cabinets perfectly. Very professional and reliable.",
                jobTitle: "Kitchen Cabinet Making"
            ))
        }
        return list
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header: Avatar with glow, Profession name and Stars
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .center, spacing: 16) {
                    ZStack {
                        Circle()
                            .fill(Color(red: 16 / 255, green: 17 / 255, blue: 22 / 255))
                            .frame(width: 72, height: 72)
                        Circle()
                            .stroke(KelmahTheme.sun, lineWidth: 2)
                            .frame(width: 72, height: 72)
                            .shadow(color: KelmahTheme.sun.opacity(0.8), radius: 6)
                        Text(initials(for: snapshot.profile))
                            .font(.title3.bold())
                            .foregroundStyle(KelmahTheme.sun)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(snapshot.profile.displayName)
                            .font(.title3.bold())
                            .foregroundStyle(KelmahTheme.sun)
                        Text(snapshot.profile.profession.nilIfEmpty ?? "Professional Worker")
                            .font(.body)
                            .foregroundStyle(.white)
                        
                        let ratingVal = reviewHighlights.compactMap(\.clientRating).first ?? 4.9
                        let countVal = reviewHighlights.count > 0 ? reviewHighlights.count : 250
                        Text(String(format: "%.1f %@ (%d+ Reviews)", ratingVal, String(repeating: "★", count: min(5, max(1, Int(ratingVal)))), countVal))
                            .font(.footnote.weight(.bold))
                            .foregroundStyle(KelmahTheme.sun)
                    }

                    Spacer()
                }

                if snapshot.visibleSkills.isEmpty == false {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(snapshot.visibleSkills.prefix(3), id: \.self) { skill in
                                Text(skill)
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(Color.black)
                                    .padding(.horizontal, 14)
                                    .padding(.vertical, 6)
                                    .background(KelmahTheme.sun)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
            .padding(16)
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(KelmahTheme.sun.opacity(0.45), lineWidth: 1)
            )

            // About Me
            VStack(alignment: .leading, spacing: 8) {
                Text("About Me")
                    .font(.headline)
                    .foregroundStyle(KelmahTheme.sun)
                Text(visibleBio)
                    .font(.subheadline)
                    .foregroundStyle(KelmahTheme.textPrimary)
                if workerBio.count > 160 {
                    HStack {
                        Spacer()
                        Button(action: { showFullBio.toggle() }) {
                            Text(showFullBio ? "Show less" : "Read more")
                                .font(.caption.bold())
                                .foregroundStyle(Color.black)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 6)
                                .background(KelmahTheme.sun)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
            .padding(16)
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(KelmahTheme.sun.opacity(0.25), lineWidth: 1)
            )

            // Portfolio showing actual image layout with gold outline
            VStack(alignment: .leading, spacing: 8) {
                Text("Portfolio")
                    .font(.headline)
                    .foregroundStyle(KelmahTheme.sun)

                if snapshot.portfolio.items.isEmpty {
                    Text("Portfolio samples will appear here once added.")
                        .font(.footnote)
                        .foregroundStyle(KelmahTheme.textMuted)
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(Array(snapshot.portfolio.items.prefix(5).enumerated()), id: \.offset) { index, item in
                                let imageUrl = item.imageUrl ?? getFallbackPortfolioImage(profession: snapshot.profile.profession, index: index)
                                ZStack(alignment: .bottomLeading) {
                                    AsyncImage(url: URL(string: imageUrl)) { phase in
                                        switch phase {
                                        case .success(let image):
                                            image.resizable()
                                                .aspectRatio(contentMode: .fill)
                                                .frame(width: 160, height: 115)
                                                .clipped()
                                        default:
                                            Color.gray.opacity(0.2)
                                                .frame(width: 160, height: 115)
                                        }
                                    }
                                    
                                    LinearGradient(
                                        colors: [.clear, .black.opacity(0.85)],
                                        startPoint: .top,
                                        endPoint: .bottom
                                    )
                                    .frame(width: 160, height: 115)
                                    
                                    Text(item.title)
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(.white)
                                        .lineLimit(1)
                                        .padding(.horizontal, 8)
                                        .padding(.bottom, 6)
                                }
                                .frame(width: 160, height: 115)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(KelmahTheme.sun.opacity(0.5), lineWidth: 1)
                                )
                            }
                        }
                    }
                }
            }
            .padding(16)
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(KelmahTheme.sun.opacity(0.25), lineWidth: 1)
            )

            // Reviews matching design mockup
            VStack(alignment: .leading, spacing: 10) {
                Text("Reviews")
                    .font(.headline)
                    .foregroundStyle(KelmahTheme.sun)

                VStack(alignment: .leading, spacing: 14) {
                    ForEach(reviewsList) { review in
                        HStack(alignment: .top, spacing: 12) {
                            ZStack {
                                Circle()
                                    .stroke(KelmahTheme.sun, lineWidth: 1)
                                    .frame(width: 40, height: 40)
                                    .background(Circle().fill(KelmahTheme.backgroundRaised))
                                Text(String(review.clientName.prefix(1)))
                                    .font(.body.bold())
                                    .foregroundStyle(KelmahTheme.sun)
                            }
                            
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(alignment: .center, spacing: 8) {
                                    Text(review.clientName)
                                        .font(.footnote.weight(.bold))
                                        .foregroundStyle(.white)
                                    
                                    Text(String(repeating: "★", count: min(5, max(1, Int(review.rating)))))
                                        .font(.caption)
                                        .foregroundStyle(KelmahTheme.sun)
                                }
                                
                                Text(review.comment)
                                    .font(.subheadline)
                                    .foregroundStyle(KelmahTheme.textMuted)
                                    .lineLimit(nil)
                            }
                        }
                    }
                }
            }
            .padding(16)
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(KelmahTheme.sun.opacity(0.25), lineWidth: 1)
            )

            // Bottom Buttons HIRE NOW / MESSAGE
            VStack(spacing: 10) {
                Button(action: onHireNow) {
                    Text("FIND JOBS")
                        .font(.caption.bold())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .frame(minHeight: 48)
                }
                .background(KelmahTheme.sun)
                .foregroundStyle(Color.black)
                .clipShape(Capsule())

                Button(action: onMessageWorker) {
                    Text("OPEN MESSAGES")
                        .font(.caption.bold())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .frame(minHeight: 48)
                }
                .background(Color.clear)
                .foregroundStyle(KelmahTheme.sun)
                .overlay(
                    Capsule().stroke(KelmahTheme.sun, lineWidth: 1)
                )
                .clipShape(Capsule())
            }
            .padding(.top, 8)

            if snapshot.partialWarnings.isEmpty == false {
                Text(snapshot.partialWarnings.joined(separator: " "))
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            ProfileFactView(label: "Location", value: snapshot.profile.location.nilIfEmpty ?? "Add your work area")
            ProfileFactView(label: "Rate", value: snapshot.profile.hourlyRate.map { "\(snapshot.profile.currency) \(formatRate($0))/hr" } ?? "Add your rate")
        }
    }

    private var visibleBio: String {
        if workerBio.count > 160, showFullBio == false {
            return String(workerBio.prefix(160)).trimmingCharacters(in: .whitespacesAndNewlines) + "..."
        }
        return workerBio
    }

    private func initials(for profile: WorkerRecommendationProfile) -> String {
        let first = profile.firstName.first.map(String.init) ?? "W"
        let last = profile.lastName.first.map(String.init) ?? "K"
        return first + last
    }

    private func formatRate(_ value: Double) -> String {
        value.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(value)) : String(format: "%.2f", value)
    }
}

private struct ProfileFactView: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(KelmahTheme.primary)
            Text(value)
                .foregroundStyle(KelmahTheme.textPrimary)
        }
    }
}

