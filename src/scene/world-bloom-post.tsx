/**
 * World bloom postprocessing — WebGPU TSL or WebGL EffectComposer.
 *
 * Copied 1:1 from combat-bloom-post.tsx (proven prod pattern) with two
 * changes: (1) params come from a Leva `World Bloom` folder inline instead
 * of a debug context, (2) default params are slightly different to suit the
 * guild hall's lighting and sprite luminance profile.
 *
 * Mounted inside world.tsx Canvas after scene content.
 */

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useControls } from 'leva';

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

/** Root — branches on renderer type and Leva enabled toggle. */
export function WorldBloomPost() {
  const gl = useThree(s => s.gl);
  const bloom = useControls('World Bloom', {
    enabled:   { value: false }, // default OFF until diagnosis confirms compat with world canvas
    strength:  { value: 0.80, min: 0, max: 3, step: 0.05 },
    radius:    { value: 0.70, min: 0, max: 2, step: 0.05 },
    threshold: { value: 0.85, min: 0, max: 2, step: 0.01 },
  }, { collapsed: true });

  if (!bloom.enabled) return null;

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
