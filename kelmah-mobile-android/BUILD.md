# Kelmah Mobile - Build & Release

Status
- Type: Android App, Kotlin + Jetpack Compose
- Verified build: `./gradlew assembleDebug`
- Verified tests: `./gradlew testDebugUnitTest`
- Verified lint: `./gradlew lintDebug`
- Android Gradle Plugin uses KSP + Hilt, Kotlin, and material 3 compose.

Requirements
- JDK 17
- Android SDK Platform 35
- Gradle 8.7 wrapper included
- Windows PowerShell or Git Bash acceptable

Local Development
- `cd kelmah-mobile-android`
- `./gradlew assembleDebug`
- `./gradlew testDebugUnitTest`
- `./gradlew lintDebug`

Release Readiness (Android)
- Build: `./gradlew assembleRelease`
- Signing metadata must be configured via keystore settings and release signing config.
- Do not overwrite release builds. Verify app signing / bundle metadata before upload.
- Google Play upload needs App Bundle / APK signing and package metadata completeness.

Quick Troubleshooting
- If KSP or composition errors appear, run `./gradlew clean` and rebuild.
- For flaky tests, use the wrapper and a clean before retrying.
