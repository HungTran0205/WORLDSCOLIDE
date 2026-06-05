/**
 * Public surface of the combat-impact VFX family. The dispatch layer
 * (combat-impact-layer) imports everything it needs from here.
 */

export { ImpactBillboardVfx } from './impact-billboard-vfx';
export type { ImpactBillboardVfxProps } from './impact-billboard-vfx';
export { BeamFlashVfx } from './beam-flash-vfx';
export type { BeamFlashVfxProps } from './beam-flash-vfx';
export { IMPACT_REGISTRY, resolveImpactKind } from './impact-registry';
export type { ImpactKind, ImpactDef } from './impact-registry';
