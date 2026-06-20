/**
 * CombatSceneShell — foundation for all map-specific combat scenes.
 *
 * Hosts the common scene components every combat map needs:
 *   - Scissor (constrains rendering to the panel rectangle)
 *   - Camera debug
 *   - Lighting
 *   - Shadow layer (under sprites)
 *   - Entity layer (sprites)
 *   - Projection publisher → DOM HUD
 *   - Fight controller (engine ticks)
 *   - DOF post (camera depth-of-field)
 *
 * Map-specific visual layers are injected via three named slots:
 *   - `bg`         — far + mid backgrounds (caller wraps in <Suspense> if textures load)
 *   - `ground`     — tiled / textured floor (caller wraps in <Suspense> if textures load)
 *   - `foreground` — optional decorative props at the front edge
 *
 * Slot order matches the original combat-scene.tsx layering (the AOE and impact
 * VFX layers are hard-mounted, not caller slots):
 *   bg → ground → shadow → aoe → entity → impact → foreground
 *
 * Each map component (e.g. <LoloVillageOutskirtScene>) wraps this shell and
 * supplies the three slots. The shell stays visually agnostic — adding a new
 * map never touches this file.
 */

import { Suspense, type ReactNode } from 'react';
import { useGameStore } from '@/game/state/store';
import { CombatSceneLighting } from './combat-scene-lighting';
import { CombatEntityLayer } from './combat-entity-layer';
import { CombatProjectionPublisher } from './combat-projection-publisher';
import { CombatFightController } from './combat-fight-controller';
import { CombatShadowLayer } from './combat-shadow-layer';
import { CombatDofPost } from './combat-dof-post';
import { CombatWebGpuPost } from './combat-webgpu-post';
import { CombatScissor } from './combat-scissor';
import { CombatCameraDebug } from './combat-camera-debug';
import { CombatMaskDevTuner } from './combat-mask-dev-tuner';
import { CombatAoeLayer } from './combat-aoe-layer';
import { CombatImpactLayer } from './combat-impact-layer';
import { MeshFxPoolRoot } from '@/scene/effects/mesh-fx';
import { CombatSkillVfxLayer } from '@/scene/effects/skill-vfx/combat-skill-vfx-layer';
import { CombatCameraShake } from './camera-impulse/combat-camera-shake';

export interface CombatSceneShellProps {
  /** Far + mid background planes. Caller owns Suspense wrapping. */
  bg: ReactNode;
  /** Ground floor primitive (e.g. <TiledFloor>). Caller owns Suspense wrapping. */
  ground: ReactNode;
  /** Optional foreground decorative layer (grass tufts, rocks, etc). */
  foreground?: ReactNode;
}

export function CombatSceneShell({ bg, ground, foreground }: CombatSceneShellProps) {
  const entities = useGameStore((s) => s.arenaEntities);

  return (
    <>
      {/* Scissor MUST mount before any rendered content — its useFrame at
          priority -1 sets up clearing + scissor rect that constrains every
          subsequent render call to the panel's pixel rectangle. */}
      <CombatScissor />
      <CombatCameraDebug />
      {/* DEV-only anchor tuner for composite mask authoring. Tree-shaken in prod. */}
      {import.meta.env.DEV && <CombatMaskDevTuner />}
      <CombatSceneLighting />
      {bg}
      {ground}
      <CombatShadowLayer entities={entities} />
      {/* AOE telegraphs render above ground (yOffset 0.02) but under sprites
          and foreground props. Suspense covers texture load on first cast. */}
      <Suspense fallback={null}>
        <CombatAoeLayer />
      </Suspense>
      <Suspense fallback={null}>
        <CombatEntityLayer />
      </Suspense>
      {/* Attack impact VFX (slash/beam meshes) — mounted after sprites so they
          read on top of entities; additive WebGPU-TSL materials. No Suspense:
          materials build async internally (useState), no texture load. */}
      <CombatImpactLayer />
      {/* Mesh-FX pool — N×kind slots mounted once; warm() builds handles on
          first combat open. Per-cast drivers (MeshFxVfx) acquire/release slots
          without mounting new geometry. */}
      <MeshFxPoolRoot />
      {/* Skill cue-sheet orchestrator — schedules mesh/trail/particles/shake/
          hitstop/sound per registered skill. Suppresses default gen-hit path
          for skills that own a full cue sheet. */}
      <CombatSkillVfxLayer />
      {foreground}
      <CombatProjectionPublisher />
      <CombatFightController />
      {/* Camera shake impulse applier — decaying oscillator offset on impact cues.
          Recomputes base from constants every frame; never drifts vs force-reset. */}
      <CombatCameraShake />
      {/* Post FX — must mount AFTER all visible scene content so the composer's
          render-loop replacement renders the full tree. The two paths are
          mutually exclusive by renderer type, so exactly one composer runs:
            - WebGL  → <CombatDofPost> (DOF; self-disables on 'low' quality).
            - WebGPU → <CombatWebGpuPost> (bloom/tilt-shift/grade/vignette/ACES;
                       tilt-shift supersedes the WebGPU-dead DOF). */}
      <CombatDofPost />
      <CombatWebGpuPost />
    </>
  );
}
