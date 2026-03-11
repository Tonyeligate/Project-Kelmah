import XCTest
@testable import Kelmah

final class KelmahTests: XCTestCase {
    func testPasswordPolicyAcceptsStrongPassword() {
        XCTAssertTrue(PasswordPolicy.isStrong("Kelmah2026!"))
    }

    func testPasswordPolicyRejectsPasswordWithoutSpecialCharacter() {
        XCTAssertFalse(PasswordPolicy.isStrong("Kelmah2026"))
    }

    func testPasswordPolicyRejectsPasswordWithoutLowercase() {
        XCTAssertFalse(PasswordPolicy.isStrong("KELMAH2026!"))
    }

    func testPasswordPolicyRejectsPasswordWithoutUppercase() {
        XCTAssertFalse(PasswordPolicy.isStrong("kelmah2026!"))
    }

    func testSessionUserDefaultsUnknownRoleToWorker() {
        let user = SessionUser(id: nil, _id: nil, email: nil, firstName: nil, lastName: nil, role: "unknown", isEmailVerified: nil)

        XCTAssertEqual(user.kelmahUserRole, .worker)
    }

    func testSessionUserResolvesDisplayNameFromNames() {
        let user = SessionUser(id: nil, _id: nil, email: "user@example.com", firstName: "Ama", lastName: "Mensah", role: "worker", isEmailVerified: true)

        XCTAssertEqual(user.displayName, "Ama Mensah")
    }
}
