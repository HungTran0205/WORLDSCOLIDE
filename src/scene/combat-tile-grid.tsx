/**
 * CombatTileGrid — instanced 3D tile floor for beat-em-up arena.
 * Zone-based layout: center lanes = accent/dirt, outer = primary/grass.
 * Edge fade uses gradient overlay planes (fog color → transparent).
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface TileGridProps {
  width: number;
  /** Gameplay zone depth (tiles fully visible) */
  depth: number;
  /** Extra rows each side for natural edge fade (default 3) */
  fadeRows?: number;
  tileSize: number;
  primarySrc: string;
  accentSrc: string;
  /** Background fog color used for gradient fade planes */
  fogColor?: string;
}

interface TilePos { x: number; y: number; z: number }

/** Extract first Mesh geometry + material from a loaded GLB scene */
function extractMesh(scene: THREE.Group): { geo: THREE.BufferGeometry; mat: THREE.Material } | null {
  let geo: THREE.BufferGeometry | null = null;
  let mat: THREE.Material | null = null;
  scene.traverse(o => {
    if (o instanceof THREE.Mesh && !geo) {
      geo = o.geometry as THREE.BufferGeometry;
      mat = o.material as THREE.Material;
    }
  });
  return geo && mat ? { geo, mat } : null;
}

interface InstancesProps {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  positions: TilePos[];
  scale: number;
}

function TileInstances({ geo, mat, positions, scale }: InstancesProps) {
  const mesh = useMemo(() => {
    // Explicit drawRange prevents WebGPU crash — default Infinity is invalid for drawIndexed
    if (geo.index && geo.drawRange.count === Infinity) {
      geo.setDrawRange(0, geo.index.count);
    }
    const m = new THREE.InstancedMesh(geo, mat, positions.length);
    const matrix = new THREE.Matrix4();
    const s = new THREE.Vector3(scale, scale, scale);
    positions.forEach((p, i) => {
      matrix.compose(new THREE.Vector3(p.x, p.y, p.z), new THREE.Quaternion(), s);
      m.setMatrixAt(i, matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    return m;
  }, [geo, mat, positions, scale]);

  return <primitive object={mesh} />;
}

/**
 * Gradient plane that fades from fogColor (outer edge) to transparent (inner edge).
 * Overlaid above tiles to create a natural terrain edge fade.
 */
function EdgeFadePlane({
  width, zCenter, planeDepth, fogColor, flipGradient,
}: {
  width: number; zCenter: number; planeDepth: number;
  fogColor: string; flipGradient: boolean;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    // Gradient direction: outer edge opaque → inner edge transparent
    if (flipGradient) {
      g.addColorStop(0, 'transparent');
      g.addColorStop(1, fogColor);
    } else {
      g.addColorStop(0, fogColor);
      g.addColorStop(1, 'transparent');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1, 64);
    return new THREE.CanvasTexture(canvas);
  }, [fogColor, flipGradient]);

  return (
    <mesh position={[0, 0.1, zCenter]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, planeDepth]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function CombatTileGrid({
  width, depth, fadeRows = 3, tileSize, primarySrc, accentSrc, fogColor = '#000000',
}: TileGridProps) {
  const primary = useGLTF(primarySrc);
  const accent = useGLTF(accentSrc);

  const primaryMesh = useMemo(() => extractMesh(primary.scene), [primary.scene]);
  const accentMesh = useMemo(() => extractMesh(accent.scene), [accent.scene]);

  const totalDepth = depth + fadeRows * 2 * tileSize;
  const cols = Math.ceil(width / tileSize);
  const totalRows = Math.ceil(totalDepth / tileSize);

  const { primaryPos, accentPos } = useMemo(() => {
    const p: TilePos[] = [];
    const a: TilePos[] = [];
    const startX = -width / 2 + tileSize / 2;
    const startZ = -totalDepth / 2 + tileSize / 2;
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * tileSize;
        const z = startZ + row * tileSize;
        const y = -0.1;
        // Zone-based: center lanes (fight zone) = accent/dirt, outer = primary/grass
        (Math.abs(z) < 2.5 ? a : p).push({ x, y, z });
      }
    }
    return { primaryPos: p, accentPos: a };
  }, [width, totalDepth, tileSize, cols, totalRows]);

  if (!primaryMesh) return null;

  const halfDepth = depth / 2;
  const fadeDepth = fadeRows * tileSize;
  // Gradient plane centers: just outside the gameplay zone
  const topFadeZ = -(halfDepth + fadeDepth / 2);
  const botFadeZ = +(halfDepth + fadeDepth / 2);

  return (
    <group>
      {primaryPos.length > 0 && (
        <TileInstances geo={primaryMesh.geo} mat={primaryMesh.mat} positions={primaryPos} scale={tileSize} />
      )}
      {accentMesh && accentPos.length > 0 && (
        <TileInstances geo={accentMesh.geo} mat={accentMesh.mat} positions={accentPos} scale={tileSize} />
      )}
      {/* Gradient fade planes — outer edge opaque (fogColor) → inner edge transparent */}
      <EdgeFadePlane width={width} zCenter={topFadeZ} planeDepth={fadeDepth} fogColor={fogColor} flipGradient={false} />
      <EdgeFadePlane width={width} zCenter={botFadeZ} planeDepth={fadeDepth} fogColor={fogColor} flipGradient={true} />
    </group>
  );
}
