/**
 * Combat scene dispatcher — picks the correct stage spec based on the active
 * mission's zone, then mounts <StageRenderHost> with that spec inside the
 * shared world canvas (D8 single-canvas strategy).
 *
 * Visibility is toggled by the parent `<group visible>` in world.tsx based
 * on `combatPanelStore.isOpen`. Camera setup lives in world.tsx; this
 * component is a pure scene fragment, not a Canvas wrapper.
 *
 * To add a new map:
 *   1. Add the id to CombatMapId in maps/combat-map-registry.ts
 *   2. Map zone(s) → id in ZONE_TO_MAP and add a STAGE_SPECS entry
 *   3. Author the stage spec under maps/stages/
 *
 * Phase 06: dispatcher collapsed to a single host call — every spec-driven
 * stage routes through <StageRenderHost>, so per-stage component files are
 * no longer needed (kept for now during migration; remove in phase 07).
 *
 * The shared scaffolding (lighting, scissor, entities, fight controller,
 * post FX) lives in <CombatSceneShell> and is reused by every map.
 */

import { useEffect } from 'react';
import { useCombatPanelStore } from '@/game/state/combat-panel-store';
import { preloadCombatMasks } from '@/scene/sprites/mask-pool';
import { disposeCombatMaskCompositeAtlasCache } from './combat-mask-composite-atlas';
import { resolveCombatMapId, getStageSpec } from './maps/combat-map-registry';
import { StageRenderHost } from './maps/stage-render-host';

// NOTE: CombatVfxRoot is intentionally NOT mounted here. It must stay alive
// for the entire Canvas lifetime to avoid WebGPU buffer-disposal races (see
// docs/vfx-particles-integration-guide.md). It's mounted by world.tsx at the
// persistent layer so opening/closing combat does not dispose its compute
// pipelines mid-frame.
export function CombatScene() {
  const missionId = useCombatPanelStore((s) => s.missionId);
  const mapId = resolveCombatMapId(missionId);
  useEffect(() => {
    preloadCombatMasks();
    return () => { disposeCombatMaskCompositeAtlasCache(); };
  }, []);
  return <StageRenderHost spec={getStageSpec(mapId)} />;
}
