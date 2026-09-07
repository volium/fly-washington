import type { PassportProgram, MapStyleDefinition } from '@passport/core';

/** Provider configuration belongs to the program; the core only knows map styles. */
export function createMapConfig(cartoBasemapsKey = ''): PassportProgram['map'] {
  const key = cartoBasemapsKey.trim();
  const query = key ? `?key=${encodeURIComponent(key)}` : '';
  const carto: MapStyleDefinition = {
    id: 'carto', name: 'CARTO',
    tileUrl: `https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${query}`,
    darkTileUrl: `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${query}`,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  };
  return { center: { latitude: 47.35, longitude: -120.7 }, zoom: 6, markerDetailZoom: 9, tileUrl: carto.tileUrl, attribution: carto.attribution, styles: [carto] };
}
