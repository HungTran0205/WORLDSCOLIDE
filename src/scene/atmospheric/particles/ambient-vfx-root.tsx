/**
 * Persistent root for ambient ParticleArchetype VFX systems.
 *
 * Per `docs/vfx-particles-integration-guide.md`: VFXParticles compute
 * pipelines must be mounted ONCE and never unmounted (the dispose path
 * races against pending GPU submissions and crashes the WebGPU device).
 * Mounts the four ambient archetypes (dust, embers, magic-motes, pollen)
 * with `autoStart={false}` — emission is driven externally by
 * `<AmbientEmitterDriver />` which reads the active room and calls
 * `useVFXEmitter().emit()` with per-frame random positions inside the
 * current room's bounds.
 *
 * Replaces the legacy `<points>` + `PointsMaterial` archetypes — those
 * silently failed under WebGPU because the TSL translation of
 * `PointsMaterial.map` reads the geometry `uv` attribute (which a Points
 * buffer doesn't have) instead of `pointUV`.
 *
 * Sampler ceiling: `lighting: Lighting.BASIC` is mandatory. Standard
 * lighting binds 18+ samplers per pipeline, exceeding the common adapter
 * cap of 16 — same constraint that drives CombatVfxRoot.
 */

import { VFXParticles, Blending } from 'r3f-vfx';
import { Lighting } from 'core-vfx';

/** Stable names used by both the root (mount) and the emitter driver
 *  (resolve via `useVFXEmitter`). Keyed by ParticleKind from atmosphere-types. */
export const AMBIENT_PARTICLE_NAMES = {
  dust: 'ambient-dust',
  embers: 'ambient-embers',
  'magic-motes': 'ambient-magic-motes',
  pollen: 'ambient-pollen',
} as const;

export type AmbientParticleKind = keyof typeof AMBIENT_PARTICLE_NAMES;

/** Event-driven sparks (hammer strike). Not part of AMBIENT_PARTICLE_NAMES
 *  because emission is triggered per frame transition, not by room presence. */
export const BLACKSMITH_SPARK_NAME = 'blacksmith-spark';

/** Steady-state emit rates (particles per second). Tuned to maintain
 *  visible density given each archetype's lifetime: rate × avg(lifetime)
 *  ≈ active count in flight. */
export const AMBIENT_EMIT_RATES: Record<AmbientParticleKind, number> = {
  dust: 60,
  embers: 70,
  'magic-motes': 50,
  pollen: 18,
};

export function AmbientVfxRoot() {
  return (
    <>
      {/* Dust — slow horizontal drift, warm cream, indoor rooms. */}
      <VFXParticles
        name={AMBIENT_PARTICLE_NAMES.dust}
        autoStart={false}
        maxParticles={200}
        lifetime={[5, 10]}
        speed={[0.05, 0.15]}
        direction={[
          [-1, 1],
          [-0.2, 0.2],
          [-1, 1],
        ]}
        gravity={[0, 0, 0]}
        size={[0.02, 0.05]}
        colorStart={['#fff0d0', '#fff8e0']}
        colorEnd={['#a08060', '#806040']}
        fadeOpacity={[1, 1]}
        fadeSize={[0.5, 0.8]}
        intensity={0.5}
        blending={Blending.ADDITIVE}
        lighting={Lighting.BASIC}
      />

      {/* Embers — hot orange, rise from heat with slight upward gravity. */}
      <VFXParticles
        name={AMBIENT_PARTICLE_NAMES.embers}
        autoStart={false}
        maxParticles={250}
        lifetime={[2, 4]}
        speed={[0.4, 0.8]}
        direction={[
          [-0.3, 0.3],
          [0.5, 1],
          [-0.3, 0.3],
        ]}
        gravity={[0, 0.3, 0]}
        size={[0.04, 0.08]}
        colorStart={['#ffa040', '#ff8020']}
        colorEnd={['#ff3000', '#a01000']}
        fadeOpacity={[1, 0]}
        fadeSize={[0.5, 1.2]}
        intensity={2.5}
        blending={Blending.ADDITIVE}
        lighting={Lighting.BASIC}
      />

      {/* Magic motes — cool purple, gentle random drift, alchemy/magic rooms. */}
      <VFXParticles
        name={AMBIENT_PARTICLE_NAMES['magic-motes']}
        autoStart={false}
        maxParticles={350}
        lifetime={[4, 8]}
        speed={[0.1, 0.3]}
        direction={[
          [-1, 1],
          [-0.5, 0.5],
          [-1, 1],
        ]}
        gravity={[0, 0, 0]}
        size={[0.06, 0.11]}
        colorStart={['#9678ff', '#a888ff']}
        colorEnd={['#6048a0', '#8060d0']}
        fadeOpacity={[1, 1]}
        fadeSize={[0.5, 0.8]}
        intensity={2}
        blending={Blending.ADDITIVE}
        lighting={Lighting.BASIC}
      />

      {/* Blacksmith hammer-strike spark — event-driven burst (not ambient).
          Triggered by WorkingAnimator's onFrame callback on the impact frame
          of the blacksmith animation. Short lifetime + downward gravity for
          a quick arc; bright yellow→orange for hot metal feel. */}
      <VFXParticles
        name={BLACKSMITH_SPARK_NAME}
        autoStart={false}
        maxParticles={150}
        lifetime={[0.25, 0.55]}
        speed={[1.2, 2.8]}
        direction={[
          [-1, 1],
          [0.4, 1],
          [-1, 1],
        ]}
        gravity={[0, -3, 0]}
        size={[0.02, 0.05]}
        colorStart={['#ffffaa', '#fff080']}
        colorEnd={['#ff8020', '#a02000']}
        fadeOpacity={[1, 0]}
        fadeSize={[0.7, 0.3]}
        intensity={3}
        blending={Blending.ADDITIVE}
        lighting={Lighting.BASIC}
      />

      {/* Pollen — warm yellow, slow downward settle, outdoor logging-site. */}
      <VFXParticles
        name={AMBIENT_PARTICLE_NAMES.pollen}
        autoStart={false}
        maxParticles={600}
        lifetime={[10, 18]}
        speed={[0.05, 0.15]}
        direction={[
          [-0.5, 0.5],
          [-1, -0.3],
          [-0.5, 0.5],
        ]}
        gravity={[0, -0.05, 0]}
        size={[0.04, 0.1]}
        colorStart={['#ffe68c', '#ffd060']}
        colorEnd={['#c0a040', '#a08030']}
        fadeOpacity={[1, 1]}
        fadeSize={[0.5, 0.7]}
        intensity={1.5}
        blending={Blending.ADDITIVE}
        lighting={Lighting.BASIC}
      />
    </>
  );
}
