/**
 * MeshFxVfx — per-cast driver for pool-backed mesh effects.
 *
 * Does NOT mount a mesh. On play it acquires a pre-warmed pool slot, drives
 * setProgress 0→1 over durationS (after delayS windup), then releases the
 * slot back to the pool and fires onComplete. If the pool is cold or all
 * slots are busy, onComplete fires after the nominal lifetime so the caller's
 * slot-release logic stays symmetric.
 *
 * Mirrors the timing contract of useImpactLifecycle (windup gate, single
 * onComplete fire at end of life) without re-mounting a material per cast.
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as pool from './mesh-fx-pool';
import { presentationNow } from '@/scene/combat/hitstop/hitstop-clock';
import type { MeshFxKind, LeaseHandle } from './mesh-fx-types';

export interface MeshFxVfxProps {
  /** Which pool kind to drive. */
  kind: MeshFxKind;
  /** World-space spawn position [x, y, z]. */
  position: [number, number, number];
  /** Visible lifetime in seconds (after delayS). */
  durationS: number;
  /** Ink/edge color hex. Defaults to pool slot's last color if omitted. */
  color?: string;
  /** Windup delay in seconds before effect appears. Default 0. */
  delayS?: number;
  /** Fired exactly once at end of life; parent should unmount this component. */
  onComplete: () => void;
}

export function MeshFxVfx({
  kind,
  position,
  durationS,
  color,
  delayS = 0,
  onComplete,
}: MeshFxVfxProps) {
  const leaseRef     = useRef<LeaseHandle | null>(null);
  const mountTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const lease = pool.acquire(kind, color);
    if (!lease) {
      // Pool cold or exhausted — fire onComplete after nominal lifetime so the
      // orchestrator's slot accounting stays symmetric (no dangling mounted driver).
      const t = setTimeout(onCompleteRef.current, (delayS + durationS) * 1000);
      return () => clearTimeout(t);
    }
    lease.setPosition(...position);
    leaseRef.current = lease;

    return () => {
      if (!completedRef.current) lease.release();
      leaseRef.current = null;
    };
    // Props are per-cast stable; no dep array required.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(({ clock }) => {
    const lease = leaseRef.current;
    if (!lease || completedRef.current) return;

    // Use presentation clock so mesh-FX progress stalls during hitstop windows.
    const now = presentationNow(clock.elapsedTime);
    if (mountTimeRef.current === null) mountTimeRef.current = now;

    // Hold invisible through windup delay.
    if (now < mountTimeRef.current + delayS) return;

    if (startTimeRef.current === null) startTimeRef.current = now;
    const progress = Math.min((now - startTimeRef.current) / durationS, 1);
    lease.setProgress(progress);

    if (progress >= 1) {
      completedRef.current = true;
      lease.release();
      leaseRef.current = null;
      onCompleteRef.current();
    }
  });

  return null;
}
