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
  /** Reduce particle count to ~40% for a medium-quality path */
  lowQuality?: boolean;
}

/** Build a stable unique name for VFXParticles registration based on debugLabel. */
function useParticleName(debugLabel: string, suffix: 'fire' | 'smoke'): string {
  return useMemo(
    () => `${debugLabel.replace(/\s+/g, '-').toLowerCase()}-${suffix}`,
    [debugLabel, suffix],
  );
}

export function TorchFireVfx({ offsetY, scale, debugLabel = 'Fire', lowQuality = false }: TorchFireVfxProps) {
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
  const particleScale = lowQuality ? 0.4 : 1;

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
        emitCount={lowQuality ? 2 : 4}
        maxParticles={Math.max(50, Math.floor(300 * ps * particleScale))}
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

      {/* Smoke particles — normal blending, grey, drifts and spreads above flame */}
      <VFXParticles
        name={smokeName}
        autoStart
        emitCount={2}
        position={[0, 0.35 * ps, 0]}
        maxParticles={Math.max(60, Math.floor(120 * ps))}
        emitterShape={EmitterShape.DISK}
        emitterRadius={[0.05 * ps, 0.22 * ps]}
        lifetime={[2.0, 4.0]}
        speed={[0.14, 0.28]}
        direction={[
          [-0.35, 0.35],
          [0.7, 1],
          [-0.35, 0.35],
        ]}
        gravity={[0, 0.08, 0]}
        size={[0.18 * ps, 0.48 * ps]}
        colorStart={['#777788', '#999aaa']}
        colorEnd={['#444450', '#555560']}
        fadeOpacity={[0.14, 0]}
        fadeSize={[0.4, 2.2]}
        blending={Blending.NORMAL}
        intensity={0.5}
        turbulence={{ intensity: 1, frequency: 0.6, speed: 0.3 }}
      />
    </group>
  );
}
