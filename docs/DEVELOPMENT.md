# Development and handoff

## Scope and ownership

Passport implementation status (2026-09-26): core 0.7.0 and the consuming app were committed and pushed after owner testing. The owner has also approved the 0.7.1 refinements and authorized commit/push. Core owns reusable behavior and schema changes; the app consumes the tested package. Earlier candidate notes below describe historical validation.

Database version 2 adds ordering and revision metadata without changing existing visits. New backups use version 2; version-1 imports remain supported. Confirmed local ordering wins over conflicting imports, and imports moving stamp dates require review before saving. Keep an export before testing the migration: older core builds requesting database version 1 cannot open the upgraded database. Core's packaged `docs/PASSPORT-COLLECTION.md` records the complete contract and test checklist. Physical phone dragging and screen-reader acceptance remain pending.

Candidate validation (2026-09-26): core typecheck/lint/build and 40 unit tests pass. The full 28-scenario core browser run passed; all nine collection scenarios passed after the final dialog/draft fixes, including the added Escape/draft regression. Packaged-app tests passed 34 scenarios across desktop Chromium, mobile Chromium, and mobile WebKit. Five cases were skipped: four desktop-only layout cases and the existing narrowly scoped WebKit internal cold-offline reload error. App lint, eight program tests, production typecheck/build, and complete map verification passed. The local preview uses the refreshed production build on port 5173; no implementation commit or push has been performed.

Historical Passport planning record (2026-09-20): the next approved feature is documented in the sibling passport-core checkout's docs/PASSPORT-COLLECTION.md and Planning.md Sections 23-25 / Phase P1. Keep regional progress cards and make them expandable; add My stamps with alphabetical/collection-order views, one stamp per airport, repeat-visit history, earlier-date confirmation, and same-date-only drag ordering with keyboard support. This is not implemented. Core owns the reusable UI, ordering, storage/migrations, and backup contract; this app supplies Washington data and later validates the packaged feature on desktop/mobile. No program map release or regeneration is needed. Schema, earliest-visit deletion/correction, and import/conflict details are explicitly pending review before implementation.

Started 2026-09-06 from the architecture plan in `passport-core/Planning.md`. The plan's `core-passport` name refers to the actual `passport-core` checkout. These remain independent repositories.

`@passport/core` owns typed contracts, responsive UI, map behavior, filters, IndexedDB, visits/history, progress, and portable JSON. This app owns Washington data and copy, the source-import pipeline, region colors, composition, PWA assets, Vite configuration, browser tests, and Pages workflow.

The first slice used Leaflet 1.9.4; core 0.5.0 now uses direct TypeScript/DOM components, MapLibre/PMTiles, IndexedDB via idb, Vite, vite-plugin-pwa/Workbox, Vitest, ESLint, and Playwright. The DOM approach keeps this initial package small without adding a UI framework contract. User notes are rendered as text using escaping. Program configuration is trusted app-owned code; validate program data before mounting.

## Package development

`package.json` consumes the local testing candidate `file:vendor/passport-core-0.7.0.tgz`. Core 0.5.1 fixes wheel and pinch zoom over airport markers; page pinch-zoom remains available outside the map. The archive and package lock are versioned inputs: app CI builds without checking out a sibling repository. Local edits in `passport-core` do not affect this app until packed. Core 0.4.1 adds viewport-based initial map fitting and hollow/filled visit markers; 0.4.0 added the viewport-height explorer and My passport panel; 0.3.0 added configurable map styles and saved per-program preferences; 0.2.0 added airport reference fields. The current candidate uses database/export schema version 2 and retains version-1 backup imports. Earlier versions used schema version 1.

After core checks pass, run `npm run core:pack` here. This builds/packs the sibling core and refreshes the app install/lockfile. Run the app checks and browser tests, then commit the archive and lockfile together. Increment the core version and app reference for future released changes. A registry release and automated dependency upgrades are later work.

After repacking a core version while Vite is running, restart with `npm run dev -- --force` to refresh its dependency cache. Washington uses `map.markerDetailZoom: 9` for compact statewide markers; airport labels become persistent at closer zooms. Selected markers retain their labels.

The saved visit confirmation uses a muted version of the active green button styling in both themes; the button remains disabled during the four-second confirmation. After changing core styles, run `npm run core:pack` and restart Vite so the checked-in package and dependency cache use the updated stylesheet.

Map selection UX: clicking empty map space clears selection and closes details, keeping the map position/zoom and visited/region styling. Dragging and zooming preserve selection; clicking another marker switches airports. Mobile details cover the map and keep the existing All airports dismissal. The behavior lives in core; a desktop browser regression in this app covers these interactions.

## Maps, cost, and offline behavior

The application owns the versioned Washington PMTiles archive, coverage/detail policy, release metadata, and complete local resource inventory. Core owns the renderer, download/status UI, storage abstraction, integrity checks, updates, rollback, and deletion. No backend, tile server, provider key, public OSM tile prefetch, or MBTiles database is introduced.

See [the offline map release record](OFFLINE-MAPS.md) for preparation commands, measured z9-z13 candidates, browser evidence, retained artifacts, Pages checks, and remaining acceptance gates. App-shell precaching excludes `maps/**`; it includes the renderer worker and program bundle. Browser downloads and updates are explicit; first eligible standalone launch downloads the initial map automatically with Cancel and retained retry suppression. The three readiness states (shell/program/passport, map installation, browser persistence) are not inferred from network connectivity.


## Storage and backup

No accounts or backend. Visits live in IndexedDB on the current origin. Preferences use program-scoped localStorage for appearance; passport data does not. Browser data deletion can erase visits. Export JSON before clearing data or changing hosts. The UI supports date-only historical visits, repeat visits, notes, editing, and confirmation before deletion. All current visits are explicitly unverified.

Schema/backup version 1 is documented in the core README. Restore is validated and add-only: matching IDs are skipped, existing records preserved, new records committed atomically. This is device transfer/backup, not synchronization. Attachments and ZIP archives are deferred.

## Desktop, mobile, PWA, and hosting

The desktop explorer fills the viewport beneath a compact header. Persistent Explore / My passport tabs control the sidebar content while the full map, controls, and attribution remain visible. Airport browsing, details, and passport content scroll independently beneath the tabs. My passport contains regional progress, Export/Import, program description, and data/source notice. Switching tabs preserves airport selection and unfinished visit fields.

On mobile, the same tabs sit beneath the header. My passport replaces the main content; Explore restores the Map/List choice, filters, and map position. My passport has no Close button or modal focus trap. Arrow keys and Home/End navigate the tabs. Only airport details use a full-screen modal, inert background controls, focus containment, and Escape dismissal. Short mobile viewports allow page scrolling. The desktop approach is owner-approved; physical mobile acceptance remains planned after deployment.

See README for LAN testing. Plain HTTP on a phone does not enable service workers/PWA installation. Use HTTPS for full physical-device testing; an HTTPS GitHub Pages deployment is the intended first host. No deployment has been requested or performed.

`npm run build` produces a static `dist/` folder. `BASE_PATH` configures subdirectory hosting; for this repository set `/fly-washington/`. The manifest uses relative identity/start/scope and PNG icons. The generated worker updates after the old app is closed; it does not force a reload while a visit form is being edited. Development mode intentionally has no service worker.

The GitHub Actions workflow runs lint, types, data checks, tests, a production browser suite, and the Pages build. Successful pushes to `main` automatically deploy the tested build to GitHub Pages. Pull requests and pushes to other branches run checks without deploying. Manual deployment remains available by dispatching the workflow on `main` with `deploy` selected. The repository's Pages source must be GitHub Actions. Deployment depends on passing checks. Remote CI has not been run from this workspace.

## Remaining milestones

Official award sources have been reviewed; see [AWARDS.md](AWARDS.md). Implementation must distinguish current map participation from dated award eligibility and official validation. The existing roster-progress engine cannot yet handle these distinctions.

The full real-data roster is integrated: 115 official-map airports, seven regions, 153 runway records, and source-provided stamp instructions. All entries are reconciled with OurAirports; the explicit crosswalk preserves existing visit IDs. Seaplane Bases is a regular region in the shared progress engine. Four source discrepancies are documented in [DATA-SOURCES.md](DATA-SOURCES.md) and `data/reconciliation-report.json`. Regenerate with `npm run data:generate`; CI checks output freshness with `npm run validate:data`.

The owner's spreadsheet was also inspected on 2026-09-06. Its 115 airport rows agree with the map's region counts and provide additional identifier candidates. The owner corrected Olympia's code to `OLM`; a refreshed CSV verified it. The workbook and personal progress remain exclusively in Git-ignored local files. See the source assessment for identifier aliases, snapshot freshness, and undated-history handling before implementing an import.

- Resolve the documented coordinate discrepancies, collect precise stamp targets and missing access/amenity details, and implement dated award eligibility. The full captured airport roster and seven region assignments are complete.
- Add program-configured amenities/runway/stamp filters and mobile filter sheet as the filter set grows.
- Implement GPS evidence with permission/error paths and geolocation tests. Preserve historical/unverified visits.
- Add photo resizing and binary storage, attachment limits, and full ZIP backup/restore.
- Implement configurable achievements and repeat-completion semantics.
- Add Oregon fixture/app validation without creating a dependency from core to a program.
- Harden cross-tab updates, storage lifecycle, schema migrations, accessibility, and PWA update UX as real use warrants.
- Publish a versioned core package, validate clean registry consumption, and add dependency-update automation.

Keep this document, core README/public contracts, and the plan's implementation status current as each milestone advances. Record checks actually run separately from checks merely configured in CI.

## Historical local validation — 2026-09-06

Tabbed explorer (core 0.4.0), approved on desktop: core lint/typecheck, seven tests, and build pass; app lint/typecheck, nine program tests, data validation, and the /fly-washington/ production build pass. Full browser suite: 26 passed, seven skipped (six desktop-only cases on mobile and the existing conditional WebKit offline reload exception). Coverage includes persistent tabs, keyboard navigation, independent scrolling, desktop map bounds, draft preservation, mobile Map/List and filter restoration, and Export/Import through My passport. Desktop/mobile screenshots were inspected. The versioned archive now contains the tabbed layout; physical mobile acceptance and a remote deployment of this revision remain pending.

Deployment test adjustment: app lint/typecheck and the production test build pass. Targeted offline coverage reports five passed and one conditionally skipped: open-app offline save/persistence passes on desktop Chromium, mobile Chromium, and mobile WebKit; offline reload/save passes on both Chromium projects; WebKit hits the exact quarantined navigation error. The revised test has not yet been pushed or rerun in GitHub Actions. Historical expected-failure counts below describe earlier runs.

Map-style update: core lint, typecheck, seven tests, and build pass. App lint, typecheck, nine program tests, data validation, and the `/fly-washington/` production build pass. Browser results: 19 successful scenarios, the existing expected Windows WebKit offline failure, and four desktop-only scenarios skipped on mobile (Playwright reports 20 passed, four skipped). New coverage exercises CARTO light/dark/system switching, persistence, attribution, unavailable/unknown preferences, and preserving selection and unfinished visits. Automated CARTO tiles are simulated. A separate live browser check with the owner-provided dedicated basemaps key loaded 15 tiles each for Positron and Dark Matter with HTTP 200 responses; screenshots showed both styles without an API-key watermark and with CARTO/OpenStreetMap attribution visible. The key is configured only in Git-ignored .env.local. The Windows test preview needed manual shutdown after the scenarios completed for the runner to exit.

Map deselection update: core lint, typecheck, six tests, and build pass; app lint, typecheck, data validation, seven program tests, and the production browser build pass. The new desktop interaction regression passes (mobile variants are skipped because details cover the map). Existing desktop/mobile workflows passed in the browser suite, with the previously documented expected Windows WebKit offline navigation failure retained.

Full-data milestone: six core tests and five program/data tests pass, along with lint, typecheck, deterministic generation checks, and production build. The expanded browser suite has eight successful scenarios and the existing expected Windows WebKit offline failure (nine scenarios total). It covers 115 markers, seven regions, four seaplane entries, nineteen Olympic entries, real multiple stamp locations, backups, and offline behavior. The following initial-slice results are retained as historical context.

Core lint, typecheck, build, and five domain/storage tests pass. App lint, typecheck, configuration test, root production build, and `/fly-washington/` Pages build pass. The final browser run has five successful scenarios and one explicitly expected Windows WebKit failure (Playwright reports six passed because the expected failure is satisfied). Browser coverage exercises marker selection, mobile list view, themes, filters, date-only check-ins, note escaping, edit/delete, reload persistence, JSON export/restore, and duplicate import handling. Desktop/mobile light/dark screenshots were inspected; online OSM tiles load, and the tested layouts have no horizontal overflow. Remote CI and deployment remain unrun.

WebKit offline reload reports `WebKit encountered an internal error` locally on Windows/WebKit 2359 and in the Linux CI log supplied by the owner. The cause has not been established as an upstream-only bug. Coverage is now split: an open app must save a visit offline and retain it after reconnect/reload on every browser; a separate test attempts offline reload and saving. Only the exact WebKit internal error thrown by that offline reload triggers a conditional skip, on any OS. Service-worker control, cached HTML, and absence of cached provider tiles are checked before the reload. Other navigation errors and all assertion failures still fail. A successful WebKit offline reload runs the remaining assertions normally. This is a documented test exception, not evidence of physical iPhone offline startup support; device verification remains open.

For this workstation, a portable Node 24.20.0 toolchain and Playwright browsers were downloaded into the user temporary directory; no system installation or PATH change was made. For new terminals, install Node 24 LTS normally or add the portable runtime directory to that terminal's PATH. Setup commands in README assume Node/npm are available.
## Airport coordinate reviews (2026-09-06)

The app uses the owner-approved original Copalis (S16) program map position, `47.144664, -124.189073`, and retains the owner-confirmed OurAirports position for Port of Whitman (S94, app ID KS94), `46.8587, -117.414001`. Both decisions are recorded in `data/sources/airport-location-overrides.json`. The reconciliation report preserves both source disagreements as resolved, and neither airport displays an unresolved-coordinate caution. Source-coordinate changes invalidate the corresponding review. See DATA-SOURCES.md for decisions and the regeneration workflow. No stamp GPS targets were added.

Map presentation (core 0.4.1), approved locally: core lint/typecheck, seven unit tests, and packaging pass; app lint/typecheck, nine program tests, data validation, and the /fly-washington/ production build pass. The browser suite produced 28 passes and seven existing skips, with one new viewport coverage assertion initially too strict for mobile WebKit (54.7% versus 55%). After correcting the majority-of-axis threshold to 50%, all three initial-fit cases passed on rerun. Every marker must also remain inside the map bounds. Existing workflow coverage now verifies hollow unvisited and filled visited circles and accessible status labels. Initial desktop/mobile screenshots were inspected; basemap network availability is outside this geometry check. Physical mobile acceptance follows deployment.

Approved UI polish (core 0.4.2): matching boxed legend circles and Export/Import styling; Fly Washington now uses CARTO only. Core/app lint, type checks, 16 total unit tests, data validation, packaging, and Pages build pass. Browser suite: 26 passed and seven existing skips; the remaining three instances of the storage-unavailable scenario passed on targeted rerun after removing an obsolete map-selector interaction. Existing visit/backup workflows pass across desktop Chromium, mobile Chromium, and mobile WebKit. Physical-device acceptance remains separate from browser emulation.

Visit feedback (core 0.4.3), approved: no floating map notifications; four-second disabled save confirmation; retained deleted visit details followed by collapse; draft-preserving history updates. Core/app lint, type checks, 16 unit tests, data validation, packaging, and Pages build pass. Browser suite: 32 passed, seven existing skips. New desktop/mobile coverage verifies disabled saving, duplicate-submit prevention, unchanged button dimensions, timed restoration/collapse, retained visit details, and preserved form identity/drafts. Import confirmations are checked in My passport. Desktop deletion screenshot inspected; physical-device acceptance remains separate.

FAA labels and selection priority (core 0.4.4), approved: display FAA identifiers consistently without changing storage IDs or alias search; selected airport markers and labels sit above ordinary markers/labels for every airport. Core/app lint, type checks, 16 unit tests, data validation, packaging, and Pages build pass. Full browser run: 29 passed and nine skips, with seven failures due to stale KORS label expectations and a new tooltip assertion not allowing Leaflet fade-out. Corrected targeted rerun: eight passed and the existing WebKit offline-reload skip. All 36 applicable scenarios therefore pass across runs; eight skips are desktop-only cases on mobile. Coverage includes the seven requested label examples and generic selection priority exercised with RNT/W36. Physical-device acceptance remains separate.

Mobile map update (core 0.4.5), approved: map taps show an airport preview before explicit details; list/desktop selection opens details directly. Mobile zoom buttons are hidden. Marker/legend borders share responsive thickness. General labels use all-or-none viewport spacing with selected labels retained. Core/app lint, type checks, 16 unit tests, data validation, packaging, and Pages build pass. Full browser run: 42 passed, ten skips, and two new outline assertion failures due to browser fractional-border rounding and a stale element during map rendering. Corrected current-element comparison passed on all three browsers in a targeted rerun, covering all 44 applicable scenarios across runs. Nine skips are device-specific cases; one is the existing WebKit offline reload exception. Mobile WebKit preview screenshot inspected; physical-device acceptance remains separate.

## Offline access UI (core 0.6.0, local implementation)

The approved mockup is now implemented in core, with an independent centered card, numeric progress, collapsible installation/repair/protection details, and automatic persistence checks. App-owned `src/installation-guidance.ts` supplies platform instructions; no map archive changes are required. Repack core and rebuild the production output before testing through port 5173; a running preview serves the new dist, while a development server should restart with `--force` after a tarball update.

Test first visit, Close/Escape and reopening from either tab, browser Download, installed-app automatic start/Cancel/restart, storage protection, and complete offline reload. The same LAN address with port 5173 remains useful for layout testing, but HTTP on a phone LAN address may lack the secure-context APIs required for PWA/storage acceptance. Use a secure origin for those tests. Physical iOS/Android acceptance remains pending; simulated standalone/browser tests are not installation tests.

Validation (2026-09-19): core typecheck/lint/build and 27 unit tests pass. All 11 core browser scenarios passed; the three offline-card/standalone/recovery scenarios were rerun after the final protection-context change and passed. App typecheck/lint/build, eight program tests, and complete map verification pass. Desktop/mobile Chromium product tests covered 33 applicable scenarios across the full run and targeted reruns; five layout-specific scenarios were skipped. The first full run stopped at two obsolete Delete-map clicks after successful cold offline rendering; corrected assertions passed in the targeted rerun. WebKit first-use UI passed; its full-map test installed and rendered offline before the existing internal cold-navigation exception caused a skip. Physical installed-PWA acceptance remains pending. The 0.6.0 tarball matches its lockfile integrity, and port 5173 was verified to serve the final production bundle.

## UI fixes (core 0.6.1)

The owner reports the deployed 0.6.0 UI working and identified follow-up issues. Three separate core fixes implement export success feedback beneath its initiating button for five seconds (`888321d`), remove the non-interactive title focus outline while retaining keyboard control outlines (`c4d3a31`), and remove routine storage-headroom wording while retaining download size and quota checks (`af69ff4`). Core 0.6.1 packages these fixes.

Saved-map startup verification is unchanged. The measured cause, alternatives, and proposed separate change are recorded in [the startup investigation](OFFLINE-MAP-STARTUP.md). Physical-device timings are still needed.

Validation for 0.6.1: core typecheck/lint/build and all 27 unit tests passed. Thirteen core browser scenarios passed across the full run and targeted rerun; a test-only missing-layer race was corrected separately (`f94c1d8`). The app card test and direct tests of both export actions passed on desktop Chromium, mobile Chromium, and mobile WebKit. The broader passport/backup workflow passed on both Chromium layouts; WebKit timed out at the unchanged Edit-visit action before export, and that separate failure remains unresolved. App build/typecheck/lint and complete map verification passed. The tarball integrity matches the lockfile and port 5173 serves the refreshed production build. Nothing has been pushed or deployed by the agent.

## Backup feedback (core 0.6.2)

My passport export feedback now spans the content width below the backup button row. Import completion and cancellation expire after five seconds; pending work and actionable errors remain visible until replaced by the owning operation. Feedback stays with the initiating card even when a tab changes. Export now says **Backup prepared. Save the file from your browser to keep a copy of your visits.** The app cannot confirm a completed save through the portable anchor-download mechanism.

The reusable [feedback contract](../../passport-core/docs/FEEDBACK.md), also included in the packaged core documentation, inventories backup, visit, storage, and offline-map messages. Existing four-second visit confirmations and persistent offline readiness/progress retain their respective behavior. Core Planning sections 44 and 46 specify the backup requirements.

Import uses a real button to synchronously activate the file input, with chooser instructions, cancellation, and error feedback. A WebKit experiment found that `showPicker()` on a hidden input returned without a chooser; `click()` opened it, so the implementation uses `click()`. This is evidence from the test browser, not a diagnosis of the original deployed failure.

The owner reports that import fails in Chrome on iOS Incognito but works in Chrome on Windows Incognito. The physical iOS case remains open: after deploying, check whether the chooser appears, whether selecting a compatible JSON backup reaches an import count, and whether the visits appear. If it fails, record the visible message and the exact stage. Do not use private-mode detection or disable import merely because a session is private. Automated file-chooser interception and isolated browser contexts cannot establish the behavior of Chrome's native iOS Incognito interface.

Validation: core typecheck/build/lint and 27 unit tests passed; the initial 15-scenario browser suite passed, and all four affected scenarios passed again after the final changes, including the added asynchronous import/tab-switch case. App lint, eight program tests, production build/typecheck, and complete map verification passed. All six backup feedback/chooser checks passed across desktop Chromium, mobile Chromium, and mobile WebKit after correcting the WebKit activation issue. The 0.6.2 archive matches its lockfile integrity; port 5173 serves the final rebuilt production HTML. Saved-map startup behavior and the previously documented broader WebKit Edit-visit failure are outside this change. No push or deployment was performed.

Core fixes are separate commits: card-width export feedback (`81ad637`), truthful export wording (`8dca109`), and import feedback/contract (`7740063`), followed by version packaging (`a20a700`).

### Intermittent iOS import after saving an export (historical investigation)

The observations and proposed checks below record the earlier investigation. The completed device results are in [the investigation outcome](#chrome-on-ios-investigation-outcome).

Further owner testing narrows the Chrome iOS Incognito report: Import works initially, but sometimes stops opening after Export followed by saving the backup. This is intermittent; the cause is not established. Export disables only its own button. Import has independent busy state, and export's ten-second cleanup revokes only the generated download URL. No production workaround has been added based on this correlation.

The regression in `tests/e2e/export-feedback.spec.ts` now imports one visit, exports and saves a real backup, opens the import chooser again, and imports that saved file without duplicating the visit. It repeats the sequence after advancing past the download URL cleanup and verifies the visit after reload. It passes on desktop Chromium, mobile Chromium, and mobile WebKit; lint and typecheck also pass. Playwright saves the download through its automation API, bypassing Chrome iOS's native Save/Share interface, so these results do not reproduce or resolve the reported native-interface failure.

Next device observation: when it fails, does tapping Import show the chooser instruction, leave an importing status, or produce no response? Does reload restore the chooser? A chooser instruction indicates the handler ran; an importing status indicates a file was selected and processing began. These distinguish picker presentation from file/storage processing and a tap or disabled-control problem. Do not increase delays, clear browser data, automatically reload, or replace the export mechanism without evidence connecting that change to the failure.

### Import recovery candidate (core 0.6.3, historical)

The owner has now confirmed that a failed tap shows the cancellation message without opening the chooser, and reloading restores Import. The same failure occurs in normal Chrome iOS, so Incognito is not a necessary trigger. That message comes from a cancel event or an empty file selection, before file reading or storage writes. It does not establish that the user deliberately cancelled, or identify whether the stuck state belongs to the input element or Chrome's native interface.

Core 0.6.3 uses a fresh hidden file input on each explicit Import attempt, activated synchronously in the user's click. Delegated events support replacements and prevent detached inputs from overwriting the current feedback. No-selection feedback is neutral and expires after five seconds. Recovery guidance mentions saving unfinished visits before reloading, instead of switching to normal mode. There is no automatic reload, retry, storage deletion, or export cleanup change.

This is a bounded recovery candidate for stale input state, not a confirmed fix for the device failure. Retest Import, Export/save, then Import repeatedly in normal and Incognito Chrome iOS. If the same symptom persists, replacing the input alone is insufficient; investigate the browser's native picker/download handoff rather than adding arbitrary delays. The regression with a simulated element that always cancels verifies replacement and stale-event isolation, not Chrome iOS internals.

Validation: core lint/typecheck/build and all 17 browser scenarios passed. After the final recovery-copy update, all nine app backup scenarios passed on desktop Chromium, mobile Chromium, and mobile WebKit. App lint, production typecheck/build, and full map verification passed. The packaged 0.6.3 archive matches the lockfile integrity, and port 5173 serves the final production build. Physical Chrome iOS acceptance in both browsing modes remains pending. No push or deployment was performed.

### Chrome on iOS investigation outcome

Physical-device testing reproduced the export/save followed by immediate picker cancellation in Chrome on iOS 26, in normal and Incognito modes. The owner could not reproduce it in Safari, including in Fly Washington. This strongly points to Chrome-on-iOS integration; the exact native cause and affected browser versions remain unconfirmed.

| Control | Observed result |
| --- | --- |
| Import only | 16 attempts without failure. |
| Delay after export | Failed after a 17.253-second interval from download initiation. |
| Retain export URLs | Failed after export #3, 16.265 seconds after download initiation; no URLs had been revoked. |
| Standalone dummy export and directly tapped visible input | Failed after export #4; five native cancellations took 10-18 ms, without blur/focus transitions. |
| Safari on the same phone | Owner could not reproduce, including in the app; not a guarantee for every version. |

The standalone reproduction requires no Passport Core, passport storage, input replacement, hidden-input activation, or URL cleanup. Retaining URLs and replacing inputs are not fixes for this defect. Preserve ordinary export cleanup and the existing neutral no-selection message, with guidance to save unfinished visits before reloading. Automated Chromium/WebKit tests do not substitute for physical Chrome-on-iOS validation.

At investigation cleanup, temporary application diagnostics and the unpublished diagnostic 0.6.4 package were removed and the app returned to the existing 0.6.3 archive. Its committed fresh-input behavior remains, but is no longer described as a validated browser fix. No new runtime workaround was introduced.

The [standalone reproducer](diagnostics/backup-picker-test.html) is retained outside public deployment assets, together with [reproduction instructions](diagnostics/README.md). It uses dummy data and retains temporary URLs only for the controlled experiment. Do not copy it into public assets for deployment. Before filing a browser report, include exact Chrome/iOS versions, the observed save workflow, the minimal page, and a sanitized log. No browser report has been submitted.

### Lightweight offline map startup (core 0.6.4)

The app now consumes a new 0.6.4 archive containing the approved saved-map startup improvement, without the removed backup diagnostics. Core checks manifest identity, all required chunk keys, both styles, and the archive header before reopening an installed generation. It no longer rehashes the entire package on startup or foreground refresh, nor schedules a background full scan. Download/update activation and explicit rollback retain full verification. No map release, schema migration, or redownload is required. See [the startup decision and accepted integrity tradeoff](OFFLINE-MAP-STARTUP.md).

Local validation: 32 core unit tests and 17 core browser tests passed, along with core typecheck/lint/build and app lint/typecheck/build/map verification. The real-package cold offline scenario passed on desktop and mobile Chromium, including local appearance resources, no map-resource network requests, and preserved visits. Mobile WebKit reached the existing narrowly scoped internal cold-navigation exception and was skipped after the preceding installation/open-app assertions; this is not a passing cold-start result. Physical iPhone/PWA timing remains pending; the old startup timing in the investigation document is not a measurement of this build. The tarball integrity matches the app lockfile and the rebuilt preview on port 5173. No commit, push, or deployment is implied.

### Passport 0.7.1 approved refinements

The approved core package shows airport names before identifiers and omits the repeated region in regional rows. Native date controls are constrained to their editor width. Earlier visits offer Save and move stamp (shows both dates), Save visit only (retains the existing stamp date/order), or Cancel (keeps the draft). Same-day repeat visits require confirmation; notes-only edits do not repeat it. Visit-only history survives edits, reloads and v3 backups. Database v3 preserves previous records; v1/v2 backups remain importable, while older app versions cannot read v3 backups/storage. The owner approved these changes after local testing. Automated WebKit checks supplement that feedback; they do not establish broader Chrome iOS compatibility. Visit histories now sort oldest first and distinguish repeat visits from explicitly excluded visits. Deletion uses an app dialog explaining the resulting stamp date, with Cancel/Escape preserving visits.

### Region presentation (owner-confirmed palette)

The program region order and exact colors are maintained in `src/program/regions.json`: Olympic #0097a7, Southwest #b10202, Northwest #f57c00, North Central #7cb342, South Central #9c27b0, Eastern #ffea00, Seaplane Bases #01579b. These values were supplied and confirmed by the owner. The region selector, Passport cards, airport-list accents, and map markers consume this shared program configuration. Core 0.7.2 adds a solid region-colored card edge, a subtle tinted surface, and a larger swatch; text retains theme foreground colors. No Washington palette is hardcoded into core. Airport IDs and region membership are unchanged.

Explore ordering: All regions follows the configured program region sequence, then airport name within each region. Selecting a region preserves alphabetical name order. Search and visited filters retain that order; source airport data and stable IDs are not reordered or rewritten.

### Compact airport details (0.7.3)

The owner selected the compact overview and expandable sections. Airport name now precedes code/region and stamp status. The collapsible sections appear in this order: Airport information, Stamp locations, Visit history. Record a visit and its editor sit at the bottom. All sections start collapsed; their state persists during in-session airport navigation. Stamp access remains available within its section, and long instructions expand in place. Airport information contains supporting description, address, runways and source links. Visit history starts collapsed and opens after saving. Successful saves close the editor, clear its draft, return focus to the recording action, and show a brief confirmation below it; failures or cancelled saves keep the editor open. Record a visit opens an inline editor; drafts survive in-session navigation. Save and Cancel draft have a consistent 12px gap, and discarding unsaved changes requires the app confirmation dialog. Core owns the reusable behavior; this app consumes the packaged release.
