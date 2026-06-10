# Kelmah Android Production Handoff

Use these exact commands from the project root unless noted. Replace placeholder passwords with bytes you control; keep secrets out of git.

## Build commands
```bash
cd C:/Users/OS/Desktop/Project-Kelmah-main/kelmah-mobile-android
./gradlew assembleDebug
./gradlew bundleRelease
./gradlew testDebugUnitTest
./gradlew lintDebug
```

## Signing commands (copy-paste)
1) Generate a release keystore:
```bash
keytool -genkeypair \
  -v \
  -keystore release-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias release \
  -storetype JKS
```

2) Place the keystore at:
`C:\Users\OS\Desktop\Project-Kelmah-main\kelmah-mobile-android\release-keystore.jks`

3) Set environment variables for CI/local:
- `KELMAH_KEYSTORE_PASSWORD`
- `KELMAH_KEY_ALIAS`
- `KELMAH_KEY_PASSWORD`

4) Rebuild signed artifacts:
```bash
cd C:/Users/OS/Desktop/Project-Kelmah-main/kelmah-mobile-android
./gradlew bundleRelease
```

5) Install unsigned intermediate for local QA:
`app/build/outputs/apk/debug/app-debug.apk`

## Local verification checklist
- Run `./gradlew testDebugUnitTest`
- Run `./gradlew lintDebug`
- Install debug APK on a device/emulator running Android 14+
- Verify biometric prompt appears on resume after login

## Notes
- Canonical gateway already set to `https://kelmah-api-gateway-gf3g.onrender.com`
- Biometric unlock wired on resume + success gate
- Profile refresh hooks exist; manual retry available in UI
