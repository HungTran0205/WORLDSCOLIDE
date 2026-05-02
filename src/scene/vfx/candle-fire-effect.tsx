/**
 * Calm candle flame effect — static billboard sprite with slow flicker + thin smoke wisp.
 * Unlike TorchFireVfx/TorchFireEffect which are designed for torches (turbulent, spreading),
 * this component produces a nearly still flame that sways very gently upward.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Billboard } from '@react-three/drei';
import * as THREE from 'three';

function makeSmokeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0,   'rgba(160,150,180,0.8)');
  g.addColorStop(0.6, 'rgba(100, 90,120,0.3)');
  g.addColorStop(1,   'rgba( 60, 50, 80,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

interface SmokeParticle {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface CandleFireEffectProps {
  /** World-space Y position of the candle wick */
  offsetY: number;
  /** Visual scale — 1.0 is a standard candle; smaller = birthday-cake size */
  scale?: number;
}

export function CandleFireEffect({ offsetY, scale = 1 }: CandleFireEffectProps) {
  const fireTex = useTexture('/arena/cave/props/fire-flame.png');
  fireTex.magFilter = THREE.NearestFilter;
  fireTex.minFilter = THREE.NearestFilter;

  const smokeTex = useMemo(makeSmokeTexture, []);
  const smokeGroup = useMemo(() => new THREE.Group(), []);

  // Small sprite pool for thin smoke wisp (6 sprites is enough)
  const smokePool = useMemo<SmokeParticle[]>(() => {
    const pool: SmokeParticle[] = [];
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.SpriteMaterial({
        map: smokeTex, transparent: true, opacity: 0,
        blending: THREE.NormalBlending, depthTest: false, depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      smokeGroup.add(sprite);
      pool.push({ sprite, vel: new THREE.Vector3(), life: 0, maxLife: 1 });
    }
    return pool;
  }, [smokeTex, smokeGroup]);

  const flameRef   = useRef<THREE.Mesh>(null);
  const smokeAcc   = useRef(0);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t  = clock.elapsedTime;

    // Gentle flicker: slow compound sine, amplitude ±8%
    if (flameRef.current) {
      const flicker = 0.92 + 0.08 * Math.sin(t * 2.3) * Math.sin(t * 1.6 + 0.9);
      flameRef.current.scale.setScalar(flicker * scale);
      (flameRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85 + 0.15 * flicker;
    }

    // Smoke wisp — emit ~2/sec, rises almost straight up with minimal drift
    smokeAcc.current += dt;
    const nSmoke = Math.floor(smokeAcc.current * 2);
    smokeAcc.current -= nSmoke / 2;

    for (let i = 0; i < nSmoke; i++) {
      const p = smokePool.find(p => !p.sprite.visible);
      if (!p) break;
      p.life = p.maxLife = 1.8 + Math.random() * 1.2;
      p.vel.set(
        (Math.random() - 0.5) * 0.03 * scale,
        0.08 + Math.random() * 0.05,
        (Math.random() - 0.5) * 0.02 * scale,
      );
      p.sprite.position.set(
        (Math.random() - 0.5) * 0.03 * scale,
        offsetY + 0.12 * scale,
        (Math.random() - 0.5) * 0.02 * scale,
      );
      p.sprite.material.opacity = 0;
      p.sprite.scale.setScalar(0.01);
      p.sprite.visible = true;
    }

    for (const p of smokePool) {
      if (!p.sprite.visible) continue;
      p.life -= dt;
      if (p.life <= 0) { p.sprite.visible = false; continue; }

      const t01 = 1 - p.life / p.maxLife;
      p.sprite.position.addScaledVector(p.vel, dt);

      const alpha = t01 < 0.15 ? (t01 / 0.15) * 0.12 : 0.12 * (1 - (t01 - 0.15) / 0.85);
      p.sprite.material.opacity = Math.max(0, alpha);

      const sz = (0.06 + t01 * 0.10) * scale;
      p.sprite.scale.setScalar(Math.max(0.01, sz));
    }
  });

  const img    = fireTex.image as HTMLImageElement | undefined;
  const aspect = img?.naturalWidth && img?.naturalHeight ? img.naturalWidth / img.naturalHeight : 32 / 48;
  const sh     = 0.22 * scale;

  return (
    <group>
      <Billboard position={[0, offsetY, 0]}>
        <mesh ref={flameRef} scale={[scale, scale, scale]}>
          <planeGeometry args={[sh * aspect, sh]} />
          <meshBasicMaterial
            map={fireTex} transparent alphaTest={0.01}
            depthWrite={false} blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>
      <primitive object={smokeGroup} />
    </group>
  );
}
