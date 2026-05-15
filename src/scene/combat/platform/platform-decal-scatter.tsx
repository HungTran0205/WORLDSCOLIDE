/**
 * PlatformDecalScatter — density-driven random decal placer for a platform's
 * top surface. Reads `platform.decalDensity[]` and emits one <FloorDecal> per
 * accepted cell. Use for ambient grunge (pebbles, leaves, footprints) where
 * exact placement does NOT matter; for hand-placed accents see
 * `platform.decals[]` (FloorDecal mounted directly by <Platform>).
 *
 * Determinism: each density spec carries its own optional `seed`. With a
 * seed, the layout is stable across remounts (good for screenshot tests,
 * gameplay-pertinent placements). Without a seed, each mount re-randomizes
 * (good for ambient grunge feeling fresh).
 *
 * Cell grid: spec.size defines the tile cell for THIS density spec (NOT the
 * platform's baseTile cell). Cells span the platform top from
 * (-width/2, -depth/2) to (+width/2, +depth/2). Every cell rolls a
 * Bernoulli(perCellChance); on success, picks a random texture and emits a
 * FloorDecal at cell center + jitter.
 *
 * Jitter: ±0.3u per axis breaks the grid feel (otherwise pebbles line up in
 * obvious rows). Jitter is part of the seeded stream — same seed → same
 * jitter.
 *
 * Coordinate frame: returns positions RELATIVE to the platform top center
 * (i.e. inside <Platform>'s `<group position={platform.position}>`). y=0
 * because <FloorDecal> applies its own yOffset above the floor plane.
 */

import { useMemo } from 'react';
import { FloorDecal } from '@/scene/sprites/floor-decal';
import type { PlatformSpec } from '@/scene/combat/maps/stage-spec-types';

const JITTER_AMPLITUDE = 0.3;

export interface PlatformDecalScatterProps {
  platform: PlatformSpec;
}

interface ScatterPlacement {
  key: string;
  texture: string;
  position: [number, number, number];
  size: [number, number];
  rotation: number;
}

export function PlatformDecalScatter({ platform }: PlatformDecalScatterProps) {
  const placements = useMemo<ScatterPlacement[]>(
    () => buildPlacements(platform),
    // Density spec contents identify the placement set. We hash a stable key
    // off the density specs to avoid recomputing on parent re-renders that
    // don't change the inputs. JSON.stringify is fine here — density specs
    // are small and only re-keyed on stage-level changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [platform.id, JSON.stringify(platform.decalDensity), platform.size[0], platform.size[1]],
  );

  if (placements.length === 0) return null;

  return (
    <>
      {placements.map((p) => (
        <FloorDecal
          key={p.key}
          position={p.position}
          size={p.size}
          texture={p.texture}
          rotation={p.rotation}
        />
      ))}
    </>
  );
}

function buildPlacements(platform: PlatformSpec): ScatterPlacement[] {
  const specs = platform.decalDensity ?? [];
  if (specs.length === 0) return [];

  const [width, depth] = platform.size;
  const out: ScatterPlacement[] = [];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    if (!spec.textures.length || spec.perCellChance <= 0) continue;

    const cellW = spec.size[0] > 0 ? spec.size[0] : 1;
    const cellD = spec.size[1] > 0 ? spec.size[1] : 1;
    const cellsX = Math.max(1, Math.floor(width / cellW));
    const cellsZ = Math.max(1, Math.floor(depth / cellD));

    const rng = spec.seed != null ? mulberry32(spec.seed >>> 0) : Math.random;

    // Top-left corner of the cell grid (relative to platform center).
    const startX = -((cellsX * cellW) / 2) + cellW / 2;
    const startZ = -((cellsZ * cellD) / 2) + cellD / 2;

    for (let z = 0; z < cellsZ; z++) {
      for (let x = 0; x < cellsX; x++) {
        if (rng() >= spec.perCellChance) continue;
        const tex = spec.textures[Math.floor(rng() * spec.textures.length) % spec.textures.length];
        const jx = (rng() * 2 - 1) * JITTER_AMPLITUDE;
        const jz = (rng() * 2 - 1) * JITTER_AMPLITUDE;
        const rot = rng() * Math.PI * 2;
        out.push({
          key: `${platform.id}:d${i}:${x},${z}`,
          texture: tex,
          position: [startX + x * cellW + jx, 0, startZ + z * cellD + jz],
          size: [cellW, cellD],
          rotation: rot,
        });
      }
    }
  }
  return out;
}

/** Mulberry32 — small, fast, deterministic PRNG (matches tiled-floor-mosaic). */
function mulberry32(a: number) {
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
