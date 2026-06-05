/**
 * useImpactLifecycle — the shared lifecycle for every combat-impact mesh
 * (slash / sword-thrust / axe-chop / beam). Owns the boilerplate that was
 * duplicated across the old slash-impact-vfx and beam-flash-vfx:
 *
 *  - async per-instance material build (with WebGL-fallback timeout so the
 *    parent's VFX slot still releases when no material renders),
 *  - windup `delayS` gating (mesh hidden until the attack's connect frame),
 *  - normalized progress 0→1 over `durationS` pushed into handle.setProgress,
 *  - a single onComplete fire at end of life,
 *  - an optional per-frame `onFrame` callback for type-specific transforms
 *    (billboard toward camera, or orient a beam) — invoked only while visible.
 *
 * A new attack type now needs only a material factory + a registry entry; it
 * reuses this hook instead of re-copying the lifecycle (see impact-registry).
 *
 * WebGPU-only visuals: on a WebGL fallback `build` returns null and nothing
 * renders, but onComplete still fires after the nominal lifetime.
 */

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Mesh, type Camera } from 'three';
import type { ImpactMaterialHandle } from './impact-material-types';

export interface ImpactFrameContext {
  mesh: Mesh;
  camera: Camera;
  /** Normalized 0→1 lifetime progress (only delivered while the mesh is visible). */
  progress: number;
}

export interface UseImpactLifecycleOptions {
  /** Build the per-instance material. Resolves null on the WebGL fallback. */
  build: (renderer: unknown) => Promise<ImpactMaterialHandle | null>;
  /** Visible lifetime in seconds (after the windup delay). */
  durationS: number;
  /** Windup delay before the impact appears, syncing to the attack connect frame. */
  delayS: number;
  /** Fired exactly once at end of life; the parent unmounts the component. */
  onComplete: () => void;
  /** Optional per-frame transform, called only while visible (billboard / orient). */
  onFrame?: (ctx: ImpactFrameContext) => void;
}

export function useImpactLifecycle({
  build,
  durationS,
  delayS,
  onComplete,
  onFrame,
}: UseImpactLifecycleOptions): { meshRef: React.RefObject<Mesh | null>; handle: ImpactMaterialHandle | null } {
  const meshRef = useRef<Mesh>(null);
  const mountRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const [handle, setHandle] = useState<ImpactMaterialHandle | null>(null);

  // Keep latest callbacks so a deferred fire (WebGL timeout) never calls a stale
  // closure if the parent rebinds onComplete/onFrame after mount.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const buildRef = useRef(build);
  buildRef.current = build;

  const gl = useThree((s) => s.gl);

  const complete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  };

  useEffect(() => {
    let cancelled = false;
    let created: ImpactMaterialHandle | null = null;
    let webglTimeout: ReturnType<typeof setTimeout> | undefined;
    const fallbackMs = (delayS + durationS) * 1000;

    buildRef
      .current(gl)
      .then((h) => {
        if (cancelled) {
          h?.dispose();
          return;
        }
        if (!h) {
          // WebGL fallback — no VFX, but release the slot after the lifetime.
          webglTimeout = setTimeout(complete, fallbackMs);
          return;
        }
        created = h;
        setHandle(h);
      })
      .catch((err) => {
        // Surface TSL build failures instead of silently never rendering.
        console.error('[useImpactLifecycle] material build failed:', err);
        if (!cancelled) webglTimeout = setTimeout(complete, fallbackMs);
      });

    return () => {
      cancelled = true;
      completedRef.current = true;
      created?.dispose();
      if (webglTimeout) clearTimeout(webglTimeout);
    };
    // build/delayS/durationS are stable per mount; gl is the renderer instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  useFrame(({ clock, camera }) => {
    const mesh = meshRef.current;
    if (!handle || !mesh) return;
    const now = clock.elapsedTime;
    if (mountRef.current === null) mountRef.current = now;
    // Hold hidden through the attack windup, then play.
    if (now < mountRef.current + delayS) {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    if (startRef.current === null) startRef.current = now;
    const progress = Math.min((now - startRef.current) / durationS, 1);
    handle.setProgress(progress);
    onFrameRef.current?.({ mesh, camera, progress });
    if (progress >= 1) complete();
  });

  return { meshRef, handle };
}
