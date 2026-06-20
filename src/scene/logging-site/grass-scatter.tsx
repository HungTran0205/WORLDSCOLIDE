/**
 * GrassScatter — instanced billboard grass tufts carpeting an outdoor room
 * (logging-site prototype). Each tuft is an alpha-cutout pixel-art quad
 * planted on the floor, with a TSL/GLSL vertex wind-sway (see
 * grass-blade-material.ts).
 *
 * One InstancedMesh per texture variant (3 draw calls total) keeps variety
 * without an atlas. Transforms are seeded per-room so the scatter is stable
 * across re-renders (no reshuffling when the room re-renders).
 *
 * Billboard: the isometric camera (offset [8, 5.5, 8.5], no rotation — see
 * camera-controller.tsx) has a fixed yaw, so tufts bake a constant facing
 * yaw + small per-instance jitter instead of a per-frame CPU billboard.
 *
 * Must mount inside <Suspense> (useLoader suspends on first texture load) —
 * the facility-room already provides that boundary.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createGrassMaterial, type GrassMaterialHandle } from './grass-blade-material';
import { assetUrl } from '@/lib/asset-url';

const GRASS_TEXTURES = [
  '/decals/combat/grass-tuft-1.png',
  '/decals/combat/grass-tuft-2.png',
  '/decals/combat/grass-tuft-3.png',
] as const;

/** Tufts per texture variant. ×3 variants ≈ this many total. */
const TUFTS_PER_VARIANT = 110;
/** XZ half-extent of the scatter, inset from the 3.5 room half so tufts stay
 *  off the walls. */
const SCATTER_HALF = 3.0;
/** World-unit blade height. */
const BLADE_HEIGHT = 0.6;
/** Bake facing so the quad's +Z normal points at the camera (offset [8,_,8.5]). */
const FACE_YAW = Math.atan2(8, 8.5);
/** ± random facing wobble so tufts don't read as a flat card wall. */
const YAW_JITTER = 0.28;
const SCALE_MIN = 0.7;
const SCALE_MAX = 1.25;

/** Deterministic PRNG (mulberry32) — stable scatter per seed. */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function GrassVariant({
  texPath,
  cx,
  cz,
  seed,
  holeRadius,
  scatterHalf,
  count,
}: {
  texPath: string;
  cx: number;
  cz: number;
  seed: number;
  /** Keep tufts out of a centered circle (e.g. a bare sparring ring). 0 = off. */
  holeRadius: number;
  /** XZ half-extent of the scatter (inset from the 3.5 room half). */
  scatterHalf: number;
  /** Tufts for this variant's InstancedMesh. */
  count: number;
}) {
  const loaded = useLoader(THREE.TextureLoader, assetUrl(texPath));
  const { gl } = useThree();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [handle, setHandle] = useState<GrassMaterialHandle | null>(null);

  // Clone before configuring — mutating the loader-cached texture is both an
  // immutability-lint violation and risks trampling other consumers. The
  // clone is owned here and disposed on unmount.
  const tex = useMemo(() => {
    const t = loaded.clone();
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestMipmapNearestFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = true;
    t.needsUpdate = true;
    return t;
  }, [loaded]);

  // Plane sized to the texture aspect, pivot translated so the base sits at
  // y=0 (sway pivots at the planted base; positionLocal.y ∈ [0, BLADE_HEIGHT]).
  const geometry = useMemo(() => {
    const img = tex.image as { width?: number; height?: number } | undefined;
    const aspect = img?.width && img?.height ? img.width / img.height : 0.8;
    const w = BLADE_HEIGHT * aspect;
    const g = new THREE.PlaneGeometry(w, BLADE_HEIGHT);
    g.translate(0, BLADE_HEIGHT / 2, 0);
    return g;
  }, [tex]);

  // Async material (WebGPU path dynamically imports three/webgpu + three/tsl).
  useEffect(() => {
    let alive = true;
    let local: GrassMaterialHandle | null = null;
    createGrassMaterial(tex, gl, { bladeHeight: BLADE_HEIGHT }).then((h) => {
      if (!alive) {
        h.dispose();
        return;
      }
      local = h;
      setHandle(h);
    });
    return () => {
      alive = false;
      local?.dispose();
    };
  }, [tex, gl]);

  // Deterministic per-room instance transforms.
  const matrices = useMemo(() => {
    const rng = mulberry32(seed ^ (Math.floor(cx * 73.1 + cz * 131.7) >>> 0));
    const dummy = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    const holeSq = holeRadius * holeRadius;
    for (let i = 0; i < count; i++) {
      // Sample a position; if a center hole is requested, reject samples inside
      // it (capped retries so determinism + cost stay bounded). The first
      // sample's two rng() draws are always consumed, so holeRadius=0 keeps the
      // exact stream the logging-site scatter already relies on.
      let px = cx + (rng() * 2 - 1) * scatterHalf;
      let pz = cz + (rng() * 2 - 1) * scatterHalf;
      for (let tries = 0; holeSq > 0 && tries < 6; tries++) {
        const ddx = px - cx;
        const ddz = pz - cz;
        if (ddx * ddx + ddz * ddz >= holeSq) break;
        px = cx + (rng() * 2 - 1) * scatterHalf;
        pz = cz + (rng() * 2 - 1) * scatterHalf;
      }
      dummy.position.set(px, 0, pz);
      dummy.rotation.set(0, FACE_YAW + (rng() * 2 - 1) * YAW_JITTER, 0);
      const s = SCALE_MIN + rng() * (SCALE_MAX - SCALE_MIN);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      out.push(dummy.matrix.clone());
    }
    return out;
  }, [cx, cz, seed, holeRadius, scatterHalf, count]);

  // Push matrices once the mesh exists (handle gate guarantees it's mounted).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < matrices.length; i++) mesh.setMatrixAt(i, matrices[i]);
    mesh.instanceMatrix.needsUpdate = true;
  }, [matrices, handle]);

  // Geometry + cloned texture are owned here (material handle disposes itself).
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => tex.dispose(), [tex]);

  useFrame(({ clock }) => handle?.setTime(clock.elapsedTime));

  if (!handle) return null;
  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, handle.material, count]}
      frustumCulled={false}
    />
  );
}

/** Mount one scatter per texture variant, centered on the room (cx, cz).
 *  `holeRadius` clears a centered circle (training-yard sparring ring).
 *  `scatterHalf` / `tuftsPerVariant` widen + thicken coverage per facility. */
export function GrassScatter({
  cx,
  cz,
  holeRadius = 0,
  scatterHalf = SCATTER_HALF,
  tuftsPerVariant = TUFTS_PER_VARIANT,
}: {
  cx: number;
  cz: number;
  holeRadius?: number;
  scatterHalf?: number;
  tuftsPerVariant?: number;
}) {
  return (
    <group>
      {GRASS_TEXTURES.map((p, i) => (
        <GrassVariant
          key={p}
          texPath={p}
          cx={cx}
          cz={cz}
          seed={(i + 1) * 9871}
          holeRadius={holeRadius}
          scatterHalf={scatterHalf}
          count={tuftsPerVariant}
        />
      ))}
    </group>
  );
}
