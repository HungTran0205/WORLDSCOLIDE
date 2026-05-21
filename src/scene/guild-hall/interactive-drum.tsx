/**
 * Interactive copper drum — diegetic quest board trigger.
 * Wraps the drum fire-holder mesh with an invisible hitbox + hover glow.
 * Click → requests the quest panel via the camera slice (R3F → React bridge).
 *
 * Phase 3 of Quest Board Diegetic Redesign.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/game/state/store';
import { useUiStore } from '@/game/state/ui-store';
import { applyLitMaterial } from './apply-lit-material';
import { DrumFireVfx } from '../vfx/drum-fire-vfx';
import { DrumSparkleHint } from './drum-sparkle-hint';
import { useRegisterObstacle } from './use-register-obstacle';

const DRUM_GLB = '/GuildHall/LinhSon/optimized/p_cooperdrumfireholder.glb';
const DRUM_HEIGHT = 1.0;
const HITBOX_SIZE: [number, number, number] = [1.6, 1.8, 1.6];

/** Scales the cloned drum so its base sits at y=0 and total height = DRUM_HEIGHT */
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

export function InteractiveDrum() {
  const { scene } = useGLTF(DRUM_GLB);
  const model = useScaledDrum(scene);
  const requestQuestPanel = useGameStore((s) => s.requestQuestPanel);
  const tutorialSeen = useUiStore((s) => s.questBoardTutorialSeen);
  const markTutorialSeen = useUiStore((s) => s.markQuestTutorialSeen);
  const [hovered, setHovered] = useState(false);
  // Footprint measured from the hitbox + model only (excludes DrumFireVfx,
  // whose animated particles would inflate the bounding box non-deterministically).
  const collisionRef = useRef<THREE.Group>(null);
  useRegisterObstacle('drum', collisionRef);

  // Reset cursor on unmount — pointerOut won't fire on scene swap/HMR/reload,
  // which would leave a 'pointer' cursor stuck on the rest of the UI.
  useEffect(() => () => { document.body.style.cursor = ''; }, []);

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (!tutorialSeen) markTutorialSeen();
    requestQuestPanel();
  };

  const handleOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handleOut = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = '';
  };

  return (
    <group position={[5, 0, 3.5]}>
      {/* Collision footprint group — only the hitbox + drum model are measured. */}
      <group ref={collisionRef}>
        {/* Invisible hitbox — wider than the drum so touch targets stay generous.
            Sits centred on the drum body (y=0.9 ≈ half of HITBOX_SIZE.y).
            NOTE: this touch hitbox now also defines the drum's walk-collision
            footprint (measured via collisionRef) — retuning HITBOX_SIZE moves
            both the click target and the wall members route around. */}
        <mesh
          position={[0, HITBOX_SIZE[1] / 2, 0]}
          onClick={handleClick}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
        >
          <boxGeometry args={HITBOX_SIZE} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <primitive object={model} />
      </group>

      {/* First-visit discoverability — particle ring fades out once dismissed. */}
      {!tutorialSeen && <DrumSparkleHint />}

      {/* Hover affordance is now diegetic: the drum's own fire flares + grows
          more turbulent. Avoids mounting a new pointLight on hover (which
          would force three.js to recompile every lit material in the scene). */}
      <DrumFireVfx hovered={hovered} />
    </group>
  );
}
