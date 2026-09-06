# Source snapshots

`google-map-2026-09-06.kml` is an unmodified KML export of the Google My Map supplied by the project owner as the official Fly Washington program source. It was retrieved on 2026-09-06 without authentication.

- Map: https://www.google.com/maps/d/viewer?mid=1AnHLrRdeYV6TR6qCFDnM4bcp2kSe45j-
- Export: https://www.google.com/maps/d/kml?mid=1AnHLrRdeYV6TR6qCFDnM4bcp2kSe45j-&forcekml=1
- SHA-256: `B226710DCC5DD9C2D5831C28FEA93F09822339B5CA29F95B522CC13D7D295565`

The app now consumes a generated dataset derived from these pinned sources. Preserve original source text and record retrieval dates when updating snapshots. Third-party source content retains its original rights; the repository's code license does not establish a license for source descriptions or linked photographs. Images have not been downloaded or bundled.

`ourairports-2026-09-06.json` contains the 115 matched public-domain airport records and 153 runway records, retained as original CSV field values. It records download URLs and SHA-256 hashes of the full upstream CSV files. `airport-crosswalk.json` explicitly binds each map title and source code to an OurAirports numeric ID and a stable application ID. All entries were unique US identifier matches; Mead `70S` and Richland `RLD` were first identified through the owner's sheet and corroborated by OurAirports. No personal spreadsheet fields are present.

Regenerate without network access using `npm run data:generate`. `npm run validate:data` checks reproducibility and domain invariants. See DATA-SOURCES.md for the source-refresh workflow. Keep the KML bytes unchanged; `.gitattributes` disables newline conversion for original KML and enforces LF for JSON so source hashes remain reproducible across Windows and CI.

See [data-source assessment](../../docs/DATA-SOURCES.md) for field inventory, ambiguities, and import decisions.

`airport-location-overrides.json` records reviewed airport positions, reviewer, date, reason, and the expected original map/reference coordinates. Following owner review on 2026-09-06, Copalis retains the original program map position and Port of Whitman retains the OurAirports position. The file records explicit source selections even when the current marker does not move. The generator rejects overrides when their source coordinates change, so a refresh requires renewed review. These are airport markers, not stamp GPS targets; do not edit original snapshots or generated JSON to apply corrections.
