import type { VfxPreset, PresetCategory } from './preset-types'
import { linhSonPresets } from './linh-son-presets'
import { deQuocPresets } from './de-quoc-presets'
import { thienLuPresets } from './thien-lu-presets'
import { genericPresets } from './generic-presets'
import { meshlinePresets } from './meshline-presets'

export const allPresets: VfxPreset[] = [
  ...linhSonPresets,
  ...deQuocPresets,
  ...thienLuPresets,
  ...genericPresets,
  ...meshlinePresets,
]

export const presetById: Record<string, VfxPreset> = Object.fromEntries(
  allPresets.map(p => [p.id, p])
)

export const presetsByCategory: Record<PresetCategory, VfxPreset[]> = {
  'linh-son': linhSonPresets,
  'de-quoc': deQuocPresets,
  'thien-lu': thienLuPresets,
  'generic': genericPresets,
  'weapon-fx': meshlinePresets,
}

export const categoryOrder: PresetCategory[] = [
  'weapon-fx',
  'linh-son',
  'de-quoc',
  'thien-lu',
  'generic',
]

export type { PresetCategory }
