/**
 * CombatImpactLayer — subscribes to engine attack events from the combat store
 * and spawns a per-hit impact mesh: a camera-facing silhouette (<ImpactBillboardVfx>:
 * slash / sword-thrust / axe-chop) or a ranged beam (<BeamFlashVfx>). The
 * attacker's archetype picks the silhouette via resolveImpactKind; the
 * IMPACT_REGISTRY holds each kind's factory + tuning. Meshes only: all particle
 * feedback (hit debris, crit burst, heal, death) stays owned by
 * combat-fight-controller's emitVfxFromEvents so there is exactly one emit per
 * event — this layer does NOT emit particles. The civ glow tint on ally
 * hit-debris lives in the controller; the shared palette is COMBAT_IMPACT_COLORS
 * (combat-vfx-bridge.ts).
 *
 * Lifecycle mirrors combat-aoe-layer.tsx: each new recentEvents array (one per
 * engine sync) is scanned exactly once via useEffect. A prevEventsRef guard
 * suppresses duplicate processing when the same array reference is replayed
 * (Suspense resolution, parent remount). Impact meshes unmount themselves
 * via their onComplete callback.
 *
 * Gated on arenaPhase === 'fighting' so stale recentEvents cannot spawn orphan
 * impacts during prep / result transitions. Concurrent slash/beam meshes are
 * capped at 4 (oldest trimmed on overflow) to bound mesh count during AOE
 * multi-hits; particle emits are uncapped (r3f-vfx enforces maxParticles).
 *
 * WebGPU-only visuals: on a WebGL fallback the slash/beam materials return null
 * and the meshes never render, but onComplete still fires so slots release.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/game/state/store';
import {
  ImpactBillboardVfx,
  BeamFlashVfx,
  IMPACT_REGISTRY,
  resolveImpactKind,
  type ImpactKind,
} from '@/scene/effects/combat-impact';
import { COMBAT_IMPACT_COLORS, COMBAT_IMPACT_DELAY_S } from './combat-vfx-bridge';
import type { CombatEvent } from '@/game/systems/combat-types';

/** World-space height (y) at which target impacts render — torso level. */
const IMPACT_Y = 1.2;

/** Beam origin height — the attacker's held-weapon level (gun/bow at chest),
 *  higher than the body-center IMPACT_Y so the bolt leaves the weapon, not the hip. */
const BEAM_ORIGIN_Y = 1.7;

/** Concurrent slash/beam mesh cap — trims oldest on overflow (AOE multi-hits). */
const MAX_CONCURRENT_IMPACTS = 4;

interface ActiveImpact {
  id: string;
  kind: ImpactKind;
  attackerPos: [number, number, number];
  targetPos: [number, number, number];
  color: string;
  glowColor: string;
}

/** Mesh palette — LinhSon warm amber ink + cyan glow, from the shared bridge
 *  constant. Reused for the attacker-missing fallback so the source stays
 *  single. Future civs add an entity param here to branch the palette. */
const DEFAULT_IMPACT_COLORS = {
  color: COMBAT_IMPACT_COLORS.ink,
  glowColor: COMBAT_IMPACT_COLORS.glow,
} as const;

function getImpactColors(): { color: string; glowColor: string } {
  return DEFAULT_IMPACT_COLORS;
}

export function CombatImpactLayer() {
  const recentEvents = useGameStore((s) => s.recentEvents);
  const arenaEntities = useGameStore((s) => s.arenaEntities);
  const arenaPhase = useGameStore((s) => s.arenaPhase);
  const [active, setActive] = useState<ActiveImpact[]>([]);
  const prevEventsRef = useRef<CombatEvent[] | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    // Skip if same array ref re-fires (Suspense / remount replay) or if we're
    // not in active combat (arenaPhase guards stale prep / result events).
    if (
      arenaPhase !== 'fighting' ||
      recentEvents === prevEventsRef.current ||
      !recentEvents ||
      recentEvents.length === 0
    ) {
      prevEventsRef.current = recentEvents ?? null;
      return;
    }
    prevEventsRef.current = recentEvents;

    const spawns: ActiveImpact[] = [];
    for (const ev of recentEvents) {
      if (ev.type !== 'auto-attack' && ev.type !== 'skill-use') continue;

      const attacker = arenaEntities.find((e) => e.id === ev.attackerId);
      const target = arenaEntities.find((e) => e.id === ev.targetId);
      if (!target) continue;

      const targetPos: [number, number, number] = [target.position.x, IMPACT_Y, target.position.z];
      // Beam origin sits at the attacker's weapon height (BEAM_ORIGIN_Y), not the
      // body center. Fallback (1.5u to the target's left) when the attacker entity
      // can't be resolved — keeps the beam segment plausible.
      const attackerPos: [number, number, number] = attacker
        ? [attacker.position.x + 1, BEAM_ORIGIN_Y, attacker.position.z]
        : [target.position.x - 1.5, BEAM_ORIGIN_Y, target.position.z];

      // Archetype → silhouette (ranged → beam, warrior → axe, sword → thrust,
      // else → slash). Attacker-missing (most enemies) falls back to the default
      // melee crescent.
      const kind = resolveImpactKind(attacker?.archetype);
      const colors = attacker ? getImpactColors() : DEFAULT_IMPACT_COLORS;

      idRef.current += 1;
      spawns.push({
        id: `impact-${idRef.current}`,
        kind,
        attackerPos,
        targetPos,
        ...colors,
      });
    }

    if (spawns.length === 0) return;
    // Bound concurrent slash/beam meshes; trim oldest on overflow.
    setActive((prev) => [...prev, ...spawns].slice(-MAX_CONCURRENT_IMPACTS));
  }, [recentEvents, arenaPhase, arenaEntities]);

  // When combat exits, drop any in-flight impacts so they don't survive a
  // panel close → reopen cycle.
  useEffect(() => {
    if (arenaPhase !== 'fighting' && active.length > 0) {
      setActive([]);
    }
  }, [arenaPhase, active.length]);

  const remove = useCallback((id: string) => {
    setActive((prev) => prev.filter((a) => a.id !== id));
  }, []);

  if (active.length === 0) return null;

  return (
    <>
      {active.map((a) => {
        const def = IMPACT_REGISTRY[a.kind];
        if (def.shape === 'beam') {
          return (
            <BeamFlashVfx
              key={a.id}
              from={a.attackerPos}
              to={a.targetPos}
              color={a.glowColor}
              delayS={COMBAT_IMPACT_DELAY_S}
              onComplete={() => remove(a.id)}
            />
          );
        }
        return (
          <ImpactBillboardVfx
            key={a.id}
            position={a.targetPos}
            buildMaterial={def.build}
            size={def.size}
            durationS={def.durationS}
            baseAngle={def.baseAngle}
            jitterAngle={def.jitterAngle}
            color={a.color}
            glowColor={a.glowColor}
            delayS={COMBAT_IMPACT_DELAY_S}
            onComplete={() => remove(a.id)}
          />
        );
      })}
    </>
  );
}
