/**
 * Heat haze TSL node — animated UV distortion masked to a forge halo.
 *
 * Approach: sin-based shimmer instead of true noise (mx_noise_float / hash).
 * Tradeoff:
 *   - Sin: ~1-2 ALU per sample, predictable wavelength, banding artefacts
 *     hidden by intensity falloff + radial mask.
 *   - Noise: ~10 ALU + texture lookup, more organic but visually overkill
 *     for a localized halo covering ~15% of the frame.
 *
 * Mask: radial falloff centered on the forge in screen UV (constants
 * `MASK_CENTER_X/Y`, `MASK_RADIUS`). The earlier whole-bottom Y-band
 * version read as "screen wobble" instead of "heat above hot metal" —
 * radial keeps the effect anchored to the heat source. Ortho camera +
 * fixed workshop framing makes hardcoded screen-UV center safe; revisit
 * if camera composition changes.
 *
 * Disabled state: `intensityU.value = 0` → all displacement collapses to
 * vec2(0) → uv unchanged → scene sampled at original UV. No chain rebuild
 * on preset toggle.
 */

import { vec2, vec4, uv, sin, smoothstep, float, length, convertToTexture } from 'three/tsl';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Horizontal shimmer wavelength (higher = tighter waves). */
const SHIMMER_FREQ_X = 30;
/** Vertical shimmer wavelength. */
const SHIMMER_FREQ_Y = 22;
/** Time multiplier for X displacement (radians/sec equivalent). */
const TIME_SPEED_X = 3;
/** Time multiplier for Y displacement — slightly slower so the two axes
 *  desync into a wobble pattern rather than diagonal sweep. */
const TIME_SPEED_Y = 2.7;
/** Screen-UV center of the forge in workshop view. Tuned visually for the
 *  ortho camera framing — the forge sits left-of-center, lower-third.
 *  Sweep these if a future room asset moves the heat source. */
const MASK_CENTER_X = 0.6;
const MASK_CENTER_Y = 0.38;
/** Radius at which the mask falls to 0. Larger = wider haze halo. */
const MASK_RADIUS = 0.4;
/** Y displacement is half-strength so the haze doesn't jitter vertically
 *  as much as horizontally — matches real heat haze (horizontal scintillation
 *  dominates the perceptual signal). */
const Y_DISP_SCALE = 0.5;

/**
 * @param input       Color node (chain output upstream — typically post-bloom,
 *                    post-tilt-shift).
 * @param intensityU  `uniform(float)` — overall displacement strength.
 *                    Preset writes preset.heatHaze.intensity (or 0 when
 *                    disabled / null). Magnitude ~0.005 is a good starting
 *                    point; >0.01 starts looking like a fever dream.
 * @param timeU       `uniform(float)` — `clock.elapsedTime` updated per
 *                    frame. Drives the animation.
 */
export function heatHazeNode(input: any, intensityU: any, timeU: any): any {
  const tex = (convertToTexture as any)(input);
  const screenUv = uv();

  // sin-based displacement. Y phase uses uv.x so each row gets a different
  // wave offset → ripple feel; X phase uses uv.y so vertical motion varies
  // by horizontal position.
  const dispX = sin(screenUv.y.mul(SHIMMER_FREQ_X).add(timeU.mul(TIME_SPEED_X)));
  const dispY = sin(screenUv.x.mul(SHIMMER_FREQ_Y).add(timeU.mul(TIME_SPEED_Y)));

  // Radial mask centered on forge in screen UV. `length(uv - center)` gives
  // distance; `1 - smoothstep(0, radius, dist)` falls off smoothly to 0 at
  // the radius. Concentrates haze on the forge area instead of a full-width
  // band, which read as "screen wobble" rather than "heat above hot metal".
  const center = vec2(MASK_CENTER_X, MASK_CENTER_Y);
  const dist = length(screenUv.sub(center));
  const mask = float(1).sub(smoothstep(float(0), float(MASK_RADIUS), dist));

  const strength = intensityU.mul(mask);
  const offset = vec2(dispX.mul(strength), dispY.mul(strength).mul(Y_DISP_SCALE));

  return vec4(tex.sample(screenUv.add(offset)));
}
