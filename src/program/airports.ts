import type { AirportDefinition } from '@passport/core';
import dataset from './airports.generated.json';

/** Generated from pinned public sources; regenerate with npm run data:generate. */
export const airports: AirportDefinition[] = dataset.map(airport => ({
  ...airport,
  stampLocations: airport.stampLocations.map(stamp => ({
    ...stamp,
    access: stamp.access as 'unknown' | 'always' | 'business-hours',
  })),
}));
