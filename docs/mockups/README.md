# Offline access design review

Open `offline-access.html` in a browser, or use the temporary review server at port 5174 while it is running. This is a self-contained interactive design artifact, not application code or a deployed route. It makes no external requests and reads no stored passport data.

The controls above the app select layout, browser/installed context, download scenario, protection result, and appearance. The map and all state are illustrative. Use **Advance download** to move through transfer, verification, and completion. Selecting Installed app starts simulated initial downloading unless a map is available or a cancellation/failure is retained. Changing scenarios intentionally resets the selected example; refreshing resets the whole mockup.

Review these flows:

1. First visit opens the same independent Offline access card used on desktop and mobile. Close it or press Escape, then reopen it from the header without changing tabs. iPhone guidance explains storage separation before a browser download; Home Screen setup includes a Share-menu glyph. Installation help remains available after download and dismissal.
2. Android Chrome browser: guidance explains that the same profile's existing map can be reused.
3. Installed app: numerical progress remains visible while switching between Explore and My passport; tap Offline access for MB detail and Cancel.
4. Cancellation, waiting for connection, verification, successful installation, failure, renderer recovery, and update availability.
5. Storage protection is independently selectable. The selected result simulates an automatic check/request: granted protection hides the indicator; denied/unknown results show a subtle shield. Its control opens the shared card with the explanation and export affordance expanded; ordinary map-card opening keeps those details collapsed. No real browser permission request or export occurs.
6. Mobile scrolling and dark appearance: the app header/status strip remains above the scrollable content, with no normal Delete action. The non-modal card is centered horizontally on desktop, moves left as the window narrows, scrolls independently, and restores focus when closed. Home Screen setup, Repair options, and Storage protection use matching collapsible sections: click/tap or press Enter/Space to expand and collapse. The Share glyph stays smaller than the instruction line.

This prototype intentionally omits functional airport filtering, real map rendering, PWA installation, storage persistence, actual downloads, and full visit editing. Shell readiness is a simulated scenario value. Production work must retain the existing product behavior and validate the real lifecycle separately.

The architecture and acceptance criteria remain in `passport-core/Planning.md`, Sections 32.3–32.5, 34.1, 58.2, and Phase U1. The owner approved the revised desktop/mobile design on 2026-09-19, including the centered responsive card, smaller Share glyph, consistent collapsible sections, and subtle storage-protection feedback. This is the design baseline for Phase U1 implementation. Production implementation and physical-device acceptance remain outstanding; this approval does not authorize deployment.
