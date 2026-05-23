/**
 * Underground Entrance — Arc 1 "First Tremor" industrial stage (Q4 dog-robots
 * in 'Underground Ruins', Q5 Slime King boss in 'Ancient Core').
 *
 * Two-platform layout: allies on the grating-level floor (y=0, left half),
 * enemies on a raised concrete slab (y=0.8, right half) with a cracked-stone
 * front face. Lower lift than crystal-cave to read as a shallow step rather
 * than a cliff. Spawn-anchor geometry mirrors `broken-cliff-outskirt`.
 *
 * Tiles/backgrounds are PLACEHOLDERS reused from the village set — swap for
 * industrial art when the asset pass lands.
 *
 * Wired via `combat-map-registry.ts` — zones 'Underground Ruins' + 'Ancient Core'.
 */

import type { CombatStageSpec } from '../stage-spec-types';

// Placeholder tiles — replace with industrial-specific assets when ready.
const PRIMARY_TILE = '/tiles/2d/64px/ruined-village_0002.png';
const SIDE_TILE = '/tiles/2d/64px/cracked-stone-wall_0001.png';
const FAR_BG = '/arena/background/fbg_forest.png';
const MID_BG = '/arena/background/mbg_mucangchai_alpha.png';

const TILE_WORLD_SIZE = 2;
const BACKDROP = { color: '#080808', z: -30, size: 200 };

export const UNDERGROUND_ENTRANCE_STAGE: CombatStageSpec = {
  id: 'underground-entrance',
  bgFar: { texture: FAR_BG },
  bgMid: { texture: MID_BG },
  backdrop: BACKDROP,
  platforms: [
    {
      // Ally platform — grating-level floor, ground level.
      id: 'grating-floor',
      position: [-7, 0, 0],
      size: [14, 12],
      baseTile: PRIMARY_TILE,
      tileWorldSize: TILE_WORLD_SIZE,
      lighting: 'unlit',
    },
    {
      // Enemy platform — raised concrete slab, shallow step (+0.8u).
      id: 'concrete-slab',
      position: [7, 0.8, 0],
      size: [14, 12],
      baseTile: PRIMARY_TILE,
      tileWorldSize: TILE_WORLD_SIZE,
      sideTile: SIDE_TILE,
      sideHeight: 0.8,
      lighting: 'unlit',
    },
  ],
  spawnAnchors: {
    // Mirrors broken-cliff lane spacing for the [-7,0,0] / [7,y,0] layout.
    ally: [
      { formationIndex: 0, platformId: 'grating-floor', localOffset: [4.5, -3] },
      { formationIndex: 1, platformId: 'grating-floor', localOffset: [4, 0] },
      { formationIndex: 2, platformId: 'grating-floor', localOffset: [3.5, 3] },
      { formationIndex: 3, platformId: 'grating-floor', localOffset: [1, -3] },
      { formationIndex: 4, platformId: 'grating-floor', localOffset: [0.5, 0] },
      { formationIndex: 5, platformId: 'grating-floor', localOffset: [0, 3] },
    ],
    enemy: [
      { formationIndex: 0, platformId: 'concrete-slab', localOffset: [-4.5, -3.5] },
      { formationIndex: 1, platformId: 'concrete-slab', localOffset: [-4, -0.5] },
      { formationIndex: 2, platformId: 'concrete-slab', localOffset: [-3.5, 2.5] },
      { formationIndex: 3, platformId: 'concrete-slab', localOffset: [-1, -3.5] },
      { formationIndex: 4, platformId: 'concrete-slab', localOffset: [-0.5, -0.5] },
      { formationIndex: 5, platformId: 'concrete-slab', localOffset: [0, 2.5] },
    ],
  },
  foreground: 'default',
};
