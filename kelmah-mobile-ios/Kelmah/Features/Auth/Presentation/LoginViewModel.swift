import Foundation

enum AuthMode: String, CaseIterable, Hashable {
    case login = "Sign In"
    case register = "Register"
    case forgotPassword = "Forgot"
    case resetPassword = "Reset"
    case verifyEmail = "Verify"
}

@MainActor
final class LoginViewModel: ObservableObject {
    @Published var mode: AuthMode = .login
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var email = ""
    @Published var phone = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var role = "worker"
    @Published var token = ""
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var infoMessage: String?

    private let authRepository: AuthRepository

    init(authRepository: AuthRepository) {
        self.authRepository = authRepository
    }

    func submitPrimaryAction() async {
        switch mode {
        case .login:
            await login()
        case .register:
            await register()
        case .forgotPassword:
            await forgotPassword()
        case .resetPassword:
            await resetPassword()
        case .verifyEmail:
            await verifyEmail()
        }
    }

    func resendVerificationEmail() async {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedEmail.isEmpty == false else {
            errorMessage = "Email is required"
            return
        }

        await runAction {
            infoMessage = try await authRepository.resendVerificationEmail(email: trimmedEmail)
        }
    }

    func switchMode(_ newMode: AuthMode) {
        mode = newMode
        errorMessage = nil
        infoMessage = nil
    }

    private func login() async {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedEmail.isEmpty == false, password.isEmpty == false else {
            errorMessage = "Email and password are required"
            return
        }

        await runAction {
            try await authRepository.login(email: trimmedEmail, password: password)
        }
    }

    private func register() async {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard firstName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false,
              lastName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            errorMessage = "First name and last name are required"
            return
        }
        guard trimmedEmail.isEmpty == false else {
            errorMessage = "Email is required"
            return
        }
        guard PasswordPolicy.isStrong(password) else {
            errorMessage = PasswordPolicy.requirementMessage
            return
        }
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match"
            return
        }

        await runAction {
            let message = try await authRepository.register(
                request: RegisterRequest(
                    firstName: firstName.trimmingCharacters(in: .whitespacesAndNewlines),
                    lastName: lastName.trimmingCharacters(in: .whitespacesAndNewlines),
                    email: trimmedEmail,
                    phone: phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : phone.trimmingCharacters(in: .whitespacesAndNewlines),
                    password: password,
                    role: role
                )
            )
            password = ""
            confirmPassword = ""
            mode = .login
            infoMessage = message
        }
    }

    private func forgotPassword() async {
        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmedEmail.isEmpty == false else {
            errorMessage = "Email is required"
            return
        }

        await runAction {
            infoMessage = try await authRepository.forgotPassword(email: trimmedEmail)
        }
    }

    private func resetPassword() async {
        guard token.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            errorMessage = "Reset token is required"
            return
        }
        guard PasswordPolicy.isStrong(password) else {
            errorMessage = PasswordPolicy.requirementMessage
            return
        }
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match"
            return
        }

        await runAction {
            let message = try await authRepository.resetPassword(
                token: token.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            )
            token = ""
            password = ""
            confirmPassword = ""
            mode = .login
            infoMessage = message
        }
    }

    private func verifyEmail() async {
        guard token.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false else {
            errorMessage = "Verification token is required"
            return
        }

        await runAction {
            let result = try await authRepository.verifyEmail(token: token.trimmingCharacters(in: .whitespacesAndNewlines))
            infoMessage = result.message
        }
    }

    private func runAction(_ action: () async throws -> Void) async {
        isLoading = true
        errorMessage = nil
        infoMessage = nil
        defer { isLoading = false }

        do {
            try await action()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
