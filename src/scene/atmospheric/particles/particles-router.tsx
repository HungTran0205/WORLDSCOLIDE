/**
 * Public entry point for the ambient particles subsystem.
 *
 * The old per-room mount switch is gone — VFXParticles can't be remounted
 * safely under WebGPU (see `docs/vfx-particles-integration-guide.md`).
 * Instead, the four archetypes are mounted persistently by
 * `<AmbientVfxRoot />` at scene root, and `<AmbientEmitterDriver />` runs
 * a `useFrame` loop that emits into the active room's bounds.
 *
 * This file kept as a thin barrel re-export so consumers (world.tsx) can
 * import both pieces from one path.
 */

export { AmbientVfxRoot } from './ambient-vfx-root';
export { AmbientEmitterDriver } from './ambient-emitter-driver';
