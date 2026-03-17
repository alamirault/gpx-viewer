import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { parseGPX } from './utils/gpxParser';
import type { GpxData } from './utils/gpxParser';
import DropZone from './components/DropZone';
import MapView from './components/MapView';
import ElevationChart from './components/ElevationChart';
import MetricsPanel from './components/MetricsPanel';
import LanguageSwitcher from './components/LanguageSwitcher';
import './styles/components.css';

export default function App() {
  const { t } = useTranslation();
  const [gpxData, setGpxData] = useState<GpxData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoad = (gpxString: string) => {
    try {
      setError(null);
      const data = parseGPX(gpxString);
      setGpxData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setGpxData(null);
    }
  };

  const handleReset = () => {
    setGpxData(null);
    setError(null);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header__left">
          <h1
            className="header__title"
            onClick={handleReset}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleReset(); }}
            role="button"
            tabIndex={0}
            aria-label={t('appName')}
            style={{ cursor: 'pointer' }}
          >
            {t('appName')}
          </h1>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="main">
        {error && <div className="error-banner" role="alert">{error}</div>}

        {!gpxData ? (
          <DropZone onFileLoad={handleFileLoad} />
        ) : (
          <div className="content">
            <div className="content__map">
              <MapView points={gpxData.points} />
            </div>
            <div className="content__sidebar">
              <MetricsPanel metrics={gpxData.metrics} />
              <ElevationChart chartData={gpxData.chartData} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
