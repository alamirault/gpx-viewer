import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GpxPoint } from '../utils/gpxParser';

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

interface MapViewProps {
  points: GpxPoint[];
}

export default function MapView({ points }: MapViewProps) {
  const positions = points.map((p) => [p.lat, p.lon] as L.LatLngTuple);
  const start = positions[0]!;
  const end = positions[positions.length - 1]!;

  return (
    <div className="map-container">
      <MapContainer
        center={start}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} color="#2E7D5B" weight={4} />
        <Marker position={start} icon={startIcon} />
        <Marker position={end} icon={endIcon} />
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
