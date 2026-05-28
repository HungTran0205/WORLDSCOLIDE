# Combat — AI & Target Priority

**Code:** `src/game/systems/combat-ai.ts`, `target-priority-resolver.ts`, `combat-arena-types.ts`

---

## Targeting Modes (Player-Selectable)

Two team-level strategies for allies, set via `CombatEngine.targetPriority`:

| Mode | Constant | Behavior |
|------|----------|---------|
| **Focus** | `'focus'` | All allies share one primary target (`primaryTargetId`) |
| **Balance** | `'balance'` | Each ally targets enemy in its own Z lane, falls back to nearest |

Default: `'focus'` (`DEFAULT_TARGET_PRIORITY` — `combat-arena-types.ts:55`).  
Enemy AI always uses the nearest-weighted algorithm regardless of mode.

---

## Focus Mode — Primary Target Priority Chain

`pickFocusPrimary()` — `target-priority-resolver.ts:18`:

1. **Boss tag** — `entity.isBoss === true` wins outright
2. **Healer** — enemy with `heal-ally` ability
3. **Highest current HP** — burst-priority tanks first
4. **Closest to ally centroid** — tie-break on X distance

Primary is re-evaluated when the current target dies or when `primaryTargetId` is null.

---

## Balance Mode — Per-Entity Targeting

`pickBalanceTarget()` — `target-priority-resolver.ts:48`:

1. Find enemies within **1 world unit on Z axis** (same lane)
2. From that pool (or all enemies if lane empty), pick **nearest by 2D distance**

Z lanes roughly correspond to formation rows (front/mid/back at Z ≈ −3/0/+3).

---

## Default AI Scoring (non-balance enemies and solo allies)

`findTarget()` — `combat-ai.ts:22`:

```
score = distance − frontBonus − laneBonus
```

- `frontBonus = 2` if enemy `|x| < 5` (near center — front row)
- `laneBonus = 1.5` if same Z lane (`|dz| < 1`)
- Picks entity with **lowest score** (nearest + front-weighted + lane-aligned)

---

## Movement

`moveToward()` — `combat-ai.ts:66`:

- X movement: full `moveSpeed × dt`
- Z drift (lane switch): `moveSpeed × 0.6 × dt` — slower lane transitions
- Stops at `stopDistance` (melee ≈ 1.5u, ranged ≈ 5.0u — `combat-arena-types.ts`)

Arena world bounds: ally zone X ∈ [−8, −2], enemy zone X ∈ [+2, +8], full width 22u  
(`ARENA_BOUNDS` — `combat-arena-types.ts`; spec: `battlefield-template.md`).
