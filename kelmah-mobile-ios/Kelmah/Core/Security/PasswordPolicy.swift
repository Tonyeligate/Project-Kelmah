import Foundation

enum PasswordPolicy {
    static let minimumLength = 8
    static let maximumLength = 128
    static let requirementMessage = "Password must be 8-128 characters and include one uppercase letter, one lowercase letter, one number, and one special character"

    static func isStrong(_ value: String) -> Bool {
        value.count >= minimumLength &&
        value.count <= maximumLength &&
        value.rangeOfCharacter(from: .uppercaseLetters) != nil &&
        value.rangeOfCharacter(from: .lowercaseLetters) != nil &&
        value.rangeOfCharacter(from: .decimalDigits) != nil &&
        value.rangeOfCharacter(from: CharacterSet.alphanumerics.inverted) != nil
    }
}