import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import faviconUrl from '/favicon.svg';
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
  const [mapHoverDistance, setMapHoverDistance] = useState<number | null>(null);
  const [pinnedPoint, setPinnedPoint] = useState<{ lat: number; lon: number } | null>(null);
  // Separate camera state per view so zoom mismatch between pitched 3D and flat 2D is avoided
  const [camera2D, setCamera2D] = useState<CameraState | null>(null);
  const [camera3D, setCamera3D] = useState<CameraState | null>(null);
  const [trackName, setTrackName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore last GPX from localStorage on first load
  useEffect(() => {
    const saved = localStorage.getItem('gpx-last');
    if (!saved) return;
    try {
      const data = parseGPX(saved);
      setGpxData(data);
      setTrackName(localStorage.getItem('gpx-name') || data.name);
    } catch {
      localStorage.removeItem('gpx-last');
    }
  }, []);

  const handleFileLoad = (gpxString: string, fileName = '') => {
    try {
      setError(null);
      const data = parseGPX(gpxString);
      setTrackName(data.name ?? (fileName || null));
      localStorage.setItem('gpx-last', gpxString);
      localStorage.setItem('gpx-name', data.name ?? fileName ?? '');
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
    reader.onload = (ev) => handleFileLoad(ev.target?.result as string, file.name.replace(/\.gpx$/i, ''));
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleMapHover = (point: { lat: number; lon: number } | null) => {
    if (!point || !gpxData) {
      setMapHoverDistance(null);
      setHoverPoint(null);
      return;
    }
    let minDist = Infinity;
    let nearest = gpxData.chartData[0]!;
    for (const p of gpxData.chartData) {
      const d = (p.lat - point.lat) ** 2 + (p.lon - point.lon) ** 2;
      if (d < minDist) { minDist = d; nearest = p; }
    }
    setMapHoverDistance(nearest.distance);
    setHoverPoint({ lat: nearest.lat, lon: nearest.lon });
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
    reader.onload = (ev) => handleFileLoad(ev.target?.result as string, file.name.replace(/\.gpx$/i, ''));
    reader.readAsText(file);
  };

  const handleReset = () => {
    localStorage.removeItem('gpx-last');
    localStorage.removeItem('gpx-name');
    setGpxData(null);
    setTrackName(null);
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
            <img className="drop-overlay__icon" src={faviconUrl} alt="" aria-hidden="true" />
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
          {trackName && (
            <>
              <span className="header__sep" aria-hidden="true">/</span>
              <span className="header__track-name" title={trackName}>{trackName}</span>
            </>
          )}
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
          <div className="hero">
            <div className="hero__content">
              <div className="hero__intro">
                <h2 className="hero__tagline">{t('hero.tagline')}</h2>
                <p className="hero__description">{t('hero.description')}</p>
              </div>
              <DropZone onFileLoad={handleFileLoad} />
            </div>
            <svg className="hero__landscape" viewBox="0 0 1200 220" preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              {/* Back range */}
              <path d="M0,220 L0,130 C150,110 250,65 400,50 C500,40 560,70 640,45 C720,20 800,5 920,30 C1040,55 1100,75 1200,60 L1200,220 Z" fill="rgba(46,125,91,0.05)"/>
              {/* Mid range */}
              <path d="M0,220 L0,155 C100,143 200,128 320,118 C440,108 510,125 600,115 C690,105 770,88 880,100 C990,112 1070,128 1200,115 L1200,220 Z" fill="rgba(46,125,91,0.07)"/>
              {/* Foreground */}
              <path d="M0,220 L0,178 C100,170 200,160 320,153 C440,146 520,158 620,151 C720,144 810,134 920,143 C1030,152 1120,157 1200,151 L1200,220 Z" fill="rgba(46,125,91,0.10)"/>
              {/* GPX trace */}
              <path d="M-10,130 C100,110 200,65 370,50 C490,38 555,67 635,43 C715,19 795,3 915,28 C1035,53 1098,72 1210,58" fill="none" stroke="rgba(46,125,91,0.28)" strokeWidth="2.5" strokeDasharray="7 5"/>
              {/* Waypoint dots */}
              <circle cx="400" cy="50"  r="5" fill="rgba(46,125,91,0.38)"/>
              <circle cx="640" cy="43"  r="5" fill="rgba(46,125,91,0.38)"/>
              <circle cx="920" cy="28"  r="5" fill="rgba(46,125,91,0.38)"/>
            </svg>
          </div>
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
                <Map3DView key={mapKey} points={gpxData.points} hoverPoint={hoverPoint} pinnedPoint={pinnedPoint} onUnpin={() => setPinnedPoint(null)} cameraState={camera3D} onCameraChange={setCamera3D} onMapHover={handleMapHover} />
              ) : (
                <MapView key={mapKey} points={gpxData.points} hoverPoint={hoverPoint} pinnedPoint={pinnedPoint} onUnpin={() => setPinnedPoint(null)} cameraState={camera2D} onCameraChange={setCamera2D} onMapHover={handleMapHover} />
              )}
            </div>
            <div className="content__sidebar">
              <MetricsPanel metrics={gpxData.metrics} />
              <ElevationChart chartData={gpxData.chartData} onHover={setHoverPoint} onPin={setPinnedPoint} mapHoverDistance={mapHoverDistance} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
