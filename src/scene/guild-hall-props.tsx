/**
 * Static decorative props for Linh Sơn guild hall.
 * All props are fixed scene elements (not player-placed furniture).
 *
 * Grid: 10 wide (x) × 7 deep (z). Back wall at z=0, left wall at x=0.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { TorchFireEffect } from './torch-fire-particles';

// ─── GLB paths ────────────────────────────────────────────────────────────────

const GLB = {
  torch:      '/arena/cave/3dprops/optimized/p_standing_torch.glb',
  questBoard: '/models/furnitures/quest-board.glb',
  throne:     '/GuildHall/LinhSon/optimized/p_ironthrone.glb',
  fairy:      '/GuildHall/LinhSon/optimized/p_fairtymotherstatues.glb',
  dragon:     '/GuildHall/LinhSon/optimized/p_dragonfatherstatues.glb',
  drum:       '/GuildHall/LinhSon/optimized/p_cooperdrumfireholder.glb',
  pillar:     '/GuildHall/LinhSon/optimized/p_woodpillar.glb',
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

// ─── Throne God Ray ───────────────────────────────────────────────────────────

/**
 * Ambient throne light — soft spotlight from above + fill point light.
 * No visible geometry, pure illumination.
 */
function ThroneLight({ thronePos }: { thronePos: [number, number, number] }) {
  const [tx, , tz] = thronePos;

  const spot = useControls('Throne Spotlight', {
    x:         { value: tx,   min: -10, max: 20,   step: 0.1  },
    y:         { value: 5.2,  min: 0,   max: 12,   step: 0.1  },
    z:         { value: tz,   min: -10, max: 10,   step: 0.1  },
    color:     { value: '#ffffff' },
    intensity: { value: 50,   min: 0,   max: 200,  step: 1    },
    distance:  { value: 15,   min: 1,   max: 30,   step: 0.5  },
    angle:     { value: 0.6,  min: 0.05,max: 1.2,  step: 0.01 },
    penumbra:  { value: 2,    min: 0,   max: 5,    step: 0.05 },
    decay:     { value: 1.2,  min: 0,   max: 5,    step: 0.1  },
  }, { collapsed: true });

  const fill = useControls('Throne Fill Light', {
    color:     { value: '#ffffff' },
    intensity: { value: 3,    min: 0,   max: 20,   step: 0.5  },
    distance:  { value: 4,    min: 1,   max: 15,   step: 0.5  },
  }, { collapsed: true });

  return (
    <>
      <spotLight
        position={[spot.x, spot.y, spot.z]}
        color={spot.color}
        intensity={spot.intensity}
        distance={spot.distance}
        angle={spot.angle}
        penumbra={spot.penumbra}
        decay={spot.decay}
        castShadow={false}
      />
      <pointLight
        position={[tx, 2.5, tz + 0.5]}
        color={fill.color}
        intensity={fill.intensity}
        distance={fill.distance}
        decay={2}
      />
    </>
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
  // Center of room — drum is ~1m tall, fire sits inside the bowl rim at ~0.85m
  return (
    <group position={[5, 0, 3.5]}>
      <primitive object={model} />
      {/* Fire + smoke particles rising from drum bowl */}
      <TorchFireEffect offsetY={0.85} scale={1.3} debugLabel="Drum Fire" />
      {/* Warm glow radiating outward */}
      <pointLight position={[0, 0.9, 0]} color="#ff6622" intensity={6} distance={5.5} decay={2} />
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
  // Throne moved to z=1.2 so the backrest clears the back wall
  const thronePos: [number, number, number] = [5, 0, 1.2];

  return (
    <>
      {/* Back wall torch — left side only (right side moved to pillar top) */}
      <WallTorch position={[0.8, 1.8, 0.25]} rotationY={0}           label="Torch BL" />

      {/* Left wall torch — front section only (back section moved to pillar top) */}
      <WallTorch position={[0.25, 1.8, 2]}   rotationY={Math.PI / 2} label="Torch LL" />

      {/* Pillar-body torches — pushed out to outer face, facing into room */}
      {/* North pillar: shift +z to clear pillar radius, face into room (+z) */}
      <WallTorch position={[9.5, 1.8, 1.3]}  rotationY={0}           label="Torch North Pillar" />
      {/* West pillar: shift +x to clear pillar radius, face into room (+x) */}
      <WallTorch position={[1.3, 1.8, 6.5]}  rotationY={Math.PI / 2} label="Torch West Pillar" />

      {/* Quest board — wall-mounted on left section of back wall */}
      <QuestBoard />

      {/* Hero props */}
      <IronThrone />
      <ThroneLight thronePos={thronePos} />
      <DragonFatherStatues />
      <FairyMotherStatues />
      <DrumFireHolder />

      {/* Wood pillars — north corner (back-right) + west corner (front-left) */}
      <WoodPillar position={[9.5, 0, 0.5]} />
      <WoodPillar position={[0.5, 0, 6.5]} />
    </>
  );
}
