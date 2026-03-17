import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MetricsPanel from './MetricsPanel';
import '../i18n';
import type { GpxMetrics } from '../utils/gpxParser';

describe('MetricsPanel', () => {
  const fullMetrics: GpxMetrics = {
    totalDistance: 12345.67,
    elevGain: 456,
    elevLoss: 234,
    eleMin: 100,
    eleMax: 890,
    eleAvg: 450.5,
    duration: 7265, // 2h 01m 05s
    avgSpeed: 1.7, // m/s => 6.1 km/h
    maxSpeed: 4.2, // m/s => 15.1 km/h
  };

  it('renders all 9 metric cards', () => {
    render(<MetricsPanel metrics={fullMetrics} />);
    const cards = document.querySelectorAll('.metric-card');
    expect(cards).toHaveLength(9);
  });

  it('displays formatted distance in km', () => {
    render(<MetricsPanel metrics={fullMetrics} />);
    expect(screen.getByText('12.35 km')).toBeInTheDocument();
  });

  it('displays elevation gain and loss', () => {
    render(<MetricsPanel metrics={fullMetrics} />);
    expect(screen.getByText('456 m')).toBeInTheDocument();
    expect(screen.getByText('234 m')).toBeInTheDocument();
  });

  it('displays min/max/avg altitude', () => {
    render(<MetricsPanel metrics={fullMetrics} />);
    expect(screen.getByText('100 m')).toBeInTheDocument();
    expect(screen.getByText('890 m')).toBeInTheDocument();
    expect(screen.getByText('451 m')).toBeInTheDocument(); // rounded
  });

  it('displays formatted duration', () => {
    render(<MetricsPanel metrics={fullMetrics} />);
    expect(screen.getByText('2h 01m 05s')).toBeInTheDocument();
  });

  it('displays speeds in km/h', () => {
    render(<MetricsPanel metrics={fullMetrics} />);
    expect(screen.getByText('6.1 km/h')).toBeInTheDocument();
    expect(screen.getByText('15.1 km/h')).toBeInTheDocument();
  });

  it('displays N/A for null metrics', () => {
    const nullMetrics: GpxMetrics = {
      totalDistance: 1000,
      elevGain: 0,
      elevLoss: 0,
      eleMin: null,
      eleMax: null,
      eleAvg: null,
      duration: null,
      avgSpeed: null,
      maxSpeed: null,
    };
    render(<MetricsPanel metrics={nullMetrics} />);
    const naElements = screen.getAllByText('N/A');
    expect(naElements.length).toBeGreaterThanOrEqual(4);
  });

  it('renders metric labels from translations', () => {
    render(<MetricsPanel metrics={fullMetrics} />);
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Dénivelé +')).toBeInTheDocument();
    expect(screen.getByText('Durée')).toBeInTheDocument();
  });
});
