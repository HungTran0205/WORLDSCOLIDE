/**
 * 3D GLB prop and environment model components for HD-2D forest biome.
 * Preloads all forest GLB assets at module import time to avoid hitching.
 */

import { useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TorchFireEffect } from '../vfx/torch-fire-particles';
import type { Prop3D } from './arena-biome-config';

// Preload all forest GLB assets at module import time (R3F standard pattern)
useGLTF.preload('/arena/forest/3dtiles/optimized/forestground.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_tree_large.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_tree_pine.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_stump.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_bush.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_boulder.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_mush_glow.glb');

// Preload fire sprite
useTexture.preload('/arena/cave/props/fire-flame.png');

// Cave GLB assets
useGLTF.preload('/arena/cave/3dtiles/optimized/groundcave.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_stonepilla.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_stone_pillar_falling.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_ice_pillar.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_vibrant_han.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_vibrant_han_2.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_standing_torch.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_a_small_dis.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_simple_dark_metal.glb');
useGLTF.preload('/arena/cave/3dprops/optimized/p_Low_poly_of_tall_dar.glb');

/**
 * Convert MeshBasicMaterial to MeshStandardMaterial so the mesh responds to
 * dynamic lights (point lights, directional). Preserves color, map, opacity.
 */
function ensureLitMaterial(mesh: THREE.Mesh) {
  const mat = mesh.material as THREE.Material;
  if (mat.type === 'MeshBasicMaterial') {
    const basic = mat as THREE.MeshBasicMaterial;
    const standard = new THREE.MeshStandardMaterial({
      map: basic.map,
      color: basic.color,
      transparent: basic.transparent,
      opacity: basic.opacity,
      side: basic.side,
      roughness: 0.8,
      metalness: 0.0,
    });
    mesh.material = standard;
    basic.dispose();
  }
}

/** GLB diorama ground — receives shadows from props and sprites */
export function Environment3DModel({ src, scale = 1, positionY = 0 }: { src: string; scale?: number; positionY?: number }) {
  const { scene } = useGLTF(src);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        ensureLitMaterial(obj as THREE.Mesh);
        (obj as THREE.Mesh).receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return <primitive object={model} scale={scale} position={[0, positionY, 0]} />;
}

/** Single GLB prop — casts and receives shadows */
function Prop3DModel({ prop, sceneScale = 1, propIndex = 0 }: { prop: Prop3D; sceneScale?: number; propIndex?: number }) {
  const { scene } = useGLTF(prop.src);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        ensureLitMaterial(obj as THREE.Mesh);
        (obj as THREE.Mesh).castShadow = true;
        (obj as THREE.Mesh).receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const rot = prop.rotation ?? [0, 0, 0];
  const baseScale = Array.isArray(prop.scale) ? prop.scale : [prop.scale, prop.scale, prop.scale];
  const scl = baseScale.map(v => v * sceneScale) as [number, number, number];

  return (
    <group position={prop.position}>
      <primitive
        object={model}
        rotation={rot}
        scale={scl}
      />
      {/* Attached point light — offset from prop origin */}
      {/* Attached point light — offset from prop origin */}
      {prop.light && (
        <pointLight
          position={[0, prop.light.offsetY, 0]}
          color={prop.light.color}
          intensity={prop.light.intensity}
          distance={prop.light.distance}
          decay={prop.light.decay ?? 2}
        />
      )}
      {/* Animated fire + smoke particle overlay */}
      {prop.sprite && (
        <TorchFireEffect offsetY={prop.sprite.offsetY} scale={prop.sprite.scale} debugLabel={`Fire ${propIndex}`} />
      )}
    </group>
  );
}

/** Render all 3D props from BiomeConfig.props3D */
export function Prop3DLayer({ props3D, sceneScale = 1 }: { props3D: Prop3D[]; sceneScale?: number }) {
  return (
    <>
      {props3D.map((prop, i) => (
        <Prop3DModel key={i} prop={prop} sceneScale={sceneScale} propIndex={i} />
      ))}
    </>
  );
}
