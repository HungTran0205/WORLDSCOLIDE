# Room: Infirmary

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS.infirmary`
**System:** injury recovery via member `status` / `injuredAt` / `baseRecoveryMs` / `recoveryProgress` fields in `src/game/state/game-state.ts`; bed/queue resolver + per-tick engine in `src/game/systems/infirmary-recovery.ts` (`resolveInjuryQueue`, `processInjuryRecovery`); skip + lastSkipDay gate in `src/game/state/guild-slice.ts` → `skipMemberRecovery`.

> **Implementation status:** implemented (plan `260527-2037-infirmary-recovery-logic`, save v30). Recovery is driven by per-tick `recoveryProgress` accrual; beds sum across infirmary instances and heal at the highest active level's speed factor; queued members heal at the passive ×1.0 rate. Skip-5min is gated guild-wide once per game day via `lastSkipDay` on the primary infirmary.

## Purpose

Heals injured guild members. **Not** a production room — no resource output, and **no member works here**. The slots are *recovery beds* occupied by the injured members themselves, NOT worker slots. Members with `status === 'injured'` recover here and cannot be assigned to production rooms or missions until fully healed (HP 100%).

## Build Requirements

- Cost: **500g + 50 Stone + 50 Wood**
- Upgrades: +350g → Lv2, +600g → Lv3
- `maxSlots: [1, 2, 3]` — these are **recovery beds**, not worker slots
- **No primary stat** — recovery speed does NOT depend on any member's stats (END, INT, or otherwise)
- Requires guild level 3 before appearing in the build picker

## Recovery Model

### PX Goal
Make the player *feel* the cost of over-pushing the roster: injuries are a sustain tax, and bed capacity is a resource to manage. Upgrading should feel like real relief (more beds + faster heal), not a checkbox.

### Beds vs Queue
- Active **beds** = `maxSlots[level]` → 1 / 2 / 3.
- Injured members fill beds **FIFO by injury time**. Members beyond bed capacity enter a **queue**.
- When a bedded member reaches 100%, they leave (→ `idle`) and the **first queued member auto-promotes** into the freed bed.
- Bed count is capped by infirmary level only — no longer tied to party size (that earlier rule was wrong and is removed).

### Recovery speed (independent of member stats)
Each injured member carries `baseRecoveryMs`, set once at injury time from **injury severity**:

```
baseRecoveryMs = mission.durationMs × 0.5   // harder / longer missions → longer recovery
```

Progress accrues over time, scaled by a **speed factor** that depends ONLY on the member's location + the infirmary LEVEL — never on member stats:

| Location | Speed factor | Effective heal time |
|----------|-------------|---------------------|
| Queue / no infirmary built (passive rest) | ×1.0 | = baseRecoveryMs (full) |
| Bed — Infirmary Lv1 | ×0.6 | 40% faster |
| Bed — Infirmary Lv2 | ×0.5 | half time |
| Bed — Infirmary Lv3 | ×0.4 | 60% faster |

**Why queued members still heal (×1.0):** the roster must never be permanently stuck. Injuries can occur from guild level 1, but the infirmary only unlocks at guild level 3 — so a hard "no bed = no recovery" gate would strand early members. Beds are an **accelerator + capacity boost**, not a hard requirement.

Implementation note: per tick, `recoveryProgress += (dt / baseRecoveryMs) × rateMultiplier`, where `rateMultiplier = 1 / speedFactor` (passive 1.0; beds 1.67 / 2.0 / 2.5 by level). Member recovers when `recoveryProgress ≥ 1`.

### Base recovery time examples (before speed factor)

| Mission duration | baseRecoveryMs (×0.5) | On a Lv3 bed (×0.4) |
|------------------|----------------------|---------------------|
| 4 min | ~2 min | ~48 s |
| 8 min | ~4 min | ~1.6 min |
| 12 min | ~6 min | ~2.4 min |

## Interaction Rules

- Injured members are **locked in the infirmary until 100% recovered** — they **cannot be withdrawn early**, and cannot join production rooms or missions until HP is full.
- This applies to **both bedded and queued** members. Queued members are locked too; they auto-promote into a bed when one frees.
- While injured (any state): item repair/upgrade on that member is blocked.

## Skip Option

- When a member's `remainingTime ≤ 5 minutes`: a **"Skip 5 min"** button appears on that member's row — instantly completes their recovery.
- **Limited to once per game day, guild-wide** (one use total across all beds, not per member). 1 game day = 30 real minutes (`clock-slice.ts`). Resets at day rollover.
- Implementation: store a `lastSkipDay` flag on the infirmary and gate the button against `currentDay` — mirror the existing once-per-day pattern in `guild-slice.ts` (`tickTavernDay` / `rerolledToday` / `lastDayProcessed`).

## Room Card UI (REQUIRED)

The room card MUST surface the full recovery state — beds AND queue — because injured count can exceed bed count.

**Header:** `Beds: {occupied}/{maxSlots} · Queue: {n} waiting`

**Beds section** (up to `maxSlots` rows): portrait · name · progress bar · remaining time · speed badge (×0.6 / ×0.5 / ×0.4) · "Skip 5 min" button when eligible.

**Queue section** (remaining injured): portrait · name · queue position (#1, #2…) · slow progress bar · "waiting for bed" label.

```
Infirmary  Lv3        Beds: 3/3 · Queue: 2 waiting
─────────────────────────────────────────────────
 BEDS
  An    [#######···]  70%   1m 12s   ×0.4
  Bình  [####······]  45%   2m 38s   ×0.4   [Skip 5m]
  Cường [##········]  25%   3m 50s   ×0.4
 QUEUE
  Lan   #1  [#·········] 12%   waiting for bed
  Minh  #2  [··········]  3%   waiting for bed
```

## Merc vs Member Distinction

Guild members who reach HP = 0 in combat: status → `injured`, enter the Infirmary on mission return.

**Tavern mercs who reach HP = 0: "Defeated" — do NOT enter the Infirmary.** Mercs are temp-contract only; they despawn. See [`rooms/tavern.md`](tavern.md) §Merc System.

## Upgrade Path

| Level | Beds | Bed heal speed | Notes |
|-------|------|---------------|-------|
| 1 | 1 | ×0.6 | Basic recovery, single bed |
| 2 | 2 | ×0.5 | +1 bed, half-time heal |
| 3 | 3 | ×0.4 | +1 bed, fastest heal, deepest throughput |

## References

- Member injury state: `src/game/state/game-state.ts` — `Member.status`, `Member.injuredAt`, `Member.baseRecoveryMs`, `Member.recoveryProgress` (legacy `injuredUntil` retained for save-compat, no longer the driver)
- Recovery engine + bed/queue resolver: `src/game/systems/infirmary-recovery.ts` — `processInjuryRecovery`, `resolveInjuryQueue`
- Skip + once-per-day gate: `src/game/state/guild-slice.ts` — `skipMemberRecovery` (uses `GuildFacility.lastSkipDay` on the primary infirmary)
- Injury trigger: `src/game/systems/arena-result-handler.ts`, `src/game/systems/mission-tick.ts` (calls `injureMember` with `baseRecoveryMs`/`injuredAt`)
- Facility def: `src/game/data/facility-definitions.ts`
- Save migration: `src/game/save/save-migrations.ts` (v29→v30)

## Open Questions

None outstanding. Resolved decisions:
- Queue ordering: **strict FIFO** (no manual priority reorder).
- Skip: **once per game day, guild-wide** (no premium instant-recovery).
- Speed factors ×0.6 / ×0.5 / ×0.4 (+ passive ×1.0): accepted as first-pass values, tune after playtest.
