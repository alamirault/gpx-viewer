export interface GpxPoint {
  lat: number;
  lon: number;
  ele: number | null;
  time: Date | null;
}

export interface ChartDataPoint {
  distance: number;
  elevation: number | null;
  lat: number;
  lon: number;
}

export interface GpxMetrics {
  totalDistance: number;
  elevGain: number;
  elevLoss: number;
  eleMin: number | null;
  eleMax: number | null;
  eleAvg: number | null;
  duration: number | null;
  avgSpeed: number | null;
  maxSpeed: number | null;
}

export interface GpxData {
  name: string | null;
  points: GpxPoint[];
  chartData: ChartDataPoint[];
  metrics: GpxMetrics;
}

const R_EARTH = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseGPX(gpxString: string): GpxData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid GPX file: XML parsing failed');
  }

  // Extract track name: prefer <trk><name>, fallback to <metadata><name>
  const trkName = doc.querySelector('trk > name')?.textContent?.trim() ?? null;
  const metaName = doc.querySelector('metadata > name')?.textContent?.trim() ?? null;
  const trackName = trkName ?? metaName;

  const trkpts = doc.querySelectorAll('trkpt');
  if (trkpts.length === 0) {
    throw new Error('Invalid GPX file: no track points found');
  }

  const points: GpxPoint[] = [];
  for (const pt of trkpts) {
    const lat = parseFloat(pt.getAttribute('lat') ?? '0');
    const lon = parseFloat(pt.getAttribute('lon') ?? '0');
    const eleNode = pt.querySelector('ele');
    const timeNode = pt.querySelector('time');
    points.push({
      lat,
      lon,
      ele: eleNode ? parseFloat(eleNode.textContent ?? '0') : null,
      time: timeNode ? new Date(timeNode.textContent ?? '') : null,
    });
  }

  // Compute cumulative distances
  let totalDistance = 0;
  const distances: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;
    const d = haversine(prev.lat, prev.lon, curr.lat, curr.lon);
    totalDistance += d;
    distances.push(totalDistance);
  }

  // Elevation stats
  const elevations = points.map((p) => p.ele).filter((e): e is number => e !== null);
  const hasElevation = elevations.length > 0;
  let elevGain = 0;
  let elevLoss = 0;
  if (hasElevation) {
    for (let i = 1; i < points.length; i++) {
      const curr = points[i]!;
      const prev = points[i - 1]!;
      if (curr.ele !== null && prev.ele !== null) {
        const diff = curr.ele - prev.ele;
        if (diff > 0) elevGain += diff;
        else elevLoss += Math.abs(diff);
      }
    }
  }

  // Time stats
  const firstPoint = points[0]!;
  const lastPoint = points[points.length - 1]!;
  const hasTime = firstPoint.time !== null && lastPoint.time !== null;
  let duration: number | null = null;
  let avgSpeed: number | null = null;
  let maxSpeed: number | null = null;
  if (hasTime) {
    duration = (lastPoint.time!.getTime() - firstPoint.time!.getTime()) / 1000;
    if (duration > 0) {
      avgSpeed = totalDistance / duration;
    }
    maxSpeed = 0;
    for (let i = 1; i < points.length; i++) {
      const curr = points[i]!;
      const prev = points[i - 1]!;
      if (curr.time && prev.time) {
        const dt = (curr.time.getTime() - prev.time.getTime()) / 1000;
        if (dt > 0) {
          const segDist = distances[i]! - distances[i - 1]!;
          const speed = segDist / dt;
          if (speed > maxSpeed) maxSpeed = speed;
        }
      }
    }
  }

  const chartData: ChartDataPoint[] = points.map((p, i) => ({
    distance: distances[i]! / 1000,
    elevation: p.ele,
    lat: p.lat,
    lon: p.lon,
  }));

  return {
    name: trackName,
    points,
    chartData,
    metrics: {
      totalDistance,
      elevGain,
      elevLoss,
      eleMin: hasElevation ? Math.min(...elevations) : null,
      eleMax: hasElevation ? Math.max(...elevations) : null,
      eleAvg: hasElevation
        ? elevations.reduce((a, b) => a + b, 0) / elevations.length
        : null,
      duration,
      avgSpeed,
      maxSpeed,
    },
  };
}
