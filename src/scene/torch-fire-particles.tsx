/**
 * Fire and smoke particle effects for torch props.
 * Uses THREE.Sprite pool — simpler and more reliable than Points+ShaderMaterial.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Billboard } from '@react-three/drei';
import { useControls } from 'leva';
import * as THREE from 'three';

// --- Canvas smoke texture ---
function makeSmokeTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0,   'rgba(180,170,200,1)');
  g.addColorStop(0.5, 'rgba(120,110,140,0.5)');
  g.addColorStop(1,   'rgba(80,70,100,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// --- Particle runtime state ---
interface ParticleState {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  maxScale: number;
}

function createSpritePool(
  count: number,
  tex: THREE.Texture,
  blending: THREE.Blending,
  group: THREE.Group,
): ParticleState[] {
  const pool: ParticleState[] = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0,
      blending,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.visible = false;
    group.add(sprite);
    pool.push({
      sprite,
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 1,
      maxScale: 1,
    });
  }
  return pool;
}

// --- Props ---
export interface TorchFireEffectProps {
  offsetY: number;
  scale: number;
  debugLabel?: string;
}

export function TorchFireEffect({ offsetY, scale, debugLabel = 'Fire' }: TorchFireEffectProps) {
  const fireTex = useTexture('/arena/cave/props/fire-flame.png');
  fireTex.magFilter = THREE.NearestFilter;
  fireTex.minFilter = THREE.NearestFilter;

  const smokeTex = useMemo(makeSmokeTexture, []);

  const dbg = useControls(debugLabel, {
    dx:          { value: 0,                                    min: -5,  max: 5,  step: 0.05, label: 'X offset' },
    dy:          { value: offsetY,                              min: -2,  max: 10, step: 0.05, label: 'Y offset' },
    dz:          { value: 0,                                    min: -5,  max: 5,  step: 0.05, label: 'Z offset' },
    spriteScale: { value: Math.max(0.5, Math.min(scale, 3.0)), min: 0.1, max: 5,  step: 0.05, label: 'sprite scale' },
  }, { collapsed: true });

  // Imperative THREE.js groups — outside React reconciler
  const fireGroup  = useMemo(() => new THREE.Group(), []);
  const smokeGroup = useMemo(() => new THREE.Group(), []);

  // Sprite pools created once, recycled every frame
  const firePool  = useMemo(() => createSpritePool(30, fireTex,  THREE.AdditiveBlending, fireGroup),  [fireTex,  fireGroup]);
  const smokePool = useMemo(() => createSpritePool(12, smokeTex, THREE.NormalBlending,   smokeGroup), [smokeTex, smokeGroup]);

  const fireAcc    = useRef(0);
  const smokeAcc   = useRef(0);
  const flickerRef = useRef<THREE.Mesh>(null);

  useEffect(() => () => {
    [...firePool, ...smokePool].forEach(p => p.sprite.material.dispose());
    smokeTex.dispose();
  }, [firePool, smokePool, smokeTex]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const ps = dbg.spriteScale;
    const t0 = clock.elapsedTime;

    // --- Billboard flicker — combines two sine waves for irregular feel ---
    if (flickerRef.current) {
      const flicker = 0.82 + 0.18 * Math.sin(t0 * 9.1) * Math.sin(t0 * 6.3 + 1.2);
      flickerRef.current.scale.setScalar(flicker);
      (flickerRef.current.material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.3 * flicker;
    }

    // --- Fire emit — slow drip, not explosive ---
    fireAcc.current += dt;
    const nFire = Math.floor(fireAcc.current * 8);
    fireAcc.current -= nFire / 8;

    for (let i = 0; i < nFire; i++) {
      const p = firePool.find(p => !p.sprite.visible);
      if (!p) break;
      p.life = (0.5 + Math.random() * 0.5) * 1.2;
      p.maxLife = p.life;
      p.maxScale = (0.25 + Math.random() * 0.3) * ps;
      p.vel.set(
        (Math.random() - 0.5) * 0.25,
        0.4 + Math.random() * 0.4,
        (Math.random() - 0.5) * 0.2,
      );
      p.sprite.position.set(
        dbg.dx + (Math.random() * 2 - 1) * 0.12 * ps,
        dbg.dy + Math.random() * 0.08,
        dbg.dz + (Math.random() * 2 - 1) * 0.08 * ps,
      );
      p.sprite.material.color.set(0xffffff);
      p.sprite.material.opacity = 0;
      p.sprite.scale.setScalar(0.01);
      p.sprite.visible = true;
    }

    // --- Fire update ---
    for (const p of firePool) {
      if (!p.sprite.visible) continue;
      p.life -= dt;
      if (p.life <= 0) { p.sprite.visible = false; continue; }

      const t = 1 - p.life / p.maxLife;
      p.sprite.position.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(1 - dt * 1.8);

      // alpha: fade in → fade out
      const alpha = t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75;
      p.sprite.material.opacity = Math.max(0, alpha);

      // size: grow → shrink
      const sz = t < 0.35 ? t / 0.35 : 1 - (t - 0.35) / 0.65;
      p.sprite.scale.setScalar(p.maxScale * Math.max(0.01, sz));

      // color: white → orange → red
      if (t < 0.4) {
        p.sprite.material.color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0xff9900), t / 0.4);
      } else {
        p.sprite.material.color.lerpColors(new THREE.Color(0xff9900), new THREE.Color(0xff3300), (t - 0.4) / 0.6);
      }
    }

    // --- Smoke emit ---
    smokeAcc.current += dt;
    const nSmoke = Math.floor(smokeAcc.current * 6);
    smokeAcc.current -= nSmoke / 6;

    for (let i = 0; i < nSmoke; i++) {
      const p = smokePool.find(p => !p.sprite.visible);
      if (!p) break;
      p.life = (0.5 + Math.random() * 0.5) * 2.5;
      p.maxLife = p.life;
      p.maxScale = (0.5 + Math.random() * 0.5) * ps * 1.2;
      p.vel.set(
        (Math.random() - 0.5) * 0.2,
        0.3 + Math.random() * 0.2,
        (Math.random() - 0.5) * 0.15,
      );
      p.sprite.position.set(
        dbg.dx + (Math.random() * 2 - 1) * 0.08 * ps,
        dbg.dy + 0.3 * ps + Math.random() * 0.1,
        dbg.dz + (Math.random() * 2 - 1) * 0.06 * ps,
      );
      p.sprite.material.color.set(0x888899);
      p.sprite.material.opacity = 0;
      p.sprite.scale.setScalar(0.01);
      p.sprite.visible = true;
    }

    // --- Smoke update ---
    for (const p of smokePool) {
      if (!p.sprite.visible) continue;
      p.life -= dt;
      if (p.life <= 0) { p.sprite.visible = false; continue; }

      const t = 1 - p.life / p.maxLife;
      p.sprite.position.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(1 - dt * 0.3);

      const alpha = t < 0.2 ? (t / 0.2) * 0.2 : 0.2 * (1 - (t - 0.2) / 0.8);
      p.sprite.material.opacity = Math.max(0, alpha);

      const sz = t < 0.3 ? t / 0.3 : 1 + (t - 0.3) * 0.5;
      p.sprite.scale.setScalar(p.maxScale * Math.max(0.01, sz));
    }
  });

  // Base billboard sprite using fire-flame.png
  const img = fireTex.image as HTMLImageElement | undefined;
  const aspect = img?.naturalWidth && img?.naturalHeight
    ? img.naturalWidth / img.naturalHeight : 32 / 48;
  const sh = dbg.spriteScale * 0.6;

  return (
    <group>
      {/* Static billboard sprite at flame position */}
      <Billboard position={[dbg.dx, dbg.dy, dbg.dz]}>
        <mesh ref={flickerRef}>
          <planeGeometry args={[sh * aspect, sh]} />
          <meshBasicMaterial
            map={fireTex} transparent alphaTest={0.01}
            depthWrite={false} blending={THREE.AdditiveBlending}
          />
        </mesh>
      </Billboard>
      {/* Fire sprite pool */}
      <primitive object={fireGroup} />
      {/* Smoke sprite pool */}
      <primitive object={smokeGroup} />
    </group>
  );
}
