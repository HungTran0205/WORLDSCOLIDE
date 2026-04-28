/**
 * World post-processing — ContactShadows (drei), N8AO SSAO + Bloom (WebGL),
 * or TSL Bloom (WebGPU). All effects driven by Zustand settings store.
 *
 * Mounted inside world.tsx Canvas after scene content.
 */

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, N8AO } from '@react-three/postprocessing';
import { useControls } from 'leva';
import { useGameStore } from '@/game/state/store';

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
    // Uniform updates handled in separate effect below.
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
    // Use sync render() instead of deprecated renderAsync() — avoids frame
    // queueing when the async work doesn't complete before next frame tick.
    current.post.render();
  }, 1);

  return null;
}

interface WebGLPostPassProps extends PassProps {
  bloomEnabled: boolean;
  shadowsEnabled: boolean;
}

/** WebGL branch — EffectComposer with optional N8AO + Bloom. */
function WebGLPostPass({ bloomEnabled, shadowsEnabled, strength, radius, threshold }: WebGLPostPassProps) {
  return (
    <EffectComposer multisampling={0}>
      {shadowsEnabled && (
        <N8AO
          halfRes
          aoRadius={0.5}
          intensity={1.5}
          aoSamples={6}
          denoiseSamples={4}
        />
      )}
      {bloomEnabled && (
        <Bloom
          intensity={strength}
          luminanceThreshold={threshold}
          luminanceSmoothing={0.1}
          radius={radius}
        />
      )}
    </EffectComposer>
  );
}

/** Root — reads settings store, branches on renderer type. */
export function WorldPostProcessing() {
  const gl = useThree(s => s.gl);
  const bloomEnabled = useGameStore(s => s.settings.bloomEnabled);
  const shadowsEnabled = useGameStore(s => s.settings.shadowsEnabled);
  const bloomThreshold = useGameStore(s => s.settings.bloomThreshold);

  const { strength, radius } = useControls('World Post', {
    strength: { value: 0.80, min: 0, max: 3, step: 0.05 },
    radius:   { value: 0.70, min: 0, max: 2, step: 0.05 },
  }, { collapsed: true });

  if (!bloomEnabled && !shadowsEnabled) return null;

  const isWebGPU = 'isWebGPURenderer' in gl;

  if (isWebGPU) {
    // N8AO not compatible with WebGPU EffectComposer — skip SSAO silently
    if (!bloomEnabled) return null;
    return <WebGPUBloomPass strength={strength} radius={radius} threshold={bloomThreshold} />;
  }

  return (
    <WebGLPostPass
      bloomEnabled={bloomEnabled}
      shadowsEnabled={shadowsEnabled}
      strength={strength}
      radius={radius}
      threshold={bloomThreshold}
    />
  );
}
