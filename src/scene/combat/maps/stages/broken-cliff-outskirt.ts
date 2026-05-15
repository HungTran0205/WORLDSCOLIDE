/**
 * Broken Cliff Outskirt — phase 06 multi-platform demo stage.
 *
 * First true side-scroller platformer layout: two combat platforms at
 * distinct y levels with a cracked-stone cliff face between them.
 *   - Allies stand on `lower-ground` (y=0) — left half of arena.
 *   - Enemies stand on `upper-cliff` (y=1.5) — right half, elevated.
 *   - Decoration `far-bg-ledge` adds parallax depth (z=-6, mid-height).
 *
 * Spawn anchor geometry mirrors `lolo-village-outskirt` lane spacing so
 * sprite foreshortening + combat math behave identically; only y differs
 * for the enemy side. This guarantees no auto-resolve regression and
 * makes the visual change the only surprise.
 *
 * Asset palette (phase 01/02 simplified set):
 *   - 32px `dirt-base` + `grass-edge` accent for top tiles.
 *   - 64px `cracked-stone-wall` for the upper-cliff front face.
 *   - decals: grass-tuft / moss-patch / crack scatter + one manually-placed
 *     broken-edge accent at front-left corner of upper-cliff.
 *
 * Wired via `combat-map-registry.ts` — zone `'Broken Cliff'` → this stage.
 */

import type { CombatStageSpec } from '../stage-spec-types';

const FAR_BG_TEXTURE = '/arena/background/fbg_forest.png';
const MID_BG_TEXTURE = '/arena/background/mbg_mucangchai_alpha.png';

const DIRT_BASE_TILE = '/tiles/2d/32px/dirt-base_0001.png';
const SIDE_WALL_TILE = '/tiles/2d/64px/cracked-stone-wall_0001.png';

const TILE_WORLD_SIZE = 1;
const BACKDROP = { color: '#0a0d0f', z: -30, size: 200 };

export const BROKEN_CLIFF_OUTSKIRT_STAGE: CombatStageSpec = {
  id: 'broken-cliff-outskirt',
  bgFar: { texture: FAR_BG_TEXTURE },
  bgMid: { texture: MID_BG_TEXTURE },
  backdrop: BACKDROP,
  platforms: [
    {
      // Ally platform — flat ground level, sparse grass-edge accents +
      // ambient grass-tuft scatter.
      id: 'lower-ground',
      position: [-7, 0, 0],
      size: [14, 12],
      baseTile: DIRT_BASE_TILE,
      tileWorldSize: TILE_WORLD_SIZE,
      lighting: 'unlit',
      decalDensity: [
        {
          textures: [
            '/decals/combat/grass-tuft-1.png',
            '/decals/combat/grass-tuft-3.png',
            '/decals/combat/pebble-cluster-1.png',
          ],
          perCellChance: 0.1,
          size: [0.6, 0.4],
          seed: 4242,
        },
      ],
    },
    {
      // Enemy platform — RAISED 1.5u, exposes cracked-stone front face.
      // Heavier decal density (moss + cracks) reinforces "weathered cliff".
      id: 'upper-cliff',
      position: [7, 1.5, 0],
      size: [14, 12],
      baseTile: DIRT_BASE_TILE,
      tileWorldSize: TILE_WORLD_SIZE,
      sideTile: SIDE_WALL_TILE,
      // sideHeight defaults to position.y = 1.5 → wall hangs from y=1.5 down to y=0.
      lighting: 'unlit',
      decals: [
        {
          // Front-left corner accent: makes the cliff edge feel "broken-off".
          // World coords: upper-cliff center [7,1.5,0] + localOffset (-6.5, 5.8).
          texture: '/decals/combat/broken-edge-tile-1.png',
          position: [0.5, 5.8],
          size: [1.0, 0.6],
        },
      ],
      decalDensity: [
        {
          textures: [
            '/decals/combat/moss-patch-1.png',
            '/decals/combat/moss-patch-2.png',
            '/decals/combat/grass-tuft-2.png',
          ],
          perCellChance: 0.08,
          size: [0.5, 0.5],
          seed: 9001,
        },
        {
          textures: [
            '/decals/combat/crack-1.png',
            '/decals/combat/crack-2.png',
          ],
          perCellChance: 0.04,
          size: [0.4, 0.4],
          seed: 731,
        },
      ],
    },
    {
      // Far-bg parallax ledge — decoration only, sits behind action plane.
      // No spawn anchors reference it; included purely for depth.
      id: 'far-bg-ledge',
      position: [-2, 0.7, -6],
      size: [6, 2],
      baseTile: DIRT_BASE_TILE,
      tileWorldSize: TILE_WORLD_SIZE,
      sideTile: SIDE_WALL_TILE,
      sideHeight: 0.7,
      lighting: 'unlit',
      decoration: true,
      decalDensity: [
        {
          textures: ['/decals/combat/grass-tuft-1.png'],
          perCellChance: 0.1,
          size: [0.4, 0.3],
          seed: 12,
        },
      ],
    },
  ],
  spawnAnchors: {
    // Geometry mirrors lolo lane spacing: front row x≈-2.5..-3.5,
    // back row x≈-6..-7; lane z = -3 / 0 / 3 (slight skew per slot).
    ally: [
      { formationIndex: 0, platformId: 'lower-ground', localOffset: [4.5, -3] },
      { formationIndex: 1, platformId: 'lower-ground', localOffset: [4, 0] },
      { formationIndex: 2, platformId: 'lower-ground', localOffset: [3.5, 3] },
      { formationIndex: 3, platformId: 'lower-ground', localOffset: [1, -3] },
      { formationIndex: 4, platformId: 'lower-ground', localOffset: [0.5, 0] },
      { formationIndex: 5, platformId: 'lower-ground', localOffset: [0, 3] },
    ],
    // Enemy mirror on upper-cliff — y inherited from platform.position[1]=1.5.
    enemy: [
      { formationIndex: 0, platformId: 'upper-cliff', localOffset: [-4.5, -3.5] },
      { formationIndex: 1, platformId: 'upper-cliff', localOffset: [-4, -0.5] },
      { formationIndex: 2, platformId: 'upper-cliff', localOffset: [-3.5, 2.5] },
      { formationIndex: 3, platformId: 'upper-cliff', localOffset: [-1, -3.5] },
      { formationIndex: 4, platformId: 'upper-cliff', localOffset: [-0.5, -0.5] },
      { formationIndex: 5, platformId: 'upper-cliff', localOffset: [0, 2.5] },
    ],
  },
  foreground: 'default',
};
