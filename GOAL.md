GOAL.md
Production finish line for both mobile apps. Frontend agents must make Android + iOS feature-complete, aligned to the live backend/REST/Socket.IO contract, and leave both apps build-verified and release-capable.

Accepted verification:
- Android: assembleDebug + testDebugUnitTest + compileReleaseKotlin green
- iOS: Xcode build succeeds for Debug/Release, no contract-breaking API drift
- Messaging and notifications use Socket.IO as source-of-truth
- REST routes match api-gateway + backend docs exactly
