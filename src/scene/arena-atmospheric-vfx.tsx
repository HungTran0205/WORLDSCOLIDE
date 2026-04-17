/**
 * Renders atmospheric particle VFX placements inside the combat arena.
 * Preset data is duplicated from tools/map-playground — YAGNI over a shared package.
 */
import { VFXParticles } from 'r3f-vfx';
import { EmitterShape, Blending } from 'r3f-vfx';
import type { AtmosphericVFXPlacement } from './arena-biome-config';

/** Minimal preset props needed to render each effectId */
const ATMOSPHERIC_PRESETS: Record<string, object> = {
  'cave-ember': {
    maxParticles: 200, size: [0.03, 0.08],
    colorStart: ['#ff6600', '#ff8c3a'], colorEnd: ['#ff000000'],
    fadeOpacity: [1, 0], lifetime: [1.5, 3.0], speed: [0.05, 0.15],
    gravity: [0, 0.3, 0], emitterShape: EmitterShape.SPHERE,
    emitterRadius: [0, 0.5], blending: Blending.ADDITIVE, intensity: 4,
  },
  'fog-mist': {
    maxParticles: 80, size: [1.5, 3.0],
    colorStart: ['#1a1a2e', '#0a0a14'], colorEnd: ['#1a1a2e00'],
    fadeOpacity: [0.4, 0], lifetime: [4.0, 8.0], speed: [0.02, 0.08],
    gravity: [0, 0, 0], emitterShape: EmitterShape.BOX,
    emitterRadius: [3, 0.1, 3], blending: Blending.NORMAL, intensity: 1,
  },
  'forest-spore': {
    maxParticles: 150, size: [0.02, 0.06],
    colorStart: ['#c8e6c8', '#90ee90'], colorEnd: ['#c8e6c800'],
    fadeOpacity: [1, 0], lifetime: [3.0, 6.0], speed: [0.01, 0.05],
    gravity: [0, 0.05, 0], emitterShape: EmitterShape.SPHERE,
    emitterRadius: [0, 2], blending: Blending.ADDITIVE, intensity: 2,
  },
  'dust-motes': {
    maxParticles: 300, size: [0.01, 0.03],
    colorStart: ['#d4c49a', '#c8b882'], colorEnd: ['#d4c49a00'],
    fadeOpacity: [1, 0], lifetime: [5.0, 10.0], speed: [0.005, 0.02],
    gravity: [0, 0.01, 0], emitterShape: EmitterShape.BOX,
    emitterRadius: [5, 2, 5], blending: Blending.ADDITIVE, intensity: 1.5,
  },
};

interface Props {
  placements: AtmosphericVFXPlacement[];
}

/** Drop into any R3F scene to render atmospheric particles from a BiomeConfig. */
export function ArenaAtmosphericVFX({ placements }: Props) {
  return (
    <>
      {placements.map((p, i) => {
        const presetProps = ATMOSPHERIC_PRESETS[p.effectId];
        if (!presetProps) return null;
        return (
          <group key={i} position={p.position} scale={p.scale}>
            <VFXParticles {...(presetProps as any)} />
          </group>
        );
      })}
    </>
  );
}
