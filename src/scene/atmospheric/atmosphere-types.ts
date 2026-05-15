/**
 * HD-2D atmospheric preset types — drives per-room post-FX, particles, lights, fog.
 *
 * Phase 01 (foundation) defines shape only. Phase 02 (post-stack) consumes
 * post-FX fields; Phase 03 (particles) reads `particles`; Phase 05 (god rays
 * + hemisphere lights) reads `godRays` + `hemisphereLight`. Phase 04 fills in
 * per-room tuned values.
 */

export type RoomId =
  | 'guild-hall'
  | 'main-hall'
  | 'tavern'
  | 'training-yard'
  | 'infirmary'
  | 'workshop'
  | 'logging-site'
  | 'stone-quarry'
  | 'alchemy-lab';

export interface BloomConfig {
  /** Luminance threshold above which pixels bloom. Lower = more pixels bloom. */
  threshold: number;
  /** Bloom strength multiplier. */
  intensity: number;
  /** Bloom kernel radius. */
  radius: number;
}

export interface TiltShiftConfig {
  /** Strength of vertical blur band (0–1). */
  strength: number;
  enabled: boolean;
}

/**
 * DOF uses a dynamic Vector3 target (= cameraTarget) — see Phase 02. Per-room
 * only tunes focus zone width + blur intensity + on/off. `targetOffset` lets a
 * room nudge the focus point off the camera target (e.g. focus deeper into
 * the room rather than at the camera pivot).
 */
export interface DofConfig {
  /** Aperture / focus zone width. Smaller = narrower in-focus band. */
  focalLength: number;
  /** Blur intensity multiplier. */
  bokehScale: number;
  /** Optional XYZ offset added to dynamic camera target before focusing. */
  targetOffset?: [number, number, number];
  enabled: boolean;
}

export interface ColorGradeConfig {
  /** Hue rotation in radians (-π..π). */
  hue: number;
  /** Saturation multiplier (-1..1). */
  saturation: number;
  /** Brightness adjust (-1..1). */
  brightness: number;
  /** Contrast adjust (-1..1). */
  contrast: number;
}

export interface VignetteConfig {
  /** Distance from screen edge where darkening begins (0–1). */
  offset: number;
  /** Maximum darkness at the screen corners (0–1). */
  darkness: number;
}

export interface NoiseConfig {
  /** Film-grain opacity (0–1). */
  opacity: number;
}

export interface FogConfig {
  /** CSS hex color for fog. */
  color: string;
  /** Near plane (start) of linear fog. */
  near: number;
  /** Far plane (full fog) of linear fog. */
  far: number;
  enabled: boolean;
}

export interface GodRaysConfig {
  /** Color tint of light shafts. */
  color: string;
  /** Exposure multiplier — brightness of rays. */
  exposure: number;
  /** Sampling count along each ray (perf vs. quality). */
  samples: number;
  /** Registry id of the light source mesh that rays radiate from (e.g.
   *  'workshop-forge'). Resolved at composer mount via the god-rays source
   *  registry; if not registered, GodRays is skipped silently. */
  sourceId: string;
  enabled: boolean;
}

export interface ChromaticAberrationConfig {
  /** Offset in screen-UV (X, Y). Keep ≤ 0.001 to avoid breaking pixel-art crispness. */
  offset: [number, number];
  enabled: boolean;
}

export interface HeatHazeConfig {
  /** Displacement strength in screen-UV. ~0.005 baseline; >0.01 looks like
   *  a fever dream. Multiplied by a Y-band mask in the shader so the effect
   *  concentrates near the bottom of the frame (forge area). */
  intensity: number;
  enabled: boolean;
}

export interface HemisphereLightConfig {
  /** Sky-direction color (upper hemisphere). */
  skyColor: string;
  /** Ground-direction color (lower hemisphere). */
  groundColor: string;
  /** Light intensity. */
  intensity: number;
}

/** Allowed ambient particle archetype for a room. `'none'` mounts nothing. */
export type ParticleKind = 'dust' | 'embers' | 'magic-motes' | 'pollen' | 'none';

export interface AtmospherePreset {
  id: RoomId;
  /** One-line designer note describing intended feel (e.g. "warm wood hall").
   *  Documentation only — never read at runtime. Optional so the baseline
   *  stub doesn't need to invent one. */
  mood?: string;
  bloom: BloomConfig;
  tiltShift: TiltShiftConfig;
  dof: DofConfig;
  colorGrade: ColorGradeConfig;
  vignette: VignetteConfig;
  noise: NoiseConfig;
  fog: FogConfig;
  /** `null` = no god rays for this room. */
  godRays: GodRaysConfig | null;
  /** `null` = no chromatic aberration. Off by default — pixel-art-unfriendly. */
  chromaticAberration: ChromaticAberrationConfig | null;
  /** `null` = no heat haze. Workshop is the canonical opt-in. */
  heatHaze: HeatHazeConfig | null;
  particles: ParticleKind;
  /** `null` = no hemisphere fill light for this room. */
  hemisphereLight: HemisphereLightConfig | null;
}

/**
 * Neutral Octopath baseline — used as the starting clone for every room until
 * Phase 04 tunes per-room values. Picks safe-but-cinematic defaults (warm
 * bloom, ACES-like contrast, soft vignette, dust motes).
 */
export const BASELINE_PRESET: Omit<AtmospherePreset, 'id'> = {
  bloom: { threshold: 0.9, intensity: 0.5, radius: 0.5 },
  tiltShift: { strength: 0.35, enabled: true },
  dof: { focalLength: 0.04, bokehScale: 3, enabled: true },
  colorGrade: { hue: 0, saturation: 0.02, brightness: 0, contrast: 0.05 },
  vignette: { offset: 0.5, darkness: 0.35 },
  noise: { opacity: 0.04 },
  fog: { color: '#1a1410', near: 12, far: 38, enabled: false },
  godRays: null,
  chromaticAberration: null,
  heatHaze: null,
  particles: 'dust',
  hemisphereLight: null,
};

export function makeBaselinePreset(id: RoomId): AtmospherePreset {
  return { id, ...BASELINE_PRESET };
}
