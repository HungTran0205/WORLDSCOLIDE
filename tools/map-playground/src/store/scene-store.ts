import { create } from 'zustand'
import type {
  PlacedProp, BgLayerConfig, LightingConfig, VFXPlacement,
  PendingAsset, HistoryEntry, DioramaConfig,
} from './scene-types'
import { snapshot, pushHistory, deepMerge, type DeepPartial } from './history-helpers'
import type { SceneTemplate } from '../templates/biome-templates'

// Re-export types for existing consumers
export type { PlacedProp, BgLayerConfig, LightingConfig, VFXPlacement, PendingAsset, DioramaConfig }

const DEFAULT_LIGHTING: LightingConfig = {
  ambient: { intensity: 3, color: '#8080c0' },
  directional: { intensity: 3, color: '#a0a0ff', position: [0, 8, 4] },
  fogColor: '#0a0a14',
  vignette: { strength: 0.99 },
}

interface SceneState {
  placedProps: PlacedProp[]
  bgLayers: BgLayerConfig[]
  lighting: LightingConfig
  vfxPlacements: VFXPlacement[]
  // selection
  selectedId: string | null
  selectedBgId: string | null
  selectedVFXId: string | null
  // placement mode
  pendingAsset: PendingAsset | null
  ghostPosition: [number, number, number] | null
  // codegen
  biome: 'cave' | 'forest'
  diorama: DioramaConfig | null
  // undo/redo
  history: HistoryEntry[]
  future: HistoryEntry[]
}

interface SceneActions {
  // placement
  setPendingAsset: (asset: PendingAsset | null) => void
  setGhostPosition: (pos: [number, number, number] | null) => void
  placeProp: (position: [number, number, number]) => void
  // selection
  selectProp: (id: string | null) => void
  selectBgLayer: (id: string | null) => void
  selectVFX: (id: string | null) => void
  // prop edits
  updatePropLive: (id: string, patch: Partial<Omit<PlacedProp, 'id' | 'src'>>) => void
  commitPropUpdate: (id: string, patch: Partial<Omit<PlacedProp, 'id' | 'src'>>) => void
  // bg layers
  addBgLayer: (src: string) => void
  updateBgLayer: (id: string, patch: Partial<Omit<BgLayerConfig, 'id' | 'src'>>) => void
  removeBgLayer: (id: string) => void
  // lighting
  updateLighting: (patch: DeepPartial<LightingConfig>) => void
  // vfx
  placeVFX: (effectId: string, position: [number, number, number]) => void
  updateVFX: (id: string, patch: Partial<Omit<VFXPlacement, 'id' | 'effectId'>>) => void
  removeVFX: (id: string) => void
  // paint mode (drag-to-place tiles, no history per move)
  paintProp: (position: [number, number, number]) => void
  startPaintSession: () => void
  // load template
  loadScene: (template: SceneTemplate) => void
  // codegen
  setBiome: (b: 'cave' | 'forest') => void
  setDiorama: (d: DioramaConfig | null) => void
  // undo/redo
  undo: () => void
  redo: () => void
  // delete/duplicate
  deleteSelected: () => void
  duplicateSelected: () => void
}

export const useSceneStore = create<SceneState & SceneActions>((set) => ({
  placedProps: [], bgLayers: [], vfxPlacements: [],
  lighting: DEFAULT_LIGHTING,
  selectedId: null, selectedBgId: null, selectedVFXId: null,
  pendingAsset: null, ghostPosition: null,
  biome: 'cave', diorama: null,
  history: [], future: [],

  setPendingAsset: (asset) => set({ pendingAsset: asset, ghostPosition: null }),
  setGhostPosition: (pos) => set({ ghostPosition: pos }),
  selectProp: (id) => set({ selectedId: id, selectedBgId: null, selectedVFXId: null }),
  selectBgLayer: (id) => set({ selectedBgId: id, selectedId: null, selectedVFXId: null }),
  selectVFX: (id) => set({ selectedVFXId: id, selectedId: null, selectedBgId: null }),

  placeProp: (position) => set((state) => {
    if (!state.pendingAsset || state.pendingAsset.type === 'bg') return {}
    const snap = snapshot(state)
    const isTile = state.pendingAsset.type === 'tile'
    const newProp: PlacedProp = {
      id: crypto.randomUUID(),
      src: state.pendingAsset.src,
      position,
      rotation: [0, 0, 0],
      scale: isTile ? 1.0 : 0.1,  // tiles render at full size by default
    }
    return {
      history: pushHistory(state.history, snap),
      future: [],
      placedProps: [...state.placedProps, newProp],
      // Tiles stay in placing mode for rapid repeated placement; props clear after one place
      ...(isTile ? {} : { pendingAsset: null, ghostPosition: null }),
    }
  }),

  // Paint a tile without pushing to history — used during drag, history captured at drag start
  paintProp: (position) => set((state) => {
    if (!state.pendingAsset || state.pendingAsset.type !== 'tile') return {}
    const newProp: PlacedProp = {
      id: crypto.randomUUID(),
      src: state.pendingAsset.src,
      position,
      rotation: [0, 0, 0],
      scale: 1.0,
    }
    return { placedProps: [...state.placedProps, newProp] }
  }),

  // Snapshot current state before a drag-paint session starts
  startPaintSession: () => set((state) => ({
    history: pushHistory(state.history, snapshot(state)),
    future: [],
  })),

  loadScene: (template) => set((state) => {
    const snap = snapshot(state)
    return {
      history: pushHistory(state.history, snap),
      future: [],
      biome: template.biome,
      diorama: template.diorama,
      bgLayers: template.bgLayers.map((l) => ({ ...l, id: crypto.randomUUID() })),
      lighting: template.lighting,
      placedProps: template.placedProps.map((p) => ({ ...p, id: crypto.randomUUID() })),
      vfxPlacements: [],
      selectedId: null,
      selectedBgId: null,
      selectedVFXId: null,
    }
  }),

  updatePropLive: (id, patch) => set((state) => ({
    placedProps: state.placedProps.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  })),

  commitPropUpdate: (id, patch) => set((state) => {
    const snap = snapshot(state)
    return {
      history: pushHistory(state.history, snap),
      future: [],
      placedProps: state.placedProps.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }
  }),

  addBgLayer: (src) => set((state) => {
    const snap = snapshot(state)
    return {
      history: pushHistory(state.history, snap),
      future: [],
      bgLayers: [...state.bgLayers, {
        id: crypto.randomUUID(), src, z: -12, y: 7, scale: 1.2, opacity: 0.9,
      }],
    }
  }),

  updateBgLayer: (id, patch) => set((state) => ({
    bgLayers: state.bgLayers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
  })),

  removeBgLayer: (id) => set((state) => {
    const snap = snapshot(state)
    return {
      history: pushHistory(state.history, snap),
      future: [],
      bgLayers: state.bgLayers.filter((l) => l.id !== id),
      selectedBgId: state.selectedBgId === id ? null : state.selectedBgId,
    }
  }),

  updateLighting: (patch) => set((state) => ({
    lighting: deepMerge(state.lighting, patch),
  })),

  placeVFX: (effectId, position) => set((state) => {
    const snap = snapshot(state)
    return {
      history: pushHistory(state.history, snap),
      future: [],
      vfxPlacements: [...state.vfxPlacements, {
        id: crypto.randomUUID(), effectId, position, scale: 1.0,
      }],
      pendingAsset: null,
    }
  }),

  updateVFX: (id, patch) => set((state) => ({
    vfxPlacements: state.vfxPlacements.map((v) => (v.id === id ? { ...v, ...patch } : v)),
  })),

  removeVFX: (id) => set((state) => {
    const snap = snapshot(state)
    return {
      history: pushHistory(state.history, snap),
      future: [],
      vfxPlacements: state.vfxPlacements.filter((v) => v.id !== id),
      selectedVFXId: state.selectedVFXId === id ? null : state.selectedVFXId,
    }
  }),

  setBiome: (b) => set({ biome: b }),
  setDiorama: (d) => set((state) => {
    const snap = snapshot(state)
    return { history: pushHistory(state.history, snap), future: [], diorama: d }
  }),

  undo: () => set((state) => {
    if (state.history.length === 0) return {}
    const prev = state.history[state.history.length - 1]
    const curr = snapshot(state)
    return {
      history: state.history.slice(0, -1),
      future: [curr, ...state.future.slice(0, 49)],
      placedProps: prev.placedProps,
      bgLayers: prev.bgLayers,
      vfxPlacements: prev.vfxPlacements,
      diorama: prev.diorama,
      lighting: prev.lighting,
      biome: prev.biome,
    }
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return {}
    const next = state.future[0]
    const curr = snapshot(state)
    return {
      history: pushHistory(state.history, curr),
      future: state.future.slice(1),
      placedProps: next.placedProps,
      bgLayers: next.bgLayers,
      vfxPlacements: next.vfxPlacements,
      diorama: next.diorama,
      lighting: next.lighting,
      biome: next.biome,
    }
  }),

  deleteSelected: () => set((state) => {
    const snap = snapshot(state)
    if (state.selectedId) {
      return {
        history: pushHistory(state.history, snap), future: [],
        placedProps: state.placedProps.filter((p) => p.id !== state.selectedId),
        selectedId: null,
      }
    }
    if (state.selectedBgId) {
      return {
        history: pushHistory(state.history, snap), future: [],
        bgLayers: state.bgLayers.filter((l) => l.id !== state.selectedBgId),
        selectedBgId: null,
      }
    }
    if (state.selectedVFXId) {
      return {
        history: pushHistory(state.history, snap), future: [],
        vfxPlacements: state.vfxPlacements.filter((v) => v.id !== state.selectedVFXId),
        selectedVFXId: null,
      }
    }
    return {}
  }),

  duplicateSelected: () => set((state) => {
    if (!state.selectedId) return {}
    const prop = state.placedProps.find((p) => p.id === state.selectedId)
    if (!prop) return {}
    const snap = snapshot(state)
    const newProp: PlacedProp = {
      ...structuredClone(prop),
      id: crypto.randomUUID(),
      position: [prop.position[0] + 1, prop.position[1], prop.position[2] + 1],
    }
    return {
      history: pushHistory(state.history, snap), future: [],
      placedProps: [...state.placedProps, newProp],
      selectedId: newProp.id,
    }
  }),
}))
