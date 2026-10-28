import type { Map as MapLibreMap, LngLatBoundsLike } from 'maplibre-gl';

export type MapLib = typeof import('maplibre-gl');

function styleUrl(): string {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return `https://tiles.openfreemap.org/styles/${dark ? 'dark' : 'positron'}`;
}

export async function createMap(
  container: HTMLElement,
  view: { bounds: LngLatBoundsLike; maxZoom?: number },
  addLayers: (map: MapLibreMap, lib: MapLib) => void,
): Promise<{ map: MapLibreMap; lib: MapLib }> {
  const lib = (await import('maplibre-gl')) as unknown as MapLib & { default?: MapLib };
  const maplibre = (lib.default ?? lib) as MapLib;
  await import('maplibre-gl/dist/maplibre-gl.css');

  const map = new maplibre.Map({
    container,
    style: styleUrl(),
    bounds: view.bounds,
    fitBoundsOptions: { padding: 24, maxZoom: view.maxZoom ?? 9 },
    cooperativeGestures: true,
    dragRotate: false,
    pitchWithRotate: false,
    attributionControl: { compact: true },
  });
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');

  map.on('style.load', () => addLayers(map, maplibre));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    window.setTimeout(() => map.setStyle(styleUrl()), 0);
  });

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('map did not load')), 12000);
    map.once('load', () => {
      window.clearTimeout(timer);
      resolve();
    });
  });
  return { map, lib: maplibre };
}

export function cssColor(element: Element, name: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}
