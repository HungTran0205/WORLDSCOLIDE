/**
 * Production VFX persistent root — mirror of the playground's
 * <AllPresetParticles> stripped of designer override storage. Mounts every
 * particle preset once with `name={preset.id}` and `autoStart={false}` so
 * any consumer can call `useVFXEmitter(presetId).emit(pos, count, overrides)`
 * from anywhere in the React tree.
 *
 * Lifecycle: mount ONCE per Canvas, never unmount on combat open/close
 * (D10 — see plans/260503-1123-combat-panel-idle-redesign/phase-05). The
 * combat group's `<group visible>` wrapper hides the renderer but the
 * VFXParticles instances stay alive, avoiding the WebGPU buffer-disposal
 * regression that bit the legacy combat path.
 *
 * Meshline presets are NOT rendered here — they don't use VFXParticles /
 * compute. They're handled by future weapon-skill renderers (Phase 5+).
 */

import { useMemo } from 'react';
import { VFXParticles } from 'r3f-vfx';
import { allPresets } from './preset-registry';
import type { ParticlesPreset } from './preset-types';

export function AllPresetParticles() {
  const children = useMemo(
    () =>
      allPresets
        .filter((p): p is ParticlesPreset => p.kind !== 'meshline')
        .map((p) => (
          <VFXParticles key={p.id} name={p.id} autoStart={false} {...p.props} />
        )),
    [],
  );

  return <>{children}</>;
}
