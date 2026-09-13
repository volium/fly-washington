# Fly Washington Passport Program

A responsive, local-first airport passport with light/dark/system themes, a free map with no API key, airport browsing, local check-ins, notes/history, progress, and JSON backup/restore.

**Full program roster:** all 115 entries from the September 6, 2026 official program-map snapshot, reconciled with OurAirports in seven regions. Includes stamp directions and 153 runway records. Source gaps and coordinate differences are documented in [DATA-SOURCES.md](docs/DATA-SOURCES.md). Progress tracks the roster; official award validation and dated eligibility rules are separate pending features. This is not flight-planning information.

## Run on desktop

Install Node.js 24 LTS (npm included), then:

```powershell
cd C:\git\fly-washington
npm ci
npm run map:prepare
npm run dev
```

Open `http://localhost:5173`. The core package is included as a pinned archive; a sibling checkout is not required to run the app.

On desktop, the map stays fully visible while the sidebar scrolls. Use the persistent **Explore / My passport** tabs above the sidebar for airport browsing or regional progress and **Export/Import passport**. On mobile, the tabs sit beneath the header and switch the main content; Explore restores your previous Map/List view. Airport details remain a separate full-screen view on mobile.

The basemap uses self-hosted PMTiles with MapLibre and local light/dark styles. No map-provider key is required. Map preparation needs pinned go-pmtiles 1.31.2 or the retained archive URL; see [map generation, release, and acceptance](docs/OFFLINE-MAPS.md). In PowerShell, use `npm.cmd` if script policy blocks `npm`.

## Test on your phone

Keep the development server running and connect your phone to the same Wi-Fi as your PC. Find the PC's IPv4 address with `ipconfig`, then open `http://<PC-IP>:5173` on the phone. If Windows prompts, permit the development server on your private network. The dev command already listens on the network interface.

This supports responsive layout and local check-in testing. Installing the PWA, its service worker, offline reloads, and future GPS require a secure context on a physical phone: use an HTTPS deployment or a locally trusted HTTPS setup. A phone's plain HTTP LAN address is not equivalent to desktop `localhost`.

To test the production PWA on desktop:

```powershell
npm run build
npm run preview
```

Open `http://localhost:4173`, load once online, then use browser developer tools to go offline and reload. Use **My passport > Download map** while connected. After verification, the basemap, styles, sprites, glyphs, and attribution are available locally alongside airports and visits. Without that explicit download, the map may be unavailable offline. Data is per browser and origin; moving between dev, preview, phone, or Pages does not transfer visits. Use Export/Import passport to transfer a backup.

## Checks

```powershell
npm run lint
npm run typecheck
npm run validate:data
npm test
npx playwright install chromium webkit
npm run test:e2e
```

Browser tests run desktop Chromium, Pixel-sized Chromium, and iPhone-sized WebKit. These are emulations; actual device testing remains necessary. Tests use a production preview server (reusing an existing local preview when present; CI starts its own) and capture screenshots in `test-results/`.

See [development and handoff notes](docs/DEVELOPMENT.md) for architecture, package updates, map terms, deployment, and next milestones. The shared architecture plan is in `../passport-core/Planning.md`.
