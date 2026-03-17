import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from 'react-i18next';
import type { GpxPoint } from '../utils/gpxParser';
import type { CameraState } from '../App';
import {
  buildTrackGeoJSON,
  computeBearing,
  computeExaggeration,
} from '../utils/map3dUtils';

// Free terrain DEM tiles (AWS Terrarium, no API key needed)
const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
// Esri World Imagery — photorealistic satellite (free, no API key)
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
// Esri Reference overlay — labels, peaks, place names
const LABELS_TILES = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
// OpenTopoMap — hypsometric tinting (green → brown → grey by elevation) + contours
const TERRAIN_VISUAL_TILES = 'https://tile.opentopomap.org/{z}/{x}/{y}.png';

type ViewMode = 'satellite' | 'terrain';

interface Map3DViewProps {
  points: GpxPoint[];
  hoverPoint: { lat: number; lon: number } | null;
  pinnedPoint: { lat: number; lon: number } | null;
  onUnpin: () => void;
  cameraState: CameraState | null;
  onCameraChange: (c: CameraState) => void;
}

export default function Map3DView({ points, hoverPoint, pinnedPoint, onUnpin, cameraState, onCameraChange }: Map3DViewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapLoadedRef = useRef(false);
  const [viewMode, setViewMode] = useState<ViewMode>('satellite');
  // Ref to avoid stale closure in map.on('load') callback
  const viewModeRef = useRef<ViewMode>('satellite');
  // Store initial camera state for the reset button
  const initialCameraRef = useRef<{ bearing: number; pitch: number; bounds: [[number, number], [number, number]] } | null>(null);
  // Hover marker from elevation chart
  const hoverMarkerRef = useRef<maplibregl.Marker | null>(null);
  // Pinned marker (click on chart)
  const pinnedMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Update hover marker position when chart is hovered
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    if (hoverPoint) {
      if (!hoverMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'map-hover-marker';
        hoverMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([hoverPoint.lon, hoverPoint.lat])
          .addTo(map);
      } else {
        hoverMarkerRef.current.setLngLat([hoverPoint.lon, hoverPoint.lat]);
      }
    } else {
      hoverMarkerRef.current?.remove();
      hoverMarkerRef.current = null;
    }
  }, [hoverPoint]);

  // Update pinned marker (click on elevation chart) — recreate each time to replay animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    pinnedMarkerRef.current?.remove();
    pinnedMarkerRef.current = null;
    if (pinnedPoint) {
      const el = document.createElement('div');
      el.className = 'map-pin-marker';
      el.addEventListener('click', (e) => { e.stopPropagation(); onUnpin(); });
      pinnedMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([pinnedPoint.lon, pinnedPoint.lat])
        .addTo(map);
    }
  }, [pinnedPoint]);

  // Sync ref and toggle layer visibility when viewMode changes
  useEffect(() => {
    viewModeRef.current = viewMode;
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const isSat = viewMode === 'satellite';
    map.setLayoutProperty('satellite-tiles', 'visibility', isSat ? 'visible' : 'none');
    map.setLayoutProperty('labels-tiles', 'visibility', isSat ? 'visible' : 'none');
    map.setLayoutProperty('terrain-visual-tiles', 'visibility', isSat ? 'none' : 'visible');
  }, [viewMode]);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;

    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    const eles = points.map((p) => p.ele ?? 0);

    // Use reduce to avoid stack overflow with large arrays (spread operator fails at ~65k args)
    const eleMin = eles.reduce((acc, v) => Math.min(acc, v), Infinity);
    const eleMax = eles.reduce((acc, v) => Math.max(acc, v), -Infinity);
    const minLat = lats.reduce((acc, v) => Math.min(acc, v), Infinity);
    const maxLat = lats.reduce((acc, v) => Math.max(acc, v), -Infinity);
    const minLon = lons.reduce((acc, v) => Math.min(acc, v), Infinity);
    const maxLon = lons.reduce((acc, v) => Math.max(acc, v), -Infinity);

    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    const eleRange = eleMax - eleMin;
    const exaggeration = computeExaggeration(eleRange);

    const firstPoint = points[0]!;
    const lastPoint = points[points.length - 1]!;
    const bearing = computeBearing(firstPoint.lat, firstPoint.lon, lastPoint.lat, lastPoint.lon);

    // Guard against load callback firing after map is destroyed
    let destroyed = false;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [SATELLITE_TILES],
            tileSize: 256,
            attribution: '© <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics',
            maxzoom: 19,
          },
          labels: {
            type: 'raster',
            tiles: [LABELS_TILES],
            tileSize: 256,
            maxzoom: 19,
          },
          'terrain-visual': {
            type: 'raster',
            tiles: [TERRAIN_VISUAL_TILES],
            tileSize: 256,
            attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxzoom: 17,
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
            id: 'satellite-tiles',
            type: 'raster',
            source: 'satellite',
            layout: { visibility: 'visible' },
          },
          {
            id: 'labels-tiles',
            type: 'raster',
            source: 'labels',
            layout: { visibility: 'visible' },
          },
          {
            id: 'terrain-visual-tiles',
            type: 'raster',
            source: 'terrain-visual',
            layout: { visibility: 'none' },
          },
        ],
        sky: {
          'sky-color': '#4DB8E8',
          'sky-horizon-blend': 0.4,
          'horizon-color': '#c8e8f4',
          'horizon-fog-blend': 0.3,
          'atmosphere-blend': 0.5,
        },
      },
      center: cameraState ? [cameraState.center[1], cameraState.center[0]] : [centerLon, centerLat],
      zoom: cameraState ? cameraState.zoom : 12,
      pitch: cameraState ? cameraState.pitch : 70,
      bearing: cameraState ? cameraState.bearing : bearing,
      antialias: true,
    });

    mapRef.current = map;

    // Only zoom buttons — compass replaced by the custom reset button below
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    // Store initial camera for the reset button
    initialCameraRef.current = {
      bearing,
      pitch: 70,
      bounds: [[minLon, minLat], [maxLon, maxLat]],
    };

    // Custom right-click drag: replace default dragRotate with slower sensitivity
    map.dragRotate.disable();
    const ROTATION_SPEED = 0.12; // degrees per pixel (default MapLibre ≈ 1.0)
    let rotating = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    const canvas = map.getCanvas();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      rotating = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!rotating) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      map.setBearing(map.getBearing() - dx * ROTATION_SPEED);
      map.setPitch(Math.max(0, Math.min(85, map.getPitch() + dy * ROTATION_SPEED)));
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    const onMouseUp = (e: MouseEvent) => { if (e.button === 2) rotating = false; };
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);

    map.on('load', () => {
      if (destroyed) return;

      // Enable 3D terrain with adaptive exaggeration
      map.setTerrain({ source: 'terrain-dem', exaggeration });

      // Apply viewMode that may have been set before map finished loading
      const isSat = viewModeRef.current === 'satellite';
      if (!isSat) {
        map.setLayoutProperty('satellite-tiles', 'visibility', 'none');
        map.setLayoutProperty('labels-tiles', 'visibility', 'none');
        map.setLayoutProperty('terrain-visual-tiles', 'visibility', 'visible');
      }

      mapLoadedRef.current = true;

      // Add GPX track GeoJSON
      const trackGeoJSON = buildTrackGeoJSON(points, eleMin, eleMax);
      map.addSource('track', { type: 'geojson', data: trackGeoJSON });

      // Track shadow (outline)
      map.addLayer({
        id: 'track-outline',
        type: 'line',
        source: 'track',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': 'rgba(0,0,0,0.5)',
          'line-width': 10,
          'line-blur': 3,
        },
      });

      // Solid red track — style reference
      map.addLayer({
        id: 'track-line',
        type: 'line',
        source: 'track',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#FF0000',
          'line-width': 5,
        },
      });

      // Start marker
      const startEl = document.createElement('div');
      startEl.className = 'map-marker map-marker--start';
      startEl.setAttribute('aria-label', t('map.startPoint'));
      new maplibregl.Marker({ element: startEl })
        .setLngLat([firstPoint.lon, firstPoint.lat])
        .addTo(map);

      // End marker
      const endEl = document.createElement('div');
      endEl.className = 'map-marker map-marker--end';
      endEl.setAttribute('aria-label', t('map.endPoint'));
      new maplibregl.Marker({ element: endEl })
        .setLngLat([lastPoint.lon, lastPoint.lat])
        .addTo(map);

      // Fit bounds only when no saved camera state
      if (!cameraState) {
        map.fitBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          { padding: 60, pitch: 70, bearing, duration: 1200 }
        );
      }

      // Sync camera state on every move (pan, zoom, rotate, pitch)
      map.on('moveend', () => {
        if (destroyed) return;
        const c = map.getCenter();
        onCameraChange({ center: [c.lat, c.lng], zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() });
      });
    });

    return () => {
      destroyed = true;
      mapLoadedRef.current = false;
      hoverMarkerRef.current?.remove();
      hoverMarkerRef.current = null;
      pinnedMarkerRef.current?.remove();
      pinnedMarkerRef.current = null;
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  return (
    <div className="map-container map-3d">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <button
        className="map-3d__reset-btn"
        onClick={() => {
          const cam = initialCameraRef.current;
          const map = mapRef.current;
          if (!cam || !map) return;
          map.fitBounds(cam.bounds, { padding: 60, pitch: cam.pitch, bearing: cam.bearing, duration: 800 });
        }}
        title={t('map.resetView')}
        aria-label={t('map.resetView')}
      >
        ↺ {t('map.resetView')}
      </button>

      <div className="map-3d__mode-toggle" role="group" aria-label={t('map.viewMode')}>
        <button
          className={`map-3d__mode-btn${viewMode === 'satellite' ? ' map-3d__mode-btn--active' : ''}`}
          onClick={() => setViewMode('satellite')}
          aria-pressed={viewMode === 'satellite'}
        >
          {t('map.modeSatellite')}
        </button>
        <button
          className={`map-3d__mode-btn${viewMode === 'terrain' ? ' map-3d__mode-btn--active' : ''}`}
          onClick={() => setViewMode('terrain')}
          aria-pressed={viewMode === 'terrain'}
        >
          {t('map.modeTerrain')}
        </button>
      </div>

      <div className="map-3d__hint">
        <span aria-hidden="true">🖱</span> {t('map.hint')}
      </div>
    </div>
  );
}
