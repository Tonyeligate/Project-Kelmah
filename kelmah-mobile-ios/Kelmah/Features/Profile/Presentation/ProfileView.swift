import SwiftUI

@MainActor
final class ProfileViewModel: ObservableObject {
    @Published var currentPassword = ""
    @Published var newPassword = ""
    @Published var confirmPassword = ""
    @Published var isSaving = false
    @Published var errorMessage: String?
    @Published var infoMessage: String?

    private let authRepository: AuthRepository

    init(authRepository: AuthRepository) {
        self.authRepository = authRepository
    }

    func changePassword() async -> Bool {
        guard currentPassword.isEmpty == false,
              newPassword.isEmpty == false,
              confirmPassword.isEmpty == false else {
            errorMessage = "Complete all password fields"
            return false
        }
        guard isStrongPassword(newPassword) else {
            errorMessage = "New password must be at least 8 characters and include one uppercase letter and one number"
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

    private func isStrongPassword(_ value: String) -> Bool {
        value.count >= 8 && value.contains(where: \ .isUppercase) && value.contains(where: \ .isNumber)
    }
}

struct ProfileView: View {
    let sessionCoordinator: SessionCoordinator
    let authRepository: AuthRepository
    let sessionStore: SessionStore

    @StateObject private var viewModel: ProfileViewModel

    init(sessionCoordinator: SessionCoordinator, authRepository: AuthRepository, sessionStore: SessionStore) {
        self.sessionCoordinator = sessionCoordinator
        self.authRepository = authRepository
        self.sessionStore = sessionStore
        _viewModel = StateObject(wrappedValue: ProfileViewModel(authRepository: authRepository))
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
            }
            .padding(20)
        }
        .background(KelmahTheme.background.ignoresSafeArea())
    }
}
