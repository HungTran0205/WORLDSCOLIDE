/**
 * CombatAoeLayer — subscribes to engine 'aoe-telegraph' events from the combat
 * store and mounts an <AoeTelegraph> for each. Phase 08 of the standard tile
 * floor system.
 *
 * Lifecycle: each new recentEvents array (one per engine sync, ~5Hz unless an
 * event tick) is scanned exactly once via useEffect. A prevEventsRef guard
 * suppresses duplicate processing when the same array reference is replayed
 * (Suspense resolution, parent remount). Telegraphs unmount themselves via
 * the onComplete callback after their full duration elapses.
 *
 * The layer also gates on arenaPhase === 'fighting' so stale recentEvents
 * cannot spawn orphan telegraphs during prep / result transitions.
 *
 * Mounted between <CombatShadowLayer> and <CombatEntityLayer> in
 * <CombatSceneShell> so telegraphs render on the ground but under sprites.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/game/state/store';
import { AoeTelegraph } from '@/scene/sprites/aoe-telegraph';
import type { CombatEvent, AoeShape } from '@/game/systems/combat-types';

interface ActiveTelegraph {
  id: string;
  position: [number, number, number];
  radius: number;
  shape: AoeShape;
  durationMs: number;
  color: string;
}

export function CombatAoeLayer() {
  const recentEvents = useGameStore((s) => s.recentEvents);
  const arenaPhase = useGameStore((s) => s.arenaPhase);
  const [active, setActive] = useState<ActiveTelegraph[]>([]);
  const prevEventsRef = useRef<CombatEvent[] | null>(null);
  const idCounterRef = useRef(0);

  useEffect(() => {
    // Skip if same array ref re-fires (Suspense / remount replay) or if we're
    // not in active combat (arenaPhase guards stale events from prep / result).
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

    const spawns: ActiveTelegraph[] = [];
    for (const ev of recentEvents) {
      if (ev.type !== 'aoe-telegraph') continue;
      idCounterRef.current += 1;
      spawns.push({
        id: `${ev.attackerId}-${ev.skillId}-${Date.now()}-${idCounterRef.current}`,
        position: ev.position,
        radius: ev.radius,
        shape: ev.shape,
        durationMs: ev.durationMs,
        color: ev.color,
      });
    }
    if (spawns.length > 0) setActive((prev) => [...prev, ...spawns]);
  }, [recentEvents, arenaPhase]);

  // When combat exits, drop any in-flight telegraphs so they don't survive
  // a panel close → reopen cycle.
  useEffect(() => {
    if (arenaPhase !== 'fighting' && active.length > 0) {
      setActive([]);
    }
  }, [arenaPhase, active.length]);

  const handleComplete = useCallback((id: string) => {
    setActive((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (active.length === 0) return null;

  return (
    <>
      {active.map((t) => (
        <AoeTelegraph
          key={t.id}
          position={t.position}
          radius={t.radius}
          shape={t.shape}
          durationMs={t.durationMs}
          color={t.color}
          onComplete={() => handleComplete(t.id)}
        />
      ))}
    </>
  );
}
