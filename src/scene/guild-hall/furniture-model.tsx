/** 3D GLB furniture model loader — uses drei Clone for GPU resource sharing */

import { Clone, useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import type { PlacedFurniture } from '@/game/state/game-state';
import { FURNITURE_DEFINITIONS } from '@/game/data/furniture';
import { applyLitMaterial } from './apply-lit-material';
import { assetUrl } from '@/lib/asset-url';

/** Map furniture type → GLB model path (files live in public/models/furnitures/) */
const MODEL_PATH: Record<string, string> = {
  'quest-board': '/models/furnitures/quest-board.glb',
  'bar-counter': '/models/furnitures/bar-counter.glb',
  'alchemy-table': '/models/furnitures/alchemy-table.glb',
  'workbench': '/models/furnitures/workbench.glb',
  'training-dummy': '/models/furnitures/training-dummy.glb',
  'reception-desk': '/models/furnitures/reception-desk.glb',
  'wine-barrel': '/models/furnitures/wine-barrel.glb',
  'medical-bed': '/models/furnitures/medical-bed.glb',
};

/** Preload all furniture models */
Object.values(MODEL_PATH).forEach((path) => useGLTF.preload(assetUrl(path), false, true));

/** Cache bounding-box derived transform per model path (computed once per model type) */
const transformCache = new Map<string, { scale: number; offsetY: number }>();

function getModelTransform(scene: THREE.Group, targetW: number, targetD: number, cacheKey: string) {
  const cached = transformCache.get(cacheKey);
  if (cached) return cached;

  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());

  const scaleX = size.x > 0 ? (targetW * 0.85) / size.x : 1;
  const scaleZ = size.z > 0 ? (targetD * 0.85) / size.z : 1;
  const scaleY = size.y > 0 ? 1.0 / size.y : 1;
  const scale = Math.min(scaleX, scaleY, scaleZ);

  // Compute y-offset so model sits on the floor after scaling
  const center = box.getCenter(new THREE.Vector3());
  const halfH = (size.y * scale) / 2;
  const offsetY = -center.y * scale + halfH;

  const result = { scale, offsetY };
  transformCache.set(cacheKey, result);
  return result;
}

/** Renders a furniture GLB model — Clone shares GPU geometry/materials across instances */
export function FurnitureModel({ furniture }: { furniture: PlacedFurniture }) {
  const def = FURNITURE_DEFINITIONS.find((f) => f.type === furniture.type);
  const modelPath = MODEL_PATH[furniture.type];
  if (!def || !modelPath) return null;

  const { scene } = useGLTF(assetUrl(modelPath), false, true);

  const [cellW, cellD] = (furniture.rotation === 90 || furniture.rotation === 270)
    ? [def.depth, def.width] : [def.width, def.depth];

  const { scale, offsetY } = useMemo(
    () => getModelTransform(scene, cellW, cellD, `${furniture.type}-${cellW}-${cellD}`),
    [scene, furniture.type, cellW, cellD],
  );

  const litScene = useMemo(() => {
    const clone = scene.clone(true);
    applyLitMaterial(clone);
    return clone;
  }, [scene]);

  const posX = furniture.position.x + cellW / 2;
  const posZ = furniture.position.z + cellD / 2;

  return (
    <group
      position={[posX, 0.05, posZ]}
      rotation={[0, (furniture.rotation * Math.PI) / 180, 0]}
    >
      <group scale={scale} position={[0, offsetY, 0]}>
        <Clone object={litScene} />
      </group>
    </group>
  );
}
