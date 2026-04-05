/**
 * Renderer factory for R3F v9 — WebGPU with automatic WebGL fallback.
 *
 * WebGPU and WebGL share GPU context — if WebGPU renderer is created first,
 * it consumes the context and WebGL can't create one until page reload.
 * We solve this by persisting WebGPU viability in localStorage:
 *
 * 1. First visit: try WebGPU → if device lost → save flag → auto-reload
 * 2. Subsequent visits: flag exists → skip WebGPU → use WebGL directly
 * 3. Settings can clear the flag to retry WebGPU after driver updates
 */
import { useEffect, useRef } from 'react';
import { WebGLRenderer } from 'three';
import { useThree } from '@react-three/fiber';

const WEBGPU_FAILED_KEY = 'webgpu-device-failed';

/** Check if WebGPU previously failed on this system */
export function isWebGPUBlocked(): boolean {
  return localStorage.getItem(WEBGPU_FAILED_KEY) === '1';
}

/** Clear the WebGPU failure flag (e.g. from Settings after driver update) */
export function clearWebGPUBlock(): void {
  localStorage.removeItem(WEBGPU_FAILED_KEY);
}

/** Async renderer factory for R3F Canvas gl prop */
export async function createWebGPURenderer(props: Record<string, unknown>) {
  // alpha: true so canvas is transparent — lets CSS background show through
  const glProps = { ...props, alpha: true };

  /* Try WebGPU only if not previously blocked */
  if (!isWebGPUBlocked() && navigator.gpu) {
    try {
      const { WebGPURenderer } = await import('three/webgpu');
      const renderer = new WebGPURenderer(glProps as any);
      await renderer.init();

      /* Watch for device loss — if it happens, persist flag and reload
       * so next load goes straight to WebGL with a clean GPU context. */
      const device = (renderer as any).backend?.device as GPUDevice | undefined;
      if (device) {
        device.lost.then(() => {
          console.warn('[Renderer] WebGPU device lost — saving flag and reloading');
          localStorage.setItem(WEBGPU_FAILED_KEY, '1');
          window.location.reload();
        });
      }

      console.log('[Renderer] WebGPU active');
      return renderer;
    } catch (e) {
      console.warn('[Renderer] WebGPU init failed:', e);
      localStorage.setItem(WEBGPU_FAILED_KEY, '1');
    }
  }

  console.log('[Renderer] WebGL active');
  return new WebGLRenderer(glProps as any);
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
