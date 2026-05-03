/**
 * Frozen production registry — mirror of tools/vfx-playground/src/presets/preset-registry.ts
 * but stripped of designer override storage. Add new presets here when the
 * playground exports a new one (manual sync — keeps production runtime tiny).
 */

import type { VfxPreset, PresetCategory } from './preset-types';
import { linhSonPresets } from './presets/linh-son-presets';
import { deQuocPresets } from './presets/de-quoc-presets';
import { thienLuPresets } from './presets/thien-lu-presets';
import { genericPresets } from './presets/generic-presets';
import { meshlinePresets } from './presets/meshline-presets';

export const allPresets: VfxPreset[] = [
  ...linhSonPresets,
  ...deQuocPresets,
  ...thienLuPresets,
  ...genericPresets,
  ...meshlinePresets,
];

export const presetById: Record<string, VfxPreset> = Object.fromEntries(
  allPresets.map((p) => [p.id, p]),
);

export type { PresetCategory };
