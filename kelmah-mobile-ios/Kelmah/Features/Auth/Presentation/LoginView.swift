import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel: LoginViewModel

    init(authRepository: AuthRepository) {
        _viewModel = StateObject(wrappedValue: LoginViewModel(authRepository: authRepository))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("Kelmah")
                    .font(.system(size: 42, weight: .bold))
                    .foregroundStyle(KelmahTheme.primary)
                    .accessibilityIdentifier("auth.title")

                Text("Find workers. Find jobs.")
                    .foregroundStyle(.secondary)

                Picker("Mode", selection: $viewModel.mode) {
                    ForEach(AuthMode.allCases, id: \.self) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .accessibilityIdentifier("auth.modePicker")

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

                if viewModel.mode == .register {
                    textField("First name", text: $viewModel.firstName, accessibilityId: "auth.firstNameField")
                    textField("Last name", text: $viewModel.lastName, accessibilityId: "auth.lastNameField")
                }

                if viewModel.mode != .verifyEmail {
                    textField("Email address", text: $viewModel.email, keyboard: .emailAddress, accessibilityId: "auth.emailField")
                        .textContentType(.emailAddress)
                }

                if viewModel.mode == .register {
                    textField("Phone (optional)", text: $viewModel.phone, keyboard: .phonePad, accessibilityId: "auth.phoneField")
                    Picker("Role", selection: $viewModel.role) {
                        Text("Worker").tag("worker")
                        Text("Hirer").tag("hirer")
                    }
                    .pickerStyle(.segmented)
                    .accessibilityIdentifier("auth.rolePicker")
                }

                if viewModel.mode == .resetPassword || viewModel.mode == .verifyEmail {
                    textField(
                        viewModel.mode == .resetPassword ? "Reset code" : "Verification code",
                        text: $viewModel.token,
                        accessibilityId: "auth.tokenField"
                    )
                }

                if viewModel.mode == .login || viewModel.mode == .register || viewModel.mode == .resetPassword {
                    secureField("Password", text: $viewModel.password, accessibilityId: "auth.passwordField")
                        .textContentType(viewModel.mode == .login ? .password : .newPassword)
                }

                if viewModel.mode == .register || viewModel.mode == .resetPassword {
                    secureField("Confirm password", text: $viewModel.confirmPassword, accessibilityId: "auth.confirmPasswordField")
                }

                Button {
                    Task {
                        await viewModel.submitPrimaryAction()
                    }
                } label: {
                    HStack {
                        Spacer()
                        if viewModel.isLoading {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text(primaryButtonTitle)
                                .fontWeight(.semibold)
                        }
                        Spacer()
                    }
                    .padding()
                    .background(KelmahTheme.primary)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                }
                .disabled(viewModel.isLoading)
                .accessibilityIdentifier("auth.primaryAction")

                actionLinks
            }
            .padding(24)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(KelmahTheme.background.ignoresSafeArea())
    }

    private var primaryButtonTitle: String {
        switch viewModel.mode {
        case .login: return "Sign in"
        case .register: return "Create account"
        case .forgotPassword: return "Send reset link"
        case .resetPassword: return "Reset password"
        case .verifyEmail: return "Verify email"
        }
    }

    @ViewBuilder
    private var actionLinks: some View {
        if viewModel.mode == .login || viewModel.mode == .register {
            VStack(alignment: .leading, spacing: 8) {
                Button("Forgot password?") {
                    viewModel.switchMode(.forgotPassword)
                }
                .buttonStyle(.plain)

                Button("Have a verification code?") {
                    viewModel.switchMode(.verifyEmail)
                }
                .buttonStyle(.plain)

                Button("Resend verification email") {
                    Task { await viewModel.resendVerificationEmail() }
                }
                .buttonStyle(.plain)
                .disabled(viewModel.isLoading || viewModel.email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        } else {
            HStack(spacing: 16) {
                Button("Back to sign in") {
                    viewModel.switchMode(.login)
                }
                .buttonStyle(.plain)

                if viewModel.mode == .forgotPassword {
                    Button("Resend email") {
                        Task { await viewModel.resendVerificationEmail() }
                    }
                    .buttonStyle(.plain)
                    .disabled(viewModel.isLoading || viewModel.email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func textField(
        _ title: String,
        text: Binding<String>,
        keyboard: UIKeyboardType = .default,
        accessibilityId: String
    ) -> some View {
        TextField(title, text: text)
            .textInputAutocapitalization(.never)
            .keyboardType(keyboard)
            .autocorrectionDisabled()
            .padding()
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .accessibilityIdentifier(accessibilityId)
    }

    private func secureField(_ title: String, text: Binding<String>, accessibilityId: String) -> some View {
        SecureField(title, text: text)
            .padding()
            .background(KelmahTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .accessibilityIdentifier(accessibilityId)
    }
}
