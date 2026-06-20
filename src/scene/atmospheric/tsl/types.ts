/**
 * Shared types for the WebGPU TSL post-processing chain.
 *
 * Custom TSL nodes built in Phases 02–05 expose mutable uniform handles
 * (returned by `tsl.uniform(...)`) so the host React component can sync
 * preset values per render without rebuilding the pipeline.
 *
 * Phase 01 fills only `post` + `bloom`. Later phases extend `TslChainHolder`
 * with optional fields keyed by effect name; the host writes `.value` on each
 * handle inside a `useEffect`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Mutable uniform handle returned by `tsl.uniform(...)`. Writing `.value`
 *  syncs the GPU side on the next render. Generic over scalar/vector type. */
export interface TslUniformHandle<T> {
  value: T;
}

/** Bloom node uniforms (built-in `BloomNode`). */
export interface BloomUniforms {
  strength: TslUniformHandle<number>;
  radius: TslUniformHandle<number>;
  threshold: TslUniformHandle<number>;
}

/** Vignette node uniforms — populated in Phase 02. */
export interface VignetteUniforms {
  offset: TslUniformHandle<number>;
  darkness: TslUniformHandle<number>;
}

/** ColorGrade node uniforms — populated in Phase 02. */
export interface ColorGradeUniforms {
  hue: TslUniformHandle<number>;
  saturation: TslUniformHandle<number>;
  brightness: TslUniformHandle<number>;
  contrast: TslUniformHandle<number>;
}

/** Fog node uniforms — populated in Phase 03 (TSL fogNode, not scene.fog). */
export interface FogUniforms {
  /** Linear fog near plane. */
  near: TslUniformHandle<number>;
  /** Linear fog far plane. */
  far: TslUniformHandle<number>;
  /** Fog color as a vec3 ({x,y,z} = r,g,b in 0..1). */
  color: TslUniformHandle<{ x: number; y: number; z: number }>;
  /** Fog density / overall strength (0 = off, used to toggle without rebuild). */
  density: TslUniformHandle<number>;
}

/** Chromatic Aberration node uniforms — populated in Phase 04. */
export interface ChromaticAberrationUniforms {
  /** UV offset as vec2 ({x,y}). Keep magnitudes ≤ 0.001 for pixel-art crispness. */
  offset: TslUniformHandle<{ x: number; y: number }>;
}

/** Tilt-Shift node uniforms — populated in Phase 05.
 *  `enabled: false` writes `strength.value = 0` (mask collapses to all-sharp).
 *  Focus-band half-width is derived from strength on-GPU; no separate uniform. */
export interface TiltShiftUniforms {
  /** Overall blur strength (0..1). 0 = all sharp / disabled. */
  strength: TslUniformHandle<number>;
}

/** Heat-haze node uniforms — sin-based UV displacement in a Y-band.
 *  `intensity = 0` collapses displacement to vec2(0) → no-op. */
export interface HeatHazeUniforms {
  /** Displacement strength. ~0.005 baseline; preset writes 0 when disabled. */
  intensity: TslUniformHandle<number>;
  /** Animation phase — host updates per frame from `clock.elapsedTime`. */
  time: TslUniformHandle<number>;
}

/** Distortion ring node uniforms — radial screen-space UV warp for shockwave rings.
 *  Each ring slot is a vec4 [centerU, centerV, radius01, strength]; strength = 0
 *  collapses the slot to a no-op without chain rebuild (identity at zero). */
export interface DistortionRingsUniforms {
  /** 4 TSL vec4 uniform nodes; written each frame by sampleRings(). */
  rings: any[];
  /** Viewport aspect ratio uniform (width/height) — keeps rings circular. */
  aspect: TslUniformHandle<number>;
}

/**
 * Holder mutated by the WebGPU pass's async `useMemo`. The host stores it in
 * a ref so per-frame and per-preset effects can read uniform handles without
 * waiting for the dynamic-import promise to resolve in their own scopes.
 */
export interface TslChainHolder {
  /** `three/webgpu` PostProcessing instance — `.render()` each frame. */
  post: any;
  bloom: BloomUniforms;
  vignette: VignetteUniforms;
  colorGrade: ColorGradeUniforms;
  fog?: FogUniforms;
  chromaticAberration?: ChromaticAberrationUniforms;
  tiltShift?: TiltShiftUniforms;
  heatHaze?: HeatHazeUniforms;
  distortionRings?: DistortionRingsUniforms;
}
