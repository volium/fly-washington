# Achievement rules

Reviewed 2026-09-06 against the official [About page](https://www.flywashington.org/about.html) and [FAQ](https://www.flywashington.org/faq.html).

| Achievement | Requirement | Award |
| --- | --- | --- |
| Geographic region | 100% of its participating airports | Regional Patch |
| Seaplane Bases | 100% of participating bases | Seaplane Patch |
| Gold | 90% of participating airports | Flight Jacket |
| Platinum | 100% of participating airports | Program Wings |
| Additional program completion | Another completed round | Master Aviator chevron |

One stamp per airport suffices. Previously collected stamps retain credit after an airport withdraws. Awards require official passport validation; application progress is not that validation. [Source](https://www.flywashington.org/about.html)

New airports become required the following calendar year. Already validated regions remain complete when airports are added. [Source](https://www.flywashington.org/faq.html)

## Implementation decisions and gaps

- Owner clarification (2026-09-06): all seven application regions use the same regional completion rules. `seaplane-bases` is a regular region; only its patch name/artwork differs. Express that difference as award presentation configuration, not a separate eligibility or progress algorithm.
- Separate browse participation from award eligibility. The current core filters progress using only current participation, so it cannot yet represent retained credit or delayed requirements correctly.
- Introduce program-owned, dated eligibility data and explicit validated-completion records before presenting authoritative award estimates. Keep generic evaluation in the core; no Washington-specific branches.
- Percentage evaluation should compare counts directly (for example, `visited * 100 >= eligible * 90`), never a rounded display percentage. Do not hard-code a threshold from the map's 115 placemarks.
- Per the owner's clarification, seaplane bases count exactly like other participating airports in both visited totals and eligible-airport denominators for Gold, Platinum, and repeat completion. Apply the same dated eligibility and retained-credit rules to every airport. There is no seaplane exclusion or separate overall completion track.
- Define round boundaries and required evidence for repeat completion before counting chevrons. Repeated visits alone must not award another completion.
- Model local progress and official validation separately. A manually recorded stamp or visit is not evidence that program administrators validated the passport.
- Add tests for exact percentage boundaries, duplicate visits, withdrawn-airport credit, next-year eligibility, preserved validations, and multiple rounds when the engine is implemented.

No achievement engine or awards UI has been implemented. This document records the rules and integration work for the next development milestone.
