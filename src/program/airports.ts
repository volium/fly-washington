import type { AirportDefinition } from '@passport/core';
import { stampLocations } from './stamp-locations';

/** Approximate coordinates for a development fixture; no operational data is asserted. */
export const airports: AirportDefinition[] = [
  { id: 'KBVS', name: 'Skagit Regional', regionId: 'northwest', location: { latitude: 48.47, longitude: -122.42 }, participation: { participating: true }, description: 'Explore the Skagit Valley in this sample passport.', stampLocations },
  { id: 'KORS', name: 'Orcas Island', regionId: 'northwest', location: { latitude: 48.71, longitude: -122.91 }, participation: { participating: true }, description: 'An island stop in the San Juans. Development sample only.' },
  { id: 'KCLM', name: 'William R. Fairchild', regionId: 'northwest', location: { latitude: 48.12, longitude: -123.50 }, participation: { participating: true }, description: 'A sample stop on the Olympic Peninsula.' },
  { id: 'KOLM', name: 'Olympia Regional', regionId: 'southwest', location: { latitude: 46.97, longitude: -122.90 }, participation: { participating: true }, description: 'Start exploring South Puget Sound with a sample visit.' },
  { id: 'KCLS', name: 'Chehalis-Centralia', regionId: 'southwest', location: { latitude: 46.68, longitude: -122.98 }, participation: { participating: true }, description: 'A sample stop between the Cascades and the coast.' },
];
