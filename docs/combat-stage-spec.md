# Combat Stage Spec — Platformer Layout Authoring

Combat stages are defined via pure TypeScript data specs under `src/scene/combat/maps/stages/` rather than hardcoded global positions. Each spec owns platform geometry, spawn anchors, decals, and background references. This decoupling enables flexible multi-platform side-scroller layouts.

## Stage Spec Data Layer

All stage specs live at `src/scene/combat/maps/stages/{stage-id}.ts` and are registered in `src/scene/combat/maps/combat-map-registry.ts`.

### Type Hierarchy

**CombatStageSpec** (root)
- `id: string` — unique identifier matching the CombatMapId union
- `bgFar: BgLayer` — far background (forest/sky)
- `bgMid: BgLayer` — mid background (silhouette/parallax)
- `backdrop?: { color, z, size }` — fallback opaque fill behind layers
- `platforms: PlatformSpec[]` — at least 1 required
- `spawnAnchors: { ally, enemy }` — spawn slot mappings per side
- `foreground?: 'default' | 'none'` — decorative foreground mode

**PlatformSpec** (individual platform)
- `id: string` — unique within stage (e.g. `'lower-ground'`, `'upper-cliff'`)
- `position: [x, y, z]` — center of top surface (world coords)
- `size: [w, d]` — width (X) and depth (Z) in world units
- `baseTile: string | string[] | { main, variants, variantChance? }` — top surface texture (TiledFloor-compatible)
- `tileWorldSize?: number` — tile size in world units (default 1)
- `sideTile?: string` — vertical front face texture (camera-facing edge). Omit for ground-level (no side wall).
- `sideHeight?: number` — wall height in world units. Default = `position.y` if raised, else 0.
- `decals?: DecalPlacement[]` — manually-placed decals (exact world-coord positioning)
- `decalDensity?: DecalDensitySpec[]` — auto-scatter specs (per-cell probability with deterministic seed)
- `decoration?: boolean` — pure eye candy (skipped by spawn logic and collision)
- `lighting?: 'lit' | 'unlit'` — Lambert material responsiveness. Default 'lit'.
- `emissiveIntensity?: number` — emissive strength when `lighting='lit'` (default 0.7, range 0.55–0.9)

**SpawnSlot** (formation anchor)
- `formationIndex: number` — 0..5 slot index (0–2 front row, 3–5 back row, mirrors FORMATION_POSITIONS)
- `platformId: string` — platform that hosts this slot
- `localOffset: [dx, dz]` — offset from platform center in world units

**DecalPlacement** (exact-position decal)
- `texture: string` — asset path under `/public`
- `position: [x, z]` — world coords (Y inferred from platform surface)
- `size: [w, d]` — world units
- `rotation?: number` — radians about Y axis (default 0)
- `color?: string` — hex tint (default white / no tint)
- `opacity?: number` — 0–1 material transparency (default 1)

**DecalDensitySpec** (scatter spec)
- `textures: string[]` — texture pool (each cell picks one uniformly at random)
- `perCellChance: number` — 0–1 probability per platform-tile cell
- `size: [w, d]` — uniform world size for every decal in spec
- `seed?: number` — PRNG seed for deterministic placement (omit for non-deterministic)

## Stage Spec ID Convention

Stage IDs are kebab-case strings matching the `CombatMapId` union in `combat-map-registry.ts`:
```typescript
type CombatMapId = 'lolo-village-outskirt' | 'broken-cliff-outskirt' | 'the-forest';
```

Add new stage IDs to the union when authoring a new stage.

## Spawn Anchor Convention

**Slot layout** mirrors legacy FORMATION_POSITIONS:
- Slots 0–2: front row (closer to camera)
- Slots 3–5: back row (farther from camera)
- Lane Z spacing: -3 / 0 / +3 (or variants like -3.5 / -0.5 / +3 for asymmetry)

**Y-axis extraction**: Spawn Y-coordinate comes from the platform's `position[1]`. A slot on `upper-cliff` at `position: [7, 1.5, 0]` will spawn entities at `y=1.5` regardless of slot's `localOffset` (which is only X and Z).

## Decal Patterns

### Manual Decals (ExactPlacement)

Use `DecalPlacement` when you need:
- **Exact positioning**: story moments, landmark accents, specific visual markers
- **One-off assets**: a broken-edge tile at a cliff corner, a ritual circle in the center

Example (from broken-cliff-outskirt):
```typescript
decals: [
  {
    texture: '/decals/combat/broken-edge-tile-1.png',
    position: [0.5, 5.8],   // Exact world coords
    size: [1.0, 0.6],
  },
]
```

### Scatter Decals (DensitySpec)

Use `DecalDensitySpec` when you need:
- **Ambient grunge**: grass tufts, pebbles, leaves, moss patches
- **Deterministic randomness**: seed-driven so the same stage always looks identical across replays
- **Performance**: render as static `<FloorDecal>` instances (no per-entity overhead)

Example (from broken-cliff-outskirt):
```typescript
decalDensity: [
  {
    textures: [
      '/decals/combat/grass-tuft-1.png',
      '/decals/combat/grass-tuft-3.png',
      '/decals/combat/pebble-cluster-1.png',
    ],
    perCellChance: 0.06,  // ~6% of tiles get a decal
    size: [0.6, 0.4],
    seed: 4242,           // Same seed = same placement every time
  },
]
```

### Anti-Pattern: Directional Transition Tiles as Scatter

❌ **Do not** use tiles like `grass-edge` (directional edge stripes) as random scatter variants in `decalDensity`. They will appear striped and disorienting.

✓ **Do** use `grass-edge` only:
- As a low-probability variant in `baseTile.variants` on the actual platform top (single-layer blend mode)
- As a manual `DecalPlacement` for a specific story accent

Scatter should use **non-directional** assets: tufts, moss blobs, cracks, pebbles, debris.

## Render Flow

1. **Stage resolution**: Combat scene calls `getStageSpec(mapId)` from `combat-map-registry.ts`
2. **Data projection**: `<StageRenderHost spec={spec}>` receives the typed spec
3. **Slot shells**: `<CombatSceneShell>` mounts render slots (background, ground, foreground, entities)
4. **Platform render**: Per-platform in the loop, `<CombatPlatform platformSpec={spec}>` renders:
   - `<TiledFloor>` for the top surface
   - `<SideWall>` if `sideTile` defined (camera-facing vertical edge)
   - `<FloorDecal>` instances for both `decals[]` and `decalDensity[]` scatter
5. **Entity spawn**: Engine reads `spawnAnchors` to compute absolute world position per slot

## Authoring Example: New Stage

Create `src/scene/combat/maps/stages/mystical-grove.ts`:

```typescript
import type { CombatStageSpec } from '../stage-spec-types';

export const MYSTICAL_GROVE_STAGE: CombatStageSpec = {
  id: 'mystical-grove',
  bgFar: { texture: '/arena/background/fbg_forest_purple.png' },
  bgMid: { texture: '/arena/background/mbg_grove_alpha.png' },
  backdrop: { color: '#1a0f2e', z: -30, size: 200 },
  platforms: [
    {
      id: 'ritual-circle',
      position: [0, 0, 0],
      size: [16, 14],
      baseTile: {
        main: '/tiles/2d/32px/deep-forest-grass_0003.png',
        variants: [
          '/tiles/2d/32px/deep-forest-grass_0001.png',
          '/tiles/2d/32px/deep-forest-grass_0002.png',
        ],
        variantChance: 0.4,
      },
      tileWorldSize: 1,
      lighting: 'unlit',
      decals: [
        {
          texture: '/decals/combat/magic-rune-circle.png',
          position: [0, 0],
          size: [3, 3],
        },
      ],
      decalDensity: [
        {
          textures: ['/decals/combat/leaf-scatter.png'],
          perCellChance: 0.1,
          size: [0.5, 0.5],
          seed: 999,
        },
      ],
    },
  ],
  spawnAnchors: {
    ally: [
      { formationIndex: 0, platformId: 'ritual-circle', localOffset: [4, -3] },
      { formationIndex: 1, platformId: 'ritual-circle', localOffset: [4, 0] },
      { formationIndex: 2, platformId: 'ritual-circle', localOffset: [4, 3] },
      { formationIndex: 3, platformId: 'ritual-circle', localOffset: [1.5, -3] },
      { formationIndex: 4, platformId: 'ritual-circle', localOffset: [1.5, 0] },
      { formationIndex: 5, platformId: 'ritual-circle', localOffset: [1.5, 3] },
    ],
    enemy: [
      { formationIndex: 0, platformId: 'ritual-circle', localOffset: [-4, -3.5] },
      { formationIndex: 1, platformId: 'ritual-circle', localOffset: [-4, -0.5] },
      { formationIndex: 2, platformId: 'ritual-circle', localOffset: [-4, 2.5] },
      { formationIndex: 3, platformId: 'ritual-circle', localOffset: [-1.5, -3.5] },
    ],
  },
  foreground: 'default',
};
```

Register in `combat-map-registry.ts`:
```typescript
import { MYSTICAL_GROVE_STAGE } from './stages/mystical-grove';

export const STAGE_SPECS = {
  'lolo-village-outskirt': LOLO_VILLAGE_OUTSKIRT_STAGE,
  'broken-cliff-outskirt': BROKEN_CLIFF_OUTSKIRT_STAGE,
  'mystical-grove': MYSTICAL_GROVE_STAGE,  // NEW
  'the-forest': THE_FOREST_STAGE,
};

export function getStageSpec(mapId: CombatMapId): CombatStageSpec {
  return STAGE_SPECS[mapId];
}
```

And add to the `CombatMapId` union type.

## Y-Axis Spatial Extension (Phase 05+)

Entity positions now support optional Y-coordinate for elevation:
- `entity.position: { x, y?, z }` — Y optional, defaults 0 (backward-compat)
- `ArenaEntity.position.y` — required field, set at spawn time from platform anchor
- Sprites, shadows, and AOE telegraphs all read Y for vertical offset rendering

Spawn anchors provide the Y-coordinate — the engine does not compute it from platform geometry. You control platform height explicitly via `position[1]`.

## Reference

- **Types**: `src/scene/combat/maps/stage-spec-types.ts`
- **Registry**: `src/scene/combat/maps/combat-map-registry.ts`
- **Stage data examples**:
  - `stages/lolo-village-outskirt.ts` — flat ground, single platform, legacy layout
  - `stages/broken-cliff-outskirt.ts` — multi-platform demo with raised cliff + scatter decals
  - `stages/the-forest.ts` — additional example
- **Helpers**: `src/scene/combat/maps/stage-formation-positions.ts` (getStageSpec, getStageSpawnPosition)
