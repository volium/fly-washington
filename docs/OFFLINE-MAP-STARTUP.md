# Saved-map startup investigation

Status: investigated on 2026-09-19; optimization is proposed, not implemented. Keep this separate from the export feedback, title focus, and storage-copy fixes in core 0.6.1.

## Current behavior

`passport-core/src/map/offline/manager.ts` calls `verify()` during `checkInventory()`, on startup and foreground refresh. Verification reads and hashes the complete archive and every supporting resource, validates both styles, and checks the PMTiles header. Only afterward does it publish the active package. On initial launch, `src/map/renderer.ts` deliberately waits while the manager is checking and has no active package.

Without an installed package, the inventory check finishes quickly and the renderer requests the online style and the archive ranges needed for the current view. It does not download or verify the entire regional archive before painting. That explains the perceived responsiveness difference; it does not by itself demonstrate that IndexedDB is the wrong storage backend.

## Local observation

An isolated Chromium 1243 test context loaded the existing production preview at localhost:5173, installed the complete Washington z12 package, then reloaded. An initialization script counted successful `chunks` object-store reads in the map database and observed the navigation status transition. User browser profiles and passport data were not touched.

- Checking began at 76.3 ms after navigation.
- Map available offline appeared at 3,212.8 ms: approximately 3,136.5 ms spent in the checking interval.
- By that transition, 863 chunk reads had returned 94,097,692 bytes.
- The package payload is 93,010,324 bytes. The read count includes repeated chunk access for style/header checks, so it is not a new package-size measurement.

This is one instrumented local desktop observation, including browser scheduling and storage work. It is not an iPhone measurement, a benchmark of hashing alone, or a promised speedup. A comparison should repeat identical cold-start scenarios on physical phones and both browser/installed-app contexts.

## Options

| Option | Benefit | Tradeoff |
| --- | --- | --- |
| Keep full verification before rendering | No unverified stored package is displayed. | Full-package work remains on every cold-start rendering path. |
| Fast reopening followed by background verification (recommended) | The map can render after checking the package metadata, required chunk presence, header, selected style, and resources needed for the initial view. | Integrity of content not yet checked remains provisional; later failure needs explicit recovery. |
| Verify fully only at download/update time | Avoids recurring full-package reads. | Later corruption outside currently requested content may go undetected; weaker ongoing assurance. |

## Proposed separate change

Retain complete integrity checks before activating any newly downloaded or replacement package. For a previously activated immutable generation, distinguish usable-for-rendering from fully checked offline availability. Do a fast metadata/presence/header/style check, allow local rendering, and verify remaining content at lower priority without delaying the initial map.

Keep the status honest: rendering a saved map must not imply every offline resource has been reverified. Corrupt/missing bytes must remain actionable; background checks must not silently delete the map or automatically redownload it. Never overwrite a newer generation's state with a stale check result. Coalesce foreground checks and coordinate verification, replacement, and deletion across tabs. Preserve passport records independently.

Acceptance should cover time to first usable map, bytes read before first paint, offline unseen-area navigation, both appearances, missing resources, corrupted archive chunks outside the current view, failed replacement, cross-tab races, and recovery. Keep the existing IndexedDB adapter for this experiment; a storage-backend migration would confound the comparison.
