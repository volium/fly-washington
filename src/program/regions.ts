import type { RegionDefinition } from '@passport/core';

import definitions from './regions.json';

export const regions: RegionDefinition[] = definitions.map(region => ({ ...region, completion: { type: 'all' } }));
