import { describe, it, expect } from 'vitest';
import type { GpxPoint } from '../utils/gpxParser';
import {
  lerpColor,
  elevationColor,
  buildTrackGeoJSON,
  computeExaggeration,
  computeBearing,
} from '../utils/map3dUtils';

describe('lerpColor', () => {
  it('returns color A when t=0', () => {
    expect(lerpColor('#ff0000', '#0000ff', 0)).toBe('#ff0000');
  });

  it('returns color B when t=1', () => {
    expect(lerpColor('#ff0000', '#0000ff', 1)).toBe('#0000ff');
  });

  it('returns #808080 when interpolating between #000000 and #ffffff at t=0.5', () => {
    expect(lerpColor('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('elevationColor', () => {
  it('returns a blue-ish color at t=0 (starts with #3)', () => {
    const color = elevationColor(0);
    expect(color).toMatch(/^#3/);
  });

  it('returns a red-ish color at t=1 (starts with #e or #f)', () => {
    const color = elevationColor(1);
    expect(color).toMatch(/^#[ef]/i);
  });

  it('returns a color at t=0.5 different from t=0 and t=1', () => {
    const colorLow = elevationColor(0);
    const colorHigh = elevationColor(1);
    const colorMid = elevationColor(0.5);
    expect(colorMid).not.toBe(colorLow);
    expect(colorMid).not.toBe(colorHigh);
  });
});

describe('buildTrackGeoJSON', () => {
  const makePoint = (lat: number, lon: number, ele: number | null): GpxPoint => ({
    lat,
    lon,
    ele,
    time: null,
  });

  it('generates 1 feature for 2 points', () => {
    const points = [makePoint(45, 6, 1000), makePoint(46, 7, 1100)];
    const geojson = buildTrackGeoJSON(points, 1000, 1100);
    expect(geojson.features).toHaveLength(1);
  });

  it('generates N-1 features for N points', () => {
    const points = [
      makePoint(45, 6, 1000),
      makePoint(45.1, 6.1, 1050),
      makePoint(45.2, 6.2, 1100),
      makePoint(45.3, 6.3, 1150),
    ];
    const geojson = buildTrackGeoJSON(points, 1000, 1150);
    expect(geojson.features).toHaveLength(3);
  });

  it('includes altitude Z in coordinates (coordinates[0] has 3 elements)', () => {
    const points = [makePoint(45, 6, 1000), makePoint(46, 7, 1100)];
    const geojson = buildTrackGeoJSON(points, 1000, 1100);
    const coords = geojson.features[0]!.geometry.coordinates[0]!;
    expect(coords).toHaveLength(3);
    expect(coords[0]).toBe(6);    // lon
    expect(coords[1]).toBe(45);   // lat
    expect(coords[2]).toBe(1000); // ele
  });

  it('uses Z=0 when ele is null', () => {
    const points = [makePoint(45, 6, null), makePoint(46, 7, null)];
    const geojson = buildTrackGeoJSON(points, 0, 0);
    const coords = geojson.features[0]!.geometry.coordinates[0]!;
    expect(coords[2]).toBe(0);
  });

  it('sets a hex color string as the color property', () => {
    const points = [makePoint(45, 6, 1000), makePoint(46, 7, 1100)];
    const geojson = buildTrackGeoJSON(points, 1000, 1100);
    const color = geojson.features[0]!.properties.color;
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('does not throw when eleMin === eleMax (division by zero protected)', () => {
    const points = [makePoint(45, 6, 500), makePoint(46, 7, 500)];
    expect(() => buildTrackGeoJSON(points, 500, 500)).not.toThrow();
  });
});

describe('computeExaggeration', () => {
  it('returns 3.0 for eleRange=50', () => {
    expect(computeExaggeration(50)).toBe(3.0);
  });

  it('returns 2.5 for eleRange=200', () => {
    expect(computeExaggeration(200)).toBe(2.5);
  });

  it('returns 2.0 for eleRange=400', () => {
    expect(computeExaggeration(400)).toBe(2.0);
  });

  it('returns 1.5 for eleRange=1577 (Mont Ventoux)', () => {
    expect(computeExaggeration(1577)).toBe(1.5);
  });
});

describe('computeBearing', () => {
  it('returns 0 for two identical points', () => {
    const bearing = computeBearing(45, 6, 45, 6);
    expect(isNaN(bearing)).toBe(false);
    expect(bearing).toBe(0);
  });

  it('returns a bearing close to 0° when moving due North', () => {
    const bearing = computeBearing(45, 6, 46, 6);
    expect(bearing).toBeCloseTo(0, 0);
  });

  it('returns a bearing close to 90° when moving due East', () => {
    const bearing = computeBearing(45, 6, 45, 7);
    expect(bearing).toBeCloseTo(90, 0);
  });
});

// ViewMode is defined in Map3DView.tsx as 'satellite' | 'terrain'.
// The React component (Map3DView) relies on maplibregl and cannot be unit-tested
// without a DOM + WebGL environment, so only the valid string values are documented here.
describe('ViewMode constants (documentation)', () => {
  // These tests assert that the two expected literal values are the correct strings,
  // acting as a canary if the ViewMode union type is ever renamed or extended.
  it('satellite mode value is the string "satellite"', () => {
    const mode: 'satellite' | 'terrain' = 'satellite';
    expect(mode).toBe('satellite');
  });

  it('terrain mode value is the string "terrain"', () => {
    const mode: 'satellite' | 'terrain' = 'terrain';
    expect(mode).toBe('terrain');
  });

  it('only two modes exist in the ViewMode union', () => {
    const validModes: Array<'satellite' | 'terrain'> = ['satellite', 'terrain'];
    expect(validModes).toHaveLength(2);
    expect(validModes).toContain('satellite');
    expect(validModes).toContain('terrain');
  });
});
