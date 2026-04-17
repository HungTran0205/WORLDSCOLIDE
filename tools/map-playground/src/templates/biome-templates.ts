/**
 * Static copies of CAVE_CONFIG and FOREST_CONFIG converted to map-playground store format.
 * Paths use bare form (no /game-assets prefix) — components add the prefix when loading.
 */
import type { BgLayerConfig, LightingConfig, PlacedProp, DioramaConfig } from '../store/scene-types'

export interface SceneTemplate {
  biome: 'cave' | 'forest'
  label: string
  diorama: DioramaConfig | null
  bgLayers: Omit<BgLayerConfig, 'id'>[]
  lighting: LightingConfig
  placedProps: Omit<PlacedProp, 'id'>[]
}

export const CAVE_TEMPLATE: SceneTemplate = {
  biome: 'cave',
  label: '⛏️ Cave (current)',
  diorama: { src: '/arena/cave/3dtiles/optimized/groundcave.glb', scale: 12, y: -1 },
  bgLayers: [
    { src: '/arena/cave/bg/far.png', z: -12.9, y: 7, scale: 1.2, opacity: 0.9 },
  ],
  lighting: {
    ambient: { intensity: 3, color: '#8080c0' },
    directional: { intensity: 3, color: '#a0a0ff', position: [0, 8, 4] },
    fogColor: '#0a0a14',
    vignette: { strength: 0.99 },
  },
  placedProps: [
    { src: '/arena/cave/3dprops/optimized/p_stonepilla.glb',           position: [-6.8, 2.9, -6.3], rotation: [0, 0, 0], scale: 0.3 },
    { src: '/arena/cave/3dprops/optimized/p_stone_pillar_falling.glb', position: [-3.5, 1.1, -4.7], rotation: [0, -0.95, 0], scale: 0.07 },
    { src: '/arena/cave/3dprops/optimized/p_ice_pillar.glb',           position: [-8.7, 0.7, 2.8],  rotation: [0, 0, 0], scale: 0.06 },
    { src: '/arena/cave/3dprops/optimized/p_ice_pillar.glb',           position: [-5.2, 1.2, 4.6],  rotation: [0, -0.75, 0], scale: 0.2 },
    { src: '/arena/cave/3dprops/optimized/p_vibrant_han.glb',          position: [3, 1.2, -3.9],    rotation: [0, -0.9, 0], scale: 0.09 },
    { src: '/arena/cave/3dprops/optimized/p_vibrant_han_2.glb',        position: [7.9, 1.3, 5.5],   rotation: [0, 0, 0], scale: 0.12 },
    { src: '/arena/cave/3dprops/optimized/p_standing_torch.glb',       position: [-5, 1.3, -4.3],   rotation: [0, 0.55, 0], scale: 0.1, light: { offsetY: 1.5, color: '#ff8c3a', intensity: 50, distance: 12 } },
    { src: '/arena/cave/3dprops/optimized/p_standing_torch.glb',       position: [1.7, 0.9, 4.7],   rotation: [0, 0, 0], scale: 0.15, light: { offsetY: 1.5, color: '#ff8c3a', intensity: 50, distance: 12 } },
    { src: '/arena/cave/3dprops/optimized/p_a_small_dis.glb',          position: [-7.5, 0.5, -3.6], rotation: [0, 0, 0], scale: 0.07 },
    { src: '/arena/cave/3dprops/optimized/p_simple_dark_metal.glb',    position: [5, 4.2, 4.5],     rotation: [0, -1.35, 0], scale: 0.05 },
    { src: '/arena/cave/3dprops/optimized/p_Low_poly_of_tall_dar.glb', position: [5, 3.7, 0.8],     rotation: [0, -1.35, 0], scale: 0.37 },
  ],
}

export const FOREST_TEMPLATE: SceneTemplate = {
  biome: 'forest',
  label: '🌲 Forest (current)',
  diorama: null,  // Forest uses tile grid, not a diorama GLB
  bgLayers: [
    { src: '/arena/forest/bg/far.png', z: -8.1, y: 6.5, scale: 2.45, opacity: 0.09 },
  ],
  lighting: {
    ambient: { intensity: 0.5, color: '#c8e6c8' },
    directional: { intensity: 0.9, color: '#fff5e0', position: [-3, 10, 6] },
    fogColor: '#1a2e1a',
    vignette: { strength: 0.99 },
  },
  placedProps: [
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [-2.8, -0.3, -5.5], rotation: [0, -0.5, 0],  scale: 0.20 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [-4.8, -0.2, -6.0], rotation: [0, 0, 0],     scale: 0.15 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [0.0, -0.7, -5.5],  rotation: [0, 0, 0],     scale: 0.18 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [7.0, -0.3, -6.0],  rotation: [0, 0, 0],     scale: 0.22 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [10.3, -0.1, -5.5], rotation: [0, -0.8, 0],  scale: 0.30 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [-11.2, 0.5, -5.8], rotation: [0, 0.15, 0],  scale: 0.43 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [15.0, 0.5, -5.8],  rotation: [0, 0, 0],     scale: 0.17 },
    { src: '/arena/forest/3dprops/optimized/p_tree_large.glb', position: [2.5, 4.6, -5.2],   rotation: [0, 0.75, 0],  scale: 0.41 },
    { src: '/arena/forest/3dprops/optimized/p_tree_large.glb', position: [-15.0, 6.1, 1.0],  rotation: [0, -1.9, 0],  scale: 0.52 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [-7.5, 0.8, -3.0],  rotation: [0, 0, 0],     scale: 0.29 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [5.0, 0.5, -3.0],   rotation: [0, -1.0, 0],  scale: 0.31 },
    { src: '/arena/forest/3dprops/optimized/p_stump.glb',      position: [15.0, 0.5, 4.9],   rotation: [0, 0, 0],     scale: 0.10 },
    { src: '/arena/forest/3dprops/optimized/p_boulder.glb',    position: [10.4, 0.5, 6.4],   rotation: [0, 0, 0],     scale: 0.83 },
    { src: '/arena/forest/3dprops/optimized/p_mush_glow.glb',  position: [9.0, 0.5, -4.7],   rotation: [0, 0, 0],     scale: 0.38 },
  ],
}

export const BIOME_TEMPLATES: SceneTemplate[] = [CAVE_TEMPLATE, FOREST_TEMPLATE]
