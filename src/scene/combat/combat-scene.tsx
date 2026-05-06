/**
 * Combat scene fragment — mounts inside the shared world canvas (D8 single-
 * canvas strategy). Visibility is toggled by the parent `<group visible>` in
 * world.tsx based on `combatPanelStore.isOpen`.
 *
 * Composition:
 *   - lighting
 *   - simple tile ground + black backdrop (bounded so ground doesn't bleed
 *     past the visible combat area — "window onto a stage" feel)
 *   - entity sprites + ground shadow blobs
 *   - projection publisher → DOM HUD
 *   - fight controller → engine ticks, store sync, event emission
 *
 * Camera + visibility wrapping is owned by world.tsx so this component is a
 * pure scene fragment, not a Canvas wrapper.
 */

import { Suspense } from 'react';
import { useGameStore } from '@/game/state/store';
import { CombatSceneLighting } from './combat-scene-lighting';
import { CombatEntityLayer } from './combat-entity-layer';
import { CombatProjectionPublisher } from './combat-projection-publisher';
import { CombatFightController } from './combat-fight-controller';
import { CombatGroundSimple } from './combat-ground-simple';
import { CombatShadowLayer } from './combat-shadow-layer';
import { CombatBgFar } from './combat-bg-far';
import { CombatBgMid } from './combat-bg-mid';
import { CombatFgDecorative } from './combat-fg-decorative';
import { CombatDofPost } from './combat-dof-post';
import { CombatScissor } from './combat-scissor';
import { CombatCameraDebug } from './combat-camera-debug';

// NOTE: CombatVfxRoot is intentionally NOT mounted here. It must stay alive
// for the entire Canvas lifetime to avoid WebGPU buffer-disposal races (see
// docs/vfx-particles-integration-guide.md). It's mounted by world.tsx at the
// persistent layer so opening/closing combat does not dispose its compute
// pipelines mid-frame.
export function CombatScene() {
  const entities = useGameStore((s) => s.arenaEntities);

  return (
    <>
      {/* Scissor MUST mount before any rendered content — its useFrame at
          priority -1 sets up clearing + scissor rect that constrains every
          subsequent render call to the panel's pixel rectangle. */}
      <CombatScissor />
      <CombatCameraDebug />
      <CombatSceneLighting />
      {/* HD-2D depth layers — order: far bg → mid bg → ground → shadow →
          sprites → foreground. Texture loaders inside bg components Suspense
          on first frame; null fallback prevents flashing while assets load. */}
      <Suspense fallback={null}>
        <CombatBgFar />
        <CombatBgMid />
      </Suspense>
      <CombatGroundSimple />
      <CombatShadowLayer entities={entities} />
      <Suspense fallback={null}>
        <CombatEntityLayer />
      </Suspense>
      <CombatFgDecorative />
      <CombatProjectionPublisher />
      <CombatFightController />
      {/* DOF — must mount AFTER all visible scene content so the composer's
          render-loop replacement renders the full tree. Self-disables on
          'low' graphics quality and on WebGPU. */}
      <CombatDofPost />
    </>
  );
}
