import XCTest

final class KelmahUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testAuthenticationShellLoadsAndSupportsModeSwitching() {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.staticTexts["auth.title"].waitForExistence(timeout: 20))
        XCTAssertTrue(app.textFields["auth.emailField"].waitForExistence(timeout: 5))

        let modePicker = app.segmentedControls["auth.modePicker"]
        XCTAssertTrue(modePicker.waitForExistence(timeout: 5))

        modePicker.buttons["Register"].tap()
        XCTAssertTrue(app.textFields["auth.firstNameField"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.secureTextFields["auth.passwordField"].waitForExistence(timeout: 5))

        modePicker.buttons["Sign In"].tap()
        XCTAssertTrue(app.textFields["auth.emailField"].waitForExistence(timeout: 5))
    }
}
