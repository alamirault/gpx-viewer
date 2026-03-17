import { useTranslation } from 'react-i18next';
import type { GpxMetrics } from '../utils/gpxParser';

function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

function formatSpeed(mps: number | null): string | null {
  if (mps == null) return null;
  return (mps * 3.6).toFixed(1);
}

interface MetricsPanelProps {
  metrics: GpxMetrics;
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  const { t } = useTranslation();
  const na = t('na');

  const cards = [
    {
      label: t('metrics.distance'),
      value:
        metrics.totalDistance != null
          ? `${(metrics.totalDistance / 1000).toFixed(2)} ${t('units.km')}`
          : na,
    },
    {
      label: t('metrics.elevGain'),
      value: metrics.elevGain != null ? `${Math.round(metrics.elevGain)} ${t('units.m')}` : na,
    },
    {
      label: t('metrics.elevLoss'),
      value: metrics.elevLoss != null ? `${Math.round(metrics.elevLoss)} ${t('units.m')}` : na,
    },
    {
      label: t('metrics.eleMin'),
      value: metrics.eleMin != null ? `${Math.round(metrics.eleMin)} ${t('units.m')}` : na,
    },
    {
      label: t('metrics.eleMax'),
      value: metrics.eleMax != null ? `${Math.round(metrics.eleMax)} ${t('units.m')}` : na,
    },
    {
      label: t('metrics.eleAvg'),
      value: metrics.eleAvg != null ? `${Math.round(metrics.eleAvg)} ${t('units.m')}` : na,
    },
    {
      label: t('metrics.duration'),
      value: formatDuration(metrics.duration) ?? na,
    },
    {
      label: t('metrics.avgSpeed'),
      value:
        metrics.avgSpeed != null
          ? `${formatSpeed(metrics.avgSpeed)} ${t('units.kmh')}`
          : na,
    },
    {
      label: t('metrics.maxSpeed'),
      value:
        metrics.maxSpeed != null
          ? `${formatSpeed(metrics.maxSpeed)} ${t('units.kmh')}`
          : na,
    },
  ];

  return (
    <div className="metrics-panel">
      {cards.map((card) => (
        <div key={card.label} className="metric-card">
          <span className="metric-card__label">{card.label}</span>
          <span className="metric-card__value">{card.value}</span>
        </div>
      ))}
    </div>
  );
}
