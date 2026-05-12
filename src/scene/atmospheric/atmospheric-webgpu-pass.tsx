/**
 * WebGPU atmospheric pass — TSL post-processing chain.
 *
 * Phase 01 scaffold: lazily builds a chained pipeline where every future
 * custom node (Vignette, ColorGrade, ACES Tonemap, ChromAb, Tilt-Shift)
 * is reassigned into a single `chain` local. Phases 02–05 only need to
 * insert their node at the marked spot and populate the corresponding
 * `TslChainHolder` field — no structural changes required.
 *
 * Chain ordering rule: ACES Tonemap must always be the LAST effect; every
 * other insertion goes BEFORE it. See `./tsl/types.ts` for the holder shape.
 *
 * Render path: `useFrame` priority 1 (after R3F's default render, before the
 * next frame's clears). Sync `post.render()`; `renderAsync()` causes
 * frame-queueing artifacts in three r167.
 */

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { AtmospherePreset } from './atmosphere-types';
import type { TslChainHolder } from './tsl/types';

export interface AtmosphericWebGPUPassProps {
  preset: AtmospherePreset;
  overrides: { bloomStrength: number; bloomRadius: number };
}

let depthSpikeLogged = false;

export function AtmosphericWebGPUPass({ preset, overrides }: AtmosphericWebGPUPassProps) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const setup = useMemo(() => {
    let cancelled = false;
    const holder: { current: TslChainHolder | null } = { current: null };

    (async () => {
      const { PostProcessing } = await import('three/webgpu');
      const { pass } = await import('three/tsl');
      const BloomNodeMod = await import('three/examples/jsm/tsl/display/BloomNode.js');
      const BloomNode = (BloomNodeMod as any).default ?? BloomNodeMod;
      if (cancelled) return;

      const post = new (PostProcessing as any)(gl);
      const scenePass = (pass as any)(scene, camera);
      const sceneColor = scenePass.getTextureNode('output');

      // Phase 01 depth-texture spike. Records once per session whether
      // `getTextureNode('depth')` resolves to a usable node — informs whether
      // DOF-on-WebGPU is viable in a follow-up plan. Wrap in try/catch because
      // some renderer configs throw rather than return null.
      if (!depthSpikeLogged) {
        depthSpikeLogged = true;
        try {
          const sceneDepth = scenePass.getTextureNode('depth');
          console.info(
            '[atmospheric/webgpu] depth-texture spike:',
            sceneDepth ? 'available — DOF candidate viable' : 'null — DOF locked WebGL-only',
          );
        } catch (err) {
          console.info(
            '[atmospheric/webgpu] depth-texture spike: threw — DOF locked WebGL-only',
            err,
          );
        }
      }

      // Initial uniform values come from props; the [preset, overrides] effect
      // below keeps them in sync afterwards. Reading them here just seeds the
      // first frame — the effect fires immediately after mount anyway.
      const initStrength = preset.bloom.intensity * overrides.bloomStrength;
      const initRadius = preset.bloom.radius * overrides.bloomRadius;
      const initThreshold = preset.bloom.threshold;

      const bloomNode = new (BloomNode as any)(
        sceneColor,
        initStrength,
        initRadius,
        initThreshold,
      );

      // Build chain via single mutable local. Each phase reassigns once.
      // Order must be: bloom → vignette → colorGrade → fog → chromAb → tiltShift → aces.
      // eslint-disable-next-line prefer-const -- Phase 02+ reassigns when nodes are inserted
      let chain: any = sceneColor.add(bloomNode);
      // Phase 02: chain = vignette(chain, holder.vignette = { offset, darkness })
      // Phase 02: chain = colorGrade(chain, holder.colorGrade = { hue, sat, brightness, contrast })
      // Phase 03: chain = fog(chain, sceneDepth, holder.fog = { near, far, color, density })
      // Phase 04: chain = chromAb(chain, holder.chromaticAberration = { offset })
      // Phase 05: chain = tiltShift(chain, holder.tiltShift = { strength, focusBand })
      // Phase 03 (chain tail, ALWAYS LAST): chain = aces(chain)

      post.outputNode = chain;
      holder.current = {
        post,
        bloom: {
          strength: bloomNode.strength,
          radius: bloomNode.radius,
          threshold: bloomNode.threshold,
        },
      };
    })();

    return {
      getCurrent: () => holder.current,
      dispose: () => {
        cancelled = true;
      },
    };
    // Pipeline build depends only on renderer/scene/camera identity. Preset
    // values flow through the uniform-sync effect below — rebuilding the
    // chain on every preset lerp would thrash the GPU.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => () => setup.dispose(), [setup]);

  useEffect(() => {
    const current = setup.getCurrent();
    if (!current) return;
    current.bloom.strength.value = preset.bloom.intensity * overrides.bloomStrength;
    current.bloom.radius.value = preset.bloom.radius * overrides.bloomRadius;
    current.bloom.threshold.value = preset.bloom.threshold;
    // Phase 02+: write vignette/colorGrade/... uniforms here when their
    // optional holder fields are present.
  }, [setup, preset, overrides]);

  useFrame(() => {
    const current = setup.getCurrent();
    if (!current) return;
    current.post.render();
  }, 1);

  return null;
}
