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
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Profile")
                    .font(.largeTitle.bold())
                    .foregroundStyle(KelmahTheme.textPrimary)

                VStack(alignment: .leading, spacing: 8) {
                    Text(sessionStore.currentUser?.displayName ?? "Kelmah User")
                        .font(.title2.bold())
                        .foregroundStyle(KelmahTheme.textPrimary)
                    Text(sessionStore.currentUser?.email ?? "No email added")
                        .foregroundStyle(KelmahTheme.textMuted)
                    Text("Role: \((sessionStore.currentUser?.role ?? "worker").capitalized)")
                        .foregroundStyle(KelmahTheme.textPrimary)
                    Text(sessionStore.currentUser?.isEmailVerified == true ? "Email verified" : "Email not verified yet")
                        .foregroundStyle(sessionStore.currentUser?.isEmailVerified == true ? KelmahTheme.primary : .red)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(KelmahTheme.card)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(KelmahTheme.primary.opacity(0.24), lineWidth: 1)
                )

                if sessionStore.currentUser?.kelmahUserRole == .worker {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your work details")
                            .font(.headline)
                            .foregroundStyle(KelmahTheme.textPrimary)
                        Text("These details help Kelmah show you better jobs.")
                            .foregroundStyle(KelmahTheme.textMuted)

                        if viewModel.isLoadingProfileSignals {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                            .padding(.vertical, 12)
                        } else if let profileErrorMessage = viewModel.profileErrorMessage {
                            Text(profileErrorMessage.isEmpty ? "We could not load your work details." : profileErrorMessage)
                                .foregroundStyle(.red)
                                .font(.footnote)
                            Button {
                                Task { await viewModel.refreshProfileSignals(user: sessionStore.currentUser) }
                            } label: {
                                Text("Try again")
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(KelmahTheme.primary)
                                    .foregroundStyle(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            }
                        } else if let snapshot = viewModel.profileSnapshot {
                            WorkerProfileSignalsView(
                                snapshot: snapshot,
                                onHireNow: onHireNow,
                                onMessageWorker: onMessageWorker
                            )
                        } else {
                            Text("Your work details will show here.")
                                .foregroundStyle(KelmahTheme.textMuted)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(KelmahTheme.card)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(KelmahTheme.primary.opacity(0.24), lineWidth: 1)
                    )
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Password")
                        .font(.headline)
                        .foregroundStyle(KelmahTheme.textPrimary)
                    Text("Change your password.")
                        .foregroundStyle(KelmahTheme.textMuted)

                    if let infoMessage = viewModel.infoMessage {
                        Text(infoMessage)
                            .foregroundStyle(KelmahTheme.primary)
                            .font(.footnote)
                    }

                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .foregroundStyle(.red)
                            .font(.footnote)
                    }

                    SecureField("Current password", text: $viewModel.currentPassword)
                        .textContentType(.password)
                        .padding()
                        .background(KelmahTheme.card)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    SecureField("New password", text: $viewModel.newPassword)
                        .textContentType(.newPassword)
                        .padding()
                        .background(KelmahTheme.card)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    SecureField("Confirm new password", text: $viewModel.confirmPassword)
                        .textContentType(.newPassword)
                        .padding()
                        .background(KelmahTheme.card)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                    Button {
                        Task {
                            let changed = await viewModel.changePassword()
                            if changed {
                                showPasswordChangedAlert = true
                            }
                        }
                    } label: {
                        HStack {
                            Spacer()
                            if viewModel.isSaving {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Change password")
                                    .fontWeight(.semibold)
                            }
                            Spacer()
                        }
                        .padding()
                        .background(KelmahTheme.primary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .disabled(viewModel.isSaving)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(KelmahTheme.card)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(KelmahTheme.primary.opacity(0.24), lineWidth: 1)
                )

                Button(role: .destructive) {
                    showSignOutAlert = true
                } label: {
                    Label("Sign out", systemImage: "rectangle.portrait.and.arrow.right")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                }
                .background(KelmahTheme.card)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(KelmahTheme.primary.opacity(0.2), lineWidth: 1)
                )

                Button(role: .destructive) {
                    showSignOutAllAlert = true
                } label: {
                    Label("Sign out everywhere", systemImage: "iphone.and.arrow.forward")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                }
                .background(KelmahTheme.card)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(KelmahTheme.primary.opacity(0.2), lineWidth: 1)
                )
            }
            .padding(20)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(KelmahTheme.background.ignoresSafeArea())
        .task(id: sessionStore.currentUser?.resolvedID) {
            await viewModel.bootstrap(user: sessionStore.currentUser)
        }
        // Confirm sign out (this device)
        .alert("Sign out?", isPresented: $showSignOutAlert) {
            Button("Sign out", role: .destructive) {
                Task { await sessionCoordinator.logout() }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You will be signed out of this device.")
        }
        // Confirm sign out (all devices)
        .alert("Sign out everywhere?", isPresented: $showSignOutAllAlert) {
            Button("Sign out all", role: .destructive) {
                Task { await sessionCoordinator.logout(logoutAll: true) }
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("You will be signed out everywhere.")
        }
        // Warn user before auto-logout after password change
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

    private var averageRatingText: String {
        let ratings = reviewHighlights.compactMap(\.clientRating)
        guard ratings.isEmpty == false else { return "No ratings yet" }
        let average = ratings.reduce(0, +) / Double(ratings.count)
        return String(format: "%.1f stars · %d highlights", average, reviewHighlights.count)
    }

    private var workerBio: String {
        snapshot.profile.bio.nilIfEmpty ?? "I deliver clean finishing, dependable timelines, and quality craft for every project."
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center, spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(KelmahTheme.primary.opacity(0.16))
                            .frame(width: 64, height: 64)
                        Circle()
                            .stroke(KelmahTheme.primary, lineWidth: 2)
                            .frame(width: 64, height: 64)
                        Text(initials(for: snapshot.profile))
                            .font(.headline.bold())
                            .foregroundStyle(KelmahTheme.primary)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(snapshot.profile.displayName)
                            .font(.headline.bold())
                            .foregroundStyle(KelmahTheme.primary)
                        Text(snapshot.profile.profession.nilIfEmpty ?? "Professional Worker")
                            .font(.subheadline)
                            .foregroundStyle(KelmahTheme.textMuted)
                        Text(averageRatingText)
                            .font(.caption)
                            .foregroundStyle(KelmahTheme.textMuted)
                    }

                    Spacer()
                }

                if snapshot.visibleSkills.isEmpty == false {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(snapshot.visibleSkills.prefix(3), id: \.self) { skill in
                                Text(skill)
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(KelmahTheme.textPrimary)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(KelmahTheme.primary.opacity(0.16))
                                    .overlay(
                                        Capsule().stroke(KelmahTheme.primary.opacity(0.5), lineWidth: 1)
                                    )
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
            .padding(14)
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(KelmahTheme.primary.opacity(0.3), lineWidth: 1)
            )

            VStack(alignment: .leading, spacing: 8) {
                Text("About Me")
                    .font(.headline)
                    .foregroundStyle(KelmahTheme.primary)
                Text(visibleBio)
                    .font(.subheadline)
                    .foregroundStyle(KelmahTheme.textPrimary)
                if workerBio.count > 160 {
                    Button(showFullBio ? "Show less" : "Read more") {
                        showFullBio.toggle()
                    }
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(KelmahTheme.primary)
                }
            }
            .padding(14)
            .background(KelmahTheme.cardRaised)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(KelmahTheme.primary.opacity(0.24), lineWidth: 1)
            )

            VStack(alignment: .leading, spacing: 8) {
                Text("Portfolio")
                    .font(.headline)
                    .foregroundStyle(KelmahTheme.primary)

                if snapshot.portfolio.items.isEmpty {
                    Text("Portfolio samples will appear here once added.")
                        .font(.footnote)
                        .foregroundStyle(KelmahTheme.textMuted)
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(snapshot.portfolio.items.prefix(5)) { item in
                                VStack(alignment: .leading, spacing: 6) {
                                    Text(item.title)
                                        .font(.caption.weight(.semibold))
                                        .lineLimit(2)
                                        .foregroundStyle(KelmahTheme.textPrimary)
                                    Text(item.skillsUsed.joined(separator: ", ").nilIfEmpty ?? item.projectType)
                                        .font(.caption2)
                                        .lineLimit(1)
                                        .foregroundStyle(KelmahTheme.textMuted)
                                }
                                .frame(width: 148, alignment: .leading)
                                .padding(10)
                                .background(KelmahTheme.card)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .stroke(KelmahTheme.primary.opacity(0.28), lineWidth: 1)
                                )
                            }
                        }
                    }
                }
            }
            .padding(14)
            .background(KelmahTheme.cardRaised)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(KelmahTheme.primary.opacity(0.24), lineWidth: 1)
            )

            VStack(alignment: .leading, spacing: 8) {
                Text("Reviews")
                    .font(.headline)
                    .foregroundStyle(KelmahTheme.primary)

                if reviewHighlights.isEmpty {
                    Text("Client review highlights will appear here.")
                        .font(.footnote)
                        .foregroundStyle(KelmahTheme.textMuted)
                } else {
                    ForEach(reviewHighlights) { item in
                        Text("• \(item.title): \(String(format: "%.1f", item.clientRating ?? 0)) stars")
                            .font(.footnote)
                            .foregroundStyle(KelmahTheme.textPrimary)
                    }
                }
            }
            .padding(14)
            .background(KelmahTheme.cardRaised)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(KelmahTheme.primary.opacity(0.24), lineWidth: 1)
            )

            HStack(spacing: 10) {
                Button(action: onHireNow) {
                    Text("HIRE NOW")
                        .font(.caption.bold())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .background(KelmahTheme.primary)
                .foregroundStyle(Color.black)
                .clipShape(Capsule())

                Button(action: onMessageWorker) {
                    Text("MESSAGE")
                        .font(.caption.bold())
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
                .background(KelmahTheme.primary.opacity(0.18))
                .foregroundStyle(KelmahTheme.textPrimary)
                .overlay(
                    Capsule().stroke(KelmahTheme.primary.opacity(0.8), lineWidth: 1)
                )
                .clipShape(Capsule())
            }

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

