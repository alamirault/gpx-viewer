import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { parseGPX } from './utils/gpxParser';
import type { GpxData } from './utils/gpxParser';

export interface CameraState {
  center: [number, number]; // [lat, lon]
  zoom: number;
  bearing: number;
  pitch: number;
}
import DropZone from './components/DropZone';
import MapView from './components/MapView';
import Map3DView from './components/Map3DView';
import ElevationChart from './components/ElevationChart';
import MetricsPanel from './components/MetricsPanel';
import LanguageSwitcher from './components/LanguageSwitcher';
import './styles/components.css';

export default function App() {
  const { t } = useTranslation();
  const [gpxData, setGpxData] = useState<GpxData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<{ lat: number; lon: number } | null>(null);
  const [pinnedPoint, setPinnedPoint] = useState<{ lat: number; lon: number } | null>(null);
  // Separate camera state per view so zoom mismatch between pitched 3D and flat 2D is avoided
  const [camera2D, setCamera2D] = useState<CameraState | null>(null);
  const [camera3D, setCamera3D] = useState<CameraState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore last GPX from localStorage on first load
  useEffect(() => {
    const saved = localStorage.getItem('gpx-last');
    if (!saved) return;
    try {
      setGpxData(parseGPX(saved));
    } catch {
      localStorage.removeItem('gpx-last');
    }
  }, []);

  const handleFileLoad = (gpxString: string) => {
    try {
      setError(null);
      const data = parseGPX(gpxString);
      localStorage.setItem('gpx-last', gpxString);
      setCamera2D(null);
      setCamera3D(null);
      setPinnedPoint(null);
      setMapKey((k) => k + 1);
      setGpxData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setGpxData(null);
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleFileLoad(ev.target?.result as string);
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleFileLoad(ev.target?.result as string);
    reader.readAsText(file);
  };

  const handleReset = () => {
    localStorage.removeItem('gpx-last');
    setGpxData(null);
    setError(null);
    setIs3D(false);
    setCamera2D(null);
    setCamera3D(null);
    setPinnedPoint(null);
  };

  return (
    <div
      className="app"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && gpxData && (
        <div className="drop-overlay" aria-live="polite">
          <div className="drop-overlay__inner">
            <div className="drop-overlay__icon">&#128506;</div>
            <p className="drop-overlay__title">{t('dropzone.dropOverlay')}</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        style={{ display: 'none' }}
        onChange={handleFilePick}
      />

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
        <div className="header__right">
          {gpxData && (
            <button
              className="header__change-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              {t('dropzone.changeFile')}
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main className="main">
        {error && <div className="error-banner" role="alert">{error}</div>}

        {!gpxData ? (
          <DropZone onFileLoad={handleFileLoad} />
        ) : (
          <div className="content">
            <div className="content__map">
              <div className="map-toggle" role="group" aria-label={t('map.viewToggle')}>
                <button
                  className={`map-toggle__btn${!is3D ? ' map-toggle__btn--active' : ''}`}
                  onClick={() => setIs3D(false)}
                  aria-pressed={!is3D}
                >
                  {t('map.view2D')}
                </button>
                <button
                  className={`map-toggle__btn${is3D ? ' map-toggle__btn--active' : ''}`}
                  onClick={() => setIs3D(true)}
                  aria-pressed={is3D}
                >
                  {t('map.view3D')}
                </button>
              </div>
              {is3D ? (
                <Map3DView key={mapKey} points={gpxData.points} hoverPoint={hoverPoint} pinnedPoint={pinnedPoint} onUnpin={() => setPinnedPoint(null)} cameraState={camera3D} onCameraChange={setCamera3D} />
              ) : (
                <MapView key={mapKey} points={gpxData.points} hoverPoint={hoverPoint} pinnedPoint={pinnedPoint} onUnpin={() => setPinnedPoint(null)} cameraState={camera2D} onCameraChange={setCamera2D} />
              )}
            </div>
            <div className="content__sidebar">
              <MetricsPanel metrics={gpxData.metrics} />
              <ElevationChart chartData={gpxData.chartData} onHover={setHoverPoint} onPin={setPinnedPoint} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
