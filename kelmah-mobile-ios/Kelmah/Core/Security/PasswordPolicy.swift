import Foundation

enum PasswordPolicy {
    static let minimumLength = 8
    static let requirementMessage = "Password must be at least 8 characters and include one uppercase letter and one number"

    static func isStrong(_ value: String) -> Bool {
        value.count >= minimumLength && value.contains(where: \ .isUppercase) && value.contains(where: \ .isNumber)
    }
}