import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ElevationChart from './ElevationChart';
import '../i18n';
import type { ChartDataPoint } from '../utils/gpxParser';

// Mock recharts to avoid rendering issues in jsdom
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe('ElevationChart', () => {
  it('renders chart when data has elevation', () => {
    const chartData: ChartDataPoint[] = [
      { distance: 0, elevation: 100 },
      { distance: 1.5, elevation: 200 },
      { distance: 3.0, elevation: 150 },
    ];
    const { container } = render(<ElevationChart chartData={chartData} />);
    expect(container.querySelector('.elevation-chart')).toBeInTheDocument();
  });

  it('returns null when all elevations are null', () => {
    const chartData: ChartDataPoint[] = [
      { distance: 0, elevation: null },
      { distance: 1.0, elevation: null },
    ];
    const { container } = render(<ElevationChart chartData={chartData} />);
    expect(container.querySelector('.elevation-chart')).toBeNull();
  });

  it('filters out null elevations from chart data', () => {
    const chartData: ChartDataPoint[] = [
      { distance: 0, elevation: 100 },
      { distance: 1.0, elevation: null },
      { distance: 2.0, elevation: 200 },
    ];
    const { container } = render(<ElevationChart chartData={chartData} />);
    expect(container.querySelector('.elevation-chart')).toBeInTheDocument();
  });

  it('renders nothing for empty array', () => {
    const { container } = render(<ElevationChart chartData={[]} />);
    expect(container.querySelector('.elevation-chart')).toBeNull();
  });
});
