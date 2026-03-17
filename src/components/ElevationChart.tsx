import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint } from '../utils/gpxParser';

interface ElevationChartProps {
  chartData: ChartDataPoint[];
}

export default function ElevationChart({ chartData }: ElevationChartProps) {
  const { t } = useTranslation();

  const filteredData = chartData.filter((d) => d.elevation !== null);
  if (filteredData.length === 0) return null;

  return (
    <div className="elevation-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4CAF82" stopOpacity={0.6} />
              <stop offset="95%" stopColor="#4CAF82" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D4DDD8" />
          <XAxis
            dataKey="distance"
            tickFormatter={(v: number) => v.toFixed(1)}
            label={{ value: t('chart.distance'), position: 'insideBottomRight', offset: -5 }}
            stroke="#5A6B63"
          />
          <YAxis
            label={{ value: t('chart.elevation'), angle: -90, position: 'insideLeft' }}
            stroke="#5A6B63"
          />
          <Tooltip
            formatter={(value: number) => [`${Math.round(value)} m`, t('chart.elevation')]}
            labelFormatter={(label: number) => `${Number(label).toFixed(2)} km`}
          />
          <Area
            type="monotone"
            dataKey="elevation"
            stroke="#2E7D5B"
            strokeWidth={2}
            fill="url(#elevGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
