/**
 * Combat bloom postprocessing — WebGPU TSL or WebGL EffectComposer.
 * Mounts inside the combat Canvas and takes over the render loop
 * (WebGPU branch) or mounts an EffectComposer (WebGL branch).
 *
 * Renderer branch chosen once at mount. Debug controls flow in via
 * props from `ArenaDebugProvider` → `combat-arena-debug.tsx`.
 */

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useArenaDebug } from './combat-arena-debug';
import { getStoredGraphicsQuality } from '@/game/state/guild-slice';

interface BloomUniform { value: number }
interface BloomNodeInstance {
  strength: BloomUniform;
  radius: BloomUniform;
  threshold: BloomUniform;
}

interface PassProps {
  strength: number;
  radius: number;
  threshold: number;
}

/** WebGPU branch — TSL PostProcessing + BloomNode. Takes render loop via priority=1. */
function WebGPUBloomPass({ strength, radius, threshold }: PassProps) {
  const gl = useThree(s => s.gl);
  const scene = useThree(s => s.scene);
  const camera = useThree(s => s.camera);

  // Lazy dynamic imports keep WebGL-only builds from pulling WebGPU code.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  interface BloomHolder {
    post: any;
    bloomNode: BloomNodeInstance;
  }
  const setup = useMemo(() => {
    let cancelled = false;
    const holder: { current: BloomHolder | null } = { current: null };

    (async () => {
      const { PostProcessing } = await import('three/webgpu');
      const { pass } = await import('three/tsl');
      const BloomNodeMod = await import('three/examples/jsm/tsl/display/BloomNode.js');
      const BloomNode = (BloomNodeMod as any).default ?? BloomNodeMod;
      if (cancelled) return;
      const post = new (PostProcessing as any)(gl);
      const scenePass = (pass as any)(scene, camera);
      const sceneColor = scenePass.getTextureNode('output');
      const bloomNode = new (BloomNode as any)(sceneColor, strength, radius, threshold);
      post.outputNode = sceneColor.add(bloomNode);
      holder.current = { post, bloomNode };
    })();

    return {
      getCurrent: () => holder.current,
      dispose: () => { cancelled = true; },
    };
    // Uniform updates handled in separate effect below — do not rebuild on param change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => () => setup.dispose(), [setup]);

  useEffect(() => {
    const current = setup.getCurrent();
    if (!current) return;
    current.bloomNode.strength.value = strength;
    current.bloomNode.radius.value = radius;
    current.bloomNode.threshold.value = threshold;
  }, [setup, strength, radius, threshold]);

  useFrame(() => {
    const current = setup.getCurrent();
    if (!current) return;
    // three r0.182 deprecated renderAsync in favor of sync render() since
    // the renderer is already awaited on init. Sync avoids frame queueing.
    current.post.render();
  }, 1);

  return null;
}

/** WebGL fallback — @react-three/postprocessing Bloom effect. */
function WebGLBloomPass({ strength, radius, threshold }: PassProps) {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={strength}
        luminanceThreshold={threshold}
        luminanceSmoothing={0.1}
        radius={radius}
      />
    </EffectComposer>
  );
}

/** Production defaults — used when no dev debug provider is mounted. */
const DEFAULT_BLOOM = {
  enabled: true,
  strength: 1.53,
  radius: 1.00,
  threshold: 0.55,
} as const;

/** Root — branches on renderer type and Leva enabled toggle. */
export function CombatBloomPost() {
  const gl = useThree(s => s.gl);
  const debug = useArenaDebug();
  const bloom = debug?.bloom ?? DEFAULT_BLOOM;

  if (!bloom.enabled) return null;
  if (getStoredGraphicsQuality() === 'low') return null;

  const isWebGPU = 'isWebGPURenderer' in gl;

  if (isWebGPU) {
    return (
      <WebGPUBloomPass
        strength={bloom.strength}
        radius={bloom.radius}
        threshold={bloom.threshold}
      />
    );
  }

  return (
    <WebGLBloomPass
      strength={bloom.strength}
      radius={bloom.radius}
      threshold={bloom.threshold}
    />
  );
}
