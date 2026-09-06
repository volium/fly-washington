# Development and handoff

## Scope and ownership

Started 2026-09-06 from the architecture plan in `passport-core/Planning.md`. The plan's `core-passport` name refers to the actual `passport-core` checkout. These remain independent repositories.

`@passport/core` owns typed contracts, responsive UI, map behavior, filters, IndexedDB, visits/history, progress, and portable JSON. This app owns Washington data and copy, the source-import pipeline, region colors, composition, PWA assets, Vite configuration, browser tests, and Pages workflow.

The first slice uses direct TypeScript/DOM components, Leaflet 1.9.4, IndexedDB via idb, Vite, vite-plugin-pwa/Workbox, Vitest, ESLint, and Playwright. The DOM approach keeps this initial package small without adding a UI framework contract. User notes are rendered as text using escaping. Program configuration is trusted app-owned code; validate program data before mounting.

## Package development

`package.json` consumes `file:vendor/passport-core-0.2.0.tgz`. The archive and package lock are versioned inputs: app CI builds without checking out a sibling repository. Local edits in `passport-core` do not affect this app until packed. Core 0.2.0 adds optional identifiers, addresses, runways, cautions, and sources, plus alias search and reference-detail rendering; storage and backups remain schema version 1.

After core checks pass, run `npm run core:pack` here. This builds/packs the sibling core and refreshes the app install/lockfile. Run the app checks and browser tests, then commit the archive and lockfile together. Increment the core version and app reference for future released changes. A registry release and automated dependency upgrades are later work.

After repacking a core version while Vite is running, restart with `npm run dev -- --force` to refresh its dependency cache. Washington uses `map.markerDetailZoom: 9` for compact statewide markers; airport labels become persistent at closer zooms. Selected markers retain their labels.

## Maps, cost, and offline behavior

Leaflet is BSD-2-Clause. The current basemap uses the public OpenStreetMap raster tile endpoint, without a paid subscription or key, and displays attribution. Its public service has limited donated capacity and no availability guarantee. Honor the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/): visible interactive tiles only, normal browser caching/referrer behavior, no bulk download, prefetch, or offline tile archives. Re-evaluate the configured provider if usage grows. Map provider URL and attribution live in program configuration.

The app's service worker precaches only built app assets and the bundled airport data. It never caches OSM tile responses in Cache Storage. Browser HTTP caching follows the provider's headers. Offline mode still supports markers, list, filters, details, visits, and backup; a detailed offline basemap is not part of this milestone. Failed tiles produce an explanatory status. Dark mode dims the basemap separately from accessible markers and controls.

## Storage and backup

No accounts or backend. Visits live in IndexedDB on the current origin. Preferences use localStorage only for the theme; passport data does not. Browser data deletion can erase visits. Export JSON before clearing data or changing hosts. The UI supports date-only historical visits, repeat visits, notes, editing, and confirmation before deletion. All current visits are explicitly unverified.

Schema/backup version 1 is documented in the core README. Restore is validated and add-only: matching IDs are skipped, existing records preserved, new records committed atomically. This is device transfer/backup, not synchronization. Attachments and ZIP archives are deferred.

## Desktop, mobile, PWA, and hosting

See README for LAN testing. Plain HTTP on a phone does not enable service workers/PWA installation. Use HTTPS for full physical-device testing; an HTTPS GitHub Pages deployment is the intended first host. No deployment has been requested or performed.

`npm run build` produces a static `dist/` folder. `BASE_PATH` configures subdirectory hosting; for this repository set `/fly-washington/`. The manifest uses relative identity/start/scope and PNG icons. The generated worker updates after the old app is closed; it does not force a reload while a visit form is being edited. Development mode intentionally has no service worker.

The GitHub Actions workflow runs lint, types, data checks, tests, a production browser suite, and the Pages build. To deploy later, configure the repository's Pages source as GitHub Actions and manually dispatch the workflow on `main` with `deploy` selected. Deployment depends on passing checks. Remote CI has not been run from this workspace.

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

## Local validation — 2026-09-06

Full-data milestone: six core tests and five program/data tests pass, along with lint, typecheck, deterministic generation checks, and production build. The expanded browser suite has eight successful scenarios and the existing expected Windows WebKit offline failure (nine scenarios total). It covers 115 markers, seven regions, four seaplane entries, nineteen Olympic entries, real multiple stamp locations, backups, and offline behavior. The following initial-slice results are retained as historical context.

Core lint, typecheck, build, and five domain/storage tests pass. App lint, typecheck, configuration test, root production build, and `/fly-washington/` Pages build pass. The final browser run has five successful scenarios and one explicitly expected Windows WebKit failure (Playwright reports six passed because the expected failure is satisfied). Browser coverage exercises marker selection, mobile list view, themes, filters, date-only check-ins, note escaping, edit/delete, reload persistence, JSON export/restore, and duplicate import handling. Desktop/mobile light/dark screenshots were inspected; online OSM tiles load, and the tested layouts have no horizontal overflow. Remote CI and deployment remain unrun.

Windows WebKit 2359 has one explicitly expected failure in the offline reload scenario: after `context.setOffline(true)`, navigation reports `WebKit encountered an internal error`. Investigation confirmed that CacheStorage still contains readable HTML and online reloads are served by the service worker. The normal mobile WebKit workflow passes; this does **not** establish physical iPhone offline support. Desktop/mobile Chromium offline reload and save both pass. Linux CI still runs the WebKit offline test without an expected-failure annotation. Do not remove this caveat until verified on an actual iPhone or the runtime issue is resolved.

For this workstation, a portable Node 24.20.0 toolchain and Playwright browsers were downloaded into the user temporary directory; no system installation or PATH change was made. For new terminals, install Node 24 LTS normally or add the portable runtime directory to that terminal's PATH. Setup commands in README assume Node/npm are available.
## Airport coordinate reviews (2026-09-06)

The app uses the owner-approved original Copalis (S16) program map position, `47.144664, -124.189073`, and retains the owner-confirmed OurAirports position for Port of Whitman (S94, app ID KS94), `46.8587, -117.414001`. Both decisions are recorded in `data/sources/airport-location-overrides.json`. The reconciliation report preserves both source disagreements as resolved, and neither airport displays an unresolved-coordinate caution. Source-coordinate changes invalidate the corresponding review. See DATA-SOURCES.md for decisions and the regeneration workflow. No stamp GPS targets were added.
