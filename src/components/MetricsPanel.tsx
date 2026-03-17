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
          ? `${(metrics.totalDistance / 1000).toFixed(2)}`
          : na,
      unit: metrics.totalDistance != null ? t('units.km') : '',
      icon: '↔',
      accent: '#2E7D5B',
    },
    {
      label: t('metrics.elevGain'),
      value: metrics.elevGain != null ? `${Math.round(metrics.elevGain)}` : na,
      unit: metrics.elevGain != null ? t('units.m') : '',
      icon: '▲',
      accent: '#10B981',
    },
    {
      label: t('metrics.elevLoss'),
      value: metrics.elevLoss != null ? `${Math.round(metrics.elevLoss)}` : na,
      unit: metrics.elevLoss != null ? t('units.m') : '',
      icon: '▼',
      accent: '#EF4444',
    },
    {
      label: t('metrics.eleMin'),
      value: metrics.eleMin != null ? `${Math.round(metrics.eleMin)}` : na,
      unit: metrics.eleMin != null ? t('units.m') : '',
      icon: '↓',
      accent: '#3B82F6',
    },
    {
      label: t('metrics.eleMax'),
      value: metrics.eleMax != null ? `${Math.round(metrics.eleMax)}` : na,
      unit: metrics.eleMax != null ? t('units.m') : '',
      icon: '↑',
      accent: '#F59E0B',
    },
  ];

  return (
    <div className="metrics-panel">
      {cards.map((card) => (
        <div key={card.label} className="metric-card" style={{ '--accent': card.accent } as React.CSSProperties}>
          <span className="metric-card__label">
            <span className="metric-card__icon" aria-hidden="true">{card.icon}</span>
            {card.label}
          </span>
          <div className="metric-card__value-row">
            <span className="metric-card__value">{card.value}</span>
            {card.unit && <span className="metric-card__unit">{card.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
