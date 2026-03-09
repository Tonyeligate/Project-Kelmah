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
            errorMessage = "Complete all password fields"
            return false
        }
        guard PasswordPolicy.isStrong(newPassword) else {
            errorMessage = "New \(PasswordPolicy.requirementMessage.lowercased())"
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

    @StateObject private var viewModel: ProfileViewModel

    init(sessionCoordinator: SessionCoordinator, authRepository: AuthRepository, profileRepository: ProfileRepository, sessionStore: SessionStore) {
        self.sessionCoordinator = sessionCoordinator
        self.authRepository = authRepository
        self.profileRepository = profileRepository
        self.sessionStore = sessionStore
        _viewModel = StateObject(wrappedValue: ProfileViewModel(authRepository: authRepository, profileRepository: profileRepository))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Profile")
                    .font(.largeTitle.bold())

                VStack(alignment: .leading, spacing: 8) {
                    Text(sessionStore.currentUser?.displayName ?? "Kelmah User")
                        .font(.title2.bold())
                    Text(sessionStore.currentUser?.email ?? "Email unavailable")
                        .foregroundStyle(.secondary)
                    Text("Role: \((sessionStore.currentUser?.role ?? "worker").capitalized)")
                    Text(sessionStore.currentUser?.isEmailVerified == true ? "Email verified" : "Email verification pending")
                        .foregroundStyle(sessionStore.currentUser?.isEmailVerified == true ? KelmahTheme.primary : .red)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                if sessionStore.currentUser?.kelmahUserRole == .worker {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recommendation signals")
                            .font(.headline)
                        Text("These details shape how Kelmah ranks and explains your mobile job recommendations.")
                            .foregroundStyle(.secondary)

                        if viewModel.isLoadingProfileSignals {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                            .padding(.vertical, 12)
                        } else if let profileErrorMessage = viewModel.profileErrorMessage {
                            Text(profileErrorMessage)
                                .foregroundStyle(.red)
                                .font(.footnote)
                            Button {
                                Task { await viewModel.refreshProfileSignals(user: sessionStore.currentUser) }
                            } label: {
                                Text("Retry profile sync")
                                    .fontWeight(.semibold)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(KelmahTheme.primary)
                                    .foregroundStyle(.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            }
                        } else if let snapshot = viewModel.profileSnapshot {
                            WorkerProfileSignalsView(snapshot: snapshot)
                        } else {
                            Text("Profile signals will appear here once your worker account is loaded.")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                }

                VStack(alignment: .leading, spacing: 12) {
                    Text("Security")
                        .font(.headline)
                    Text("Change your password to keep your Kelmah account secure across devices.")
                        .foregroundStyle(.secondary)

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
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    SecureField("New password", text: $viewModel.newPassword)
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    SecureField("Confirm new password", text: $viewModel.confirmPassword)
                        .padding()
                        .background(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                    Button {
                        Task {
                            let changed = await viewModel.changePassword()
                            if changed {
                                await sessionCoordinator.logout()
                            }
                        }
                    } label: {
                        HStack {
                            Spacer()
                            if viewModel.isSaving {
                                ProgressView()
                                    .tint(.white)
                            } else {
                                Text("Change Password")
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
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))

                Button(role: .destructive) {
                    Task {
                        await sessionCoordinator.logout()
                    }
                } label: {
                    Text("Sign Out")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                }
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))

                Button(role: .destructive) {
                    Task {
                        await sessionCoordinator.logout(logoutAll: true)
                    }
                } label: {
                    Text("Sign Out All Devices")
                        .fontWeight(.semibold)
                        .frame(maxWidth: .infinity)
                        .padding()
                }
                .background(.white)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .padding(20)
        }
        .background(KelmahTheme.background.ignoresSafeArea())
        .task(id: sessionStore.currentUser?.resolvedID) {
            await viewModel.bootstrap(user: sessionStore.currentUser)
        }
    }
}

private struct WorkerProfileSignalsView: View {
    let snapshot: WorkerProfileSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(snapshot.profile.profession.nilIfEmpty ?? "Profession pending")
                .font(.title3.bold())

            if snapshot.profile.bio.isEmpty == false {
                Text(snapshot.profile.bio)
                    .foregroundStyle(.primary)
            }

            ProfileFactView(label: "Location", value: snapshot.profile.location.nilIfEmpty ?? "Add your working location")
            ProfileFactView(label: "Rate", value: snapshot.profile.hourlyRate.map { "\(snapshot.profile.currency) \(formatRate($0))/hr" } ?? "Set an hourly rate")
            ProfileFactView(
                label: "Experience",
                value: experienceLabel(for: snapshot.profile)
            )
            ProfileFactView(
                label: "Verification",
                value: "Email \(snapshot.profile.isEmailVerified ? "verified" : "pending") • Phone \(snapshot.profile.isPhoneVerified ? "verified" : "pending")"
            )

            Divider()

            Text("Visible skills")
                .font(.headline)
            Text(snapshot.visibleSkills.isEmpty ? "Add skills so recommendation matches have enough precision." : snapshot.visibleSkills.joined(separator: " • "))

            ProfileFactView(
                label: "Credentials",
                value: "\(snapshot.credentials.certifications.filter(\ .isVerified).count) verified certifications • \(snapshot.credentials.licenses.count) licenses"
            )
            ForEach(snapshot.credentials.certifications.prefix(3)) { certification in
                Text("• \(certification.name)\(certification.issuingOrganization.nilIfEmpty.map { " · \($0)" } ?? "")")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Divider()

            Text("Availability and completeness")
                .font(.headline)
            ProfileFactView(label: "Availability", value: availabilityLabel(snapshot.availability))
            ForEach(snapshot.availability.schedule.prefix(3)) { day in
                Text("• \(daySummary(day))")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            ProgressView(value: Double(snapshot.completeness.completionPercentage), total: 100)
                .tint(KelmahTheme.primary)
            Text("\(snapshot.completeness.completionPercentage)% complete • required \(snapshot.completeness.requiredCompletion)% • optional \(snapshot.completeness.optionalCompletion)%")
                .font(.footnote)
                .foregroundStyle(.secondary)
            ForEach(snapshot.completeness.recommendations.prefix(3), id: \.self) { recommendation in
                Text("• \(recommendation)")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Divider()

            Text("Portfolio proof")
                .font(.headline)
            Text("\(snapshot.portfolio.publishedCount) published items out of \(snapshot.portfolio.totalCount)")
                .foregroundStyle(.secondary)
            if snapshot.portfolio.items.isEmpty {
                Text("Add portfolio work to support recommendation trust and conversion.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(snapshot.portfolio.items.prefix(3)) { item in
                    Text("• \(item.title)\(item.skillsUsed.isEmpty ? "" : " · \(item.skillsUsed.joined(separator: ", "))")")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    private func experienceLabel(for profile: WorkerRecommendationProfile) -> String {
        let level = profile.experienceLevel?.capitalized ?? "Experience level pending"
        if let years = profile.yearsOfExperience, years > 0 {
            return "\(level) • \(years)y"
        }
        return level
    }

    private func availabilityLabel(_ availability: WorkerAvailability) -> String {
        if availability.isAvailable {
            return "Available\(availability.nextAvailable.map { " • next \($0)" } ?? "")"
        }
        if availability.status == "not_set" {
            return availability.message ?? "Availability not configured"
        }
        return "Unavailable\(availability.nextAvailable.map { " • next \($0)" } ?? "")"
    }

    private func daySummary(_ day: AvailabilityDay) -> String {
        let label = day.day.capitalized
        guard day.available, day.slots.isEmpty == false else { return "\(label): unavailable" }
        let slots = day.slots.map { "\($0.start)-\($0.end)" }.joined(separator: ", ")
        return "\(label): \(slots)"
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
                .foregroundStyle(.primary)
        }
    }
}

private extension String {
    var nilIfEmpty: String? {
        trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : self
    }
}
