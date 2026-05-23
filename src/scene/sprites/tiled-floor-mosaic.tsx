/**
 * TiledFloorMosaic — pre-bakes a per-cell random mosaic of one primary tile
 * + optional accent tiles into a single floor-sized texture.
 *
 * Use when:
 *   - Your tiles have visible mortar / borders (RPG-style block tiles) where
 *     a fixed atlas-repeat would show obvious pattern seams.
 *   - You want one tile to dominate (~80%) with sparse variation from accent
 *     variants randomly distributed across the floor.
 *
 * Output: a single CanvasTexture sized to (cellsX*tilePx, cellsZ*tilePx) that
 * covers the whole plane once (no repeat wrapping). 1 mesh, 1 draw call.
 *
 * Memory: 32x12 ground @ tileWorldSize=2 with 64px tiles → 16x6 cells →
 * 1024x384 RGBA canvas ≈ 1.5MB GPU. Acceptable for a combat scene.
 *
 * Determinism: pass `seed` for stable placement across remounts. Without
 * seed, each mount randomizes (combat open/close gives a fresh layout —
 * usually desirable; pass seed if you need reproducibility for snapshots
 * or screenshot tests).
 *
 * Mipmaps disabled — combat ortho camera doesn't zoom, and a full-floor
 * canvas would need expensive gutter padding to avoid mip bleeding between
 * neighboring cells.
 */

import { useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import {
  TextureLoader,
  CanvasTexture,
  NearestFilter,
  ClampToEdgeWrapping,
  SRGBColorSpace,
} from 'three';
import { assetUrl } from '@/lib/asset-url';

export interface TiledFloorMosaicProps {
  width: number;
  depth: number;
  /** Tile drawn in the majority of cells. */
  primaryTile: string;
  /** Tiles randomly substituted in for `primaryTile` per accentChance. */
  accentTiles?: string[];
  /** Per-cell probability of swapping primary for a random accent. 0..1. Default 0.2. */
  accentChance?: number;
  /** World units per cell. Default 1. Clamped to >0. */
  tileWorldSize?: number;
  /** Optional seed for stable layout. Without seed, each mount re-randomizes. */
  seed?: number;
  position?: [number, number, number];
  alphaTest?: number;
}

export function TiledFloorMosaic({
  width,
  depth,
  primaryTile,
  accentTiles = [],
  accentChance = 0.2,
  tileWorldSize = 1,
  seed,
  position = [0, 0, 0],
  alphaTest = 0,
}: TiledFloorMosaicProps) {
  // Spread into a single useLoader call so all tiles arrive in one Suspense
  // resolution. useLoader caches by URL, so accent reuse is free.
  const allUrls = [primaryTile, ...accentTiles].map(assetUrl);
  const textures = useLoader(TextureLoader, allUrls);
  const primaryTex = textures[0];
  const accentTexes = textures.slice(1);

  // Stable string key — protects useMemo from array-identity churn if a
  // caller inlines the accentTiles literal.
  const urlsKey = allUrls.join('|');

  const mosaicTex = useMemo<CanvasTexture>(() => {
    const safeTile = tileWorldSize > 0 ? tileWorldSize : 1;
    const cellsX = Math.max(1, Math.ceil(width / safeTile));
    const cellsZ = Math.max(1, Math.ceil(depth / safeTile));

    const primaryImg = primaryTex.image as HTMLImageElement;
    const cellPxW = primaryImg.naturalWidth || primaryImg.width;
    const cellPxH = primaryImg.naturalHeight || primaryImg.height;

    const canvas = document.createElement('canvas');
    canvas.width = cellsX * cellPxW;
    canvas.height = cellsZ * cellPxH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('TiledFloorMosaic: 2d canvas context unavailable');
    ctx.imageSmoothingEnabled = false;

    // Seeded PRNG (mulberry32) for reproducibility when caller supplies
    // `seed`; falls back to Math.random for live remount randomization.
    const rng = seed != null ? mulberry32(seed >>> 0) : Math.random;
    const useAccent = accentTexes.length > 0 && accentChance > 0;

    for (let z = 0; z < cellsZ; z++) {
      for (let x = 0; x < cellsX; x++) {
        let img: CanvasImageSource = primaryImg;
        if (useAccent && rng() < accentChance) {
          const accent = accentTexes[Math.floor(rng() * accentTexes.length)];
          img = accent.image as CanvasImageSource;
        }
        ctx.drawImage(img, x * cellPxW, z * cellPxH, cellPxW, cellPxH);
      }
    }

    const tex = new CanvasTexture(canvas);
    tex.magFilter = NearestFilter;
    tex.minFilter = NearestFilter;
    tex.generateMipmaps = false;
    tex.wrapS = ClampToEdgeWrapping;
    tex.wrapT = ClampToEdgeWrapping;
    tex.colorSpace = SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
    // primaryTex / accentTexes intentionally excluded — they're closed over
    // and re-fetched fresh whenever `urlsKey` changes (which forces re-run).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlsKey, width, depth, tileWorldSize, accentChance, seed]);

  useEffect(() => {
    return () => {
      mosaicTex.dispose();
    };
  }, [mosaicTex]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial map={mosaicTex} transparent={false} alphaTest={alphaTest} />
    </mesh>
  );
}

/** Mulberry32 — small, fast, deterministic PRNG. Good enough for tile noise. */
function mulberry32(a: number) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
