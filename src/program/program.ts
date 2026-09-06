import type { PassportProgram } from '@passport/core';
import { airports } from './airports';
import { regions } from './regions';
import { createMapConfig } from './map';

export const flyWashingtonProgram: PassportProgram = {
  id: 'fly-washington', name: 'Fly Washington Passport Program', shortName: 'Fly Washington',
  description: 'Explore Washington by air. Collect memories, one airport at a time.',
  dataNotice: '115 program-map airports · 7 regions · Sources captured September 6, 2026. Airport reference positions and runways: OurAirports. Stamp directions: program map. Progress tracks this roster, not official award validation. Verify current airport conditions and stamp access before travel; not for flight planning.',
  branding: { accent: '#256b53', eyebrow: 'PASSPORT PROGRAM' },
  map: createMapConfig(import.meta.env.VITE_CARTO_BASEMAPS_KEY),
  regions, airports,
};
