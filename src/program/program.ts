import type { PassportProgram } from '@passport/core';
import { airports } from './airports';
import { regions } from './regions';

export const flyWashingtonProgram: PassportProgram = {
  id: 'fly-washington', name: 'Fly Washington Passport Program', shortName: 'Fly Washington',
  description: 'Explore Washington by air. Collect memories, one airport at a time.',
  dataNotice: '115 program-map airports · 7 regions · Sources captured September 6, 2026. Airport reference positions and runways: OurAirports. Stamp directions: program map. Progress tracks this roster, not official award validation. Verify current airport conditions and stamp access before travel; not for flight planning.',
  branding: { accent: '#256b53', eyebrow: 'PASSPORT PROGRAM' },
  map: { center: { latitude: 47.35, longitude: -120.7 }, zoom: 6, markerDetailZoom: 9, tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' },
  regions, airports,
};
