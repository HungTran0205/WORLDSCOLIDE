/**
 * Combat-local atmosphere preset — drives the combat WebGPU post pass
 * (combat-webgpu-post.tsx → AtmosphericWebGPUPass).
 *
 * Combat is NOT a `RoomId`, so this preset deliberately lives OUTSIDE the room
 * registry (`ATMOSPHERE_PRESETS`). Adding a `'combat'` member to the `RoomId`
 * union would force a 10th `Record<RoomId>` entry plus handling in the
 * room-selector + lerp hooks — pure pollution for a non-room. The pass never
 * reads `id` (see `applyPreset` in atmospheric-webgpu-pass.tsx), so we borrow an
 * existing `RoomId` value purely to satisfy the type; its room semantics are
 * irrelevant here.
 *
 * HD-2D intent (Octopath): glue the realistic BG + pixel sprites + brick floor
 * into one cohesive image —
 *   - tiltShift: miniature-diorama focus band. REPLACES the WebGPU-dead DOF
 *     (combat-dof-post is WebGL-only). Sharp battlefield centre, soft edges.
 *   - colorGrade: slight desaturate + small contrast lift + faint cool hue to
 *     reconcile the warm BG photo vs. saturated brick vs. bright sprites.
 *   - bloom: mild — lifts VFX/highlights, not a glow bath.
 *   - vignette: pulls the eye to centre.
 *   - pixelation: forced OFF via the pass prop (granularity 1) — BG stays
 *     smooth so pixel sprites pop; avoids double-pixelating pixel-art sprites.
 *
 * Values are starting points; live-tune via the `Combat / Post` leva group,
 * then bake the final numbers back here.
 */

import type { AtmospherePreset } from '@/scene/atmospheric/atmosphere-types';

export const COMBAT_PRESET: AtmospherePreset = {
  // Borrowed RoomId — unused by the pass. Do NOT read this as "the combat scene
  // is the training yard"; it only exists to satisfy `AtmospherePreset['id']`.
  id: 'training-yard',
  mood: 'HD-2D combat — unified diorama band, cohesive palette',
  // Soft morning glow — low-ish threshold so the brighter morning BG haloes
  // gently without washing the pixel sprites.
  bloom: { threshold: 0.82, intensity: 0.45, radius: 0.5 },
  // Miniature-diorama focus band. This is the HD-2D depth cue on WebGPU since
  // DOF (combat-dof-post) only runs on WebGL.
  tiltShift: { strength: 0.45, enabled: true },
  // DOF is WebGL-only; disabled here so a future WebGL reuse of this preset
  // doesn't double up with tilt-shift.
  dof: { focalLength: 0.04, bokehScale: 3, enabled: false },
  // Morning-forest grade: LIFT brightness (the scene was reading too dark),
  // faint warm hue for sunrise, only a touch of desaturation so foliage greens
  // still read, light contrast. Tune under the live frame.
  colorGrade: { hue: 0.015, saturation: -0.02, brightness: 0.12, contrast: 0.04 },
  // Light in-scene vignette only — the panel CSS already draws a vignette
  // (combat-panel.css `__vignette`), so keep this low to avoid double-darkening
  // the morning sky at the top of the frame.
  vignette: { offset: 0.55, darkness: 0.18 },
  noise: { opacity: 0.03 },
  fog: { color: '#10131a', near: 12, far: 40, enabled: false },
  godRays: null,
  chromaticAberration: null,
  heatHaze: null,
  particles: 'none',
  hemisphereLight: null,
};
