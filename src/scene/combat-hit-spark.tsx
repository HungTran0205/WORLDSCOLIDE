import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import { Mesh, MeshBasicMaterial, AdditiveBlending, CanvasTexture } from 'three';

// Create a juicy 4-point star burst texture with glow
function createSparkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.1, 'rgba(255, 255, 200, 0.8)');
  grad.addColorStop(1, 'rgba(255, 200, 0, 0)');
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(64, 0);
  ctx.quadraticCurveTo(64, 64, 128, 64);
  ctx.quadraticCurveTo(64, 64, 64, 128);
  ctx.quadraticCurveTo(64, 64, 0, 64);
  ctx.quadraticCurveTo(64, 64, 64, 0);
  ctx.fill();

  return new CanvasTexture(canvas);
}

const sparkTexture = createSparkTexture() || undefined;

interface CombatHitSparkProps {
  position: { x: number; z: number };
  onExpired: () => void;
}

export function CombatHitSpark({ position, onExpired }: CombatHitSparkProps) {
  const materialRef = useRef<MeshBasicMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  const elapsedRef = useRef(0);
  const lifetime = 0.15; // 150ms spark

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (elapsedRef.current >= lifetime) {
      onExpired();
      return;
    }
    
    const progress = Math.min(1, elapsedRef.current / lifetime);
    // Fast outward expansion
    const scale = 0.5 + Math.sin(progress * Math.PI / 2) * 2.5; 
    
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, 1);
    }
    
    if (materialRef.current) {
      // Stay bright initially, then fade out rapidly
      materialRef.current.opacity = 1 - Math.pow(progress, 3);
    }
  });

  return (
    <group position={[position.x, 1.0, position.z]}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        <mesh ref={meshRef}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshBasicMaterial 
            ref={materialRef} 
            map={sparkTexture} 
            color="#ffffff" 
            transparent 
            blending={AdditiveBlending} 
            depthWrite={false} 
          />
        </mesh>
      </Billboard>
    </group>
  );
}
