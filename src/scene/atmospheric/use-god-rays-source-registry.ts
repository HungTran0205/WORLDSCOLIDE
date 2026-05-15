/**
 * God-rays light source registry.
 *
 * `GodRaysEffect` requires a single `sun` mesh ref. Each room may want a
 * different hero light (forge, drum, lantern, sun). Components mount their
 * candidate mesh and register it here keyed by a stable `sourceId`. The
 * atmospheric composer reads by id at render time.
 *
 * Module-level Map is intentional: lights need to survive provider re-mounts
 * (room transitions don't unmount the source), and we never need React
 * subscription — the composer reads once per frame inside R3F.
 *
 * Phase 02: just plumbing — Phase 05 will mount actual sources per room.
 */

import { useEffect } from 'react';
import type * as THREE from 'three';

type GodRaysSource = THREE.Object3D;
type GodRaysRef = { current: GodRaysSource | null };

const registry = new Map<string, GodRaysRef>();

/** Register a mesh/light as the god-rays source for `sourceId`. Auto-unregisters
 *  on unmount. Re-registering the same id overwrites the prior ref. */
export function useRegisterGodRaysSource(sourceId: string, ref: GodRaysRef): void {
  useEffect(() => {
    registry.set(sourceId, ref);
    return () => {
      // Only delete if WE are the current registered ref (another component
      // may have overridden before our unmount).
      if (registry.get(sourceId) === ref) registry.delete(sourceId);
    };
  }, [sourceId, ref]);
}

/** Read the currently registered source mesh for `sourceId`, or `null`. */
export function getGodRaysSource(sourceId: string): GodRaysSource | null {
  return registry.get(sourceId)?.current ?? null;
}
