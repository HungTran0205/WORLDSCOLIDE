/**
 * LoLo Village Outskirt — first stage spec.
 *
 * Re-expresses the existing `lolo-village-outskirt-scene.tsx` as a single
 * platform `CombatStageSpec`. Visual parity is GUARANTEED — bg textures,
 * tile paths, weighted accents, backdrop, and spawn positions all mirror
 * the current scene + `FORMATION_POSITIONS`.
 *
 * Spawn-anchor parity (platform centered at [0,0,0], so localOffset = world):
 *   ally   slot 0..2 = front row, lanes back/mid/front (z=-3/0/+3)
 *   ally   slot 3..5 = back  row, lanes back/mid/front
 *   enemy  slot 0..2 = front row, lanes back/mid/front (z asymmetric vs ally
 *                       — see FORMATION_POSITIONS for rationale)
 *   enemy  slot 3..5 = back  row
 *
 * Phase 03 — DORMANT. Phase 04+ activates this for render.
 */

import type { CombatStageSpec } from '../stage-spec-types';

const FAR_BG_TEXTURE = '/arena/background/fbg_forest.png';
const MID_BG_TEXTURE = '/arena/background/mbg_mucangchai_alpha.png';

// Ground tiles — 0002 dominant (golden weathered stone), 0001/0003/0004
// sparsely scattered as wear accents.
const PRIMARY_TILE = '/tiles/2d/64px/ruined-village_0002.png';
const ACCENT_TILES = [
  '/tiles/2d/64px/ruined-village_0001.png',
  '/tiles/2d/64px/ruined-village_0003.png',
  '/tiles/2d/64px/ruined-village_0004.png',
];

// Match scene constants exactly.
const GROUND_WIDTH = 32;
const GROUND_DEPTH = 12;
const TILE_WORLD_SIZE = 2;
const ACCENT_CHANCE = 0.2;

const BACKDROP = { color: '#0a0d0f', z: -30, size: 200 };

// PHASE 04 TILT PROTOTYPE — exported but NOT included in the canonical
// platforms list. Append it to platforms[] during dev to eyeball-validate
// that the 22° camera tilt exposes a visible side-wall band. Target
// verdict: ≥0.5 world units of vertical face visible on screen at default
// cam tilt. Remove this constant before phase 06 (real stages own their
// own platforms).
const SIDE_WALL_TILE = '/tiles/2d/64px/cracked-stone-wall_0001.png';
export const TEST_CLIFF_PROTOTYPE: import('../stage-spec-types').PlatformSpec = {
  id: 'test-cliff',
  position: [-12, 2, -2],
  size: [6, 4],
  baseTile: PRIMARY_TILE,
  tileWorldSize: TILE_WORLD_SIZE,
  sideTile: SIDE_WALL_TILE,
  // sideHeight defaults to position.y = 2 → wall hangs from y=2 down to y=0.
  decoration: true,
  lighting: 'unlit',
};

export const LOLO_VILLAGE_OUTSKIRT_STAGE: CombatStageSpec = {
  id: 'lolo-village-outskirt',
  bgFar: { texture: FAR_BG_TEXTURE },
  bgMid: { texture: MID_BG_TEXTURE },
  backdrop: BACKDROP,
  platforms: [
    {
      id: 'ground',
      position: [0, 0, 0],
      size: [GROUND_WIDTH, GROUND_DEPTH],
      baseTile: {
        main: PRIMARY_TILE,
        variants: ACCENT_TILES,
        variantChance: ACCENT_CHANCE,
      },
      tileWorldSize: TILE_WORLD_SIZE,
      // Pre-refactor scene used <TiledFloorMosaic> with meshBasicMaterial
      // (no light reaction). Declare 'unlit' explicitly so the spec-driven
      // <CombatPlatform> renders pixel-equivalent.
      lighting: 'unlit',
      // No sideTile / sideHeight — ground level, no front face.
    },
    // To eyeball-validate side-wall visibility at 22° camera tilt, append
    // `TEST_CLIFF` here, run `npm run dev`, and inspect the panel. Target
    // verdict: ≥0.5u of vertical face on screen. Remove before phase 06.
  ],
  spawnAnchors: {
    // Mirror FORMATION_POSITIONS.ally exactly. Platform centered at [0,0,0]
    // so localOffset[i] === world FORMATION_POSITIONS.ally[...][i] {x,z}.
    ally: [
      { formationIndex: 0, platformId: 'ground', localOffset: [-2.5, -3] },
      { formationIndex: 1, platformId: 'ground', localOffset: [-3, 0] },
      { formationIndex: 2, platformId: 'ground', localOffset: [-3.5, 3] },
      { formationIndex: 3, platformId: 'ground', localOffset: [-6, -3] },
      { formationIndex: 4, platformId: 'ground', localOffset: [-6.5, 0] },
      { formationIndex: 5, platformId: 'ground', localOffset: [-7, 3] },
    ],
    enemy: [
      { formationIndex: 0, platformId: 'ground', localOffset: [2.5, -3.5] },
      { formationIndex: 1, platformId: 'ground', localOffset: [3, -0.5] },
      { formationIndex: 2, platformId: 'ground', localOffset: [3.5, 2.5] },
      { formationIndex: 3, platformId: 'ground', localOffset: [6, -3.5] },
      { formationIndex: 4, platformId: 'ground', localOffset: [6.5, -0.5] },
      { formationIndex: 5, platformId: 'ground', localOffset: [7, 2.5] },
    ],
  },
  foreground: 'default',
};
