import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GpxPoint } from '../utils/gpxParser';
import type { CameraState } from '../App';

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

interface MapViewProps {
  points: GpxPoint[];
  hoverPoint: { lat: number; lon: number } | null;
  cameraState: CameraState | null;
  onCameraChange: (c: CameraState) => void;
}

export default function MapView({ points, hoverPoint, cameraState, onCameraChange }: MapViewProps) {
  const positions = points.map((p) => [p.lat, p.lon] as L.LatLngTuple);
  const start = positions[0]!;
  const end = positions[positions.length - 1]!;

  const initialCenter = cameraState ? [cameraState.center[0], cameraState.center[1]] as L.LatLngTuple : start;
  const initialZoom = cameraState ? cameraState.zoom : 13;

  return (
    <div className="map-container">
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
        <Polyline positions={positions} color="#2E7D5B" weight={4} />
        <Marker position={start} icon={startIcon} />
        <Marker position={end} icon={endIcon} />
        <ZoomControl />
        {!cameraState && <FitBounds points={points} />}
        <CameraSync onCameraChange={onCameraChange} />
        <HoverMarker point={hoverPoint} />
      </MapContainer>
    </div>
  );
}
