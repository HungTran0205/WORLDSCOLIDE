/**
 * 3D GLB prop and environment model components for HD-2D forest biome.
 * Preloads all forest GLB assets at module import time to avoid hitching.
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { Prop3D } from './arena-biome-config';

// Preload all forest GLB assets at module import time (R3F standard pattern)
useGLTF.preload('/arena/forest/3dtiles/optimized/forestground.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_tree_large.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_tree_pine.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_stump.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_bush.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_boulder.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_mush_glow.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_log_fallen.glb');
useGLTF.preload('/arena/forest/3dprops/optimized/p_rock_small.glb');

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

/** GLB diorama ground — receives shadows from props and sprites */
export function Environment3DModel({ src, scale = 1 }: { src: string; scale?: number }) {
  const { scene } = useGLTF(src);

  // Clone to avoid mutating shared GLTF cache on unmount/remount
  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return <primitive object={model} scale={scale} />;
}

/** Single GLB prop — casts and receives shadows */
function Prop3DModel({ prop, sceneScale = 1 }: { prop: Prop3D; sceneScale?: number }) {
  const { scene } = useGLTF(prop.src);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
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
    <primitive
      object={model}
      position={prop.position}
      rotation={rot}
      scale={scl}
    />
  );
}

/** Render all 3D props from BiomeConfig.props3D */
export function Prop3DLayer({ props3D, sceneScale = 1 }: { props3D: Prop3D[]; sceneScale?: number }) {
  return (
    <>
      {props3D.map((prop, i) => (
        <Prop3DModel key={i} prop={prop} sceneScale={sceneScale} />
      ))}
    </>
  );
}
