/**
 * Shared types for the mesh-fx primitive library (thrust-lance / shockwave-ring /
 * slash-arc / impact-star). Every pooled preset exposes the same MeshFxHandle
 * so the pool manager and per-cast driver can operate without knowing the kind.
 */

import type * as THREE from 'three';

/** All primitive kinds the pool pre-warms.
 *  `cleave-arc` is a wide vertical-sweep variant of `slash-arc` (larger quad +
 *  axisAngle ≈ π/2) used by Cleave to read as a crescent across a cluster. */
export type MeshFxKind = 'thrust-lance' | 'shockwave-ring' | 'slash-arc' | 'impact-star' | 'cleave-arc';

/** Construction params shared by all preset factories. */
export interface MeshFxParams {
  /** Primary ink / edge color hex (e.g. '#a0d0ff'). */
  color: string;
  /** Additive glow core hex (e.g. '#ffffff'). */
  glowColor: string;
  /**
   * Optional axis angle in radians — used by directional effects (lance up-tilt,
   * arc sweep center). Defaults to 0.
   */
  axisAngle?: number;
}

/**
 * Per-instance handle for a mesh-fx material. Mirrors `ImpactMaterialHandle`
 * from the combat-impact family so it can slot into `useImpactLifecycle`
 * unchanged. Optional setColor / setScale allow pool resets without GPU alloc.
 */
export interface MeshFxHandle {
  material: THREE.Material;
  /** Advance animation — normalized progress 0 → 1. */
  setProgress: (t: number) => void;
  /** Recolor without rebuilding. Optional: not all presets support mid-cast recolor. */
  setColor?: (hex: string) => void;
  /** Uniform-scale multiplier (default 1). Optional. */
  setScale?: (s: number) => void;
  /** Free GPU resources — called by pool on dispose. */
  dispose: () => void;
}

/**
 * A pooled lease — what `pool.acquire(kind)` returns to the per-cast driver.
 * Adds position control and a release callback to the raw handle surface.
 */
export interface LeaseHandle {
  /** Drive the effect (0 → 1). */
  setProgress: (t: number) => void;
  /** Recolor the leased slot. */
  setColor: (hex: string) => void;
  /** Move the mesh slot in world space. */
  setPosition: (x: number, y: number, z: number) => void;
  /** Uniform-scale the mesh slot (default 1). Used for layered FX (e.g. a wider
   *  glow halo behind a core slash). Reset to 1 on acquire. */
  setScale: (s: number) => void;
  /** Return the slot to the pool and hide its mesh. */
  release: () => void;
}
