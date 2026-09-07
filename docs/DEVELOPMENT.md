# Development and handoff

## Scope and ownership

Started 2026-09-06 from the architecture plan in `passport-core/Planning.md`. The plan's `core-passport` name refers to the actual `passport-core` checkout. These remain independent repositories.

`@passport/core` owns typed contracts, responsive UI, map behavior, filters, IndexedDB, visits/history, progress, and portable JSON. This app owns Washington data and copy, the source-import pipeline, region colors, composition, PWA assets, Vite configuration, browser tests, and Pages workflow.

The first slice uses direct TypeScript/DOM components, Leaflet 1.9.4, IndexedDB via idb, Vite, vite-plugin-pwa/Workbox, Vitest, ESLint, and Playwright. The DOM approach keeps this initial package small without adding a UI framework contract. User notes are rendered as text using escaping. Program configuration is trusted app-owned code; validate program data before mounting.

## Package development

`package.json` consumes `file:vendor/passport-core-0.4.1.tgz`. The archive and package lock are versioned inputs: app CI builds without checking out a sibling repository. Local edits in `passport-core` do not affect this app until packed. Core 0.4.1 adds viewport-based initial map fitting and hollow/filled visit markers; 0.4.0 added the viewport-height explorer and My passport panel; 0.3.0 added configurable map styles and saved per-program preferences; 0.2.0 added airport reference fields. Storage and backups remain schema version 1.

After core checks pass, run `npm run core:pack` here. This builds/packs the sibling core and refreshes the app install/lockfile. Run the app checks and browser tests, then commit the archive and lockfile together. Increment the core version and app reference for future released changes. A registry release and automated dependency upgrades are later work.

After repacking a core version while Vite is running, restart with `npm run dev -- --force` to refresh its dependency cache. Washington uses `map.markerDetailZoom: 9` for compact statewide markers; airport labels become persistent at closer zooms. Selected markers retain their labels.

Map selection UX: clicking empty map space clears selection and closes details, keeping the map position/zoom and visited/region styling. Dragging and zooming preserve selection; clicking another marker switches airports. Mobile details cover the map and keep the existing All airports dismissal. The behavior lives in core; a desktop browser regression in this app covers these interactions.

## Maps, cost, and offline behavior

The map style selector offers OpenStreetMap (default) and CARTO when `VITE_CARTO_BASEMAPS_KEY` is configured. CARTO uses Positron in light mode and Dark Matter in dark mode, matching the [earlier app](https://github.com/volium/fwpp/blob/main/js/map.js). System appearance changes the native CARTO tiles automatically; no extra dark filter is applied to them. The selector remembers the choice on this browser for this program and preserves selection, map position/zoom, and unfinished visit forms. Provider URLs live in `src/program/map.ts`.

Copy `.env.example` to `.env.local` and set `VITE_CARTO_BASEMAPS_KEY` to a dedicated [CARTO Basemaps key](https://carto.com/basemaps/apikey/), then restart Vite. `.env.local` is Git-ignored. This browser key is visible in built assets and tile requests; do not use a general workspace API token. For Pages builds, configure the GitHub Actions secret `CARTO_BASEMAPS_KEY`. No key means only OpenStreetMap is offered. Both providers' required attribution remains visible. CARTO's current documentation says raster basemaps are being retired; this change keeps Leaflet raster tiles to match the older app, with vector migration a future map-renderer change.

Browser tests build into `dist-e2e` with a dummy key and intercept CARTO requests with test images. They test behavior, not real provider availability or visual cartography. Normal `npm run build` writes `dist` using local/CI configuration, and is the build intended for deployment. No developer key is needed for automated tests.

Leaflet is BSD-2-Clause. The current basemap uses the public OpenStreetMap raster tile endpoint, without a paid subscription or key, and displays attribution. Its public service has limited donated capacity and no availability guarantee. Honor the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/): visible interactive tiles only, normal browser caching/referrer behavior, no bulk download, prefetch, or offline tile archives. Re-evaluate the configured provider if usage grows. Map provider URL and attribution live in program configuration.

The app's service worker precaches only built app assets and the bundled airport data. It never caches OSM or CARTO tile responses in Cache Storage. Browser HTTP caching follows the provider's headers. Offline mode still supports markers, list, filters, details, visits, and backup; a detailed offline basemap is not part of this milestone. Failed tiles produce an explanatory status. Dark mode dims OpenStreetMap separately from accessible markers and controls; CARTO uses native dark tiles.

## Storage and backup

No accounts or backend. Visits live in IndexedDB on the current origin. Preferences use localStorage for appearance and the per-program map style; passport data does not. Browser data deletion can erase visits. Export JSON before clearing data or changing hosts. The UI supports date-only historical visits, repeat visits, notes, editing, and confirmation before deletion. All current visits are explicitly unverified.

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

## Local validation — 2026-09-06

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
