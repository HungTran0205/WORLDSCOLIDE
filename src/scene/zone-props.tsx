/** Level-gated 3D prop rendering per facility zone — GLB models scaled to target heights */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FacilityType } from '@/game/state/game-state';

// Preload all GLBs used by zone props
const ZONE_GLB_PATHS = [
  '/models/furnitures/bar-counter.glb',
  '/models/furnitures/wine-barrel.glb',
  '/models/furnitures/training-dummy.glb',
  '/models/furnitures/medical-bed.glb',
  '/models/furnitures/alchemy-table.glb',
  '/models/furnitures/workbench.glb',
  '/models/furnitures/reception-desk.glb',
  '/arena/forest/3dprops/p_tree_large.glb',
  '/arena/forest/3dprops/p_tree_pine.glb',
  '/arena/forest/3dprops/p_stump.glb',
  '/arena/forest/3dprops/p_log_fallen.glb',
  '/arena/forest/3dprops/p_bush.glb',
];
ZONE_GLB_PATHS.forEach((p) => useGLTF.preload(p));

interface PropConfig {
  path: string;
  offset: [number, number, number];
  targetHeight: number;
  minLevel: number;
}

interface LightConfig {
  color: string;
  intensity: number;
  distance: number;
}

interface ZonePropsConfig {
  models: PropConfig[];
  light?: LightConfig;
}

const ZONE_PROPS: Record<FacilityType, ZonePropsConfig> = {
  tavern: {
    models: [
      { path: '/models/furnitures/bar-counter.glb', offset: [0, 0, 0], targetHeight: 1.0, minLevel: 1 },
      { path: '/models/furnitures/wine-barrel.glb', offset: [-0.8, 0, 0.6], targetHeight: 0.8, minLevel: 2 },
    ],
    light: { color: '#ff8833', intensity: 2, distance: 3 },
  },
  'training-yard': {
    models: [
      { path: '/models/furnitures/training-dummy.glb', offset: [0, 0, 0], targetHeight: 1.2, minLevel: 1 },
      { path: '/models/furnitures/training-dummy.glb', offset: [-0.8, 0, 0.6], targetHeight: 1.2, minLevel: 2 },
    ],
    light: { color: '#ff4422', intensity: 1.5, distance: 2.5 },
  },
  infirmary: {
    models: [
      { path: '/models/furnitures/medical-bed.glb', offset: [0, 0, 0], targetHeight: 0.9, minLevel: 1 },
      { path: '/models/furnitures/alchemy-table.glb', offset: [-0.8, 0, 0.6], targetHeight: 1.0, minLevel: 2 },
    ],
    light: { color: '#4488ff', intensity: 2, distance: 3 },
  },
  workshop: {
    models: [
      { path: '/models/furnitures/workbench.glb', offset: [0, 0, 0], targetHeight: 1.0, minLevel: 1 },
      { path: '/models/furnitures/reception-desk.glb', offset: [-0.8, 0, 0.6], targetHeight: 0.9, minLevel: 2 },
    ],
    light: { color: '#ffaa22', intensity: 2, distance: 2.5 },
  },
  'logging-site': {
    models: [
      { path: '/arena/forest/3dprops/p_tree_large.glb', offset: [0, 0, -0.8], targetHeight: 3.5, minLevel: 1 },
      { path: '/arena/forest/3dprops/p_tree_pine.glb', offset: [-1.0, 0, 0.3], targetHeight: 2.8, minLevel: 1 },
      { path: '/arena/forest/3dprops/p_stump.glb', offset: [0.9, 0, 0.6], targetHeight: 0.55, minLevel: 1 },
      { path: '/arena/forest/3dprops/p_bush.glb', offset: [0.3, 0, 0.8], targetHeight: 0.7, minLevel: 1 },
    ],
    light: { color: '#fff5cc', intensity: 2.5, distance: 4 },
  },
  'stone-quarry': {
    models: [
      { path: '/models/furnitures/workbench.glb', offset: [0, 0, 0], targetHeight: 1.0, minLevel: 1 },
    ],
    light: { color: '#aaaacc', intensity: 1.5, distance: 2.5 },
  },
};

/** Clone a GLB scene and auto-scale so the model is targetHeight units tall */
function useScaledModel(scene: THREE.Group, targetHeight: number) {
  return useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? targetHeight / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    return clone;
  }, [scene, targetHeight]);
}

function ZoneProp({ path, offset, targetHeight }: { path: string; offset: [number, number, number]; targetHeight: number }) {
  const { scene } = useGLTF(path);
  const model = useScaledModel(scene, targetHeight);
  return (
    <group position={offset}>
      <primitive object={model} />
    </group>
  );
}

interface ZonePropsProps {
  type: FacilityType;
  level: number;
}

/** Renders level-gated GLB props for a facility zone */
export function ZoneProps({ type, level }: ZonePropsProps) {
  const config = ZONE_PROPS[type];
  const activeModels = config.models.filter((m) => m.minLevel <= level);

  return (
    <group>
      {activeModels.map((m, i) => (
        <ZoneProp key={`${m.path}-${i}`} path={m.path} offset={m.offset} targetHeight={m.targetHeight} />
      ))}
      {level >= 3 && config.light && (
        <pointLight
          color={config.light.color}
          intensity={config.light.intensity}
          distance={config.light.distance}
          decay={2}
        />
      )}
    </group>
  );
}
