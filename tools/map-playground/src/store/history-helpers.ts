import type { PlacedProp, BgLayerConfig, VFXPlacement, LightingConfig, HistoryEntry, DioramaConfig } from './scene-types'

/** Capture a snapshot of all scene state needed for full undo/redo */
export function snapshot(state: {
  placedProps: PlacedProp[]
  bgLayers: BgLayerConfig[]
  vfxPlacements: VFXPlacement[]
  diorama: DioramaConfig | null
  lighting: LightingConfig
  biome: 'cave' | 'forest'
}): HistoryEntry {
  return {
    placedProps: structuredClone(state.placedProps),
    bgLayers: structuredClone(state.bgLayers),
    vfxPlacements: structuredClone(state.vfxPlacements),
    diorama: structuredClone(state.diorama),
    lighting: structuredClone(state.lighting),
    biome: state.biome,
  }
}

export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

/** Recursively merge patch into base — used for lighting updates */
export function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
  const result = { ...base } as Record<string, unknown>
  for (const key in patch) {
    const v = patch[key as keyof typeof patch]
    if (v !== undefined && v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result[key] = deepMerge((base as Record<string, unknown>)[key], v as DeepPartial<unknown>)
    } else if (v !== undefined) {
      result[key] = v
    }
  }
  return result as T
}

/** Push snapshot to history, capping at maxLen entries */
export function pushHistory(
  history: HistoryEntry[],
  snap: HistoryEntry,
  maxLen = 50,
): HistoryEntry[] {
  return [...history.slice(-maxLen + 1), snap]
}
