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
  /** 3D GLB props (replaces props[] for 3D biomes) */
  props3D?: Prop3D[];
}

const FOREST_CONFIG: BiomeConfig = {
  biome: 'forest',
  groundColor: '#3a5a2a',
  // groundTexture removed — replaced by diorama GLB
  bgLayers: [
    /* y values compensate for the 35° ortho camera at [0,7,10] */
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
    /* y values compensate for the 35° ortho camera at [0,7,10] */
    { src: '/arena/cave/bg/far.png',  z: -8,  y: -3,   scale: 1.2, opacity: 0.9 },
    { src: '/arena/cave/bg/mid.png',  z: -6,  y: -0.5, scale: 1.1, opacity: 0.85 },
    { src: '/arena/cave/bg/near.png', z: -3,  y: -1,   scale: 1.5, opacity: 0.65 },
  ],
  props: [],  // emptied — 3D props replace 2D sprites
  ambient: { intensity: 1.0, color: '#8080c0' },
  directional: { intensity: 0.5, color: '#a0a0ff', position: [0, 8, 4] },
  fogColor: '#0a0a14',
  diorama: '/arena/cave/3dtiles/optimized/groundcave.glb',
  dioramaScale: 12,
  props3D: [
    // Pillars (replacing pillar.png at edges)
    { src: '/arena/cave/3dprops/optimized/p_stonepilla.glb',           position: [-9, 0, -1], scale: 0.3 },
    { src: '/arena/cave/3dprops/optimized/p_stone_pillar_falling.glb', position: [9, 0, -1],  scale: 0.3 },
    // Crystal/ice pillars (replacing crystal-formation.png)
    { src: '/arena/cave/3dprops/optimized/p_ice_pillar.glb',          position: [-6, 0, -2.5], scale: 0.2 },
    { src: '/arena/cave/3dprops/optimized/p_ice_pillar.glb',          position: [6.5, 0, 2.5], scale: 0.15 },
    // Stalagmites (replacing stalagmite.png)
    { src: '/arena/cave/3dprops/optimized/p_vibrant_han.glb',         position: [-3, 0, 3],  scale: 0.15 },
    { src: '/arena/cave/3dprops/optimized/p_vibrant_han_2.glb',       position: [4, 0, -3],  scale: 0.12 },
    // Standing torches (replacing torch-wall.png)
    { src: '/arena/cave/3dprops/optimized/p_standing_torch.glb',      position: [-8, 0, -4], scale: 0.15 },
    { src: '/arena/cave/3dprops/optimized/p_standing_torch.glb',      position: [8, 0, -4],  scale: 0.15 },
    // Debris (replacing rock-pile, bone-pile)
    { src: '/arena/cave/3dprops/optimized/p_a_small_dis.glb',         position: [7.5, 0, 1.5], scale: 0.1 },
    { src: '/arena/cave/3dprops/optimized/p_simple_dark_metal.glb',   position: [-7, 0, 2],    scale: 0.1 },
    // Extra background prop
    { src: '/arena/cave/3dprops/optimized/p_Low_poly_of_tall_dar.glb', position: [0, 0, -4],   scale: 0.2 },
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
