# 06 — Combat System

**Game:** 2000s A.C — After the Collapse  
**Status:** Living spec | Code-bound  
**Primary code:** `src/game/systems/combat-engine.ts`, `combat-formulas.ts`, `combat-types.ts`, `combat-arena-types.ts`

> This section is split into sub-files for detail. Read this overview first.

---

## Sub-file Index

| File | Content |
|------|---------|
| [combat/formulas-damage.md](combat/formulas-damage.md) | Damage, crit, defense, status effects |
| [combat/engine-tick-atb.md](combat/engine-tick-atb.md) | Tick model, turn order, attack intervals |
| [combat/ai-targeting.md](combat/ai-targeting.md) | Focus/balance modes, target priority chain |
| [combat/waves-formations.md](combat/waves-formations.md) | Waves, 6-slot formation, stage specs |

---

## System Summary

Combat is a **real-time auto-battler** with player tactical control over formation, targeting mode, and skill activation. Entities act on individual cooldowns driven by AGI and weapon speed; there is no shared initiative queue.

**Two execution paths share the same formulas:**
- **Arena (live):** `CombatEngine.tick(dt)` — `LOGIC_TICK_MS = 100ms` accumulator loop (`combat-engine.ts:33`)
- **Auto-resolve (offline/mission):** `simulateCombat()` in `combat-simulator.ts` — instant, same damage formulas

Hard cap: **120 seconds** real time per battle (`MAX_COMBAT_MS = 120_000` — `combat-engine.ts:34`).

---

## Civilization Passives (implemented)

Three passives live in `combat-passives.ts`:

| Civ | Passive | Trigger | Effect |
|-----|---------|---------|--------|
| Linh Sơn | Sơn Thế | HP ≤ 30% | END +30% (`baseStats.END × 1.3`) |
| Đế Quốc | Điện Thế Chi Huy | Every 3 hits | Shock target (skip-turn); 5s team buff (+5% crit/dmg) |
| Thiên Lữ | — | 5 hits: +15% crit 5s; 15 hits: clone 5s | Hit-counter stack machine |

Shock = `stunned`-equivalent (1-tick `skipTurn`) applied via `consumeShock()`.  
DeQuoc team buff flag: `entity._hasDeQuocBuff` set each tick by engine.

---

*Cross-references: [05 Characters](05-characters-progression.md) | [09 Missions](09-missions-quests.md)*
