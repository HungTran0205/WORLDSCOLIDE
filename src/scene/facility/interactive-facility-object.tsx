/**
 * Interactive facility object — diegetic function-panel trigger.
 *
 * Clones a room's iconic GLB prop (anvil / reactor / counter) and wraps it with
 * an invisible hitbox. Clicking it requests the matching facility function panel
 * via the camera slice (R3F → React bridge) and retires the first-visit coachmark.
 *
 * Hover affordance is the pointer cursor only — discoverability is carried by the
 * one-time coachmark, so no persistent glow/icon is mounted (avoids touching every
 * lit material). Renders the GLB identically to RoomProp so visuals are unchanged.
 */

import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/game/state/store';
import { useUiStore, type FacilityHintType } from '@/game/state/ui-store';
import { applyLitMaterial } from '../guild-hall/apply-lit-material';

interface InteractiveFacilityObjectProps {
  glbPath: string;
  /** Absolute world position (already offset by the room's cx/cz at the call site). */
  position: [number, number, number];
  targetHeight: number;
  rotY?: number;
  /** Convert materials to MeshStandard + enable castShadow (parity with RoomProp). */
  castShadow?: boolean;
  /** Hitbox size [w,h,d] — kept generous so touch targets stay easy to hit. */
  hitboxSize?: [number, number, number];
  /** Restricted to the 3 facilities that surface a function panel via their object. */
  facilityType: FacilityHintType;
}

/** Scales a cloned GLB so its base sits at y=0 and total height = targetHeight. */
function useScaledGlb(scene: THREE.Group, targetHeight: number, castShadow: boolean) {
  return useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? targetHeight / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    if (castShadow) applyLitMaterial(clone);
    return clone;
  }, [scene, targetHeight, castShadow]);
}

export function InteractiveFacilityObject({
  glbPath,
  position,
  targetHeight,
  rotY = 0,
  castShadow = false,
  hitboxSize = [2, 2.4, 2],
  facilityType,
}: InteractiveFacilityObjectProps) {
  const { scene } = useGLTF(glbPath);
  const model = useScaledGlb(scene, targetHeight, castShadow);
  const requestFacilityPanel = useGameStore((s) => s.requestFacilityPanel);
  const markFacilityHintSeen = useUiStore((s) => s.markFacilityHintSeen);

  // Reset cursor on unmount — pointerOut won't fire on scene swap/HMR/reload,
  // which would otherwise leave a stuck 'pointer' cursor over the rest of the UI.
  useEffect(() => () => { document.body.style.cursor = ''; }, []);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    // Retire the coachmark on the action it teaches, then frame + open the panel.
    markFacilityHintSeen(facilityType);
    requestFacilityPanel(facilityType, position);
  };

  const handleOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handleOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    document.body.style.cursor = '';
  };

  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* Invisible hitbox — generous box around the object so touch targets stay
          easy. Centred vertically (y = half the hitbox height). */}
      <mesh
        position={[0, hitboxSize[1] / 2, 0]}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <boxGeometry args={hitboxSize} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <primitive object={model} />
    </group>
  );
}
