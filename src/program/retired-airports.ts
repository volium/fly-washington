import type { AirportDefinition } from '@passport/core';

/** Retain owner-confirmed retired airports here when removing them from active sources.
 * Keep their stable IDs, names, regions, coordinates, and useful historical metadata.
 * Do not infer retirement from a facility closure or a missing source record alone.
 */
export const retiredAirports: (AirportDefinition & { participation: { participating: false } })[] = [];
