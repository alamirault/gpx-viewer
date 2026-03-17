import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from 'react-i18next';
import type { GpxPoint } from '../utils/gpxParser';

// Free terrain DEM tiles (AWS Terrarium, no API key needed)
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
// Free OSM raster tiles
const OSM_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function elevationColor(t: number): string {
  if (t < 0.4) {
    const s = t / 0.4;
    return lerpColor('#3B82F6', '#10B981', s);
  } else if (t < 0.7) {
    const s = (t - 0.4) / 0.3;
    return lerpColor('#10B981', '#F59E0B', s);
  } else {
    const s = (t - 0.7) / 0.3;
    return lerpColor('#F59E0B', '#EF4444', s);
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar! + (br! - ar!) * t);
  const g = Math.round(ag! + (bg! - ag!) * t);
  const bl = Math.round(ab! + (bb! - ab!) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

function buildTrackGeoJSON(points: GpxPoint[], eleMin: number, eleMax: number) {
  const eleRange = eleMax - eleMin || 1;
  const features = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p = points[i]!;
    const q = points[i + 1]!;
    const t = p.ele !== null ? (p.ele - eleMin) / eleRange : 0.5;
    features.push({
      type: 'Feature' as const,
      properties: { color: elevationColor(t) },
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [p.lon, p.lat],
          [q.lon, q.lat],
        ],
      },
    });
  }

  return { type: 'FeatureCollection' as const, features };
}

interface Map3DViewProps {
  points: GpxPoint[];
}

export default function Map3DView({ points }: Map3DViewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    const eles = points.map((p) => p.ele ?? 0);
    const eleMin = Math.min(...eles);
    const eleMax = Math.max(...eles);

    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [OSM_TILES],
            tileSize: 256,
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxzoom: 19,
          },
          'terrain-dem': {
            type: 'raster-dem',
            tiles: [TERRAIN_TILES],
            tileSize: 256,
            encoding: 'terrarium' as const,
            maxzoom: 15,
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
          },
        ],
        sky: {
          'sky-color': '#87CEEB',
          'sky-horizon-blend': 0.5,
          'horizon-color': '#f4f8fb',
          'horizon-fog-blend': 0.5,
          'atmosphere-blend': 0.3,
        },
      },
      center: [centerLon, centerLat],
      zoom: 12,
      pitch: 60,
      bearing: -15,
      antialias: true,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    map.on('load', () => {
      // Enable 3D terrain
      map.setTerrain({ source: 'terrain-dem', exaggeration: 1.5 });

      // Add GPX track
      const trackGeoJSON = buildTrackGeoJSON(points, eleMin, eleMax);
      map.addSource('track', { type: 'geojson', data: trackGeoJSON });

      // Track shadow (outline)
      map.addLayer({
        id: 'track-outline',
        type: 'line',
        source: 'track',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': 'rgba(0,0,0,0.3)',
          'line-width': 8,
          'line-blur': 2,
        },
      });

      // Colored track by elevation
      map.addLayer({
        id: 'track-line',
        type: 'line',
        source: 'track',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
        },
      });

      // Start marker
      const startEl = document.createElement('div');
      startEl.className = 'map-marker map-marker--start';
      new maplibregl.Marker({ element: startEl })
        .setLngLat([points[0]!.lon, points[0]!.lat])
        .addTo(map);

      // End marker
      const endEl = document.createElement('div');
      endEl.className = 'map-marker map-marker--end';
      new maplibregl.Marker({ element: endEl })
        .setLngLat([points[points.length - 1]!.lon, points[points.length - 1]!.lat])
        .addTo(map);

      // Fit bounds with 3D pitch
      map.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        { padding: 60, pitch: 60, bearing: -15, duration: 1200 }
      );
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  return (
    <div className="map-container map-3d">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Elevation legend */}
      <div className="map-3d__legend" aria-label="Légende altitude">
        <div className="map-3d__legend-bar" />
        <div className="map-3d__legend-labels">
          <span style={{ color: '#EF4444' }}>Max</span>
          <span style={{ color: '#10B981' }}>Mid</span>
          <span style={{ color: '#3B82F6' }}>Min</span>
        </div>
      </div>

      <div className="map-3d__hint">🖱 {t('map.hint')}</div>
    </div>
  );
}
