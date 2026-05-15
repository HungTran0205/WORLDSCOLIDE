/**
 * Stage Spec DSL — typed description of a combat stage layout.
 *
 * Philosophy:
 *   - Pure TS data, no external Tiled/LDtk files. KISS for the small (1-3)
 *     stage count we expect this generation.
 *   - Spec is the source of truth for: platform geometry, decals, spawn
 *     anchors, and bg refs. Render components are dumb projectors of spec.
 *   - All fields except `id`, `position`, `size`, `baseTile` are optional —
 *     extend types only when a future stage actually needs the field.
 *   - Spec OWNS spawn positions; legacy `FORMATION_POSITIONS` is preserved
 *     for non-spec-driven code paths but spec-driven stages bypass it.
 *
 * Phase 03 introduces these types as DORMANT — no render impact yet.
 * Phase 04 builds <Platform /> consuming PlatformSpec. Phase 05 wires the
 * combat engine to read spawn anchors from the spec.
 */

/** Background plane (far/mid layer). Position/size optional — defaults baked
 *  into existing CombatBgFar / CombatBgMid components. */
export interface BgLayer {
  texture: string;
  position?: [number, number, number];
  size?: [number, number];
  tint?: string;
  alphaTest?: number;
}

/** Manually-placed decal (cracks, footprints, blood splatter, etc.).
 *  Position is [x, z] on platform top surface; y is inferred from platform.
 *  Use this when you need exact placement (story moment, gameplay marker). */
export interface DecalPlacement {
  /** Texture path under /public. */
  texture: string;
  /** [x, z] world coords — y is taken from owning platform top. */
  position: [number, number];
  /** [width, depth] in world units. */
  size: [number, number];
  /** Rotation about Y axis (radians). Default 0. */
  rotation?: number;
  /** Tint color. Default white (no tint). */
  color?: string;
  /** Material opacity 0..1. Default 1. */
  opacity?: number;
}

/** Density-driven decal scatter — pool of textures sampled per platform-tile
 *  cell with `perCellChance`. Use this for ambient grunge (pebbles, leaves)
 *  where exact placement doesn't matter. Deterministic when `seed` set. */
export interface DecalDensitySpec {
  /** Texture pool — each cell picks one uniformly at random. */
  textures: string[];
  /** 0..1 — probability a given platform-tile cell receives a decal. */
  perCellChance: number;
  /** Uniform [width, depth] world size for every decal in this spec. */
  size: [number, number];
  /** PRNG seed for deterministic placement. Omit for non-deterministic. */
  seed?: number;
}

/** Platform — a flat top surface optionally with a vertical front face.
 *  Position is the CENTER of the top surface. Origin platform sits at y=0
 *  with no side wall; raised platforms set y>0 and supply a sideTile. */
export interface PlatformSpec {
  id: string;
  /** Center of platform top surface (world coords). */
  position: [number, number, number];
  /** [width (X), depth (Z)] of top surface. */
  size: [number, number];
  /** Top surface tile — single, list, or weighted spec (TiledFloor-compatible). */
  baseTile:
    | string
    | string[]
    | { main: string; variants: string[]; variantChance?: number };
  /** Tile world size in world units. Default 1. */
  tileWorldSize?: number;
  /** Vertical face tile (camera-facing edge). Omit for ground (no side face). */
  sideTile?: string;
  /** Side wall height (world units). Default = position.y if >0, else 0. */
  sideHeight?: number;
  /** Manually-placed decals on top surface. */
  decals?: DecalPlacement[];
  /** Auto-scatter decal specs on top surface. */
  decalDensity?: DecalDensitySpec[];
  /** Decoration-only platform — skipped by spawn anchors and collision. */
  decoration?: boolean;
  /** Lighting mode for top tile (passes through to TiledFloor). */
  lighting?: 'lit' | 'unlit';
  /** Emissive intensity when lighting='lit'. */
  emissiveIntensity?: number;
}

/** Spawn slot — maps a formation index (0..5) to a platform + local offset.
 *  Indices 0..2 = front row, 3..5 = back row (matches FORMATION_POSITIONS). */
export interface SpawnSlot {
  /** 0..5 formation slot index. */
  formationIndex: number;
  /** Platform that hosts this slot. */
  platformId: string;
  /** [dx, dz] offset from platform center. */
  localOffset: [number, number];
}

/** Top-level stage spec — owns the entire combat scene's spatial layout. */
export interface CombatStageSpec {
  id: string;
  /** Far background layer (forest/sky). */
  bgFar: BgLayer;
  /** Mid background layer (silhouette/parallax). */
  bgMid: BgLayer;
  /** Optional opaque backdrop behind bg layers (fallback fill). */
  backdrop?: { color: string; z: number; size: number };
  /** Platform set — at least one required (spawn anchors reference these). */
  platforms: PlatformSpec[];
  /** Spawn anchors per side — formationIndex 0..5 each. */
  spawnAnchors: { ally: SpawnSlot[]; enemy: SpawnSlot[] };
  /** Foreground decoratives mode. 'default' = existing CombatFgDecorative. */
  foreground?: 'default' | 'none';
}
