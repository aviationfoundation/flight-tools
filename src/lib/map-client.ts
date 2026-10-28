import type { Map as MapLibreMap, LngLatBoundsLike } from 'maplibre-gl';

export type MapLib = typeof import('maplibre-gl');

const ATTRIBUTION =
  '<a href="https://openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>';

interface StyleSource {
  type: string;
  url?: string;
  tiles?: string[];
  minzoom?: number;
  maxzoom?: number;
  attribution?: string;
}

const styleCache = new Map<string, Promise<object>>();

function loadStyle(url: string): Promise<object> {
  let pending = styleCache.get(url);
  if (!pending) {
    pending = (async () => {
      const style = (await (await fetch(url)).json()) as { sources: Record<string, StyleSource> };
      await Promise.all(
        Object.values(style.sources).map(async (source) => {
          delete source.attribution;
          if (!source.url) return;
          const tilejson = (await (await fetch(source.url)).json()) as { tiles?: string[]; minzoom?: number; maxzoom?: number };
          if (!tilejson.tiles) return;
          delete source.url;
          source.tiles = tilejson.tiles;
          if (tilejson.minzoom != null) source.minzoom = tilejson.minzoom;
          if (tilejson.maxzoom != null) source.maxzoom = tilejson.maxzoom;
        }),
      );
      return style;
    })();
    styleCache.set(url, pending);
  }
  return pending;
}

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
    bounds: view.bounds,
    fitBoundsOptions: { padding: 24, maxZoom: view.maxZoom ?? 9 },
    cooperativeGestures: true,
    dragRotate: false,
    pitchWithRotate: false,
    attributionControl: false,
  });
  map.setStyle((await loadStyle(styleUrl())) as never);
  map.addControl(new maplibre.AttributionControl({ compact: false, customAttribution: ATTRIBUTION }), 'bottom-right');
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');

  map.on('style.load', () => addLayers(map, maplibre));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    window.setTimeout(async () => map.setStyle((await loadStyle(styleUrl())) as never), 0);
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
