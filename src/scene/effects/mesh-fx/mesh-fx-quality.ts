/**
 * mesh-fx-quality — single source of truth for skill-VFX quality degradation.
 *
 * Wraps the existing binary graphics-quality setting (there is no granular
 * VFX slider). On 'low' the orchestrator halves scatter-particle counts, skips
 * the weapon trail, drops the lance dissolve-noise, and skips the WebGPU
 * distortion pass — the sequence stays legible (lance + mesh rings + SFX).
 *
 * Used by non-React modules (the mesh-FX pool warm step). React components that
 * already subscribe to the store reuse `s.settings.graphicsQuality` directly so
 * they degrade reactively; both sources stay in lockstep because updateSettings
 * writes the store value and the localStorage key together.
 */

import { getStoredGraphicsQuality } from '@/game/state/guild-slice';

/** Current mesh-FX quality tier ('high' | 'low'), mirroring graphics-quality. */
export function getMeshFxQuality(): 'high' | 'low' {
  return getStoredGraphicsQuality();
}

/** True when degradation should apply (low tier). */
export function isLowMeshFxQuality(): boolean {
  return getMeshFxQuality() === 'low';
}
