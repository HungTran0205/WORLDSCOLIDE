/**
 * Per-room atmosphere preset registry.
 *
 * Phase 04: stubs replaced with hand-tuned per-room configs. Each preset
 * declares the full effect stack (bloom, tilt-shift, DOF, color grade,
 * vignette, fog, god rays, particles, hemisphere fill). No implicit
 * baseline — every field explicit so the lerp always has both sides.
 *
 * Tuning workflow: see ./CLAUDE.md → "Per-room tuning".
 *
 * God rays carry sourceIds that map to registered light meshes (Phase 05).
 * Until the corresponding mesh registers via `registerGodRaysSource`, the
 * composer silently skips that effect — declaring it here is the cheap
 * forward-declaration so Phase 05 only wires the registration side.
 *
 * Color grade conventions:
 *   hue:        +warm shift, −cool shift (radians, small magnitudes)
 *   saturation: negative = Octopath signature muted look
 *   brightness: −dark room, +outdoor
 *   contrast:   +0.05–0.10 typical for "punch"
 */

import type { AtmospherePreset, RoomId } from './atmosphere-types';

/** Workshop forge offset relative to room center — DOF focus pulls here so
 *  the fire is sharp and everything else softens. Matches FORGE_OFFSET in
 *  facility-room.tsx (kept literal here to avoid scene→data import cycle). */
const WORKSHOP_DOF_OFFSET: [number, number, number] = [-0.5, 0.95, -2.45];

const GUILD_HALL: AtmospherePreset = {
  id: 'guild-hall',
  mood: 'warm wood hall, hearth-lit drum centerpiece',
  bloom: { threshold: 0.9, intensity: 0.3, radius: 0.3},
  tiltShift: { strength: 0.6, enabled: true },
  dof: { focalLength: 0.6, bokehScale: 2.5, targetOffset: [0, 0.5, 0], enabled: true },
  colorGrade: { hue: 0.04, saturation: -0.05, brightness: 0.02, contrast: -0.05},
  vignette: { offset: 0.5, darkness: 0.45 },
  noise: { opacity: 0.04 },
  fog: { color: '#14121e', near: 15, far: 55, enabled: true },
  godRays: { color: '#ffb070', exposure: 0.4, samples: 60, sourceId: 'guild-hall-drum', enabled: true },
  chromaticAberration: null,
  heatHaze: null,
  particles: 'dust',
  hemisphereLight: { skyColor: '#d8a060', groundColor: '#404a60', intensity: 0.4 },
};

/** Main-hall has no assets yet — minimal safe stub (Phase 04 non-goal). */
const MAIN_HALL: AtmospherePreset = {
  id: 'main-hall',
  mood: 'baseline stub — no assets yet',
  bloom: { threshold: 0.8, intensity: 1.0, radius: 0.7 },
  tiltShift: { strength: 0.2, enabled: true },
  dof: { focalLength: 0.5, bokehScale: 2.0, enabled: false },
  colorGrade: { hue: 0, saturation: 0, brightness: 0, contrast: 0 },
  vignette: { offset: 0.5, darkness: 0.4 },
  noise: { opacity: 0.04 },
  fog: { color: '#1a1410', near: 12, far: 38, enabled: false },
  godRays: null,
  chromaticAberration: null,
  heatHaze: null,
  particles: 'dust',
  hemisphereLight: null,
};

const TAVERN: AtmospherePreset = {
  id: 'tavern',
  mood: 'cozy warm, candlelit hearth',
  bloom: { threshold: 0.7, intensity: 1.4, radius: 0.8 },
  tiltShift: { strength: 0.4, enabled: true },
  dof: { focalLength: 0.5, bokehScale: 3.0, targetOffset: [0, 0.3, 0], enabled: true },
  colorGrade: { hue: 0.06, saturation: 0.05, brightness: 0.05, contrast: 0.05 },
  vignette: { offset: 0.5, darkness: 0.5 },
  noise: { opacity: 0.04 },
  fog: { color: '#28140a', near: 10, far: 30, enabled: true },
  godRays: { color: '#ffaa44', exposure: 0.4, samples: 60, sourceId: 'tavern-torch', enabled: true },
  chromaticAberration: null,
  heatHaze: null,
  particles: 'dust',
  hemisphereLight: { skyColor: '#d89060', groundColor: '#503020', intensity: 0.5 },
};

const TRAINING_YARD: AtmospherePreset = {
  id: 'training-yard',
  mood: 'gritty rust, sharp metallic edges',
  bloom: { threshold: 0.7, intensity: 1.4, radius: 0.7 },
  tiltShift: { strength: 0.2, enabled: true },
  dof: { focalLength: 0.5, bokehScale: 2.0, enabled: false },
  colorGrade: { hue: -0.02, saturation: -0.1, brightness: 0.02, contrast: 0},
  vignette: { offset: 0.5, darkness: 0.35 },
  noise: { opacity: 0.05 },
  fog: { color: '#c9ce99', near: 20, far: 50, enabled: true },
  godRays: { color: '#ff8a3a', exposure: 0.4, samples: 60, sourceId: 'training-yard-torch', enabled: true },
  chromaticAberration: null,
  heatHaze: null,
  particles: 'dust',
  hemisphereLight: { skyColor: '#b0805a', groundColor: '#302520', intensity: 0.3 },
};

const INFIRMARY: AtmospherePreset = {
  id: 'infirmary',
  mood: 'ether-lit sanctuary, warm gold crystal hush',
  // Lower threshold + bump intensity so the golden ether crystal blooms.
  bloom: { threshold: 0.65, intensity: 1.1, radius: 0.7 },
  tiltShift: { strength: 0.4, enabled: true },
  // Focus pulls up to the crystal core; pods + shelves soften.
  dof: { focalLength: 0.6, bokehScale: 2.5, targetOffset: [0, 0.9, 0], enabled: true },
  // Warm hue shift + slight contrast punch (was cool/desaturated clinical).
  colorGrade: { hue: 0.04, saturation: 0, brightness: 0.02, contrast: -0.04 },
  vignette: { offset: 0.5, darkness: 0.55 },
  noise: { opacity: 0.03 },
  // Warm dark haze so background fades through amber, not cold blue void.
  fog: { color: '#704108', near: 12, far: 38, enabled: true },
  godRays: { color: '#ffc864', exposure: 0.5, samples: 60, sourceId: 'infirmary-ether-crystal', enabled: true },
  chromaticAberration: null,
  heatHaze: null,
  particles: 'dust',
  hemisphereLight: { skyColor: '#e0b070', groundColor: '#403020', intensity: 0.4 },
};

const WORKSHOP: AtmospherePreset = {
  id: 'workshop',
  mood: 'hot forge, hammered iron, embers',
  // Bloom: bumped intensity + lowered threshold so forge fire + lanterns
  // punch through the dark room (Octopath signature).
  bloom: { threshold: 0.72, intensity: 0.9, radius: 0.9 },
  // Tilt-shift: 0.7 over-blurred the whole frame uniformly, killing the
  // miniature-diorama band. 0.5 is the HD-2D sweet spot.
  tiltShift: { strength: 0.5, enabled: true },
  // DOF: widen focus slightly so character + anvil stay sharp, foreground
  // crates + back scaffolding soften (true "lens" feel).
  dof: { focalLength: 0.4, bokehScale: 3.5, targetOffset: WORKSHOP_DOF_OFFSET, enabled: true },
  // ColorGrade: small saturation bump for HD-2D punch on warm forge.
  colorGrade: { hue: 0.03, saturation: 0.03, brightness: 0.03, contrast: 0.1 },
  // Vignette: deeper to pull eye toward forge/anvil center.
  vignette: { offset: 0.45, darkness: 0.55 },
  noise: { opacity: 0.05 },
  // Fog: extend far so background fades through warm haze instead of
  // snapping to pure black; warm-neutral tone reads as smoky furnace air.
  fog: { color: '#1a1208', near: 6, far: 30, enabled: true },
  godRays: { color: '#db7b4a', exposure: 1.0, samples: 60, sourceId: 'workshop-forge', enabled: true },
  // Subtle chromatic aberration — lens artifact, ≤ 0.001 keeps pixels crisp.
  chromaticAberration: { offset: [0.0008, 0.0008], enabled: true },
  // Heat haze — radial shimmer mask centered on the forge in screen UV.
  // Mask center/radius live in heat-haze-node.ts as constants; intensity
  // is the only per-preset knob. 0.0025 reads as believable heat without
  // looking like a screen wobble effect.
  heatHaze: { intensity: 0.001, enabled: true },
  particles: 'none',
  // Hemisphere fill bumped — foreground crates need a little warm bounce
  // to read as "in the room" rather than silhouetted.
  hemisphereLight: { skyColor: '#faf4f0', groundColor: '#704020', intensity: 0.45 },
};

const LOGGING_SITE: AtmospherePreset = {
  id: 'logging-site',
  mood: 'bright outdoor canopy, dappled sun',
  bloom: { threshold: 0.85, intensity: 1.0, radius: 0.7 },
  tiltShift: { strength: 0.6, enabled: true },
  dof: { focalLength: 0.9, bokehScale: 1.5, enabled: true },
  colorGrade: { hue: 0.02, saturation: 0.05, brightness: 0.1, contrast: 0 },
  vignette: { offset: 0.55, darkness: 0.3 },
  noise: { opacity: 0.03 },
  fog: { color: '#b4c896', near: 30, far: 80, enabled: true },
  godRays: { color: '#fff5cc', exposure: 0.7, samples: 60, sourceId: 'logging-site-sun', enabled: true },
  chromaticAberration: null,
  heatHaze: null,
  particles: 'none',
  hemisphereLight: { skyColor: '#b0d0ff', groundColor: '#608040', intensity: 0.7 },
};

const STONE_QUARRY: AtmospherePreset = {
  id: 'stone-quarry',
  mood: 'dim damp cave, single torch in gloom',
  bloom: { threshold: 0.8, intensity: 0.8, radius: 0.7 },
  tiltShift: { strength: 0.4, enabled: true },
  dof: { focalLength: 0.5, bokehScale: 3.0, enabled: true },
  colorGrade: { hue: 0.03, saturation: 0.03, brightness: 0.03, contrast: 0.1 },
  vignette: { offset: 0.5, darkness: 0.65 },
  noise: { opacity: 0.05 },
  fog: { color: '#0f0f14', near: 6, far: 40, enabled: true },
  godRays: { color: '#aaaacc', exposure: 0.4, samples: 60, sourceId: 'stone-quarry-torch', enabled: true },
  chromaticAberration: null,
  heatHaze: null,
  particles: 'none',
  hemisphereLight: null,
};

const ALCHEMY_LAB: AtmospherePreset = {
  id: 'alchemy-lab',
  mood: 'magical purple, bubbling cauldron glow',
  bloom: { threshold: 0.65, intensity: 1.6, radius: 0.8 },
  tiltShift: { strength: 0.6, enabled: true },
  dof: { focalLength: 0.4, bokehScale: 3.5, targetOffset: [0, 1.0, 0], enabled: true },
  colorGrade: { hue: -0.5, saturation: 0.02, brightness: 0.1, contrast: 0.1 },
  vignette: { offset: 0.5, darkness: 0.6 },
  noise: { opacity: 0.04 },
  fog: { color: '#140a1e', near: 10, far: 30, enabled: true },
  godRays: { color: '#d2a9f3', exposure: 0.7, samples: 60, sourceId: 'alchemy-lantern', enabled: true },
  chromaticAberration: null,
  heatHaze: null,
  particles: 'none',
  hemisphereLight: { skyColor: '#6080c0', groundColor: '#c08060', intensity: 0.4 },
};

/** Frozen registry — Record<RoomId, AtmospherePreset>. Object identity per
 *  preset is stable across calls so React memoization works. */
export const ATMOSPHERE_PRESETS: Record<RoomId, AtmospherePreset> = Object.freeze({
  'guild-hall': GUILD_HALL,
  'main-hall': MAIN_HALL,
  tavern: TAVERN,
  'training-yard': TRAINING_YARD,
  infirmary: INFIRMARY,
  workshop: WORKSHOP,
  'logging-site': LOGGING_SITE,
  'stone-quarry': STONE_QUARRY,
  'alchemy-lab': ALCHEMY_LAB,
});

export function getAtmospherePreset(id: RoomId): AtmospherePreset {
  return ATMOSPHERE_PRESETS[id];
}

/** Default room when no room is active (camera between rooms / panning). */
export const DEFAULT_ROOM_ID: RoomId = 'guild-hall';
