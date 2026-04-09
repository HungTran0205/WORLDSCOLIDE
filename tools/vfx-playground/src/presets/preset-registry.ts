import type { VfxPreset } from './preset-types'
import { linhSonPresets } from './linh-son-presets'
import { deQuocPresets } from './de-quoc-presets'
import { thienLuPresets } from './thien-lu-presets'
import { genericPresets } from './generic-presets'

export const allPresets: VfxPreset[] = [
  ...linhSonPresets,
  ...deQuocPresets,
  ...thienLuPresets,
  ...genericPresets,
]

export const presetById: Record<string, VfxPreset> = Object.fromEntries(
  allPresets.map(p => [p.id, p])
)

export type PresetCategory = VfxPreset['category']

export const presetsByCategory: Record<PresetCategory, VfxPreset[]> = {
  'linh-son': linhSonPresets,
  'de-quoc': deQuocPresets,
  'thien-lu': thienLuPresets,
  'generic': genericPresets,
}

export const categoryOrder: PresetCategory[] = ['linh-son', 'de-quoc', 'thien-lu', 'generic']
