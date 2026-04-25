/** Zone floor marker — colored plane mesh indicating a facility zone boundary */

import * as THREE from 'three';
import type { FacilityType } from '@/game/state/game-state';
import { LOGGING_SITE_CONFIG } from '@/game/data/facility-definitions';

const ZONE_COLORS: Record<FacilityType, string> = {
  tavern: '#D4A017',
  'training-yard': '#B04040',
  infirmary: '#4080B0',
  workshop: '#8B6914',
  'logging-site': '#4A7A30',
  'stone-quarry': '#7A7060',
  'alchemy-lab': '#9B59B6',
};

interface ZoneFloorMarkerProps {
  footprint: [number, number];
  facilityType: FacilityType;
  locked: boolean;
  /** 0–1 fraction of reserve remaining (logging-site only) */
  reservePct?: number;
}

/** Semi-transparent floor plane for zone bounds. Locked = grey/dim, active = facility color. */
export function ZoneFloorMarker({ footprint, facilityType, locked, reservePct }: ZoneFloorMarkerProps) {
  let color: string;
  let opacity: number;

  if (locked) {
    color = '#888888';
    opacity = 0.15;
  } else if (facilityType === 'logging-site' && reservePct !== undefined) {
    // Tint floor based on reserve level
    color = reservePct <= 0
      ? '#6b7280'   // depleted: grey
      : reservePct <= LOGGING_SITE_CONFIG.warningCriticalPct
        ? '#ef4444' // critical: red
        : reservePct <= LOGGING_SITE_CONFIG.warningLowPct
          ? '#f59e0b' // warning: amber
          : ZONE_COLORS[facilityType]; // normal: green
    opacity = reservePct <= 0 ? 0.20 : 0.30;
  } else {
    color = ZONE_COLORS[facilityType];
    opacity = 0.25;
  }

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
      <planeGeometry args={[footprint[0], footprint[1]]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
