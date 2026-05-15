/**
 * The Forest — phase 04 visual-validation stage. Clone of LoLo Village
 * Outskirt with a single raised platform ("test-cliff") added to eyeball
 * side-wall visibility under the 22° camera tilt.
 *
 * Purpose: hands-on prototype before phase 06 authors a real multi-platform
 * stage. Same bg/ground/spawns as lolo so combat feels familiar; the only
 * difference is the y=2 cliff at the back-left of the arena.
 *
 * REMOVE this stage (and its zone mapping in combat-map-registry.ts) before
 * phase 07 cleanup once phase 06 has the real demo stage.
 */

import type { CombatStageSpec } from '../stage-spec-types';

const FAR_BG_TEXTURE = '/arena/background/fbg_forest.png';
const MID_BG_TEXTURE = '/arena/background/mbg_mucangchai_alpha.png';

const PRIMARY_TILE = '/tiles/2d/64px/ruined-village_0002.png';
const ACCENT_TILES = [
  '/tiles/2d/64px/ruined-village_0001.png',
  '/tiles/2d/64px/ruined-village_0003.png',
  '/tiles/2d/64px/ruined-village_0004.png',
];
const SIDE_WALL_TILE = '/tiles/2d/64px/cracked-stone-wall_0001.png';

const GROUND_WIDTH = 32;
const GROUND_DEPTH = 12;
const TILE_WORLD_SIZE = 2;
const ACCENT_CHANCE = 0.2;

const BACKDROP = { color: '#0a0d0f', z: -30, size: 200 };

export const THE_FOREST_STAGE: CombatStageSpec = {
  id: 'the-forest',
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
      lighting: 'unlit',
    },
    {
      // Tilt-validation cliff — sits behind ally back row INSIDE the viewport
      // safe zone (x ∈ [-9, 9]). Phase 05 Y-wiring verify: ally slot 5 (back
      // row last) anchored here to confirm sprite + shadow + AOE telegraph
      // all read entity.position.y correctly. sideHeight defaults to
      // position.y=2; sideTile drives the vertical cracked-stone face on
      // the +Z (camera-facing) edge.
      id: 'test-cliff',
      position: [-9, 2, -2],
      size: [4, 4],
      baseTile: PRIMARY_TILE,
      tileWorldSize: TILE_WORLD_SIZE,
      sideTile: SIDE_WALL_TILE,
      lighting: 'unlit',
    },
  ],
  // Spawn anchors mirror lolo exactly — stage is just a visual variant.
  spawnAnchors: {
    ally: [
      { formationIndex: 0, platformId: 'ground', localOffset: [-2.5, -3] },
      { formationIndex: 1, platformId: 'ground', localOffset: [-3, 0] },
      { formationIndex: 2, platformId: 'ground', localOffset: [-3.5, 3] },
      { formationIndex: 3, platformId: 'ground', localOffset: [-6, -3] },
      { formationIndex: 4, platformId: 'ground', localOffset: [-6.5, 0] },
      // Phase 05 Y-wiring verify: slot 5 anchored at cliff center (y=2).
      // Cliff center (-9, 2, -2); localOffset (0, 0) → world (-9, 2, -2).
      // Sprite should mount visibly elevated above the back row (~2u above
      // ally slot 4 at world (-6.5, 0, 0)); shadow lands on cliff top y=2.01.
      { formationIndex: 5, platformId: 'test-cliff', localOffset: [0, 0] },
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
