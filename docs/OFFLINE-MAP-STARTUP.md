# Saved-map startup investigation

Status: lightweight reopening approved and implemented locally in core 0.6.4. Device timing validation and deployment remain pending. This is separate from the core 0.6.1 feedback/title/storage-copy fixes.

## Historical behavior before 0.6.4

`passport-core/src/map/offline/manager.ts` calls `verify()` during `checkInventory()`, on startup and foreground refresh. Verification reads and hashes the complete archive and every supporting resource, validates both styles, and checks the PMTiles header. Only afterward does it publish the active package. On initial launch, `src/map/renderer.ts` deliberately waits while the manager is checking and has no active package.

Without an installed package, the inventory check finishes quickly and the renderer requests the online style and the archive ranges needed for the current view. It does not download or verify the entire regional archive before painting. That explains the perceived responsiveness difference; it does not by itself demonstrate that IndexedDB is the wrong storage backend.

## Local observation

An isolated Chromium 1243 test context loaded the existing production preview at localhost:5173, installed the complete Washington z12 package, then reloaded. An initialization script counted successful `chunks` object-store reads in the map database and observed the navigation status transition. User browser profiles and passport data were not touched.

- Checking began at 76.3 ms after navigation.
- Map available offline appeared at 3,212.8 ms: approximately 3,136.5 ms spent in the checking interval.
- By that transition, 863 chunk reads had returned 94,097,692 bytes.
- The package payload is 93,010,324 bytes. The read count includes repeated chunk access for style/header checks, so it is not a new package-size measurement.

This is one instrumented local desktop observation, including browser scheduling and storage work. It is not an iPhone measurement, a benchmark of hashing alone, or a promised speedup. A comparison should repeat identical cold-start scenarios on physical phones and both browser/installed-app contexts.

## Options considered

| Option | Benefit | Tradeoff |
| --- | --- | --- |
| Keep full verification before rendering | No unverified stored package is displayed. | Full-package work remains on every cold-start rendering path. |
| Fast reopening followed by background verification (not selected) | The map can render after checking the package metadata, required chunk presence, header, selected style, and resources needed for the initial view. | Integrity of content not yet checked remains provisional; later failure needs explicit recovery. |
| Verify fully at download/update activation, with explicit rollback verification (selected) | Avoids recurring full-package reads. | Later corruption outside currently requested content may go undetected; weaker ongoing assurance. |

## Implemented policy

Full streamed and stored-byte verification remains mandatory before activating downloads or updates, covering the archive and all supporting resources. Explicit rollback also fully verifies the retained candidate before switching the pointer.

Startup and foreground reopening of previously activated generations instead validate the saved manifest and package identity, query all expected chunk keys, and read both styles and the PMTiles header for compatibility. The key query covers every archive chunk and all styles, sprites, glyphs, fonts, and attribution resources without reading every payload. Existing installed generations need no migration or redownload. Failed replacement recovery uses lightweight reopening too.

There is no routine background full-package scan. Availability means that installation passed full verification and current lightweight checks pass; it does not mean every byte was hashed again this session. Missing keys are detected immediately. Truncated/unreadable bytes reached later invalidate only the matching active generation; renderer errors retain their separate recovery path. Same-length corruption, especially outside the current view, can remain undetected. This is an explicit accepted tradeoff, not a claim that parsing detects every alteration.

After initial inventory resolution, foreground reconciliation is silent: preserve the current banner and controls until an actual availability change. Successful style/header validation is reused for the same immutable generation within the session; returning to the window checks chunk keys without rereading those payloads. A fresh session or changed generation validates styles/header again. This avoids repeated Checking map announcements, disabled actions, and collapsed Repair options while still detecting missing records.

Repair/redownload remains explicit and verifies its replacement completely. Rollback is an explicit full verification path; no new Verify button is introduced. Checks do not silently delete installed maps or redownload them. Existing locks and coalescing coordinate checks with replacement/deletion; stale read failures cannot invalidate a newer generation. Passport storage remains independent. IndexedDB stays the storage backend.

The earlier background-scan recommendation was conservative. There is no observed post-install byte corruption in this investigation to justify reading the complete regional package on every launch. Ordinary eviction detection and byte-for-byte integrity assurance are different checks.

## Validation

Reload follow-up: style-resource validation itself was expensive even after removing whole-package hashing. For every glyph reference it scanned the manifest and repeatedly normalized resource URLs. An isolated Node run using both actual Washington styles measured 946 ms for light and 915 ms for dark. Replacing the repeated scans with one normalized URL set per validation measured 38 ms and 13 ms in a subsequent run. These are individual local CPU observations, not browser startup timings or phone speedup guarantees. Both styles still pass the same validation, and removing required glyph ranges still fails. No compatibility or integrity checks were removed by this optimization.

A separate fresh automated Chromium context installed the complete Washington package from the rebuilt 5173 preview, then reloaded. The offline-availability banner appeared at approximately 396 ms after navigation, and the renderer's ready state at 832 ms. This was one local desktop reload with an installed package and network available, not a cold offline/PWA or physical-phone benchmark. No user browser profile was used. All 33 core unit tests, core lint/build/typecheck, app build/typecheck, and map asset verification passed after the lookup optimization.

Core regressions exercise bounded reopening reads across startup/foreground, offline tail reads, absent archive/resource keys, deferred tail corruption, truncated reads, corrupt stored downloads, failed replacement, and corrupt rollback rejection. The pre-change desktop observation above is historical; it is not a measurement of this implementation or a promised speedup.

Application acceptance should exercise a fully downloaded real package with network disabled, both appearances, unseen-area navigation, visit preservation, and physical iPhone/PWA startup timing. Existing Chromium/WebKit automation does not establish real-device timing or replace the documented narrow WebKit cold-navigation limitation.
