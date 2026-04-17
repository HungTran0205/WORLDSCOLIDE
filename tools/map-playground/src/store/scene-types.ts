/** All TypeScript interfaces for the map-playground scene store. */

export interface PlacedProp {
  id: string
  /** e.g. '/arena/cave/3dprops/optimized/p_standing_torch.glb' */
  src: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  light?: { offsetY: number; color: string; intensity: number; distance: number }
}

export interface BgLayerConfig {
  id: string
  src: string
  /** Z depth behind arena (more negative = farther) */
  z: number
  /** Vertical offset */
  y: number
  scale: number
  opacity: number
}

export interface LightingConfig {
  ambient: { intensity: number; color: string }
  directional: { intensity: number; color: string; position: [number, number, number] }
  fogColor: string
  vignette: { strength: number }
}

export interface VFXPlacement {
  id: string
  effectId: string
  position: [number, number, number]
  scale: number
}

/** Asset selected in browser, awaiting click-to-place in viewport */
export type PendingAsset = { type: 'prop3D' | 'bg' | 'tile' | 'vfx'; src: string }

/** Snapshot of placeable scene objects for undo/redo history */
export interface HistoryEntry {
  placedProps: PlacedProp[]
  bgLayers: BgLayerConfig[]
  vfxPlacements: VFXPlacement[]
  diorama: DioramaConfig | null
  lighting: LightingConfig
  biome: 'cave' | 'forest'
}

export interface DioramaConfig {
  src: string
  scale: number
  y: number
}
