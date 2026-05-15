/**
 * Renderer factory for R3F v9 — WebGPU default, WebGL only when hardware
 * genuinely can't do WebGPU.
 *
 * Policy:
 * 1. Hardware/browser has no `navigator.gpu` → fallback WebGL (terminal)
 * 2. `requestAdapter()` returns null → no GPU adapter → fallback WebGL (terminal)
 * 3. `WebGPURenderer.init()` throws → fallback WebGL for THIS page load only;
 *    no persisted flag — next reload will retry WebGPU.
 * 4. Device lost mid-session → warn + reload (no persisted flag, will retry).
 *
 * Why no persisted flag: transient driver/context failures should not
 * permanently downgrade the user to WebGL. Hardware capability is
 * re-checked each load; only real absence blocks WebGPU.
 */
import { useEffect, useRef } from 'react';
import { InstancedBufferGeometry, WebGLRenderer } from 'three';
import { useThree } from '@react-three/fiber';

/**
 * Three.js r175 WebGPU bug: InstancedBufferGeometry.instanceCount defaults to Infinity.
 * WebGL silently clamps this; WebGPU's drawIndexed() rejects Infinity as unsigned long.
 * Fix: intercept Infinity reads and return 0 (skip draw until real count is set).
 * Troika-three-text triggers this — its GlyphsGeometry extends InstancedBufferGeometry
 * and sets instanceCount only AFTER async font layout completes.
 */
const _ibgCountKey = Symbol('ibgInstanceCount');
Object.defineProperty(InstancedBufferGeometry.prototype, 'instanceCount', {
  get(this: any) {
    const v = this[_ibgCountKey];
    return (v === undefined || v === Infinity) ? 0 : v;
  },
  set(this: any, v: number) {
    this[_ibgCountKey] = v;
  },
  configurable: true,
  enumerable: true,
});

/** Async renderer factory for R3F Canvas gl prop */
export async function createWebGPURenderer(props: Record<string, unknown>) {
  // alpha: true so canvas is transparent — lets CSS background show through
  const glProps = { ...props, alpha: true };

  // Hardware capability check — the only reason we permanently downgrade
  if (!navigator.gpu) {
    console.log('[Renderer] WebGL active — navigator.gpu unavailable');
    return new WebGLRenderer(glProps as any);
  }

  // Probe adapter — capture so we can negotiate higher limits below before
  // letting three.js request the device with default ceilings.
  let adapter: GPUAdapter | null = null;
  try {
    adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.log('[Renderer] WebGL active — no WebGPU adapter available');
      return new WebGLRenderer(glProps as any);
    }
  } catch (e) {
    console.warn('[Renderer] WebGPU adapter probe failed, falling back to WebGL:', e);
    return new WebGLRenderer(glProps as any);
  }

  // Negotiate higher per-stage texture/sampler limits.
  //
  // Combat scene mounts sprite atlases (idle + death per entity) plus VFX
  // preset particles whose compute pipelines bind 18+ samplers per stage,
  // blowing past WebGPU's default `16 samplersPerShaderStage` ceiling. Most
  // desktop adapters report 1000s; we ask for adapter-max (capped at hard
  // upper bounds so the request stays portable).
  const adapterLimits = adapter.limits;
  const pickLimit = (current: number | undefined, target: number) => {
    if (current === undefined) return target;
    return current >= target ? target : current;
  };
  const requiredLimits: Record<string, number> = {
    maxSampledTexturesPerShaderStage: pickLimit(
      adapterLimits.maxSampledTexturesPerShaderStage, 64,
    ),
    maxSamplersPerShaderStage: pickLimit(
      adapterLimits.maxSamplersPerShaderStage, 64,
    ),
    maxBindingsPerBindGroup: pickLimit(
      adapterLimits.maxBindingsPerBindGroup, 1000,
    ),
  };
  console.log('[Renderer] WebGPU adapter limits — samplers/stage:',
    adapterLimits.maxSamplersPerShaderStage,
    'sampledTextures/stage:', adapterLimits.maxSampledTexturesPerShaderStage,
    '— requested:', requiredLimits);

  // Manually create the device with our limits, then pass to WebGPURenderer
  // via `device` parameter. Bypasses three.js's `requiredLimits` flow which
  // — empirically — wasn't lifting the samplersPerShaderStage default in
  // some Chromium WebGPU builds even when the adapter supports higher.
  let device: GPUDevice;
  try {
    device = await adapter.requestDevice({ requiredLimits });
  } catch (e) {
    console.warn('[Renderer] WebGPU device request failed (limits unsupported?), falling back to WebGL:', e);
    return new WebGLRenderer(glProps as any);
  }
  console.log('[Renderer] WebGPU device created — samplers/stage:',
    device.limits.maxSamplersPerShaderStage,
    'sampledTextures/stage:', device.limits.maxSampledTexturesPerShaderStage);

  // Try WebGPU init — transient failures here fall back for this load only,
  // but leave no persistent flag so the next reload retries.
  try {
    const { WebGPURenderer } = await import('three/webgpu');
    const renderer = new WebGPURenderer({ ...glProps, device, requiredLimits } as any);
    await renderer.init();

    // Device loss: warn + reload. No flag — next load retries WebGPU.
    device.lost.then((info) => {
      console.warn('[Renderer] WebGPU device lost — reloading to retry', info);
      window.location.reload();
    });

    console.log('[Renderer] WebGPU active');
    return renderer;
  } catch (e) {
    console.warn('[Renderer] WebGPU init failed, falling back to WebGL:', e);
    return new WebGLRenderer(glProps as any);
  }
}

/** Place inside Canvas with frameloop="demand" — ensures first frames render after mount */
export function WebGPUInit() {
  const invalidate = useThree((s) => s.invalidate);
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    invalidate();
    requestAnimationFrame(() => invalidate());
  }, [invalidate]);

  return null;
}
