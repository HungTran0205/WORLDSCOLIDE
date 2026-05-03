/**
 * Combat scene fragment — mounts inside the shared world canvas (D8 single-
 * canvas strategy). Visibility is toggled by the parent `<group visible>` in
 * world.tsx based on `combatPanelStore.isOpen`.
 *
 * Composition:
 *   - lighting + black backdrop (D9)
 *   - entity layer (idle sprites driven from arena snapshots)
 *   - projection publisher → DOM HUD
 *   - fight controller → engine ticks, store sync, event emission
 *
 * Camera + visibility wrapping is owned by world.tsx so this component is a
 * pure scene fragment, not a Canvas wrapper.
 */

import { Suspense } from 'react';
import { CombatBackgroundBlack } from './combat-background-black';
import { CombatSceneLighting } from './combat-scene-lighting';
import { CombatEntityLayer } from './combat-entity-layer';
import { CombatProjectionPublisher } from './combat-projection-publisher';
import { CombatFightController } from './combat-fight-controller';

// NOTE: CombatVfxRoot is intentionally NOT mounted here. It must stay alive
// for the entire Canvas lifetime to avoid WebGPU buffer-disposal races (see
// docs/vfx-particles-integration-guide.md). It's mounted by world.tsx at the
// persistent layer so opening/closing combat does not dispose its compute
// pipelines mid-frame.
export function CombatScene() {
  return (
    <>
      <CombatSceneLighting />
      <CombatBackgroundBlack />
      <Suspense fallback={null}>
        <CombatEntityLayer />
      </Suspense>
      <CombatProjectionPublisher />
      <CombatFightController />
    </>
  );
}
