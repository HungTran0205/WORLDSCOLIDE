# Combat — Damage Formulas & Status Effects

**Code:** `src/game/systems/combat-formulas.ts`, `derived-combat-stats.ts`, `combat-effects.ts`

---

## Auto-Attack Damage

```
raw = (STR × weaponMult + gearFlatDamage) × (1 − defRatio) × BASE_DAMAGE_MULTIPLIER
damage = max(1, floor(raw))
```

- `defRatio = min(0.75, targetEND / (targetEND + 100))` — `combat-formulas.ts:25`
- `BASE_DAMAGE_MULTIPLIER = 1.2` — phase-6 balance scalar targeting 15–30s battle duration (`combat-formulas.ts:16`)
- `gearFlatDamage` — flat weapon bonus baked at entity creation (`combat-types.ts:27`)
- `gearFlatDefense` — flat armor bonus applied separately in damage-receive calc

**Spot-check (STR=10, weaponMult=1.0, gearFlatDmg=0, targetEND=20):**  
`defRatio = 20/120 = 0.167` → `raw = 10 × 0.833 × 1.2 = 10.0` → damage = 10 ✓

---

## Skill Damage

```
damage = floor(baseDamage × skillMultiplier × (1 + DEX × 0.005))
```

`calcSkillDamage()` — `combat-formulas.ts:31`. DEX × 0.5% additive bonus.

---

## Critical Hits

| Value | Formula | Cap |
|-------|---------|-----|
| Crit rate | `5% + LCK × 0.3%` | 50% (`combat-formulas.ts:37`) |
| Crit multiplier | `1.5 + LCK × 0.005` | none (`derived-combat-stats.ts:56`) |

`CRIT_MULTIPLIER = 1.5` exported as flat constant for non-LCK-scaling paths (`combat-formulas.ts:56`).  
Crit roll: `Math.random() < calcCritRate(lck)` — `combat-formulas.ts:43`.

**Spot-check (LCK=20):** rate = 5% + 6% = 11%; critDmg = 1.5 + 0.1 = 1.6× ✓

---

## Defense, Dodge, Block

| Mechanic | Formula | Cap | Effect |
|----------|---------|-----|--------|
| Defense rating | `END / (END+100)` | 75% | Reduces all incoming damage |
| Dodge rate | `AGI×0.2% + DEX×0.1%` | 30% | Complete avoidance |
| Block rate | `END×0.2% + STR×0.1%` | 25% | Halves damage on proc |

<!-- TODO: dodge and block rolls are defined in derived-combat-stats.ts but their integration into combat-engine.ts hit resolution path needs verification — check combat-engine tick where damage is applied -->

---

## HP Regen

`END×0.1 + level×0.05` HP/s — `derived-combat-stats.ts:67`.  
Applied per engine tick (`LOGIC_TICK_MS = 100ms`); display via `formatHpRegen()`.

---

## Status Effects

Defined in `combat-types.ts:68` and processed by `applyEffectTick()` — `combat-effects.ts:3`:

| Type | Effect per tick | Source |
|------|----------------|--------|
| `poisoned` | `floor(entity.maxHp × 0.05)` damage | enemy `poison-attack` ability |
| `stunned` | `skipTurn = true` | enemy `stun-attack` ability |
| `shocked` | `skipTurn = true` (1 tick) | Đế Quốc passive (every 3 hits) |
| `boosted` | _(no tick effect — duration only)_ | <!-- TODO: boosted source not found in effects --> |

`ticksRemaining` decrements each logic tick; effect removed at 0.  
`statusResist` stat (`min(40%, INT×0.2% + END×0.1%)`) is defined but not yet wired into status application — placeholder for future status-effect expansion.
