/**
 * Arena biome configuration — maps mission zones to visual themes.
 * Each biome defines background layers, props, ground texture, and lighting.
 */

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
}

const FOREST_CONFIG: BiomeConfig = {
  biome: 'forest',
  groundColor: '#3a5a2a',
  // groundTexture removed — replaced by diorama GLB
  bgLayers: [
    /* y values compensate for the 20° ortho camera at [0,3.6,10] */
    { src: '/arena/forest/bg/far.png',  z: -6.9, y: 3.7,   scale: 1.10, opacity: 0.18 },
    /* mid & near have transparent centers — they frame the scene from edges */
    { src: '/arena/forest/bg/mid.png',  z: 5.6,  y: -6.0, scale: 1.25, opacity: 0.83 },
    { src: '/arena/forest/bg/near.png', z: 5.5,  y: 5.0,   scale: 1.50, opacity: 0.70 },
  ],
  props: [],  // emptied — 3D props replace 2D sprites
  ambient: { intensity: 0.5, color: '#c8e6c8' },
  directional: { intensity: 0.9, color: '#fff5e0', position: [-3, 10, 6] },
  fogColor: '#1a2e1a',
  diorama: '/arena/forest/3dtiles/optimized/forestground.glb',
  dioramaScale: 12,  // GLB exported at ~0.1x scale relative to arena units — tune if needed
  props3D: [
    // Trees (flanking edges)
    { src: '/arena/forest/3dprops/optimized/p_tree_large.glb', position: [-5, 2, -4], scale: 0.3 },
    { src: '/arena/forest/3dprops/optimized/p_tree_large.glb', position: [5, 4, 1],  scale: 0.6 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [-7.5, 0, -3], scale: 0.2 },
    { src: '/arena/forest/3dprops/optimized/p_tree_pine.glb',  position: [7.5, 0, -3],  scale: 0.1 },
    // Midground details
    { src: '/arena/forest/3dprops/optimized/p_stump.glb',      position: [-5, 0, 2], scale: 0.1 },
    { src: '/arena/forest/3dprops/optimized/p_bush.glb',       position: [7.5, 0, 2],  scale: 0.5 },
    { src: '/arena/forest/3dprops/optimized/p_boulder.glb',    position: [-3, 0, 3],   scale: 0.5 },
    { src: '/arena/forest/3dprops/optimized/p_mush_glow.glb',  position: [5, 0, -2.5], scale: 0.1 },
    { src: '/arena/forest/3dprops/optimized/p_log_fallen.glb', position: [8, 0, -2],   scale: 0.1 },
    { src: '/arena/forest/3dprops/optimized/p_rock_small.glb', position: [-5, 0, -2],  scale: 0.1 },
  ],
};

const CAVE_CONFIG: BiomeConfig = {
  biome: 'cave',
  groundColor: '#2a2a30',
  bgLayers: [
    { src: '/arena/cave/bg/far.png',  z: -12.9, y: 4,   scale: 1.2,  opacity: 0.9 },
    { src: '/arena/cave/bg/mid.png',  z: -6,    y: 5.2, scale: 1.4,  opacity: 0.3 },
    { src: '/arena/cave/bg/near.png', z: 0.6,   y: 6.2, scale: 1.85, opacity: 0   },
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
