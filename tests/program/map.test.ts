import { describe, expect, it } from 'vitest';
import { validateProgram } from '@passport/core';
import { createMapConfig } from '../../src/program/map';
import { flyWashingtonProgram } from '../../src/program/program';

describe('Washington basemap choices', () => {
  it('keeps CARTO as the sole provider even without credentials', () => {
    for (const key of [undefined, '', '   ']) {
      const map = createMapConfig(key);
      expect(map.styles?.map(style => style.id)).toEqual(['carto']);
      expect(() => validateProgram({ ...flyWashingtonProgram, map })).not.toThrow();
    }
  });
  it('configures the old app’s light and dark CARTO maps with encoded credentials and attribution', () => {
    const map = createMapConfig(' example&key=1 ');
    expect(map.styles?.map(style => style.id)).toEqual(['carto']);
    const carto = map.styles![0];
    expect(carto.tileUrl).toContain('/light_all/{z}/{x}/{y}{r}.png?key=example%26key%3D1');
    expect(carto.darkTileUrl).toContain('/dark_all/{z}/{x}/{y}{r}.png?key=example%26key%3D1');
    expect(carto.attribution).toContain('OpenStreetMap');
    expect(carto.attribution).toContain('CARTO');
    expect(() => validateProgram({ ...flyWashingtonProgram, map })).not.toThrow();
  });
});
