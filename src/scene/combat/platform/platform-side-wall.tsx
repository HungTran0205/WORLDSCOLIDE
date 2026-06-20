/**
 * PlatformSideWall — vertical face primitive on the camera-facing edge of a
 * raised platform. Tiles a single PNG vertically (and horizontally if width
 * exceeds tile size). Mounted by <Platform> as a sibling to the top tile.
 *
 * Geometry:
 *   - planeGeometry args = [width, sideHeight]
 *   - rotation identity → plane normal = +Z (camera-facing in this scene's
 *     overhead-tilt camera, where +Z is toward the viewer).
 *   - position is the wall CENTER. Platform group passes the precomputed
 *     world-relative offset (top-edge anchor minus sideHeight/2).
 *
 * Tile repeat:
 *   - Wall is `width` units wide × `sideHeight` units tall.
 *   - With `tileWorldSize` units per tile cell, repeats = (width / s, h / s).
 *   - Phase 04 prototype: cracked-stone-wall_0001.png is square; vertical and
 *     horizontal repeats are independent so a tall, thin wall stretches
 *     stone bands rather than tiling pixel-distorted.
 *
 * Lighting matches <TiledFloor>: 'lit' = Lambert + emissiveMap (reactive to
 * scene lights, intensity 0..1 controls how "self-lit" the wall stays);
 * 'unlit' = legacy meshBasicMaterial. Mirror the platform top by default so
 * the front face shades consistently with the surface above it.
 */

import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  RepeatWrapping,
  NearestFilter,
  NearestMipmapNearestFilter,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { assetUrl } from '@/lib/asset-url';

export interface PlatformSideWallProps {
  /** World position of wall center (XYZ). */
  position: [number, number, number];
  /** [width, sideHeight] in world units. */
  size: [number, number];
  /** Vertical face tile path (relative to /public). */
  tile: string;
  /** World units per tile cell. Default 1. */
  tileWorldSize?: number;
  /** Lighting mode (matches <TiledFloor>). Default 'lit'. */
  lighting?: 'lit' | 'unlit';
  /** Emissive base intensity when lighting='lit'. Default 0.7. */
  emissiveIntensity?: number;
}

export function PlatformSideWall({
  position,
  size,
  tile,
  tileWorldSize = 1,
  lighting = 'lit',
  emissiveIntensity = 0.7,
}: PlatformSideWallProps) {
  const baseTex = useLoader(TextureLoader, assetUrl(tile)) as Texture;
  const [width, height] = size;

  const configuredTex = useMemo<Texture>(() => {
    const safeTile = tileWorldSize > 0 ? tileWorldSize : 1;
    const repeatX = Math.max(1, Math.round(width / safeTile));
    const repeatY = Math.max(1, Math.round(height / safeTile));
    // Clone — same hygiene as TiledFloor: never trample loader-cache shared tex.
    const tex = baseTex.clone();
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestMipmapNearestFilter;
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.colorSpace = SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.repeat.set(repeatX, repeatY);
    tex.needsUpdate = true;
    return tex;
  }, [baseTex, width, height, tileWorldSize]);

  useEffect(() => () => configuredTex.dispose(), [configuredTex]);

  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      {lighting === 'unlit' ? (
        <meshBasicMaterial map={configuredTex} transparent={false} alphaTest={0.05} />
      ) : (
        <meshLambertMaterial
          map={configuredTex}
          emissiveMap={configuredTex}
          emissive="#ffffff"
          emissiveIntensity={emissiveIntensity}
          transparent={false}
          alphaTest={0.05}
        />
      )}
    </mesh>
  );
}
