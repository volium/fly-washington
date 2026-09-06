import { describe, expect, it } from 'vitest';
import { calculateProgress, validateProgram } from '@passport/core';
import { flyWashingtonProgram } from '../../src/program/program';

describe('Washington development configuration through the public core API', () => {
  it('validates the initial five-airport slice with multiple stamp locations', () => {
    expect(() => validateProgram(flyWashingtonProgram)).not.toThrow();
    expect(flyWashingtonProgram.airports).toHaveLength(5);
    expect(flyWashingtonProgram.regions).toHaveLength(2);
    expect(flyWashingtonProgram.airports.some(a => (a.stampLocations?.length ?? 0) > 1)).toBe(true);
    expect(calculateProgress(flyWashingtonProgram, []).total).toBe(5);
  });
});
