/**
 * FloorDecal — flat horizontal overlay above <TiledFloor> for atmospheric
 * spot accents (lamp pool, rune circle, build placement preview, etc.).
 * Phase 07 — Standard Tile Floor System.
 *
 * Differences vs <TiledFloor>:
 * - ClampToEdge wrap (single-instance decal, no repeat)
 * - meshBasicMaterial transparent + depthWrite=false (decal-on-decal blend
 *   stays additive without z-fight); pure overlay, NOT light-reactive
 * - alphaTest=0.05 to clip soft alpha edges (no halo from premultiplied)
 * - yOffset default 0.01 to clear TiledFloor base
 *
 * Texture authoring convention (see docs/code-standards.md):
 * - PNG with straight alpha (NOT premultiplied)
 * - Square aspect, ≤256×256 for hot-spot decoration
 * - Radial / circular patterns: center at image center, edge fading to alpha=0
 *
 * Note: must be mounted inside <Suspense> (useLoader suspends on first load).
 */

import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  NearestFilter,
  ClampToEdgeWrapping,
  SRGBColorSpace,
  type Texture,
  type MeshBasicMaterial,
} from 'three';
import type { MutableRefObject } from 'react';

export interface FloorDecalProps {
  /** World position of decal center (XZ ground plane). */
  position: [number, number, number];
  /** Decal size in world units [width, depth]. */
  size: [number, number];
  /** Texture path (PNG with straight alpha, relative to /public). */
  texture: string;
  /** Y rotation for pattern orientation (radians). Default 0. */
  rotation?: number;
  /** Tint color multiplier. Default '#ffffff' = pass-through. */
  color?: string;
  /** Opacity 0-1. Default 1. */
  opacity?: number;
  /** Y offset above floor to avoid z-fight. Default 0.01. */
  yOffset?: number;
  /** Optional renderOrder hint for stacking multiple overlapping decals. */
  renderOrder?: number;
  /** Optional ref to the underlying material — lets callers (e.g. AoeTelegraph) drive opacity per frame without React rerenders. */
  materialRef?: MutableRefObject<MeshBasicMaterial | null>;
}

export function FloorDecal({
  position,
  size,
  texture,
  rotation = 0,
  color = '#ffffff',
  opacity = 1,
  yOffset = 0.01,
  renderOrder,
  materialRef,
}: FloorDecalProps) {
  const baseTex = useLoader(TextureLoader, texture) as Texture;

  // Clone to avoid trampling shared loader-cache texture; configure once.
  const configuredTex = useMemo<Texture>(() => {
    const tex = baseTex.clone();
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.colorSpace = SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }, [baseTex]);

  useEffect(() => () => configuredTex.dispose(), [configuredTex]);

  return (
    <mesh
      position={[position[0], position[1] + yOffset, position[2]]}
      rotation={[-Math.PI / 2, 0, rotation]}
      renderOrder={renderOrder}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial
        ref={materialRef}
        map={configuredTex}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        alphaTest={0.05}
      />
    </mesh>
  );
}
