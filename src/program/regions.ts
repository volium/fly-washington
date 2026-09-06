import type { RegionDefinition } from '@passport/core';

/** Representative development regions, not the complete official dataset. */
export const regions: RegionDefinition[] = [
  { id: 'northwest', name: 'Northwest', color: '#477a61', completion: { type: 'all' } },
  { id: 'southwest', name: 'Southwest', color: '#986735', completion: { type: 'all' } },
];
