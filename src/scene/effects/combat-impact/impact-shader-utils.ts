/**
 * Tiny shared helpers for the combat-impact TSL materials — color conversion
 * and the common additive/no-depth blend state. Extracted so the four material
 * factories don't each re-declare identical setup (DRY).
 */

import * as THREE from 'three';

/** Hex string → linear RGB Vector3 for a TSL color uniform. */
export function hexToVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

/** Structural shape every NodeMaterial satisfies — avoids importing three/webgpu here. */
interface ImpactBlendMaterial {
  transparent: boolean;
  depthWrite: boolean;
  depthTest: boolean;
  blending: THREE.Blending;
  side: THREE.Side;
}

/**
 * Shared blend state for impact billboards/beams: additive, transparent, no
 * depth write, and — crucially — depthTest OFF. Hit VFX spawn at the target's
 * own position, so the target's depth-writing sprite would otherwise occlude
 * this flat mesh; impacts must always read on top of sprites. DoubleSide so a
 * billboard reads from either camera side.
 */
export function configureImpactMaterial(material: ImpactBlendMaterial): void {
  material.transparent = true;
  material.depthWrite = false;
  material.depthTest = false;
  material.blending = THREE.AdditiveBlending;
  material.side = THREE.DoubleSide;
}
