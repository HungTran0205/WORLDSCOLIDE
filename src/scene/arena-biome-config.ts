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
}

const FOREST_CONFIG: BiomeConfig = {
  biome: 'forest',
  groundColor: '#3a5a2a',
  bgLayers: [
    { src: '/arena/forest/bg/far.png', z: -8, y: 3.5, scale: 1.8, opacity: 0.7 },
    { src: '/arena/forest/bg/mid.png', z: -6, y: 2.5, scale: 1.5, opacity: 0.9 },
    { src: '/arena/forest/bg/near.png', z: -4.5, y: 2, scale: 1.3, opacity: 0.4 },
  ],
  props: [
    /* left boundary tree */
    { src: '/arena/forest/props/tree-large.png', position: [-9, 1.5, -1], scale: 2.5 },
    /* right boundary tree */
    { src: '/arena/forest/props/tree-large.png', position: [9, 1.5, -1], scale: 2.5 },
    /* scattered ground props */
    { src: '/arena/forest/props/stump.png', position: [-7, 0.3, 1.5], scale: 0.8 },
    { src: '/arena/forest/props/bush.png', position: [7.5, 0.25, 2], scale: 0.7 },
    { src: '/arena/forest/props/rock.png', position: [-3, 0.2, 3], scale: 0.6 },
    { src: '/arena/forest/props/mushroom-glow.png', position: [5, 0.3, -2.5], scale: 0.6 },
    { src: '/arena/forest/props/fallen-log.png', position: [8, 0.2, -2], scale: 0.9 },
  ],
  ambient: { intensity: 0.5, color: '#c8e6c8' },
  directional: { intensity: 0.9, color: '#fff5e0', position: [-3, 10, 6] },
  fogColor: '#1a2e1a',
};

const CAVE_CONFIG: BiomeConfig = {
  biome: 'cave',
  groundColor: '#2a2a30',
  bgLayers: [
    { src: '/arena/cave/bg/far.png', z: -8, y: 3.5, scale: 1.8, opacity: 0.8 },
    { src: '/arena/cave/bg/mid.png', z: -6, y: 2.5, scale: 1.5, opacity: 0.9 },
    { src: '/arena/cave/bg/near.png', z: -4.5, y: 2.5, scale: 1.4, opacity: 0.35 },
  ],
  props: [
    /* left boundary pillar */
    { src: '/arena/cave/props/pillar.png', position: [-9, 1.5, -1], scale: 2.5 },
    /* right boundary pillar */
    { src: '/arena/cave/props/pillar.png', position: [9, 1.5, -1], scale: 2.5 },
    /* scattered cave props */
    { src: '/arena/cave/props/crystal-formation.png', position: [-6, 0.4, -2.5], scale: 0.8 },
    { src: '/arena/cave/props/crystal-formation.png', position: [6.5, 0.35, 2.5], scale: 0.7 },
    { src: '/arena/cave/props/stalagmite.png', position: [-3, 0.3, 3], scale: 0.7 },
    { src: '/arena/cave/props/stalagmite.png', position: [4, 0.3, -3], scale: 0.6 },
    { src: '/arena/cave/props/rock-pile.png', position: [7.5, 0.15, 1.5], scale: 0.6 },
    { src: '/arena/cave/props/bone-pile.png', position: [-7, 0.15, 2], scale: 0.6 },
    { src: '/arena/cave/props/torch-wall.png', position: [-8, 2.5, -4], scale: 0.8 },
    { src: '/arena/cave/props/torch-wall.png', position: [8, 2.5, -4], scale: 0.8 },
  ],
  ambient: { intensity: 0.3, color: '#8080c0' },
  directional: { intensity: 0.5, color: '#a0a0ff', position: [0, 8, 4] },
  fogColor: '#0a0a14',
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
