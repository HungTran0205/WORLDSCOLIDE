/**
 * Combat map registry — resolves a mission to its visual map identifier.
 *
 * Each combat map (location-themed combat scene) is identified by a stable
 * `CombatMapId`. Missions reference a `zone` string (see `Mission.zone` in
 * game-state.ts); this registry maps zone → mapId so different missions in
 * the same zone share visuals without per-mission config.
 *
 * To add a new map:
 *   1. Add the id to `CombatMapId`.
 *   2. Add zone(s) → id mapping in `ZONE_TO_MAP`.
 *   3. Create `<XScene>` component under `src/scene/combat/maps/`.
 *   4. Wire the component into the dispatch switch in `combat-scene.tsx`.
 *
 * Fallback: unknown / null missions resolve to the default map so combat
 * never renders a black void during dev or when a save references a removed
 * mission.
 */

import { MISSIONS } from '@/game/data/missions';
import type { CombatStageSpec } from './stage-spec-types';
import { LOLO_VILLAGE_OUTSKIRT_STAGE } from './stages/lolo-village-outskirt';
import { THE_FOREST_STAGE } from './stages/the-forest';
import { BROKEN_CLIFF_OUTSKIRT_STAGE } from './stages/broken-cliff-outskirt';

export type CombatMapId =
  | 'lolo-village-outskirt'
  | 'the-forest'
  | 'broken-cliff-outskirt';

/** First map and current default — used when a mission's zone has no entry. */
export const DEFAULT_COMBAT_MAP: CombatMapId = 'lolo-village-outskirt';

/** Stage specs keyed by mapId. Spec-driven render path consumes these. */
const STAGE_SPECS: Record<CombatMapId, CombatStageSpec> = {
  'lolo-village-outskirt': LOLO_VILLAGE_OUTSKIRT_STAGE,
  'the-forest': THE_FOREST_STAGE,
  'broken-cliff-outskirt': BROKEN_CLIFF_OUTSKIRT_STAGE,
};

/** Resolve a stage spec for a given mapId. */
export function getStageSpec(mapId: CombatMapId): CombatStageSpec {
  return STAGE_SPECS[mapId];
}

/** Per-mission overrides — checked BEFORE zone routing. Use for individual
 *  missions that should diverge from their zone's default map (e.g. phase 04
 *  validation: route specific spider missions to the-forest without dragging
 *  the rest of 'Outskirts Forest' along). */
const MISSION_TO_MAP: Partial<Record<string, CombatMapId>> = {
  // Phase 04: validate side-wall visibility on a real F-tier mission.
  'spider-nest': 'the-forest',
};

/** Mission.zone string → CombatMapId. Multiple zones can share a map. */
const ZONE_TO_MAP: Record<string, CombatMapId> = {
  'Outskirts Forest': 'lolo-village-outskirt',
  // Phase 04: 'Deep Forest' (Forest Guardian mission) routes to the-forest
  // so users can eyeball side-wall visibility at 22° tilt before phase 06.
  'Deep Forest': 'the-forest',
  // Phase 06: multi-platform demo stage — allies on lower-ground (y=0),
  // enemies on raised cliff (y=1.5), cracked-stone wall between.
  'Broken Cliff': 'broken-cliff-outskirt',
};

/** Resolve the map for a given missionId. Falls back to default on miss.
 *  Order: missionId override → zone → default. */
export function resolveCombatMapId(missionId: string | null | undefined): CombatMapId {
  if (!missionId) return DEFAULT_COMBAT_MAP;
  const override = MISSION_TO_MAP[missionId];
  if (override) return override;
  const mission = MISSIONS.find((m) => m.id === missionId);
  const zone = mission?.zone;
  if (zone && ZONE_TO_MAP[zone]) return ZONE_TO_MAP[zone];
  return DEFAULT_COMBAT_MAP;
}
