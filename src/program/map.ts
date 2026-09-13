import type { PassportProgram } from '@passport/core';
import washington from './maps/washington-z12.json';
/** Washington owns coverage and release metadata; core owns rendering and storage. */
export function createMapConfig(): PassportProgram['map'] {
  return { center: { latitude: 47.35, longitude: -120.7 }, zoom: 6, markerDetailZoom: 9, package: washington as PassportProgram['map']['package'] };
}
