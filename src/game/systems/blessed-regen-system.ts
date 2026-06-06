/**
 * Blessed resource regen engine — refills each Linh Sơn member's `blessedPct`
 * (0→1) over real time while they idle at the guild hall. A full bar gates the
 * Ancestral Blessings combat buff.
 *
 * Rules:
 *  - A drained bar refills to full over BLESSED_FULL_MS of wall-clock time
 *    (30 real min == 1 game-day), accruing `dtMs / BLESSED_FULL_MS` per tick.
 *  - Members dispatched on an active mission do NOT regen — their bar is frozen
 *    while away; everyone else idling at the hall accrues, capped at 1.
 *  - Offline catch-up needs no separate code path: the first tick after load runs
 *    with dt = the full offline window (the wall-clock delta is only consumed once
 *    `tickClock` advances), the same single-source pattern injury recovery uses.
 *  - Linh Sơn-only: Blessed is their civ resource; other civs never accrue.
 */

import type { GameStore } from '@/game/state/store';
import type { Member } from '@/game/state/game-state';
import { getBlessedPct } from '@/game/state/game-state';

/** Wall-clock time for an empty Blessed bar to refill to full (30 real min). */
export const BLESSED_FULL_MS = 30 * 60 * 1000;

/**
 * Advance the Blessed bar of every idle Linh Sơn member by `dtMs`.
 * Members on an active mission and members already at full are skipped.
 * Pure given `(store, dtMs)`; performs a single batched state write.
 */
export function processBlessedRegen(store: GameStore, dtMs: number): void {
  if (dtMs <= 0) return;

  // Frozen-while-dispatched: anyone listed in an active mission party.
  const busy = new Set(store.activeMissions.flatMap((m) => m.memberIds));
  const members: Member[] = store.founder ? [store.founder, ...store.roster] : store.roster;

  const updates: { id: string; pct: number }[] = [];
  for (const m of members) {
    if (m.civilization !== 'LinhSon') continue; // Blessed is a Linh Sơn resource
    if (busy.has(m.id)) continue;               // dispatched → bar frozen
    const cur = getBlessedPct(m);
    if (cur >= 1) continue;                     // already full
    updates.push({ id: m.id, pct: Math.min(1, cur + dtMs / BLESSED_FULL_MS) });
  }

  if (updates.length > 0) store.applyBlessedRegen(updates);
}
