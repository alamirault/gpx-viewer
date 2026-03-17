import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Polyline, GeoJSON, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import type { GpxPoint } from '../utils/gpxParser';
import type { CameraState } from '../App';
import { buildTrackGeoJSON } from '../utils/map3dUtils';

const hoverIcon = L.divIcon({
  className: 'map-hover-marker',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

// Fix default marker icon issue with bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ColorModeControl({ colorMode, onColorModeChange, hasElevation }: {
  colorMode: 'red' | 'elevation';
  onColorModeChange: (m: 'red' | 'elevation') => void;
  hasElevation: boolean;
}) {
  const { t } = useTranslation();
  const map = useMap();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const container = L.DomUtil.create('div', 'map-3d__mode-toggle');
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', t('map.viewMode'));
    // Override position: absolute from CSS — inside Leaflet control pane, use margin instead
    container.style.position = 'relative';
    container.style.top = 'auto';
    container.style.left = 'auto';
    container.style.margin = '12px 0 0 12px';
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    const Control = L.Control.extend({ onAdd: () => container });
    const ctrl = new (Control as any)({ position: 'topleft' });
    ctrl.addTo(map);
    setPortalTarget(container);
    return () => { ctrl.remove(); setPortalTarget(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  if (!portalTarget) return null;
  return createPortal(
    <>
      <button
        className={`map-3d__mode-btn${colorMode === 'red' ? ' map-3d__mode-btn--active' : ''}`}
        onClick={() => onColorModeChange('red')}
        aria-pressed={colorMode === 'red'}
      >
        {t('map.colorRed')}
      </button>
      <button
        className={`map-3d__mode-btn${colorMode === 'elevation' ? ' map-3d__mode-btn--active' : ''}`}
        onClick={() => onColorModeChange('elevation')}
        aria-pressed={colorMode === 'elevation'}
        disabled={!hasElevation}
      >
        {t('map.colorElevation')}
      </button>
    </>,
    portalTarget
  );
}

function MapHoverListener({ onMapHover }: { onMapHover: (p: { lat: number; lon: number } | null) => void }) {
  const map = useMap();
  const onMapHoverRef = useRef<typeof onMapHover>(onMapHover);
  onMapHoverRef.current = onMapHover;

  useEffect(() => {
    const handleMove = (e: L.LeafletMouseEvent) =>
      onMapHoverRef.current({ lat: e.latlng.lat, lon: e.latlng.lng });
    const handleOut = () => onMapHoverRef.current(null);
    map.on('mousemove', handleMove);
    map.on('mouseout', handleOut);
    return () => {
      map.off('mousemove', handleMove);
      map.off('mouseout', handleOut);
    };
  }, [map]);

  return null;
}

function CameraSync({ onCameraChange }: { onCameraChange: (c: CameraState) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const c = map.getCenter();
      onCameraChange({ center: [c.lat, c.lng], zoom: map.getZoom(), bearing: 0, pitch: 0 });
    },
  });
  return null;
}

function ZoomControl() {
  const map = useMap();
  useEffect(() => {
    const ctrl = L.control.zoom({ position: 'topright' });
    ctrl.addTo(map);
    return () => { ctrl.remove(); };
  }, [map]);
  return null;
}

function FitBounds({ points }: { points: GpxPoint[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (points.length > 0 && !fitted.current) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [30, 30] });
      fitted.current = true;
    }
  }, [points, map]);

  return null;
}

function HoverMarker({ point }: { point: { lat: number; lon: number } | null }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (point) {
      if (!markerRef.current) {
        markerRef.current = L.marker([point.lat, point.lon], { icon: hoverIcon, interactive: false }).addTo(map);
      } else {
        markerRef.current.setLatLng([point.lat, point.lon]);
      }
    } else {
      markerRef.current?.remove();
      markerRef.current = null;
    }
  }, [point, map]);

  return null;
}

const pinnedIcon = L.divIcon({
  className: 'map-pin-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function PinnedMarker({ point, onUnpin }: { point: { lat: number; lon: number } | null; onUnpin: () => void }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  // Recreate marker on each change to replay the pulse animation
  useEffect(() => {
    markerRef.current?.remove();
    markerRef.current = null;
    if (point) {
      markerRef.current = L.marker([point.lat, point.lon], { icon: pinnedIcon }).addTo(map);
      markerRef.current.on('click', onUnpin);
    }
  }, [point, map, onUnpin]);

  return null;
}

interface MapViewProps {
  points: GpxPoint[];
  hoverPoint: { lat: number; lon: number } | null;
  pinnedPoint: { lat: number; lon: number } | null;
  onUnpin: () => void;
  cameraState: CameraState | null;
  onCameraChange: (c: CameraState) => void;
  onMapHover: (p: { lat: number; lon: number } | null) => void;
}

export default function MapView({ points, hoverPoint, pinnedPoint, onUnpin, cameraState, onCameraChange, onMapHover }: MapViewProps) {
  const { t } = useTranslation();
  const [colorMode, setColorMode] = useState<'red' | 'elevation'>('red');

  const positions = points.map((p) => [p.lat, p.lon] as L.LatLngTuple);
  const start = positions[0]!;
  const end = positions[positions.length - 1]!;

  const eles = points.map((p) => p.ele ?? 0);
  const eleMin = eles.reduce((a, b) => Math.min(a, b), Infinity);
  const eleMax = eles.reduce((a, b) => Math.max(a, b), -Infinity);
  const hasElevation = points.some((p) => p.ele !== null);
  const elevationGeoJSON = hasElevation ? buildTrackGeoJSON(points, eleMin, eleMax) : null;

  const initialCenter = cameraState ? [cameraState.center[0], cameraState.center[1]] as L.LatLngTuple : start;
  const initialZoom = cameraState ? cameraState.zoom : 13;

  return (
    <div className="map-container" style={{ position: 'relative' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {colorMode === 'red' || !elevationGeoJSON ? (
          <Polyline positions={positions} color="#FF0000" weight={4} />
        ) : (
          <GeoJSON
            key={`elev-${points.length}`}
            data={elevationGeoJSON}
            style={(feature) => ({ color: feature?.properties?.color ?? '#3B82F6', weight: 4 })}
          />
        )}
        <Marker position={start} icon={startIcon} />
        <Marker position={end} icon={endIcon} />
        <ColorModeControl colorMode={colorMode} onColorModeChange={setColorMode} hasElevation={hasElevation} />
        <ZoomControl />
        {!cameraState && <FitBounds points={points} />}
        <CameraSync onCameraChange={onCameraChange} />
        <MapHoverListener onMapHover={onMapHover} />
        <HoverMarker point={hoverPoint} />
        <PinnedMarker point={pinnedPoint} onUnpin={onUnpin} />
      </MapContainer>

      {colorMode === 'elevation' && hasElevation && (
        <div className="map-3d__legend">
          <div className="map-3d__legend-bar" />
          <div className="map-3d__legend-labels">
            <span>{Math.round(eleMax)} m</span>
            <span>{Math.round(eleMin)} m</span>
          </div>
        </div>
      )}
    </div>
  );
}
