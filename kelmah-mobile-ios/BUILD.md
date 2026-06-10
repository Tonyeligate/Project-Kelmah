# Kelmah Mobile iOS - Build & Release

Status
- SwiftUI root shell with tab routing
- Socket.IO client added
- Keychain/SessionStore scaffolding exists
- Requires macOS to build, sign, and run

Requirements
- Xcode 15+
- iOS deployment target: 17.0
- Swift 5.10
- CocoaPods / Swift Package Manager as dependency system

Local Development
- Open `kelmah-mobile-ios/project.yml` and the Xcode workspace.
- Build target: `Kelmah`
- Mock or integrate API gateway at runtime via environment.

Release Readiness (iOS)
- Confirm signing and provisioning profile for `com.kelmah.mobile`.
- Set Release scheme and archive in Xcode.
- Validate with TestFlight before App Store submission.
- Assets: AppIcon and AccentColor exist in Assets.xcassets.

Quick Troubleshooting
- If Socket.IO linkage fails, reinstall package from GitHub.
- If build fails, clean build folder and re-resolve signing entitlements.
