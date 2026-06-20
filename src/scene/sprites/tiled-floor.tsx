/**
 * TiledFloor — shared 2D-tile-textured floor primitive for combat + guild
 * facilities. Replaces ad-hoc procedural canvas / GLB-clone floor patterns.
 *
 * Lighting modes (Phase 07):
 * - 'lit' (default): meshLambertMaterial + emissiveMap=tex trick. Tile keeps
 *   its pixel-art pre-shaded look via emissive (intensity 0..1) but also
 *   reacts to scene pointLight/ambientLight (warm torch pool hắt lên sàn).
 *   Lower emissiveIntensity = more lighting reactivity (suggested 0.55-0.7
 *   for torch-rich scenes, 0.7-0.85 for ambient-only).
 * - 'unlit': legacy meshBasicMaterial. Use when scene lighting should not
 *   affect the floor at all (combat scenes with bg tonal control, etc.).
 *
 * Usage:
 *   <TiledFloor width={32} depth={12} tileTexture="/tiles/2d/32px/forest-grass-32_0001.png" />
 *   <TiledFloor ... lighting="lit" emissiveIntensity={0.6} />  // torch-rich
 *   <TiledFloor ... lighting="unlit" />                         // legacy
 *
 * Tile-to-world ratio: tileWorldSize=1 means 1 tile cell = 1 world unit.
 * For 32x12 plane with default tileWorldSize, the tile repeats 32x12 times.
 *
 * Note: must be mounted inside <Suspense> (useLoader suspends on first load).
 * The base texture from useLoader is shared across consumers by URL — we
 * clone it locally so each <TiledFloor> can configure its own repeat/wrap
 * without trampling other instances using the same tile path.
 */

import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  NearestFilter,
  NearestMipmapNearestFilter,
  RepeatWrapping,
  SRGBColorSpace,
  CanvasTexture,
  type Texture,
} from 'three';
import { assetUrl } from '@/lib/asset-url';

/** Weighted variant spec: a dominant main tile with sparse accent variants. */
export interface TileTextureWeighted {
  /** Tile shown by default for most cells. */
  main: string;
  /** Accent tiles placed randomly in place of the main. */
  variants: string[];
  /** Per-cell probability that a variant replaces the main. 0..1. Default 0.2. */
  variantChance?: number;
}

/**
 * Tile texture input:
 * - `string` — single path, repeat-wrapped.
 * - `string[]` — uniform random per cell across all paths (each ~equal share).
 * - `TileTextureWeighted` — main dominates, variants scattered as accents.
 */
export type TileTextureSpec = string | string[] | TileTextureWeighted;

export interface TiledFloorProps {
  width: number;
  depth: number;
  tileTexture: TileTextureSpec;
  /** World units per tile cell. Default 1. Clamped to >0 internally. */
  tileWorldSize?: number;
  /** Floor center position. Default origin. */
  position?: [number, number, number];
  /** Alpha-test cutout threshold for tiles with transparent borders. Default 0 (no cutout). */
  alphaTest?: number;
  /**
   * Material lighting response (Phase 07). Default `'lit'`.
   * - `'lit'` — meshLambertMaterial + emissiveMap=tex (react with scene lights, keep pixel-art tone via emissiveIntensity).
   * - `'unlit'` — meshBasicMaterial (legacy, no light react).
   */
  lighting?: 'lit' | 'unlit';
  /**
   * Emissive base intensity, only when `lighting === 'lit'`. Default 0.7.
   * 0 = full lighting react (tile color comes only from scene lights).
   * 1 = effectively unlit (tile color is pure self-emission).
   * Sweet spot for torch-rich scenes: 0.55-0.65; ambient-only: 0.7-0.85.
   */
  emissiveIntensity?: number;
}

interface NormalizedSpec {
  mode: 'single' | 'uniform' | 'weighted';
  paths: string[];
  variantChance: number;
}

function normalizeSpec(spec: TileTextureSpec): NormalizedSpec {
  if (typeof spec === 'string') return { mode: 'single', paths: [spec], variantChance: 0 };
  if (Array.isArray(spec)) {
    return spec.length === 1
      ? { mode: 'single', paths: spec, variantChance: 0 }
      : { mode: 'uniform', paths: spec, variantChance: 0 };
  }
  return {
    mode: 'weighted',
    paths: [spec.main, ...spec.variants],
    variantChance: spec.variantChance ?? 0.2,
  };
}

function specCacheKey(spec: TileTextureSpec): string {
  if (typeof spec === 'string') return `s:${spec}`;
  if (Array.isArray(spec)) return `a:${spec.join('|')}`;
  return `w:${spec.main}|${spec.variants.join(',')}|${spec.variantChance ?? 0.2}`;
}

export function TiledFloor({
  width,
  depth,
  tileTexture,
  tileWorldSize = 1,
  position = [0, 0, 0],
  alphaTest = 0,
  lighting = 'lit',
  emissiveIntensity = 0.7,
}: TiledFloorProps) {
  // Stable cache key so the spec memo only re-runs on content change.
  const specKey = specCacheKey(tileTexture);
  const spec = useMemo<NormalizedSpec>(
    () => normalizeSpec(tileTexture),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [specKey],
  );
  const loaded = useLoader(TextureLoader, spec.paths.map(assetUrl)) as Texture[];
  // useLoader returns T when input is string, T[] when input is string[]; we
  // always pass array form, so loaded is Texture[]. Normalize defensively.
  const textures = useMemo<Texture[]>(
    () => (Array.isArray(loaded) ? loaded : [loaded]),
    [loaded],
  );

  const configuredTex = useMemo<Texture>(() => {
    const safeTile = tileWorldSize > 0 ? tileWorldSize : 1;
    const tilesX = Math.max(1, Math.round(width / safeTile));
    const tilesZ = Math.max(1, Math.round(depth / safeTile));

    if (spec.mode === 'single') {
      // Single-variant fast path: clone the loader-cached texture and
      // configure repeat. Cloning avoids trampling other consumers of the
      // same tile PNG.
      const tex = textures[0].clone();
      tex.magFilter = NearestFilter;
      tex.minFilter = NearestMipmapNearestFilter;
      tex.wrapS = RepeatWrapping;
      tex.wrapT = RepeatWrapping;
      tex.colorSpace = SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.repeat.set(tilesX, tilesZ);
      tex.needsUpdate = true;
      return tex;
    }

    // Multi-variant: bake a random per-cell pattern into one canvas. The
    // resulting CanvasTexture maps 1:1 to the plane (no runtime repeat).
    // 'uniform' picks any path with equal chance; 'weighted' lets the main
    // (textures[0]) dominate, with variants[1..] sprinkled at variantChance.
    const firstImg = textures[0].image as HTMLImageElement;
    const tilePx = firstImg?.naturalWidth || firstImg?.width || 32;
    const canvas = document.createElement('canvas');
    canvas.width = tilesX * tilePx;
    canvas.height = tilesZ * tilePx;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      const variantCount = textures.length - 1;
      for (let z = 0; z < tilesZ; z++) {
        for (let x = 0; x < tilesX; x++) {
          let pick: Texture;
          if (spec.mode === 'weighted' && variantCount > 0) {
            pick = Math.random() < spec.variantChance
              ? textures[1 + Math.floor(Math.random() * variantCount)]
              : textures[0];
          } else {
            pick = textures[Math.floor(Math.random() * textures.length)];
          }
          const img = pick.image as HTMLImageElement | undefined;
          if (img) ctx.drawImage(img, x * tilePx, z * tilePx, tilePx, tilePx);
        }
      }
    }
    const tex = new CanvasTexture(canvas);
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestMipmapNearestFilter;
    tex.colorSpace = SRGBColorSpace;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return tex;
  }, [textures, width, depth, tileWorldSize, spec]);

  // Dispose the cloned GPU texture on unmount / reconfigure. The base
  // texture from useLoader is owned by the loader cache — leave it alone.
  useEffect(() => {
    return () => {
      configuredTex.dispose();
    };
  }, [configuredTex]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={[width, depth]} />
      {lighting === 'unlit' ? (
        <meshBasicMaterial
          map={configuredTex}
          transparent={false}
          alphaTest={alphaTest}
        />
      ) : (
        // Phase 07: Lambert + emissiveMap trick. emissive='#ffffff' passes
        // tile color through; emissiveIntensity controls how much of the
        // tile is "self-lit" vs reactive to scene pointLight/ambientLight.
        // map is required so the tile is still drawn when no light hits it.
        <meshLambertMaterial
          map={configuredTex}
          emissiveMap={configuredTex}
          emissive="#ffffff"
          emissiveIntensity={emissiveIntensity}
          transparent={false}
          alphaTest={alphaTest}
        />
      )}
    </mesh>
  );
}
