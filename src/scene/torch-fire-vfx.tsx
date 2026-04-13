/**
 * Torch fire VFX using r3f-vfx (TSL-based particle system).
 *
 * Runs on both WebGPU (native TSL compute) and WebGL (CPU-sorted fallback)
 * via r3f-vfx's internal renderer branching — no app-level wrapper needed.
 *
 * Backward compat: same signature as legacy `TorchFireEffect` in
 * `torch-fire-particles.tsx` (offsetY/scale/debugLabel). Guild hall uses this
 * version via alias import; combat arena still imports the sprite-pool legacy.
 */

import { useMemo } from 'react';
import { useTexture, Billboard } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';
import { VFXParticles, EmitterShape, Blending } from 'r3f-vfx';

export interface TorchFireVfxProps {
  offsetY: number;
  scale: number;
  debugLabel?: string;
}

/** Build a stable unique name for VFXParticles registration based on debugLabel. */
function useParticleName(debugLabel: string, suffix: 'fire' | 'smoke'): string {
  return useMemo(
    () => `${debugLabel.replace(/\s+/g, '-').toLowerCase()}-${suffix}`,
    [debugLabel, suffix],
  );
}

export function TorchFireVfx({ offsetY, scale, debugLabel = 'Fire' }: TorchFireVfxProps) {
  // Static core flame sprite (same asset as legacy, preserves visual identity)
  const fireTex = useTexture('/arena/cave/props/fire-flame.png');
  fireTex.magFilter = THREE.NearestFilter;
  fireTex.minFilter = THREE.NearestFilter;

  // Leva controls — mirror legacy component's knobs + VFX-specific additions
  const dbg = useControls(debugLabel, {
    dx:          { value: 0,        min: -5,  max: 5,  step: 0.05, label: 'X offset' },
    dy:          { value: offsetY,  min: -2,  max: 10, step: 0.05, label: 'Y offset' },
    dz:          { value: 0,        min: -5,  max: 5,  step: 0.05, label: 'Z offset' },
    spriteScale: { value: Math.max(0.5, Math.min(scale, 3.0)), min: 0.1, max: 5, step: 0.05, label: 'sprite scale' },
    intensity:   { value: 4.0,      min: 0,   max: 12, step: 0.1,  label: 'fire intensity' },
    turbulence:  { value: 1.2,      min: 0,   max: 5,  step: 0.05, label: 'turbulence' },
  }, { collapsed: true });

  const ps = dbg.spriteScale;

  const fireName  = useParticleName(debugLabel, 'fire');
  const smokeName = useParticleName(debugLabel, 'smoke');

  // Base billboard sprite — kept from legacy to preserve the "flame soul" look
  const img = fireTex.image as HTMLImageElement | undefined;
  const aspect = img?.naturalWidth && img?.naturalHeight
    ? img.naturalWidth / img.naturalHeight : 32 / 48;
  const sh = ps * 0.6;

  return (
    <group position={[dbg.dx, dbg.dy, dbg.dz]}>
      {/* Core flame billboard — static glow at emitter origin */}
      <Billboard>
        <mesh>
          <planeGeometry args={[sh * aspect, sh]} />
          <meshBasicMaterial
            map={fireTex}
            transparent
            alphaTest={0.01}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>

      {/* Fire particles — additive white→orange→red, rising with turbulence */}
      <VFXParticles
        name={fireName}
        autoStart
        emitCount={4}
        maxParticles={Math.max(120, Math.floor(300 * ps))}
        emitterShape={EmitterShape.DISK}
        emitterRadius={[0, 0.1 * ps]}
        lifetime={[0.6, 1.2]}
        speed={[0.3, 0.7]}
        direction={[
          [-0.15, 0.15],
          [0.8, 1],
          [-0.15, 0.15],
        ]}
        gravity={[0, 0.4, 0]}
        size={[0.04 * ps, 0.12 * ps]}
        colorStart={['#ffffff', '#ffdd88']}
        colorEnd={['#ff3300', '#aa1100']}
        fadeOpacity={[1, 0]}
        fadeSize={[0.3, 1.2]}
        blending={Blending.ADDITIVE}
        intensity={dbg.intensity}
        turbulence={{ intensity: dbg.turbulence, frequency: 2, speed: 1.5 }}
      />

      {/* Smoke particles — normal blending, grey, slow rise above flame */}
      <VFXParticles
        name={smokeName}
        autoStart
        emitCount={2}
        position={[0, 0.3 * ps, 0]}
        maxParticles={Math.max(60, Math.floor(120 * ps))}
        emitterShape={EmitterShape.DISK}
        emitterRadius={[0, 0.08 * ps]}
        lifetime={[1.5, 3.0]}
        speed={[0.06, 0.12]}
        direction={[
          [-0.1, 0.1],
          [0.8, 1],
          [-0.1, 0.1],
        ]}
        gravity={[0, 0.25, 0]}
        size={[0.25 * ps, 0.55 * ps]}
        colorStart={['#888899', '#aaaacc']}
        colorEnd={['#555566']}
        fadeOpacity={[0.25, 0]}
        fadeSize={[0.5, 1.8]}
        blending={Blending.NORMAL}
        intensity={0.6}
        turbulence={{ intensity: 0.5, frequency: 0.8, speed: 0.4 }}
      />
    </group>
  );
}
