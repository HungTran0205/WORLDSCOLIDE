/**
 * Crystal Cave — Arc 1 "First Tremor" cave stage (Q3 drones, plus the
 * legacy Crystal Cave bat/slime missions).
 *
 * Two-platform layout: allies on the flat cave floor (y=0, left half),
 * enemies on a raised rock shelf (y=1.2, right half) with a cracked-stone
 * front face. Spawn-anchor geometry mirrors `broken-cliff-outskirt` lane
 * spacing so combat math behaves identically; only the enemy y differs.
 *
 * Tiles/backgrounds are PLACEHOLDERS reused from the village set — swap for
 * cave-specific art when the asset pass lands.
 *
 * Wired via `combat-map-registry.ts` — zones 'Crystal Cave' + 'Cave Entrance'.
 */

import type { CombatStageSpec } from '../stage-spec-types';

// Placeholder tiles — replace with cave-specific assets when art is ready.
const PRIMARY_TILE = '/tiles/2d/64px/ruined-village_0002.png';
const SIDE_TILE = '/tiles/2d/64px/cracked-stone-wall_0001.png';
const FAR_BG = '/arena/background/fbg_forest.png';
const MID_BG = '/arena/background/mbg_mucangchai_alpha.png';

const TILE_WORLD_SIZE = 2;
const BACKDROP = { color: '#050a12', z: -30, size: 200 };

export const CRYSTAL_CAVE_STAGE: CombatStageSpec = {
  id: 'crystal-cave',
  bgFar: { texture: FAR_BG },
  bgMid: { texture: MID_BG },
  backdrop: BACKDROP,
  platforms: [
    {
      // Ally platform — flat cave floor, ground level.
      id: 'cave-floor',
      position: [-7, 0, 0],
      size: [14, 12],
      baseTile: PRIMARY_TILE,
      tileWorldSize: TILE_WORLD_SIZE,
      lighting: 'unlit',
    },
    {
      // Enemy platform — raised rock shelf, exposes cracked-stone front face.
      id: 'rock-shelf',
      position: [7, 1.2, 0],
      size: [14, 12],
      baseTile: PRIMARY_TILE,
      tileWorldSize: TILE_WORLD_SIZE,
      sideTile: SIDE_TILE,
      sideHeight: 1.2,
      lighting: 'unlit',
    },
  ],
  spawnAnchors: {
    // Mirrors broken-cliff lane spacing for the [-7,0,0] / [7,y,0] layout.
    ally: [
      { formationIndex: 0, platformId: 'cave-floor', localOffset: [4.5, -3] },
      { formationIndex: 1, platformId: 'cave-floor', localOffset: [4, 0] },
      { formationIndex: 2, platformId: 'cave-floor', localOffset: [3.5, 3] },
      { formationIndex: 3, platformId: 'cave-floor', localOffset: [1, -3] },
      { formationIndex: 4, platformId: 'cave-floor', localOffset: [0.5, 0] },
      { formationIndex: 5, platformId: 'cave-floor', localOffset: [0, 3] },
    ],
    enemy: [
      { formationIndex: 0, platformId: 'rock-shelf', localOffset: [-4.5, -3.5] },
      { formationIndex: 1, platformId: 'rock-shelf', localOffset: [-4, -0.5] },
      { formationIndex: 2, platformId: 'rock-shelf', localOffset: [-3.5, 2.5] },
      { formationIndex: 3, platformId: 'rock-shelf', localOffset: [-1, -3.5] },
      { formationIndex: 4, platformId: 'rock-shelf', localOffset: [-0.5, -0.5] },
      { formationIndex: 5, platformId: 'rock-shelf', localOffset: [0, 2.5] },
    ],
  },
  foreground: 'default',
};
