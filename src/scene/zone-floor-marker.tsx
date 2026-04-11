/** Zone floor marker — colored plane mesh indicating a facility zone boundary */

import * as THREE from 'three';
import type { FacilityType } from '@/game/state/game-state';

const ZONE_COLORS: Record<FacilityType, string> = {
  tavern: '#D4A017',
  'training-yard': '#B04040',
  infirmary: '#4080B0',
  workshop: '#8B6914',
  'logging-site': '#4A7A30',
  'stone-quarry': '#7A7060',
};

interface ZoneFloorMarkerProps {
  footprint: [number, number];
  facilityType: FacilityType;
  locked: boolean;
}

/** Semi-transparent floor plane for zone bounds. Locked = grey/dim, active = facility color. */
export function ZoneFloorMarker({ footprint, facilityType, locked }: ZoneFloorMarkerProps) {
  const color = locked ? '#888888' : ZONE_COLORS[facilityType];
  const opacity = locked ? 0.15 : 0.25;

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
