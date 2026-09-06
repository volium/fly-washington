# Real program data intake

## Google My Map — inspected 2026-09-06

The project owner supplied [this Google My Map](https://www.google.com/maps/d/viewer?mid=1AnHLrRdeYV6TR6qCFDnM4bcp2kSe45j-) as the official program data source. Its public KML export is accessible without an account. An unmodified, dated copy is preserved in `data/sources/`; no live Google Maps SDK or API key is necessary to display derived program data on the existing Leaflet map.

The export contains 115 placemarks with point geometries and no duplicate display names. All 115 now map uniquely to airport records in OurAirports through an explicit crosswalk. This is the complete captured map roster; dated award eligibility is a separate calculation.

| Source layer | Placemarks |
| --- | ---: |
| Northwest Region | 24 |
| Olympic Region | 19 |
| Southwest Region | 13 |
| Eastern Region | 20 |
| North Central | 23 |
| South Central | 12 |
| Seaplane Bases | 4 |
| Three empty untitled layers | 0 |
| Total | 115 |

All 115 records contain structured `Stamp Location` and `Region` fields. Addresses appear under two labels: `Address` (74) and `Address (Pilot to Verify Data)` (41). Latitude/longitude text appears under `Lat / Long (Estimated)` (41), `Lat / Long` (19), and `Lat/Long Estimated` (55). Media links exist for 114 records. Preserve source labels and text; normalize them only in the derived dataset. KML coordinates are longitude, latitude, altitude; the core model expects named latitude/longitude fields.

## Reconciliation decisions

- Use the program map for program-specific participation claims, region labels, stamp instructions, and access text. A map export's retrieval date does not prove each individual entry is current.
- Keep airport reference coordinates separate from stamp targets. The map calls many coordinates estimated; do not silently use them as precise GPS-verification targets.
- Owner decision (2026-09-06): treat **Seaplane Bases** as a regular region, with stable ID `seaplane-bases`, for seven regions total. All four records in that layer belong to this region, including Poulsbo despite its title mentioning Olympic Region. Normalize the source labels `Seaplane Base` and `Seaplane Bases` to the same region ID. These airports count identically toward regional and overall achievements, including Gold, Platinum, and repeat completion. Only the region's specific patch differs.
- Olympia and William R. Fairchild now belong to Olympic Region, correcting the original fixture assignments while preserving airport IDs `KOLM` and `KCLM`.
- Airport identifiers are inconsistently embedded in titles: parenthesized FAA/local codes, trailing codes, and some ICAO codes. Mead Flying Service and Richland have no identifier in their titles. Reconcile exact identifiers before using them as persistent keys; never add a `K` prefix to every local code or rely on fuzzy name matches alone.
- Preserve all instructions when a single record describes several stamp locations. One airport can have multiple stamp locations without counting more than once toward progress.
- Treat media URLs as source references. No source photos have been copied into app assets.

## Official achievement rules

The supplied [About page](https://www.flywashington.org/about.html) and linked FAQ were reviewed on 2026-09-06. [AWARDS.md](AWARDS.md) records thresholds, eligibility timing, and required engine changes. The owner clarified that seaplane bases are included in overall award counts and denominators under the same rules as other airports; their region has its own patch.

## Supplemental aviation data

[OurAirports](https://ourairports.com/data/) provides public-domain airport and runway CSV data. Its [maintained data repository](https://github.com/davidmegginson/ourairports-data) is a suitable supplemental source for airport identifiers, reference coordinates, elevation, municipality, facility type, and runway details.

OurAirports is community-maintained and explicitly gives no accuracy guarantee. It cannot establish Fly Washington participation, stamp access, regions, or award rules. Match identifier aliases first, then review location/name conflicts manually. Preserve each source's original values and record the chosen value's provenance. A statewide filter must not exclude out-of-state facilities that the program map includes, such as The Dalles.

## Personal spreadsheet

The owner supplied a personal Google Sheet on 2026-09-06. Its XLSX export was downloaded without authentication into the Git-ignored `.local/` directory, along with a local parsed representation. Neither the spreadsheet URL nor personal rows are included in the public source snapshot.

The workbook has one worksheet, `Sheet1`, with 115 airport rows and six primary columns: `Name`, `Code`, `Region`, `# Stamp Collected`, `Date`, and `Notes`. Region counts agree with the map after normalizing label suffixes. Per the owner's decision, the four-entry Seaplane Bases group is its own region.

Airport-fact findings:

- The sheet supplies `70S` for Mead Airport, corresponding to the map's Mead Flying Service, and `RLD` for Richland. These remain identifier candidates for corroboration against the aviation database.
- Olympia's Code cell was corrected by the owner to `OLM`, and a refreshed CSV export verified that correction on 2026-09-06. The code and Olympic Region assignment now agree with the map. Preserve the application's existing `KOLM` key when integrating real data. The earlier local XLSX and parsed JSON predate this correction; use the refreshed CSV or a new export for subsequent imports.
- Several map titles use ICAO-style identifiers where the sheet uses shorter codes. Reconcile aliases explicitly against airport data; do not mechanically prepend `K` to arbitrary codes.
- The initial inspection found no blank or duplicate raw Code cells. Format and cross-source validation are also required; uniqueness alone did not catch Olympia's earlier name-in-code error.

Personal-history findings are retained only in local working data. `# Stamp Collected` appears to be collection sequence, not the number of repeat visits. XLSX dates are serialized spreadsheet values and must be decoded to calendar dates, without inventing times. Some numbered entries have no date. The core currently requires a visit date, so those entries need either user-supplied dates or a deliberate undated-history model before import; do not substitute today's date. Preserve original sequence separately if needed rather than rewriting timestamps.

No personal history has been imported into the application. The full airport IDs are now wired in, so a separate user-controlled backup import can be prepared next, with undated entries handled explicitly. Keep personal visits, dates, notes, and progress out of the bundled program dataset and Git.

## Completed dataset integration — 2026-09-06

The running app now loads `src/program/airports.generated.json`: 115 airports, seven regions, and 153 runway records. Every map airport matched a unique OurAirports record. `data/sources/airport-crosswalk.json` freezes application IDs independently of future source renames; the original five persisted IDs remain valid. The Dalles is retained despite its Oregon location. Seaplane Bases uses the same progress engine as every other region.

Airport markers use OurAirports reference coordinates. Original map positions and coordinate text remain in provenance, without being designated GPS stamp-verification targets. The original stamp instructions are preserved as text. Bremerton's explicitly separated Avian Flight Center and pilot lounge locations are also displayed separately; the source's undated construction notice is retained and labeled year-unspecified. Other access values remain unknown unless explicitly normalized. Synthetic stamp examples have been removed.

The machine-readable [reconciliation report](../data/reconciliation-report.json) records:

- Copalis (`S16`): map/reference positions differ by 2,230 m.
- Port of Whitman (`KS94`, FAA `S94`): positions differ by 4,319 m.
- Willard Field (`73S`): blank Region field resolved from its Eastern Region source layer.
- Cle Elum (`S93`): blank Region field resolved from its South Central source layer.

Copalis was resolved on 2026-09-06 using the original program map position, latitude `47.144664`, longitude `-124.189073`, retained at the owner's request after manual review. `data/sources/airport-location-overrides.json` records this decision and the original source coordinates. The generated airport uses the owner-approved map position, preserves both source positions in provenance, and removes the unresolved-coordinate caution. The report retains the original 2,230 m disagreement with `status: resolved` and the decision.

Port of Whitman (`KS94`, FAA `S94`) was also resolved on 2026-09-06: the owner confirmed the OurAirports position, latitude `46.8587`, longitude `-117.414001`. The same review file records this selection even though the marker does not move. The report retains the 4,319 m source disagreement with `status: resolved`, and the unresolved-coordinate caution is removed. Both original source snapshots remain unchanged. No precise stamp coordinates have been inferred.

The generator hashes the override file and rejects unknown/duplicate airport IDs, invalid coordinates, or changed underlying source positions. Source refreshes that change an overridden position require renewed review rather than silently carrying the old decision forward. Airport markers otherwise continue to use OurAirports.

Street addresses are absent for 56 records and remain unknown. The map has a Region field in every record, but two values are empty. Source photographs, private sheet contents, historical award eligibility, and unprovided amenities are not invented or bundled.

## Reproduce and refresh

`npm run data:generate` parses the pinned KML and reconciles it with the pinned public reference subset. `npm run validate:data` regenerates in memory, rejects stale generated files, then runs program tests. CI needs no Google account, private spreadsheet, adjacent checkout, or runtime data download.

To refresh sources deliberately:

1. Download dated official-map KML and OurAirports airport/runway CSV snapshots. Keep original bytes and retrieval dates.
2. Review map additions, withdrawals, changed titles, and identifiers against `airport-crosswalk.json`. Preserve existing `airportId` values. Do not silently drop historical IDs or assign new IDs from array positions.
3. Create a public reference subset: `node scripts/snapshot-ourairports.mjs <airports.csv> <runways.csv> <YYYY-MM-DD> <output.json>`. This reads only public CSVs and the crosswalk, never the personal sheet.
4. Update the dated input paths/version in `scripts/generate-data.mjs`, then run `npm run data:generate`. Review the data diff and reconciliation report, including changed instructions and coordinates.
5. Run lint, typecheck, data validation, build, and desktop/mobile browser tests. Update the source notice, dataset expectations, and handoff notes with verified counts and dates.

Remaining work is the award engine described in [AWARDS.md](AWARDS.md), optional amenities enrichment, precise GPS targets, media, and personal history import. The complete captured airport roster itself is integrated.
