import type { StampLocationDefinition } from '@passport/core';

/** Synthetic location examples for exercising multiple-location UI; not navigation guidance. */
export const stampLocations: StampLocationDefinition[] = [
  { id: 'demo-kbvs-terminal', airportId: 'KBVS', name: 'Terminal · sample location', description: 'Development example only. Official stamp location and access have not been verified.', access: 'unknown' },
  { id: 'demo-kbvs-fbo', airportId: 'KBVS', name: 'FBO · alternate sample location', description: 'A second example location for this airport. Collecting multiple stamps is not needed for sample progress.', access: 'unknown' },
];
