import { describe, expect, it } from 'vitest';
import { validateProgram } from '@passport/core';
import { createMapConfig } from '../../src/program/map';
import { flyWashingtonProgram } from '../../src/program/program';
describe('Washington offline package', () => {
  it('owns release metadata and covers every participating airport', () => {
    const map = createMapConfig();
    expect(() => validateProgram({ ...flyWashingtonProgram, map })).not.toThrow();
    for (const airport of flyWashingtonProgram.airports) {
      expect(airport.location.latitude).toBeGreaterThanOrEqual(map.package.bounds.south);
      expect(airport.location.latitude).toBeLessThanOrEqual(map.package.bounds.north);
      expect(airport.location.longitude).toBeGreaterThanOrEqual(map.package.bounds.west);
      expect(airport.location.longitude).toBeLessThanOrEqual(map.package.bounds.east);
    }
    expect(map.package.resources.filter(r => r.kind === 'style')).toHaveLength(2);
    expect(map.package.url).toMatch(/^maps\//);
    expect(map.package.sizeBytes).toBe(81779500);
  });
});
