/**
 * Infirmary recovery engine — per-tick progress accrual for injured members.
 *
 * Replaces the old flat-deadline auto-clear. Injured members heal by accruing
 * `recoveryProgress` (0→1) each tick at a rate derived from their bed/queue
 * placement: members on an infirmary bed heal faster (level-scaled), the rest
 * queue and still heal at the passive rate so the roster is never stuck.
 *
 * Bed/queue assignment is DERIVED every tick (sort injured by injury time) —
 * no stored slot state, so recovering a bedded member auto-promotes the
 * next-oldest queued member on the following tick.
 */

import type { GameStore } from '@/game/state/store';
import type { Member, GuildFacility } from '@/game/state/game-state';
import { FACILITY_DEFINITIONS } from '@/game/data/facility-definitions';

/** Bed recovery-time multiplier by infirmary level (index = level − 1). Lower = faster heal. */
const BED_SPEED_FACTOR = [0.6, 0.5, 0.4] as const;
/** Queued / no-infirmary members heal at the full (slow) wall-clock rate. */
const PASSIVE_SPEED_FACTOR = 1.0;
/** Skip is only allowed once remaining real-time drops to ≤ 5 min. */
export const SKIP_THRESHOLD_MS = 5 * 60 * 1000;
/** Guard for HMR / hand-edited saves where `baseRecoveryMs` is missing. */
const FALLBACK_BASE_RECOVERY_MS = 120_000;

/** One injured member's derived recovery placement for a single tick. */
export interface InjuryRecoveryRow {
  member: Member;
  bedded: boolean;
  /** 0-based bed index when bedded; 0-based queue position otherwise. */
  position: number;
  speedFactor: number;
  /** Recovery progress, 0..1. */
  progress: number;
  /** Real-ms left until full recovery at the current speed (for UI + skip gate). */
  remainingMs: number;
}

/**
 * Single source of truth for "who is bedded, at what speed, with what remaining
 * time". Used by the recovery engine, the Skip action, and the room card so all
 * three agree on ranking.
 *
 * Capacity stacks across every active infirmary instance: beds sum across them,
 * while heal speed uses the highest infirmary level among them.
 */
export function resolveInjuryQueue(
  members: Member[],
  facilities: GuildFacility[],
): { beds: number; level: number; rows: InjuryRecoveryRow[] } {
  const injured = members
    .filter((m) => m.status === 'injured')
    .sort((a, b) => {
      const at = (a.injuredAt ?? 0) - (b.injuredAt ?? 0);
      return at !== 0 ? at : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

  const infirmaries = facilities.filter((f) => f.type === 'infirmary' && f.level > 0);
  const level = infirmaries.reduce((max, f) => Math.max(max, f.level), 0);
  const beds = infirmaries.reduce(
    (sum, f) => sum + FACILITY_DEFINITIONS.infirmary.maxSlots[f.level - 1],
    0,
  );

  const rows: InjuryRecoveryRow[] = injured.map((member, i) => {
    const bedded = i < beds;
    const speedFactor = bedded ? BED_SPEED_FACTOR[level - 1] : PASSIVE_SPEED_FACTOR;
    const base = member.baseRecoveryMs ?? FALLBACK_BASE_RECOVERY_MS;
    const progress = member.recoveryProgress ?? 0;
    return {
      member,
      bedded,
      position: bedded ? i : i - beds,
      speedFactor,
      progress,
      remainingMs: Math.max(0, (1 - progress) * base * speedFactor),
    };
  });

  return { beds, level, rows };
}

/**
 * Advance every injured member's recovery by `dtMs` of wall-clock time.
 * Members reaching progress ≥ 1 recover; the rest get their new progress.
 * Pure given `(store, dtMs)`; performs a single batched state write.
 */
export function processInjuryRecovery(store: GameStore, dtMs: number): void {
  if (dtMs <= 0) return;
  const members = store.founder ? [store.founder, ...store.roster] : store.roster;
  const { rows } = resolveInjuryQueue(members, store.facilities);
  if (rows.length === 0) return;

  const progressUpdates: { id: string; progress: number }[] = [];
  const recoveredIds: string[] = [];
  for (const row of rows) {
    const base = row.member.baseRecoveryMs ?? FALLBACK_BASE_RECOVERY_MS;
    const next = row.progress + (dtMs / base) / row.speedFactor;
    if (next >= 1) recoveredIds.push(row.member.id);
    else progressUpdates.push({ id: row.member.id, progress: next });
  }

  store.applyInjuryRecovery(progressUpdates, recoveredIds);
}
