# Chrome on iOS file picker reproducer

This is an investigation artifact, not part of the deployed app. It exports dummy JSON and opens a visible native file input. It does not read selected files or load Passport Core. Export URLs are deliberately retained, capped at 20 exports, to show that revocation is not necessary for the observed failure. Do not use that lifetime policy in production.

For local device testing, run `npm.cmd run dev -- --port 5173 --strictPort` when that port is free, then open `http://<computer-LAN-IP>:5173/docs/diagnostics/backup-picker-test.html`. A production preview serves only the built app and will not expose this documentation file. No extra port or firewall rule is needed.

1. In Chrome on the iPhone, export the test file and complete the save workflow.
2. Tap the native Choose File control, then cancel once the chooser appears.
3. Repeat up to ten cycles. On failure, select and copy the log before reloading.
4. Compare the same sequence in Safari. Record the exact iOS/Chrome versions and save steps when preparing a browser report.

The owner reproduced the failure after the fourth export: five subsequent picker attempts cancelled within 10–18 ms without the picker opening. Safari did not reproduce in the owner's testing. This supports a Chrome-on-iOS-specific investigation; it does not identify the failing internal component or guarantee Safari behavior on other versions. See [the investigation outcome](../DEVELOPMENT.md#chrome-on-ios-investigation-outcome).
