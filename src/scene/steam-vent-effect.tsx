/**
 * Steam vent / water-vapor effect for alchemical reactor pipes.
 * Emits in irregular bursts (pressure-release feel) rather than a continuous stream.
 * White-to-grey puffs that expand quickly and fade out.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function makeSteamTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0,   'rgba(240,240,255,1)');
  g.addColorStop(0.4, 'rgba(200,200,220,0.6)');
  g.addColorStop(1,   'rgba(160,160,180,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

interface SteamParticle {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  maxScale: number;
}

export interface SteamVentEffectProps {
  /** World-space position of the vent nozzle */
  position: [number, number, number];
  /** Scale multiplier — 1.0 = reactor-pipe sized puff */
  scale?: number;
}

export function SteamVentEffect({ position, scale = 1 }: SteamVentEffectProps) {
  const steamTex = useMemo(makeSteamTexture, []);
  const group    = useMemo(() => new THREE.Group(), []);

  const pool = useMemo<SteamParticle[]>(() => {
    const arr: SteamParticle[] = [];
    for (let i = 0; i < 12; i++) {
      const mat = new THREE.SpriteMaterial({
        map: steamTex, transparent: true, opacity: 0,
        blending: THREE.NormalBlending, depthTest: false, depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      group.add(sprite);
      arr.push({ sprite, vel: new THREE.Vector3(), life: 0, maxLife: 1, maxScale: 1 });
    }
    return arr;
  }, [steamTex, group]);

  // Burst timer: emit a small puff every 0.6–1.2 s (irregular pressure release)
  const burstTimer = useRef(0.4);
  const nextBurst  = useRef(0.7);

  useFrame(({ }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    burstTimer.current += dt;

    if (burstTimer.current >= nextBurst.current) {
      burstTimer.current = 0;
      nextBurst.current  = 0.6 + Math.random() * 0.6;

      // Emit 2–4 particles per burst
      const count = 2 + Math.floor(Math.random() * 3);
      let emitted = 0;
      for (const p of pool) {
        if (p.sprite.visible || emitted >= count) continue;
        p.life = p.maxLife = 0.9 + Math.random() * 0.6;
        p.maxScale = (0.12 + Math.random() * 0.10) * scale;
        // Mostly upward, slight horizontal spread for billowing feel
        p.vel.set(
          (Math.random() - 0.5) * 0.18 * scale,
          0.22 + Math.random() * 0.18,
          (Math.random() - 0.5) * 0.14 * scale,
        );
        p.sprite.position.set(
          position[0] + (Math.random() - 0.5) * 0.06 * scale,
          position[1] + Math.random() * 0.04,
          position[2] + (Math.random() - 0.5) * 0.05 * scale,
        );
        p.sprite.material.opacity = 0;
        p.sprite.scale.setScalar(0.01);
        p.sprite.visible = true;
        emitted++;
      }
    }

    for (const p of pool) {
      if (!p.sprite.visible) continue;
      p.life -= dt;
      if (p.life <= 0) { p.sprite.visible = false; continue; }

      const t = 1 - p.life / p.maxLife;
      p.sprite.position.addScaledVector(p.vel, dt);
      // Decelerate as steam loses pressure
      p.vel.multiplyScalar(1 - dt * 1.4);

      // Fade in quickly, linger, then fade out
      const alpha = t < 0.12
        ? (t / 0.12) * 0.55
        : 0.55 * (1 - (t - 0.12) / 0.88);
      p.sprite.material.opacity = Math.max(0, alpha);

      // Expand as it dissipates (steam billows out)
      p.sprite.scale.setScalar(Math.max(0.01, p.maxScale * (0.3 + t * 0.7)));
    }
  });

  return <primitive object={group} />;
}
