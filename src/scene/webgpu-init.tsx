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

  // Probe adapter before constructing the renderer — null means no
  // compatible GPU (blocklisted driver, software rasterizer only, etc.)
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      console.log('[Renderer] WebGL active — no WebGPU adapter available');
      return new WebGLRenderer(glProps as any);
    }
  } catch (e) {
    console.warn('[Renderer] WebGPU adapter probe failed, falling back to WebGL:', e);
    return new WebGLRenderer(glProps as any);
  }

  // Try WebGPU init — transient failures here fall back for this load only,
  // but leave no persistent flag so the next reload retries.
  try {
    const { WebGPURenderer } = await import('three/webgpu');
    const renderer = new WebGPURenderer(glProps as any);
    await renderer.init();

    // Device loss: warn + reload. No flag — next load retries WebGPU.
    const device = (renderer as any).backend?.device as GPUDevice | undefined;
    if (device) {
      device.lost.then((info) => {
        console.warn('[Renderer] WebGPU device lost — reloading to retry', info);
        window.location.reload();
      });
    }

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
