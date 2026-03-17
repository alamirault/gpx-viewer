import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseGPX } from './gpxParser';
import type { GpxData } from './gpxParser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturesDir = resolve(__dirname, '../__tests__/fixtures');
const readFixture = (name: string): string => readFileSync(resolve(fixturesDir, name), 'utf-8');

describe('parseGPX', () => {
  describe('valid GPX with elevation and time', () => {
    const gpx = readFixture('valid-with-elevation.gpx');
    let result: GpxData;

    beforeAll(() => {
      result = parseGPX(gpx);
    });

    it('extracts all track points', () => {
      expect(result.points).toHaveLength(4);
    });

    it('parses lat/lon correctly', () => {
      expect(result.points[0].lat).toBe(45.0);
      expect(result.points[0].lon).toBe(6.0);
    });

    it('parses elevation', () => {
      expect(result.points[0].ele).toBe(1000);
      expect(result.points[1].ele).toBe(1050);
    });

    it('parses time', () => {
      expect(result.points[0].time).toBeInstanceOf(Date);
      expect(result.points[0].time!.toISOString()).toBe('2024-01-01T10:00:00.000Z');
    });

    it('computes total distance > 0', () => {
      expect(result.metrics.totalDistance).toBeGreaterThan(0);
    });

    it('computes elevation gain', () => {
      // 0->1050 (+50), 1050->1020 (loss), 1020->1100 (+80) => gain = 130
      expect(result.metrics.elevGain).toBe(130);
    });

    it('computes elevation loss', () => {
      // 1050->1020 = 30m loss
      expect(result.metrics.elevLoss).toBe(30);
    });

    it('computes min/max/avg elevation', () => {
      expect(result.metrics.eleMin).toBe(1000);
      expect(result.metrics.eleMax).toBe(1100);
      expect(result.metrics.eleAvg).toBeCloseTo((1000 + 1050 + 1020 + 1100) / 4, 1);
    });

    it('computes duration in seconds', () => {
      // 10:00 to 10:20 = 20 minutes = 1200 seconds
      expect(result.metrics.duration).toBe(1200);
    });

    it('computes average speed', () => {
      expect(result.metrics.avgSpeed).toBeGreaterThan(0);
      // avgSpeed = totalDistance / 1200
      expect(result.metrics.avgSpeed).toBeCloseTo(result.metrics.totalDistance / 1200, 5);
    });

    it('computes max speed', () => {
      expect(result.metrics.maxSpeed).toBeGreaterThan(0);
      expect(result.metrics.maxSpeed).toBeGreaterThanOrEqual(result.metrics.avgSpeed!);
    });

    it('generates chart data', () => {
      expect(result.chartData).toHaveLength(4);
      expect(result.chartData[0].distance).toBe(0);
      expect(result.chartData[0].elevation).toBe(1000);
    });
  });

  describe('valid GPX without elevation or time', () => {
    const gpx = readFixture('valid-no-elevation.gpx');
    let result: GpxData;

    beforeAll(() => {
      result = parseGPX(gpx);
    });

    it('extracts track points', () => {
      expect(result.points).toHaveLength(3);
    });

    it('sets elevation to null', () => {
      result.points.forEach((p) => {
        expect(p.ele).toBeNull();
      });
    });

    it('sets time to null', () => {
      result.points.forEach((p) => {
        expect(p.time).toBeNull();
      });
    });

    it('still computes distance', () => {
      expect(result.metrics.totalDistance).toBeGreaterThan(0);
    });

    it('sets elevation stats to null/zero', () => {
      expect(result.metrics.elevGain).toBe(0);
      expect(result.metrics.elevLoss).toBe(0);
      expect(result.metrics.eleMin).toBeNull();
      expect(result.metrics.eleMax).toBeNull();
      expect(result.metrics.eleAvg).toBeNull();
    });

    it('sets time stats to null', () => {
      expect(result.metrics.duration).toBeNull();
      expect(result.metrics.avgSpeed).toBeNull();
      expect(result.metrics.maxSpeed).toBeNull();
    });
  });

  describe('invalid GPX', () => {
    it('throws on invalid XML', () => {
      const gpx = readFixture('invalid.gpx');
      expect(() => parseGPX(gpx)).toThrow('Invalid GPX file: XML parsing failed');
    });

    it('throws on empty track (no trkpt)', () => {
      const gpx = readFixture('empty.gpx');
      expect(() => parseGPX(gpx)).toThrow('Invalid GPX file: no track points found');
    });
  });

  describe('haversine distance sanity check', () => {
    it('computes reasonable distance for known coordinates', () => {
      // ~111m per 0.001 degree latitude at 45N
      const gpx = `<?xml version="1.0"?>
        <gpx><trk><trkseg>
          <trkpt lat="45.0" lon="6.0"><ele>0</ele></trkpt>
          <trkpt lat="45.001" lon="6.0"><ele>0</ele></trkpt>
        </trkseg></trk></gpx>`;
      const result = parseGPX(gpx);
      // ~111 meters for 0.001 deg lat
      expect(result.metrics.totalDistance).toBeGreaterThan(100);
      expect(result.metrics.totalDistance).toBeLessThan(120);
    });
  });
});
