import type { PassportProgram } from '@passport/core';
import { airports } from './airports';
import { regions } from './regions';

export const flyWashingtonProgram: PassportProgram = {
  id: 'fly-washington', name: 'Fly Washington Passport Program', shortName: 'Fly Washington',
  description: 'Explore Washington by air. Collect memories, one airport at a time.',
  dataNotice: 'Development preview · 5 sample airports in 2 regions. Participation, region assignments, coordinates, and stamp locations are not verified. Progress is for this sample only; it does not establish eligibility for official awards. Not for flight planning.',
  branding: { accent: '#256b53', eyebrow: 'PASSPORT PROGRAM' },
  map: { center: { latitude: 47.72, longitude: -122.7 }, zoom: 7, tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' },
  regions, airports,
};
