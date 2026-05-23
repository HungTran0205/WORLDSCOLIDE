/**
 * Title-scene drum — non-interactive variant of InteractiveDrum.
 * Reuses the copper drum + fire holder GLB and DrumFireVfx for visual parity
 * with the in-game guild hall. Strips out the quest-panel click handler,
 * hover affordance, sparkle tutorial hint, and game-store wiring — the title
 * screen renders the drum purely as scenery.
 *
 * useGraphicsQuality (consumed inside DrumFireVfx) reads from React context;
 * with no provider mounted in the title canvas it falls back to the default
 * 'high' tier, which is the right choice for a static showcase scene.
 */

import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { applyLitMaterial } from '@/scene/guild-hall/apply-lit-material';
import { DrumFireVfx } from '@/scene/vfx/drum-fire-vfx';
import { assetUrl } from '@/lib/asset-url';

const DRUM_GLB = '/GuildHall/LinhSon/optimized/p_cooperdrumfireholder.glb';
const DRUM_HEIGHT = 0.65;

/** Scales the cloned drum so base sits at y=0 and total height = DRUM_HEIGHT.
 *  Identical to InteractiveDrum's hook; duplicated here to keep title-drum
 *  free of in-game scene imports beyond the GLB path itself. */
function useScaledDrum(scene: THREE.Group) {
  return useMemo(() => {
    const clone = scene.clone(true);
    applyLitMaterial(clone);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? DRUM_HEIGHT / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    return clone;
  }, [scene]);
}

interface TitleDrumProps {
  position?: [number, number, number];
}

export function TitleDrum({ position = [0, 0, 0.5] }: TitleDrumProps) {
  const { scene } = useGLTF(assetUrl(DRUM_GLB));
  const model = useScaledDrum(scene);

  return (
    <group position={position}>
      <primitive object={model} />
      {/* Gold-shifted palette: replaces the pure-white flame tip ('#ffffff')
       *  with a warm parchment-gold so bloom reads as ritual firelight, not a
       *  blown-out hotspot. spotIntensityMul + spotMainColor pull the upward
       *  cone toward bronze and dim it ~35%, removing the white halo behind
       *  the drum mouth. */}
      <DrumFireVfx
        hovered={false}
        fireOffsetY={0.60}
        fireIntensityMul={0.2}
        fireTurbulenceMul={0.1}
        baseColorStart={['#ffd47a', '#ffb84a']}
        baseColorEnd={['#c8590a', '#7a2a05']}
        spotMainColor="#d4a045"
        spotIntensityMul={0.5}
        spotMainDistance={8.5}
        disableLeva
      />
    </group>
  );
}

useGLTF.preload(assetUrl(DRUM_GLB));
