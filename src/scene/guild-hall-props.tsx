/**
 * Static decorative props for Linh Sơn guild hall.
 * All props are fixed scene elements (not player-placed furniture).
 *
 * Grid: 10 wide (x) × 7 deep (z). Back wall at z=0, left wall at x=0.
 */

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { TorchFireEffect } from './torch-fire-particles';

// ─── GLB paths ────────────────────────────────────────────────────────────────

const GLB = {
  torch: '/arena/cave/3dprops/optimized/p_standing_torch.glb',
  questBoard: '/models/furnitures/quest-board.glb',
  throne: '/GuildHall/LinhSon/optimized/p_ironthrone.glb',
  fairy: '/GuildHall/LinhSon/optimized/p_fairtymotherstatues.glb',
  dragon: '/GuildHall/LinhSon/optimized/p_dragonfatherstatues.glb',
  drum: '/GuildHall/LinhSon/optimized/p_cooperdrumfireholder.glb',
  pillar: '/GuildHall/LinhSon/optimized/p_woodpillar.glb',
} as const;

Object.values(GLB).forEach((p) => useGLTF.preload(p));

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** MeshBasicMaterial → MeshStandardMaterial so dynamic lights affect the mesh */
function applyLitMaterial(root: THREE.Group) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.Material;
    if (mat.type === 'MeshBasicMaterial') {
      const b = mat as THREE.MeshBasicMaterial;
      mesh.material = new THREE.MeshStandardMaterial({
        map: b.map, color: b.color,
        transparent: b.transparent, opacity: b.opacity,
        roughness: 0.8, metalness: 0.1,
      });
      b.dispose();
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });
}

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
  const { scene } = useGLTF(GLB.torch);
  const model = useScaledModel(scene, 0.4);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <primitive object={model} />
      <TorchFireEffect offsetY={0.45} scale={0.6} debugLabel={label} />
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

function DrumFireHolder() {
  const { scene } = useGLTF(GLB.drum);
  const model = useScaledModel(scene, 1.0);
  const groupRef = useRef<THREE.Group>(null);
  const spotRef = useRef<THREE.SpotLight>(null);
  const fillRef = useRef<THREE.SpotLight>(null);

  // Main upward cone — fire glow escaping the drum mouth
  const main = useControls('Drum Fire — Main Cone (Up)', {
    posY: { value: 0.45, min: 0, max: 2, step: 0.05 },
    targetY: { value: 5.8, min: 0.5, max: 12, step: 0.1 },
    color: { value: '#e2bbaa' },
    intensity: { value: 34.5, min: 0, max: 60, step: 0.5 },
    distance: { value: 7.0, min: 1, max: 20, step: 0.5 },
    angle: { value: Math.PI / 1.41, min: 0.05, max: Math.PI / 2, step: 0.01 },
    penumbra: { value: 0.15, min: 0, max: 2, step: 0.05 },
    decay: { value: 1.2, min: 0, max: 5, step: 0.1 },
  }, { collapsed: true });

  // Flicker — modulates main cone intensity each frame for organic firelight feel
  const flicker = useControls('Drum Fire — Flicker', {
    enabled: { value: true },
    amount: { value: 0.38, min: 0, max: 1, step: 0.01 },
    speed: { value: 1.00, min: 0.1, max: 5, step: 0.05 },
  }, { collapsed: true });

  // Downward fill so the drum body catches fire color
  const fill = useControls('Drum Fire — Fill Cone (Down)', {
    posY: { value: 1.20, min: 0, max: 2, step: 0.05 },
    targetY: { value: -2.1, min: -5, max: 0, step: 0.1 },
    color: { value: '#ff5511' },
    intensity: { value: 10.5, min: 0, max: 30, step: 0.5 },
    distance: { value: 3.2, min: 0.2, max: 10, step: 0.1 },
    angle: { value: Math.PI / 1.21, min: 0.05, max: Math.PI / 2, step: 0.01 },
    penumbra: { value: 1.95, min: 0, max: 2, step: 0.05 },
    decay: { value: 2.6, min: 0, max: 5, step: 0.1 },
  }, { collapsed: true });

  // Targets live inside the group so they inherit the drum transform.
  // Re-apply on every change so leva tweaks update the cone direction live.
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    if (spotRef.current) {
      g.add(spotRef.current.target);
      spotRef.current.target.position.set(0, main.targetY, 0);
      spotRef.current.target.updateMatrixWorld();
    }
    if (fillRef.current) {
      g.add(fillRef.current.target);
      fillRef.current.target.position.set(0, fill.targetY, 0);
      fillRef.current.target.updateMatrixWorld();
    }
  }, [main.targetY, fill.targetY]);

  // Flicker loop — direct ref mutation, no React re-render, ~zero overhead.
  // Layered sines at 3 incommensurate frequencies fake organic flame noise
  // without Math.random() jitter (which looks like a strobe, not fire).
  useFrame((state) => {
    const light = spotRef.current;
    if (!light) return;
    if (!flicker.enabled) {
      light.intensity = main.intensity;
      return;
    }
    const t = state.clock.elapsedTime * flicker.speed;
    const f =
      Math.sin(t * 12.0) * 0.5 +
      Math.sin(t * 23.7) * 0.3 +
      Math.sin(t * 7.3) * 0.2;
    // f ∈ ~[-1, 1] → scale by amount, multiply onto base intensity
    light.intensity = main.intensity * (1 + f * flicker.amount);
  });

  // Center of room — drum is ~1m tall, fire sits inside the bowl rim at ~0.85m
  return (
    <group ref={groupRef} position={[5, 0, 3.5]}>
      <primitive object={model} />
      {/* Fire + smoke particles rising from drum bowl */}
      <TorchFireEffect offsetY={0.85} scale={1.3} debugLabel="Drum Fire" />
      <spotLight
        ref={spotRef}
        position={[0, main.posY, 0]}
        color={main.color}
        intensity={main.intensity}
        distance={main.distance}
        angle={main.angle}
        penumbra={main.penumbra}
        decay={main.decay}
      />
      <spotLight
        ref={fillRef}
        position={[0, fill.posY, 0]}
        color={fill.color}
        intensity={fill.intensity}
        distance={fill.distance}
        angle={fill.angle}
        penumbra={fill.penumbra}
        decay={fill.decay}
      />
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
      <DrumFireHolder />

      {/* Wood pillars — north corner (back-right) + west corner (front-left) */}
      <WoodPillar position={[9.5, 0, 0.5]} />
      <WoodPillar position={[0.5, 0, 6.5]} />
    </>
  );
}
