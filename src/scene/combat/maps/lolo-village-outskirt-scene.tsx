/**
 * LoLo Village Outskirt — first concrete combat map.
 *
 * Setting: ruined hamlet on the outskirts of LoLo Village. Mountain Village
 * forest art behind, Mu Cang Chai silhouette mid-ground, weathered paving
 * underfoot — primary tile is `ruined-village_0002` (golden weathered stone,
 * the most uniform tone of the set); the other 5 variants are sparsely
 * scattered as accents (~20% per cell) for irregular wear without breaking
 * tonal coherence.
 *
 * Used by missions whose `zone` resolves to `lolo-village-outskirt` via
 * `combat-map-registry.ts` (currently F-tier "Outskirts Forest" + "Deep
 * Forest" missions).
 *
 * Phase 04: this component is now a thin delegate to <StageRenderHost>. All
 * tile / bg / spawn data live in the stage spec at
 * `./stages/lolo-village-outskirt.ts`. Visual parity with the pre-refactor
 * scene is maintained via the spec's `lighting: 'unlit'` flag on the ground
 * platform (matches old <TiledFloorMosaic> meshBasicMaterial behavior).
 */

import { StageRenderHost } from './stage-render-host';
import { getStageSpec } from './combat-map-registry';

export function LoloVillageOutskirtScene() {
  return <StageRenderHost spec={getStageSpec('lolo-village-outskirt')} />;
}
