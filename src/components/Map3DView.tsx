import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import type { GpxPoint } from '../utils/gpxParser';

const TO_RAD = Math.PI / 180;
const R_EARTH = 6371000;

function elevationColor(t: number): THREE.Color {
  // Gradient: blue (0) → green (0.4) → amber (0.7) → red (1)
  if (t < 0.4) {
    const s = t / 0.4;
    return new THREE.Color().lerpColors(
      new THREE.Color('#3B82F6'),
      new THREE.Color('#10B981'),
      s
    );
  } else if (t < 0.7) {
    const s = (t - 0.4) / 0.3;
    return new THREE.Color().lerpColors(
      new THREE.Color('#10B981'),
      new THREE.Color('#F59E0B'),
      s
    );
  } else {
    const s = (t - 0.7) / 0.3;
    return new THREE.Color().lerpColors(
      new THREE.Color('#F59E0B'),
      new THREE.Color('#EF4444'),
      s
    );
  }
}

function projectPoints(points: GpxPoint[]): {
  positions: [number, number, number][];
  colors: THREE.Color[];
  groundY: number;
} {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const eles = points.map((p) => p.ele ?? 0);

  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;

  const xs = points.map(
    (p) => (p.lon - centerLon) * TO_RAD * R_EARTH * Math.cos(centerLat * TO_RAD)
  );
  const ys = points.map((p) => (p.lat - centerLat) * TO_RAD * R_EARTH);

  const xRange = Math.max(...xs) - Math.min(...xs) || 1;
  const yRange = Math.max(...ys) - Math.min(...ys) || 1;
  const horizSpan = Math.max(xRange, yRange);
  const scale = 10 / horizSpan;

  const eleMin = Math.min(...eles);
  const eleMax = Math.max(...eles);
  const eleRange = eleMax - eleMin || 1;

  // Vertical exaggeration: make elevation span at least 2 units, max 8
  const naturalEleScale = eleRange * scale;
  const targetEleScale = Math.max(2, Math.min(8, horizSpan * scale * 0.35));
  const vExag = targetEleScale / naturalEleScale;

  const groundY = eleMin * scale * vExag;

  const positions: [number, number, number][] = points.map((p, i) => [
    xs[i]! * scale,
    eles[i]! * scale * vExag,
    -ys[i]! * scale,
  ]);

  const colors: THREE.Color[] = eles.map((e) =>
    elevationColor((e - eleMin) / eleRange)
  );

  return { positions, colors, groundY };
}

function StartEndMarkers({
  start,
  end,
}: {
  start: [number, number, number];
  end: [number, number, number];
}) {
  return (
    <>
      <mesh position={start}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#10B981" />
      </mesh>
      <mesh position={end}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#EF4444" />
      </mesh>
    </>
  );
}

function AnimatedCamera() {
  const angle = useRef(0);
  const animating = useRef(true);

  useFrame((state, delta) => {
    if (!animating.current) return;
    angle.current += delta * 0.3;
    if (angle.current > Math.PI * 0.5) {
      animating.current = false;
      return;
    }
    state.camera.position.setFromSphericalCoords(
      18,
      Math.PI / 3 - angle.current * 0.2,
      angle.current
    );
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

function Track({ points }: { points: GpxPoint[] }) {
  const { positions, colors, groundY } = useMemo(() => projectPoints(points), [points]);

  return (
    <>
      <AnimatedCamera />

      {/* Ground grid */}
      <Grid
        position={[0, groundY - 0.3, 0]}
        args={[24, 24]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#c8d5ce"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#a0b8ad"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Vertical drop lines from each point to ground */}
      {positions.filter((_, i) => i % 20 === 0).map((pos, i) => (
        <Line
          key={i}
          points={[pos, [pos[0], groundY, pos[2]]]}
          color="#c8d5ce"
          lineWidth={0.5}
          opacity={0.5}
          transparent
        />
      ))}

      {/* Main track */}
      <Line
        points={positions}
        vertexColors={colors}
        lineWidth={3}
      />

      {/* Start/end markers */}
      <StartEndMarkers start={positions[0]!} end={positions[positions.length - 1]!} />

      {/* Lighting */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 20, 10]} intensity={0.6} />
    </>
  );
}

interface Map3DViewProps {
  points: GpxPoint[];
}

export default function Map3DView({ points }: Map3DViewProps) {
  const { t } = useTranslation();
  const hasElevation = points.some((p) => p.ele !== null);

  return (
    <div className="map-container map-3d">
      <Canvas
        camera={{ position: [0, 12, 18], fov: 45 }}
        style={{ background: '#F0F5F2' }}
      >
        {hasElevation ? (
          <Track points={points} />
        ) : (
          <Track points={points.map((p) => ({ ...p, ele: 0 }))} />
        )}
        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={3}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {!hasElevation && (
        <div className="map-3d__no-elevation">{t('map.noElevation')}</div>
      )}

      {/* Elevation legend */}
      <div className="map-3d__legend" aria-label="Légende altitude">
        <div className="map-3d__legend-bar" />
        <div className="map-3d__legend-labels">
          <span style={{ color: '#EF4444' }}>Max</span>
          <span style={{ color: '#10B981' }}>Mid</span>
          <span style={{ color: '#3B82F6' }}>Min</span>
        </div>
      </div>

      <div className="map-3d__hint">🖱 {t('map.hint')}</div>
    </div>
  );
}
