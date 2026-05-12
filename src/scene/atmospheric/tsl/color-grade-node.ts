/**
 * ColorGrade TSL node — Hue → Saturation → Brightness → Contrast pipeline.
 * Ported to match pmndrs `HueSaturationEffect` + `BrightnessContrastEffect`
 * so the WebGPU pass produces identical output to the WebGL stack.
 *
 * Order is deliberate (pmndrs effect-composer order):
 *   1. Hue rotation (matrix form via vec3 derived from the angle)
 *   2. Saturation (asymmetric scale: +sat boost differs from -sat clamp)
 *   3. Output clamped to min(color, 1.0)   ← pmndrs HueSat tail
 *   4. Brightness shift  +  Contrast scale around 0.5  ← pmndrs BC
 *
 * pmndrs HueSat GLSL (verbatim):
 *   color = vec3(dot(input, hue.xyz), dot(input, hue.zxy), dot(input, hue.yzx));
 *   avg = (color.r + color.g + color.b) / 3;
 *   diff = avg - color;
 *   if (sat > 0) color += diff * (1 - 1/(1.001 - sat));
 *   else         color += diff * -sat;
 *   output = min(color, 1.0);
 *
 * pmndrs BC GLSL (verbatim):
 *   color = input + (brightness - 0.5);
 *   if (contrast > 0) color /= (1 - contrast);
 *   else              color *= (1 + contrast);
 *   output = color + 0.5;
 *
 * Hue-vector derivation (from pmndrs JS-side setter):
 *   s = sin(hue), c = cos(hue), √3 ≈ 1.7320508
 *   hue.x = (2c + 1)/3
 *   hue.y = (-√3·s - c + 1)/3
 *   hue.z = ( √3·s - c + 1)/3
 */

import { vec3, vec4, dot, sin, cos, float, select, min as tslMin } from 'three/tsl';

/* eslint-disable @typescript-eslint/no-explicit-any */

const SQRT3 = 1.7320508075688772;

/** Hue rotation via pmndrs's vec3-derived matrix form. */
function applyHueRotation(rgb: any, hueU: any): any {
  const s = sin(hueU);
  const c = cos(hueU);
  const hueVec = vec3(
    c.mul(2).add(1).div(3),
    s.mul(-SQRT3).sub(c).add(1).div(3),
    s.mul(SQRT3).sub(c).add(1).div(3),
  );
  return vec3(
    dot(rgb, hueVec),                     // hue.xyz
    dot(rgb, vec3(hueVec.z, hueVec.x, hueVec.y)),
    dot(rgb, vec3(hueVec.y, hueVec.z, hueVec.x)),
  );
}

/** Saturation with pmndrs's asymmetric scale (positive boost vs negative clamp). */
function applySaturation(rgb: any, satU: any): any {
  const avg = rgb.x.add(rgb.y).add(rgb.z).div(3);
  const diff = avg.sub(rgb);
  const posScale = float(1).sub(float(1).div(float(1.001).sub(satU)));
  const scale = select(satU.greaterThan(0), posScale, satU.negate());
  return rgb.add(diff.mul(scale));
}

/** Brightness shift + contrast scale around 0.5 — pmndrs BrightnessContrast. */
function applyBrightnessContrast(rgb: any, brightU: any, contU: any): any {
  const shifted = rgb.add(brightU.sub(0.5));
  const posScale = float(1).div(float(1).sub(contU));
  const negScale = float(1).add(contU);
  const scale = select(contU.greaterThan(0), posScale, negScale);
  return shifted.mul(scale).add(0.5);
}

/**
 * @param input    Color node (chain output).
 * @param hueU     `uniform(float)` hue rotation in radians.
 * @param satU     `uniform(float)` saturation (-1..1, 0 = no change).
 * @param brightU  `uniform(float)` brightness offset (-1..1, 0 = no change).
 * @param contU    `uniform(float)` contrast scale (-1..1, 0 = no change).
 */
export function colorGradeNode(
  input: any,
  hueU: any,
  satU: any,
  brightU: any,
  contU: any,
): any {
  const hueRotated = applyHueRotation(input.rgb, hueU);
  const saturated = tslMin(applySaturation(hueRotated, satU), vec3(1));
  const graded = applyBrightnessContrast(saturated, brightU, contU);
  return vec4(graded, input.a);
}
