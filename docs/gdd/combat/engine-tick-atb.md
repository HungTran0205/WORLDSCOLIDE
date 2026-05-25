# Combat — Engine Tick & ATB Model

**Code:** `src/game/systems/combat-engine.ts`, `combat-arena-types.ts`, `combat-simulator.ts`

---

## Execution Model

Combat is **real-time with individual per-entity cooldowns** — not a shared turn queue.
Each entity has its own `nextAttackAt` timestamp (ms); the engine ticks every 100ms and
acts for every entity whose cooldown has expired.

```
LOGIC_TICK_MS = 100          // engine fixed-step accumulator (combat-engine.ts:33)
MAX_COMBAT_MS = 120_000      // 2-minute hard cap (combat-engine.ts:34)
ANIM_ATTACK_DURATION = 600   // ms attack animation window (combat-engine.ts:37)
```

---

## Turn Order (Attack Interval)

```
attackInterval = max(300ms, weaponBaseSpeed / (1 + AGI/100))
```

`weaponBaseSpeed` default = **1800ms** (`combat-formulas.ts:7`).  
Minimum interval floor = **300ms** regardless of AGI — prevents infinite-speed builds.

**Examples:**

| AGI | weaponBase | Interval | Hits/s |
|-----|-----------|----------|--------|
| 0 | 1800ms | 1800ms | 0.56 |
| 20 | 1800ms | 1500ms | 0.67 |
| 50 | 1800ms | 1200ms | 0.83 |
| 100 | 1800ms | 900ms | 1.11 |

Higher AGI → shorter interval → more attacks. Equal-interval entities act in declaration order
(no tiebreaker randomness — insertion order from `init()` determines priority at identical `nextAttackAt`).

---

## Per-Tick Flow

Each `tick(dt)` call:
1. Accumulate `dt` into `accumulator`; drain in `LOGIC_TICK_MS` steps
2. For each logic step:
   a. Apply `applyEffectTick()` — status damage + skip flags (`combat-effects.ts`)
   b. Apply `applyPassiveTick()` — civ conditional buffs (Linh Sơn HP-gate, etc.)
   c. Apply HP regen (`entity.hpRegenPerSec × 0.1` per 100ms tick)
   d. For each entity (not dead, not `skipTurn`):
      - If `activeActorId` set and not this entity → skip (sequential lock)
      - `findTarget()` / `resolveTarget()` → select enemy
      - If not in attack range → `moveToward()` (X primary, Z at 60% speed)
      - If in range and `time >= nextAttackAt` → execute attack cycle
   e. Check victory (all enemies dead) → `onWaveCheck()`

**Sequential turn lock** (`activeActorId`): once an entity starts its attack step-forward
animation, all other entities pause their action phase until the attacker returns home.
This prevents pile-on visual chaos while keeping the engine real-time.

---

## Step-Attack State Machine

Each entity cycles: `home → step-forward → returning → home`

```
FORMATION_STEP_DISTANCE    // world units toward target
FORMATION_STEP_DURATION_MS // ms to reach step position
FORMATION_RETURN_DURATION_MS // ms to return home
```

Values defined in `combat-arena-types.ts`. Entity's `homeX/Y/Z` set at spawn from
formation slot; stunned entities' `position.y` resets to `homeY` to prevent mid-air lock.

---

## Auto-Resolve Path

`simulateCombat()` in `combat-simulator.ts` runs the same damage math instantly (no
accumulator, no animation states). Shared formula modules: `combat-formulas.ts`,
`combat-effects.ts`, `combat-passives.ts`. Used for mission resolution and offline progression.
