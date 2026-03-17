import type { GpxPoint } from './gpxParser';

export function lerpColor(a: string, b: string, t: number): string {
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

export function elevationColor(t: number): string {
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

export function computeExaggeration(eleRange: number): number {
  if (eleRange < 100) return 3.0;
  if (eleRange < 300) return 2.5;
  if (eleRange < 600) return 2.0;
  return 1.5;
}

export function computeBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

export function buildTrackGeoJSON(points: GpxPoint[], eleMin: number, eleMax: number) {
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
          [p.lon, p.lat, p.ele ?? 0],
          [q.lon, q.lat, q.ele ?? 0],
        ],
      },
    });
  }

  return { type: 'FeatureCollection' as const, features };
}
