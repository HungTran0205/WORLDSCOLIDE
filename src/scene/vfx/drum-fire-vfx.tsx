/**
 * Drum fire VFX — lights, flicker, and particles for the copper drum fire holder.
 * Extracts all visual effects from DrumFireHolder so the props component stays lean.
 *
 * Contains:
 *  - Fire + smoke particles (quality-branched: TorchFireVfx | legacy)
 *  - Main upward SpotLight (wide cone, escaping drum mouth)
 *  - Fill downward SpotLight (drum body catches fire colour)
 *  - Flicker animation via layered sines (no Math.random jitter)
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import { TorchFireVfx } from './torch-fire-vfx';
import { TorchFireEffect as TorchFireEffectLegacy } from './torch-fire-particles';
import { useGraphicsQuality } from '../world';

export function DrumFireVfx() {
  const quality = useGraphicsQuality();
  const groupRef = useRef<THREE.Group>(null);
  const spotRef  = useRef<THREE.SpotLight>(null);
  const fillRef  = useRef<THREE.SpotLight>(null);

  // Main upward cone — fire glow escaping the drum mouth
  const main = useControls('Drum Fire — Main Cone (Up)', {
    posY:      { value: 0.45,            min: 0,    max: 2,         step: 0.05 },
    targetY:   { value: 5.8,             min: 0.5,  max: 12,        step: 0.1  },
    color:     { value: '#e2bbaa' },
    intensity: { value: 34.5,            min: 0,    max: 60,        step: 0.5  },
    distance:  { value: 7.0,             min: 1,    max: 20,        step: 0.5  },
    angle:     { value: Math.PI / 1.41,  min: 0.05, max: Math.PI / 2, step: 0.01 },
    penumbra:  { value: 0.15,            min: 0,    max: 2,         step: 0.05 },
    decay:     { value: 1.2,             min: 0,    max: 5,         step: 0.1  },
  }, { collapsed: true });

  // Flicker — modulates main cone intensity each frame for organic firelight feel
  const flicker = useControls('Drum Fire — Flicker', {
    enabled: { value: true },
    amount:  { value: 0.38, min: 0, max: 1,   step: 0.01 },
    speed:   { value: 1.00, min: 0.1, max: 5, step: 0.05 },
  }, { collapsed: true });

  // Downward fill so the drum body catches fire colour
  const fill = useControls('Drum Fire — Fill Cone (Down)', {
    posY:      { value: 1.20,            min: 0,    max: 2,            step: 0.05 },
    targetY:   { value: -2.1,            min: -5,   max: 0,            step: 0.1  },
    color:     { value: '#ff5511' },
    intensity: { value: 10.5,            min: 0,    max: 30,           step: 0.5  },
    distance:  { value: 3.2,             min: 0.2,  max: 10,           step: 0.1  },
    angle:     { value: Math.PI / 1.21,  min: 0.05, max: Math.PI / 2, step: 0.01 },
    penumbra:  { value: 1.95,            min: 0,    max: 2,            step: 0.05 },
    decay:     { value: 2.6,             min: 0,    max: 5,            step: 0.1  },
  }, { collapsed: true });

  // Targets live inside the group so they inherit the drum transform.
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    if (spotRef.current) {
      g.add(spotRef.current.target);
      spotRef.current.target.position.set(0, main.targetY, 0);
      spotRef.current.target.updateMatrixWorld();
    }
    if (fillRef.current) {
      g.add(fillRef.current.target);
      fillRef.current.target.position.set(0, fill.targetY, 0);
      fillRef.current.target.updateMatrixWorld();
    }
  }, [main.targetY, fill.targetY]);

  // Layered sines at 3 incommensurate frequencies fake organic flame noise
  // without Math.random() jitter (which looks like a strobe, not fire).
  useFrame((state) => {
    const light = spotRef.current;
    if (!light) return;
    if (!flicker.enabled) {
      light.intensity = main.intensity;
      return;
    }
    const t = state.clock.elapsedTime * flicker.speed;
    const f =
      Math.sin(t * 12.0) * 0.5 +
      Math.sin(t * 23.7) * 0.3 +
      Math.sin(t *  7.3) * 0.2;
    light.intensity = main.intensity * (1 + f * flicker.amount);
  });

  return (
    <group ref={groupRef}>
      {/* Fire + smoke particles rising from drum bowl */}
      {quality === 'high'
        ? <TorchFireVfx offsetY={0.85} scale={1.3} debugLabel="Drum Fire" />
        : <TorchFireEffectLegacy offsetY={0.85} scale={1.3} debugLabel="Drum Fire" />
      }
      <spotLight
        ref={spotRef}
        position={[0, main.posY, 0]}
        color={main.color}
        intensity={main.intensity}
        distance={main.distance}
        angle={main.angle}
        penumbra={main.penumbra}
        decay={main.decay}
      />
      <spotLight
        ref={fillRef}
        position={[0, fill.posY, 0]}
        color={fill.color}
        intensity={fill.intensity}
        distance={fill.distance}
        angle={fill.angle}
        penumbra={fill.penumbra}
        decay={fill.decay}
      />
    </group>
  );
}
