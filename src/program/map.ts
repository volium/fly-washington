import type { PassportProgram, MapStyleDefinition } from '@passport/core';

/** Provider configuration belongs to the program; the core only knows map styles. */
export function createMapConfig(cartoBasemapsKey = ''): PassportProgram['map'] {
  const standard: MapStyleDefinition = {
    id: 'openstreetmap', name: 'OpenStreetMap',
    tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  };
  const styles = [standard];
  const key = cartoBasemapsKey.trim();
  if (key) styles.push({
    id: 'carto', name: 'CARTO',
    tileUrl: `https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`,
    darkTileUrl: `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(key)}`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  });
  return { center: { latitude: 47.35, longitude: -120.7 }, zoom: 6, markerDetailZoom: 9, tileUrl: standard.tileUrl, attribution: standard.attribution, styles };
}
