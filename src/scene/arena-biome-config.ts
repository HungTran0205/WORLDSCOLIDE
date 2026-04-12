/**
 * Arena biome configuration — maps mission zones to visual themes.
 * Each biome defines background layers, props, ground texture, and lighting.
 */
import { useGLTF } from '@react-three/drei';

export type ArenaBiome = 'forest' | 'cave';

/** Background layer with position offset and opacity */
export interface BgLayer {
  src: string;
  /** Z depth behind arena (more negative = farther) */
  z: number;
  /** Vertical offset */
  y: number;
  /** Scale multiplier */
  scale: number;
  opacity: number;
}

/** Prop placed in the arena scene */
export interface ArenaProp {
  src: string;
  position: [x: number, y: number, z: number];
  scale: number;
}

/** 3D GLB prop placed in arena — replaces ArenaProp for 3D biomes */
export interface Prop3D {
  src: string;
  position: [x: number, y: number, z: number];
  rotation?: [x: number, y: number, z: number];
  scale: number | [x: number, y: number, z: number];
  /** Optional point light attached to this prop — position is offset from prop origin */
  light?: { offsetY: number; color: string; intensity: number; distance: number; decay?: number };
  /** Optional billboard sprite overlay (fire flame, crystal glow) */
  sprite?: { src: string; offsetY: number; scale: number };
}

export interface BiomeConfig {
  biome: ArenaBiome;
  /** Ground color tint (meshStandardMaterial) */
  groundColor: string;
  /** Ground texture path (optional) */
  groundTexture?: string;
  /** Parallax background layers (far → near) */
  bgLayers: BgLayer[];
  /** Decorative props scattered in the arena */
  props: ArenaProp[];
  /** Decorative foreground props (high Z, close to camera — blurred by DoF) */
  foregroundProps?: ArenaProp[];
  /** Ambient light intensity + color */
  ambient: { intensity: number; color: string };
  /** Directional light */
  directional: { intensity: number; color: string; position: [number, number, number] };
  /** Fog color for depth fade */
  fogColor: string;
  /** GLB diorama ground model (replaces TexturedGround for 3D biomes) */
  diorama?: string;
  /** Uniform scale for diorama and all props3D — tune to match GLB export scale */
  dioramaScale?: number;
  /** Vertical offset for diorama ground model — negative = lower */
  dioramaY?: number;
  /** 3D GLB props (replaces props[] for 3D biomes) */
  props3D?: Prop3D[];
  /** GLB path for instanced primary tile (~80%) — replaces diorama when set */
  tilePrimary?: string;
  /** GLB path for instanced accent tile (~20%) */
  tileAccent?: string;
  /** World-space units per tile side (default 1) */
  tileSize?: number;
  /** Post-process vignette — darkness at corners */
  vignette?: { strength: number };
}

const FOREST_CONFIG: BiomeConfig = {
  biome: 'forest',
  groundColor: '#3a5a2a',
  bgLayers: [
    /* y adjusted for 35° ortho camera at [0,8.4,12] */
    { src: '/arena/forest/bg/far.png', z: -8.1, y: 6.5, scale: 2.45, opacity: 0.09 },
  ],
  props: [],  // emptied — 3D props replace 2D sprites
  ambient: { intensity: 0.5, color: '#c8e6c8' },
  directional: { intensity: 0.9, color: '#fff5e0', position: [-3, 10, 6] },
  fogColor: '#1a2e1a',
  // diorama replaced by tile grid
  tilePrimary: '/tiles/t_Green_Tile_of_Grass.glb',
  tileAccent: '/tiles/t_Cork_Tile.glb',
  tileSize: 1.75,
  dioramaScale: 12,
  dioramaY: 0,
  vignette: { strength: 0.99 },
  props3D: [
    // Top-edge pine treeline
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [ -2.8, -0.3, -5.5], rotation: [0, -0.5,  0], scale: 0.20 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [ -4.8, -0.2, -6.0], rotation: [0,  0.0,  0], scale: 0.15 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [  0.0, -0.7, -5.5], rotation: [0,  0.0,  0], scale: 0.18 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [  7.0, -0.3, -6.0], rotation: [0,  0.0,  0], scale: 0.22 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [ 10.3, -0.1, -5.5], rotation: [0, -0.8,  0], scale: 0.30 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [-11.2,  0.5, -5.8], rotation: [0,  0.15, 0], scale: 0.43 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [ 15.0,  0.5, -5.8], rotation: [0,  0.0,  0], scale: 0.17 },
    // Large feature trees
    { src: '/arena/forest/3dprops/optimized/p_tree_large.glb', position: [  2.5, 4.6, -5.2], rotation: [0,  0.75, 0], scale: 0.41 },
    { src: '/arena/forest/3dprops/optimized/p_tree_large.glb', position: [-15.0, 6.1,  1.0], rotation: [0, -1.9,  0], scale: 0.52 },
    // Midground pine flanks
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [ -7.5, 0.8, -3.0], rotation: [0,  0.0,  0], scale: 0.29 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb', position: [  5.0, 0.5, -3.0], rotation: [0, -1.0,  0], scale: 0.31 },
    // Ground details
    { src: '/arena/forest/3dprops/optimized/p_stump.glb',      position: [ 15.0, 0.5,  4.9], rotation: [0,  0.0,  0], scale: 0.10 },
    { src: '/arena/forest/3dprops/optimized/p_bush.glb',       position: [ 13.5, 0.5,  5.3], rotation: [0,  0.35, 0], scale: 0.33 },
    { src: '/arena/forest/3dprops/optimized/p_boulder.glb',    position: [ 10.4, 0.5,  6.4], rotation: [0,  0.0,  0], scale: 0.83 },
    { src: '/arena/forest/3dprops/optimized/p_mush_glow.glb',  position: [  9.0, 0.5, -4.7], rotation: [0,  0.0,  0], scale: 0.38 },
    { src: '/arena/forest/3dprops/optimized/p_log_fallen.glb', position: [ 15.0, 0.5, -2.0], rotation: [0, -0.5,  0], scale: 1.39 },
    { src: '/arena/forest/3dprops/optimized/p_rock_small.glb', position: [ 13.4, 0.5, -2.0], rotation: [0,  0.0,  0], scale: 0.78 },
  ],
};

const CAVE_CONFIG: BiomeConfig = {
  biome: 'cave',
  groundColor: '#2a2a30',
  bgLayers: [
    /* y adjusted for 35° ortho camera at [0,8.4,12] */
    { src: '/arena/cave/bg/far.png', z: -12.9, y: 7, scale: 1.2, opacity: 0.9 },
  ],
  props: [],
  ambient: { intensity: 3, color: '#8080c0' },
  directional: { intensity: 3, color: '#a0a0ff', position: [0, 8, 4] },
  fogColor: '#0a0a14',
  diorama: '/arena/cave/3dtiles/optimized/groundcave.glb',
  dioramaScale: 12,
  dioramaY: -1,
  props3D: [
    { src: '/arena/cave/3dprops/optimized/p_stonepilla.glb',           position: [-6.8, 2.9, -6.3], scale: 0.3 },
    { src: '/arena/cave/3dprops/optimized/p_stone_pillar_falling.glb', position: [-3.5, 1.1, -4.7], rotation: [0, -0.95, 0], scale: 0.07 },
    { src: '/arena/cave/3dprops/optimized/p_ice_pillar.glb',          position: [-8.7, 0.7, 2.8],  scale: 0.06 },
    { src: '/arena/cave/3dprops/optimized/p_ice_pillar.glb',          position: [-5.2, 1.2, 4.6],  rotation: [0, -0.75, 0], scale: 0.2 },
    { src: '/arena/cave/3dprops/optimized/p_vibrant_han.glb',         position: [3, 1.2, -3.9],    rotation: [0, -0.9, 0], scale: 0.09 },
    { src: '/arena/cave/3dprops/optimized/p_vibrant_han_2.glb',       position: [7.9, 1.3, 5.5],   scale: 0.12 },
    { src: '/arena/cave/3dprops/optimized/p_standing_torch.glb',      position: [-5, 1.3, -4.3],   rotation: [0, 0.55, 0], scale: 0.1, light: { offsetY: 1.5, color: '#ff8c3a', intensity: 50, distance: 12, decay: 2 }, sprite: { src: '/arena/cave/props/fire-flame.png', offsetY: 3.0, scale: 1.5 } },
    { src: '/arena/cave/3dprops/optimized/p_standing_torch.glb',      position: [1.7, 0.9, 4.7],   scale: 0.15, light: { offsetY: 1.5, color: '#ff8c3a', intensity: 50, distance: 12, decay: 2 }, sprite: { src: '/arena/cave/props/fire-flame.png', offsetY: 2.5, scale: 1.5 } },
    { src: '/arena/cave/3dprops/optimized/p_a_small_dis.glb',         position: [-7.5, 0.5, -3.6], scale: 0.07 },
    { src: '/arena/cave/3dprops/optimized/p_simple_dark_metal.glb',   position: [5, 4.2, 4.5],     rotation: [0, -1.35, 0], scale: 0.05 },
    { src: '/arena/cave/3dprops/optimized/p_Low_poly_of_tall_dar.glb', position: [5, 3.7, 0.8],    rotation: [0, -1.35, 0], scale: 0.37 },
  ],
};


/** Map mission zone string to arena biome — defaults to forest */
const ZONE_TO_BIOME: Record<string, ArenaBiome> = {
  'Outskirts Forest': 'forest',
  'Deep Forest': 'forest',
  'Highland Trails': 'forest',
  'Crystal Cave': 'cave',
  'Deep Caverns': 'cave',
  'Dusty Plains': 'forest',
  'Iron Pass': 'cave',
};

const BIOME_CONFIGS: Record<ArenaBiome, BiomeConfig> = {
  forest: FOREST_CONFIG,
  cave: CAVE_CONFIG,
};

/** Resolve biome config from a mission zone string */
export function getBiomeConfig(zone?: string): BiomeConfig {
  const biome = ZONE_TO_BIOME[zone ?? ''] ?? 'forest';
  return BIOME_CONFIGS[biome];
}

// Preload tile GLBs to avoid pop-in
useGLTF.preload('/tiles/t_Green_Tile_of_Grass.glb');
useGLTF.preload('/tiles/t_Cork_Tile.glb');
