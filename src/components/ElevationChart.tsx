import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Customized,
} from 'recharts';
import type { CategoricalChartState } from 'recharts/types/chart/generateCategoricalChart';
import type { ChartDataPoint } from '../utils/gpxParser';

interface ElevationChartProps {
  chartData: ChartDataPoint[];
  mapHoverDistance?: number | null;
  onHover?: (point: { lat: number; lon: number } | null) => void;
  onPin?: (point: { lat: number; lon: number }) => void;
}

export default function ElevationChart({ chartData, mapHoverDistance, onHover, onPin }: ElevationChartProps) {
  const { t, i18n } = useTranslation();

  const filteredData = chartData.filter((d) => d.elevation !== null);

  // Find nearest data point to the map-hover distance
  const mapHoverPoint = mapHoverDistance != null && filteredData.length > 0
    ? filteredData.reduce((prev, curr) =>
        Math.abs(curr.distance - mapHoverDistance) < Math.abs(prev.distance - mapHoverDistance) ? curr : prev
      )
    : null;
  if (filteredData.length === 0) return null;

  const getPayloadPoint = (state: CategoricalChartState) =>
    state.activePayload?.[0]?.payload as ChartDataPoint | undefined;

  const handleMouseMove = (state: CategoricalChartState) => {
    const point = getPayloadPoint(state);
    if (point) onHover?.({ lat: point.lat, lon: point.lon });
  };

  const handleMouseLeave = () => onHover?.(null);

  const handleClick = (state: CategoricalChartState) => {
    const point = getPayloadPoint(state);
    if (point) onPin?.({ lat: point.lat, lon: point.lon });
  };

  return (
    <div className="elevation-chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart key={i18n.language}
          data={filteredData}
          margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ cursor: 'crosshair' }}
        >
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
          <Customized component={({ xAxisMap, yAxisMap, margin, height }: Record<string, any>) => {
            if (!mapHoverPoint || !xAxisMap || !yAxisMap) return null;
            const xScale = (Object.values(xAxisMap)[0] as any)?.scale;
            const yScale = (Object.values(yAxisMap)[0] as any)?.scale;
            if (!xScale || !yScale) return null;
            const x = xScale(mapHoverPoint.distance);
            const y = yScale(mapHoverPoint.elevation);
            const top = margin?.top ?? 10;
            const bottom = (height as number) - (margin?.bottom ?? 20);
            return (
              <g>
                <line x1={x} y1={top} x2={x} y2={bottom} stroke="#2E7D5B" strokeOpacity={0.45} strokeDasharray="4 3" strokeWidth={1.5} />
                <circle cx={x} cy={y} r={4} fill="#2E7D5B" stroke="white" strokeWidth={2} />
              </g>
            );
          }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
