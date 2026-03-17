import { useTranslation } from 'react-i18next';
import type { GpxMetrics } from '../utils/gpxParser';

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
