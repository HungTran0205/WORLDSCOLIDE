/**
 * CombatSkillVfxLayer — data-driven skill VFX orchestrator.
 *
 * Subscribes to recentEvents (same pattern as CombatImpactLayer). For each
 * skill-use event with a registered cue sheet, schedules:
 *   - Mesh cues:      pool.acquire(kind) on setTimeout(atMs), driven in useFrame.
 *   - Trail cue:      continuous emitTrailAlong loop in useFrame for its window.
 *   - Imperative cues (particles/shake/hitstop/sound): delegated to dispatchImperativeCues.
 *
 * Bounded by MAX_CONCURRENT_SEQUENCES; trims oldest on overflow.
 * All timers + leases cleared on arenaPhase exit and unmount.
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useVFXEmitter } from 'r3f-vfx';
import { useGameStore } from '@/game/state/store';
import { pushDistortionRing, clear as clearDistortionRings } from '@/scene/combat/distortion/distortion-ring-store';
import { hasCueSheet, getCueSheet } from './skill-cue-registry';
import { dispatchImperativeCues } from './skill-cue-dispatcher';
import { resolveSkillEvent } from './skill-event-resolver';
import type { MeshAnchor } from './cue-sheet-types';
import * as pool from '@/scene/effects/mesh-fx/mesh-fx-pool';
import { emitTrailAlong } from '@/scene/effects/mesh-fx/trail-emit-helper';
import type { LeaseHandle } from '@/scene/effects/mesh-fx/mesh-fx-types';
import type { MeshFxKind } from '@/scene/effects/mesh-fx/mesh-fx-types';
import type { CombatEvent } from '@/game/systems/combat-types';

const MAX_CONCURRENT_SEQUENCES = 4;
const IMPACT_Y = 1.2;

interface MeshLease {
  lease: LeaseHandle; startMs: number; durationMs: number;
  /** When set, the mesh lerps from→to over its lifetime (traveling slash). */
  from?: [number, number, number];
  to?: [number, number, number];
}
interface TrailWindow {
  startMs: number; durationMs: number;
  from: readonly [number, number, number];
  to: readonly [number, number, number];
}
interface ActiveSequence {
  cancelled: boolean;
  imperativeTimers: ReturnType<typeof setTimeout>[];
  meshTimers: ReturnType<typeof setTimeout>[];
  meshLeases: MeshLease[];
  trailWindow: TrailWindow | null;
}

function _cleanup(seq: ActiveSequence): void {
  seq.cancelled = true;
  for (const t of seq.imperativeTimers) clearTimeout(t);
  for (const t of seq.meshTimers) clearTimeout(t);
  for (const ml of seq.meshLeases) ml.lease.release();
  seq.meshLeases.length = 0;
  seq.trailWindow = null;
}

/** Distortion strength for shockwave rings — Phase 08 owns tuning. */
const RING_DISTORTION_STRENGTH = 0.04;

export function CombatSkillVfxLayer() {
  const recentEvents  = useGameStore((s) => s.recentEvents);
  const arenaEntities = useGameStore((s) => s.arenaEntities);
  const arenaPhase    = useGameStore((s) => s.arenaPhase);
  const quality       = useGameStore((s) => s.settings.graphicsQuality);
  const gl = useThree((s) => s.gl);
  // Distortion is WebGPU-only — on WebGL the mesh ring carries the effect.
  const isWebGPU = 'isWebGPURenderer' in gl;

  // Emitters for all preset IDs used by registered cue sheets.
  const genHit          = useVFXEmitter('gen-hit');
  const genBurst        = useVFXEmitter('gen-burst');
  const genTrail        = useVFXEmitter('gen-trail');
  const genTrailFire    = useVFXEmitter('gen-trail-fire');
  const genTrailLance   = useVFXEmitter('gen-trail-lance');
  const lsFire          = useVFXEmitter('ls-fire');
  const lsSmoke         = useVFXEmitter('ls-smoke');
  const lsEarthSlam     = useVFXEmitter('ls-earth-slam');
  const lsHeal          = useVFXEmitter('ls-heal');
  const lsBlessingAura  = useVFXEmitter('ls-blessing-aura');
  const lsBlessingDust  = useVFXEmitter('ls-blessing-dust');
  const lsParryGlint    = useVFXEmitter('ls-parry-glint');
  const lsWarcryUpdraft = useVFXEmitter('ls-warcry-updraft');

  // Stable emitter map — updated each render so closures always call current emitter.
  const emittersRef = useRef<Record<string, (p: [number, number, number], n?: number) => void>>({});
  emittersRef.current = {
    'gen-hit':           (p, n) => genHit.emit(p, n ?? 20),
    'gen-burst':         (p, n) => genBurst.emit(p, n ?? 12),
    'gen-trail':         (p, n) => genTrail.emit(p, n ?? 10),
    'gen-trail-fire':    (p, n) => genTrailFire.emit(p, n ?? 3),
    'gen-trail-lance':   (p, n) => genTrailLance.emit(p, n ?? 5),
    'ls-fire':           (p, n) => lsFire.emit(p, n ?? 16),
    'ls-smoke':          (p, n) => lsSmoke.emit(p, n ?? 16),
    'ls-earth-slam':     (p, n) => lsEarthSlam.emit(p, n ?? 20),
    'ls-heal':           (p, n) => lsHeal.emit(p, n ?? 16),
    'ls-blessing-aura':  (p, n) => lsBlessingAura.emit(p, n ?? 12),
    'ls-blessing-dust':  (p, n) => lsBlessingDust.emit(p, n ?? 24),
    'ls-parry-glint':    (p, n) => lsParryGlint.emit(p, n ?? 12),
    'ls-warcry-updraft': (p, n) => lsWarcryUpdraft.emit(p, n ?? 16),
  };

  const prevEventsRef = useRef<CombatEvent[] | null>(null);
  const activeRef     = useRef<ActiveSequence[]>([]);

  useEffect(() => {
    if (
      arenaPhase !== 'fighting' ||
      recentEvents === prevEventsRef.current ||
      !recentEvents?.length
    ) {
      prevEventsRef.current = recentEvents ?? null;
      return;
    }
    prevEventsRef.current = recentEvents;

    // Cast-scoped dedup: casters whose cast-level cues already fired this batch.
    // Local (not a ref) so it resets every event batch.
    const seenCast = new Set<string>();

    for (const ev of recentEvents) {
      const resolved = resolveSkillEvent(ev);
      if (!resolved) continue;
      const { casterId, victimId, trigger } = resolved;

      const caster  = arenaEntities.find((e) => e.id === casterId);
      const skillId = caster?.skillId;
      if (!hasCueSheet(skillId)) continue;
      const sheet = getCueSheet(skillId)!;
      // Only fire a sheet for the event type it declares (default 'skill-use').
      if ((sheet.trigger ?? 'skill-use') !== trigger) continue;

      // Cast-scoped skills (Cleave) emit one event per struck target: run the
      // cast-level cues once per caster/batch; particles still emit per victim.
      const firstForCaster = !seenCast.has(casterId);
      if (sheet.castScoped) seenCast.add(casterId);
      const runCastLevel = !sheet.castScoped || firstForCaster;

      // Trim oldest sequence on overflow.
      if (activeRef.current.length >= MAX_CONCURRENT_SEQUENCES) {
        _cleanup(activeRef.current.shift()!);
      }

      // victimId null (self/team buff with no target) → anchor on the caster.
      const victim = victimId ? arenaEntities.find((e) => e.id === victimId) : null;
      const anchorEntity = victim ?? caster;
      const tPos: [number, number, number] = anchorEntity
        ? [anchorEntity.position.x, IMPACT_Y, anchorEntity.position.z]
        : [0, IMPACT_Y, 0];
      const aPos: [number, number, number] = caster
        ? [caster.position.x + 0.5, IMPACT_Y, caster.position.z]
        : [tPos[0] - 1.5, IMPACT_Y, tPos[2]];

      const meshAnchorPos = (kind: MeshFxKind, anchor?: MeshAnchor): [number, number, number] => {
        switch (anchor) {
          case 'caster':       return [aPos[0], IMPACT_Y, aPos[2]];
          case 'caster-front': return [aPos[0] + 0.7, IMPACT_Y, aPos[2]];
          case 'cluster':      return [(aPos[0] + tPos[0]) * 0.5, IMPACT_Y, tPos[2]];
          case 'target':       return tPos;
          default:
            // Legacy default: thrust-lance straddles the caster↔target midpoint.
            return kind === 'thrust-lance' ? [(aPos[0] + tPos[0]) * 0.5, tPos[1], tPos[2]] : tPos;
        }
      };

      const seq: ActiveSequence = {
        cancelled: false, imperativeTimers: [], meshTimers: [], meshLeases: [], trailWindow: null,
      };

      if (runCastLevel) {
        for (const cue of sheet.cues) {
          if (cue.type === 'mesh') {
            const { kind, atMs, durationMs, anchor, fromAnchor, color, scale } = cue;
            const meshPos = meshAnchorPos(kind, anchor);
            // Traveling mesh (e.g. Cleave slash): start at fromAnchor, fly to anchor.
            const fromPos = fromAnchor ? meshAnchorPos(kind, fromAnchor) : null;
            seq.meshTimers.push(setTimeout(() => {
              if (seq.cancelled) return;
              const lease = pool.acquire(kind, color);
              if (!lease) return;
              if (scale != null) lease.setScale(scale);
              const startPos = fromPos ?? meshPos;
              lease.setPosition(startPos[0], startPos[1], startPos[2]);
              seq.meshLeases.push({
                lease, startMs: performance.now(), durationMs,
                from: fromPos ?? undefined,
                to: fromPos ? meshPos : undefined,
              });
              // Screen-space ripple on WebGPU (mesh ring carries the WebGL effect).
              if (kind === 'shockwave-ring' && isWebGPU && quality !== 'low') {
                pushDistortionRing({ worldPos: meshPos, durationMs, maxStrength: RING_DISTORTION_STRENGTH });
              }
            }, atMs));
          } else if (cue.type === 'trail') {
            // 'low' quality skips the weapon trail entirely (CPU particle cost).
            if (quality === 'low') continue;
            const { atMs, durationMs } = cue;
            seq.meshTimers.push(setTimeout(() => {
              if (seq.cancelled) return;
              // Trail shares the target's Z lane so it stays co-planar with the lance
              // mesh (positioned at tPos.z). Using aPos.z misaligns across rows.
              seq.trailWindow = {
                startMs: performance.now(), durationMs,
                from: [aPos[0], aPos[1], tPos[2]],
                to: tPos,
              };
            }, atMs));
          }
        }
      }

      // Full cue set on the cast-level pass; particles-only on later same-cast
      // events so scatter debris lands on each victim without re-firing mesh/shake.
      const impCues = runCastLevel ? sheet.cues : sheet.cues.filter((c) => c.type === 'particles');
      seq.imperativeTimers = dispatchImperativeCues(impCues, tPos, {
        emitParticles: (id, pos, count) => {
          // 'low' quality halves scatter-particle counts (sequence stays legible).
          const n = count != null && quality === 'low' ? Math.ceil(count * 0.5) : count;
          emittersRef.current[id]?.(pos, n);
        },
      });
      activeRef.current.push(seq);
    }
  }, [recentEvents, arenaPhase, arenaEntities]);

  // Clear all sequences on combat exit.
  useEffect(() => {
    if (arenaPhase !== 'fighting' && activeRef.current.length > 0) {
      for (const s of activeRef.current) _cleanup(s);
      activeRef.current = [];
      clearDistortionRings();
    }
  }, [arenaPhase]);

  // Clear on unmount.
  useEffect(() => () => {
    for (const s of activeRef.current) _cleanup(s);
    activeRef.current = [];
  }, []);

  useFrame(() => {
    const nowMs = performance.now();
    for (const seq of activeRef.current) {
      // Advance mesh leases and release completed ones.
      for (let i = seq.meshLeases.length - 1; i >= 0; i--) {
        const ml = seq.meshLeases[i];
        const t = Math.min((nowMs - ml.startMs) / ml.durationMs, 1);
        ml.lease.setProgress(t);
        // Traveling slash: lerp position from→to across the lifetime.
        if (ml.from && ml.to) {
          ml.lease.setPosition(
            ml.from[0] + (ml.to[0] - ml.from[0]) * t,
            ml.from[1] + (ml.to[1] - ml.from[1]) * t,
            ml.from[2] + (ml.to[2] - ml.from[2]) * t,
          );
        }
        if (t >= 1) { ml.lease.release(); seq.meshLeases.splice(i, 1); }
      }
      // Emit trail particles along the lance path while the window is active.
      if (seq.trailWindow) {
        const elapsed = nowMs - seq.trailWindow.startMs;
        if (elapsed < seq.trailWindow.durationMs) {
          emitTrailAlong(
            (pos, count) => genTrailLance.emit(pos as [number, number, number], count ?? 5),
            seq.trailWindow.from, seq.trailWindow.to,
            elapsed / seq.trailWindow.durationMs, 5,
          );
        } else {
          seq.trailWindow = null;
        }
      }
    }
  });

  return null;
}
