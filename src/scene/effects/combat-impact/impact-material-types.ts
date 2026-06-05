/**
 * Shared types for the combat-impact VFX family (slash / sword-thrust /
 * axe-chop / beam). Every per-instance impact material exposes the same handle
 * so the lifecycle hook (use-impact-lifecycle) can drive any of them without
 * knowing which silhouette it is animating.
 */

import type * as THREE from 'three';

/** Common handle for every per-instance impact material. */
export interface ImpactMaterialHandle {
  material: THREE.Material;
  /** Advance the animation — call every frame with normalized progress 0→1. */
  setProgress: (t: number) => void;
  dispose: () => void;
}

/**
 * Params for the camera-facing planar silhouettes (slash / sword-thrust /
 * axe-chop). `angle` meaning is per-shader: crescent sweep orientation, thrust
 * up-tilt, or axe lateral offset.
 */
export interface PlanarImpactParams {
  /** Ink/edge color hex. */
  color: string;
  /** Additive glow-core color hex. */
  glowColor: string;
  /** Silhouette orientation in radians (per-shader meaning). */
  angle: number;
}

/** Params for the ranged beam material (a stretched cylinder, no silhouette angle). */
export interface BeamImpactParams {
  /** Beam color hex. */
  color: string;
}
