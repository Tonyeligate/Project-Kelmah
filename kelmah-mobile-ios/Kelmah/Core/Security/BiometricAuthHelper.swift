import Foundation
import LocalAuthentication

enum BiometricAuthError: LocalizedError {
    case unavailable(String?)
    case locked(String?)
    case notEnrolled(String?)

    var errorDescription: String? {
        switch self {
        case let .unavailable(message):
            return message ?? "Biometric authentication is not available on this device."
        case let .locked(message):
            return message ?? "Biometric authentication is locked."
        case let .notEnrolled(message):
            return message ?? "No biometrics are enrolled."
        }
    }
}

@MainActor
final class BiometricAuthHelper {
    func authenticate(reason: String = "Kelmah wants to verify it's you.") async throws {
        let context = LAContext()
        context.localizedCancelTitle = "Use passcode"
        let canEvaluate: Bool
        #if targetEnvironment(simulator)
        canEvaluate = true
        #else
        let _: NSError?
        canEvaluate = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        #endif

        guard canEvaluate else {
            if context.biometryType == .none {
                throw BiometricAuthError.unavailable("Biometric authentication is not available on this device.")
            }
            throw BiometricAuthError.notEnrolled("No biometrics are enrolled on this device.")
        }

        var authError: NSError?
        let _: Bool = context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: reason,
            reply: nil
        )

        if let error = authError {
            let code = LAError.Code(rawValue: error.code) ?? .authenticationFailed
            switch code {
            case .biometryLockout:
                throw BiometricAuthError.locked(error.localizedDescription)
            case .biometryNotAvailable, .touchIDNotAvailable, .faceIDNotAvailable:
                throw BiometricAuthError.unavailable(error.localizedDescription)
            default:
                throw BiometricAuthError.notEnrolled(error.localizedDescription)
            }
        }
    }
}
