/**
 * Static decorative props for Linh Sơn guild hall.
 * All props are fixed scene elements (not player-placed furniture).
 *
 * Grid: 10 wide (x) × 7 deep (z). Back wall at z=0, left wall at x=0.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { TorchFireVfx } from '../vfx/torch-fire-vfx';
import { TorchFireEffect as TorchFireEffectLegacy } from '../vfx/torch-fire-particles';
import { useGraphicsQuality } from '../world';
import { applyLitMaterial } from './apply-lit-material';
import { InteractiveDrum } from './interactive-drum';

// ─── GLB paths ────────────────────────────────────────────────────────────────

const GLB = {
  torch: '/arena/cave/3dprops/optimized/p_standing_torch.glb',
  questBoard: '/models/furnitures/quest-board.glb',
  throne: '/GuildHall/LinhSon/optimized/p_ironthrone.glb',
  fairy: '/GuildHall/LinhSon/optimized/p_fairtymotherstatues.glb',
  dragon: '/GuildHall/LinhSon/optimized/p_dragonfatherstatues.glb',
  drum: '/GuildHall/LinhSon/optimized/p_cooperdrumfireholder.glb',
  pillar: '/GuildHall/LinhSon/optimized/p_woodpillar.glb'
} as const;

Object.values(GLB).forEach((p) => useGLTF.preload(p));

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Clone a GLB scene, apply lit materials, and auto-scale so the model is
 * `targetHeight` units tall, sitting with its base at y=0.
 */
function useScaledModel(scene: THREE.Group, targetHeight: number) {
  return useMemo(() => {
    const clone = scene.clone(true);
    applyLitMaterial(clone);
    const box = new THREE.Box3().setFromObject(clone);
    const h = box.getSize(new THREE.Vector3()).y;
    const s = h > 0 ? targetHeight / h : 1;
    clone.scale.setScalar(s);
    clone.position.y = -box.min.y * s;
    return clone;
  }, [scene, targetHeight]);
}

// ─── Wall Torch ───────────────────────────────────────────────────────────────

function WallTorch({ position, rotationY = 0, label = 'Torch' }: {
  position: [number, number, number];
  rotationY?: number;
  label?: string;
}) {
  const quality = useGraphicsQuality();
  const { scene } = useGLTF(GLB.torch);
  const model = useScaledModel(scene, 0.4);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <primitive object={model} />
      {quality === 'high'
        ? <TorchFireVfx offsetY={0.45} scale={0.6} debugLabel={label} />
        : <TorchFireEffectLegacy offsetY={0.45} scale={0.6} debugLabel={label} />
      }
      <pointLight position={[0, 0.55, 0]} color="#ff8833" intensity={3} distance={4} decay={2} />
    </group>
  );
}

// ─── Scene props ──────────────────────────────────────────────────────────────

function QuestBoard() {
  const { scene } = useGLTF(GLB.questBoard);
  const model = useScaledModel(scene, 1.2);
  // Raised to y=0.7 so it reads as wall-mounted, not lying on floor
  return (
    <group position={[1.5, 0.7, 0.08]}>
      <primitive object={model} />
    </group>
  );
}

function IronThrone() {
  const { scene } = useGLTF(GLB.throne);
  const model = useScaledModel(scene, 2.2);
  // Moved forward (z=1.2) so the backrest is not clipped by the back wall
  return (
    <group position={[5, 0, 1.2]}>
      <primitive object={model} />
    </group>
  );
}

function FairyMotherStatues() {
  const { scene } = useGLTF(GLB.fairy);
  const model = useScaledModel(scene, 2.8);
  // Right of throne, pulled slightly forward to clear wall
  return (
    <group position={[7.5, 0, 0.5]}>
      <primitive object={model} />
    </group>
  );
}

function DragonFatherStatues() {
  const { scene } = useGLTF(GLB.dragon);
  const model = useScaledModel(scene, 2.8);
  // Left of throne, mirrored placement from fairy statues
  return (
    <group position={[2.5, 0, 0.5]} rotation={[0, 0, 0]}>
      <primitive object={model} />
    </group>
  );
}

// ─── Wood Pillars ─────────────────────────────────────────────────────────────

function WoodPillar({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF(GLB.pillar);
  const model = useScaledModel(scene, 4.5);
  return (
    <group position={position}>
      <primitive object={model} />
    </group>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** All static decorative props for the Linh Sơn guild hall */
export function GuildHallProps() {
  return (
    <>
      {/* Back wall torch — left side only (right side moved to pillar top) */}
      <WallTorch position={[0.8, 1.8, 0.25]} rotationY={0} label="Torch BL" />

      {/* Left wall torch — front section only (back section moved to pillar top) */}
      <WallTorch position={[0.25, 1.8, 2]} rotationY={Math.PI / 2} label="Torch LL" />

      {/* Pillar-body torches — pushed out to outer face, facing into room */}
      {/* North pillar: shift +z to clear pillar radius, face into room (+z) */}
      <WallTorch position={[9.5, 1.8, 1.3]} rotationY={0} label="Torch North Pillar" />
      {/* West pillar: shift +x to clear pillar radius, face into room (+x) */}
      <WallTorch position={[1.3, 1.8, 6.5]} rotationY={Math.PI / 2} label="Torch West Pillar" />

      {/* Quest board — wall-mounted on left section of back wall */}
      <QuestBoard />

      {/* Hero props */}
      <IronThrone />
      <DragonFatherStatues />
      <FairyMotherStatues />
      <InteractiveDrum />

      {/* Wood pillars — north corner (back-right) + west corner (front-left) */}
      <WoodPillar position={[9.5, 0, 0.5]} />
      <WoodPillar position={[0.5, 0, 6.5]} />
    </>
  );
}
