# 17 — Character Rarity Grade System (Proposal)

**Game:** 2000s A.C — After the Collapse
**Status:** ⚠️ **DESIGN PROPOSAL — NOT YET IMPLEMENTED.** Replaces the current leveling + guild-rank systems when built.
**Supersedes (when implemented):** [05-characters-progression.md](05-characters-progression.md) §2 (EXP & Leveling), §5 (Ranks). Until then, 05 remains the as-built spec.
**Code to replace:** `src/game/systems/leveling-system.ts`, `src/game/data/ranks.ts`, `stat-allocation.ts`; combat/guild formulas using `level` in `combat-formulas.ts`, `derived-combat-stats.ts`, `derived-guild-stats.ts`.

> This system removes character leveling entirely. A character's power comes from **Rarity Grade (F→S)** + gear + skill ranks. Grade replaces both the EXP/level treadmill **and** the old RECRUIT→COMMANDER guild rank (unified into one tier).

---

## Why Rarity Replaces Leveling

- **No XP grind** — power tier is explicit and readable (you know exactly how strong a character is).
- **Recruitment becomes meta** — pulling/recruiting better grades drives progression.
- **Completes the "no leveling" direction** — the Training Yard was already repurposed off passive EXP ([16](16-linh-son-class-skills.md)); this removes leveling outright, so there is no orphaned half-system.
- **Three clean power axes, no overlap:** Grade (stat budget) + Gear + Skill Ranks.

---

## Stat Budget by Grade

A grade defines the **total stat points** distributed across the 7 talents (STR/END/INT/DEX/CHA/LCK/AGI):

| Grade | Total points | Δ from prev |
|-------|--------------|-------------|
| F | 50 | — |
| E | 58 | +8 |
| D | 68 | +10 |
| C | 80 | +12 |
| B | 95 | +15 |
| A | 120 | +25 |
| S | 160 | +40 |

**Power comes purely from stat budget — grade multiplier (GPM) deferred for now (kept simple; can be reintroduced later if the B→A / A→S gap needs to feel more dramatic).** Jumps grow toward the top (+25 B→A, +40 A→S) so higher grades feel meaningfully stronger, while staying within the per-talent cap of 50. **F=50 aligns with the existing `INITIAL_STAT_POINTS = 50`.** **S must be rare** (recruit drop-rate gated + hard-gated, see below).

**On the "1 beats 3" scaling target:** the grade gap is sized so a higher-grade carry *can* fight outnumbered, but this is a **relative scaling feel, not a hard guarantee**. Whether 1v3 actually happens depends on stat allocation, class, and chosen skill — combat math shows it requires the carry's kit to do the work (AoE hitting all targets, or burst/execute deleting one fast so incoming damage decays via focus-fire). Pure stat budget alone does **not** deliver 1v3; it is realized through **build + skill + playtest tuning** (notably tuning AoE/execute skills in [16](16-linh-son-class-skills.md)). Combat diminishing returns (`defRatio = END/(END+100)`, crit cap 50%) further soften the raw gap. Budget-only with this curve gives a **moderate** gap (~1.5–1.6× effective power per top step) — if a more dramatic spike is wanted later, raise A/S budgets (e.g. A160/S260) and lift the per-talent cap for those grades.

---

## Stat Distribution (Archetype-Weighted Random)

On recruit, the budget is distributed **randomly but weighted by archetype** — never uniform (uniform produces feel-bad rolls like a high-INT Templar). Each archetype has primary / secondary / dump stats:

| Archetype | Primary | Secondary | Dump |
|-----------|---------|-----------|------|
| Templar (sword) | STR, END | DEX, AGI | INT, CHA |
| Forester (warrior) | END, STR | AGI, LCK | INT, CHA, DEX |
| Ranger (scout) | DEX, AGI | LCK, STR | INT, CHA, END |

**Sample F-grade (50 pts) rolls** (weighted center; recruit values jitter around these):

| Stat | Templar | Forester | Ranger |
|------|---------|----------|--------|
| STR | 12 | 12 | 8 |
| END | 12 | 16 | 4 |
| INT | 3 | 3 | 2 |
| DEX | 8 | 4 | 14 |
| CHA | 2 | 3 | 2 |
| LCK | 5 | 6 | 8 |
| AGI | 8 | 6 | 12 |
| **Σ** | **50** | **50** | **50** |

---

## Founders

- Founders start at **grade F or E** (weighted distribution by their archetype), and are **promotable** — they are never permanently outclassed.
- Fantasy: start from nothing, invest the founder up through the grades.
- Because there is no permadeath (injured characters recover via [Infirmary](rooms/infirmary.md)), founder investment is safe.

---

## Recruitment & Grade Acquisition

Characters enter the roster two ways: **founders** (start F/E) and **tavern recruits**. Recruit grade is rolled, but **high grades are hard-gated, not easy RNG**:

- **S-rank is recruitable** — but requires **Tavern level 5** before S can even appear in the pool.
- **High failure rate** on high-grade negotiations — attempting to recruit a top-grade character usually fails.
- **CHA-gated odds** — success leans on the **Negotiation** guild stat (`CHA×2 + LCK×1`, `derived-guild-stats.ts`). You need a high-CHA character leading negotiations to realistically land an S.

Net effect: S is an **investment + roster-building achievement** (level the tavern, field a CHA negotiator, eat failures), not a lucky single pull. Reuses the existing `tavern-negotiation.ts` / `recruit-system.ts` / `tavern-spawn.ts` systems.

> Grade drop-rates per tavern level (how often E/D/C/B/A/S appear) are a tuning table — TBD vs economy + tavern reroll cost.

---

## Promotion (Grade-Up)

A character promotes one grade when **ALL THREE gates** are met, then the player spends the resource cost to confirm:

1. **Achievement** — complete N missions of the **current grade's tier** (mission difficulty tiers F–S; see [09-missions](09-missions-quests.md)).
2. **Skill mastery** — the character's **carried skill** trained to the required rank at the [Training Yard](rooms/training-yard.md).
3. **Resources** — gold (+ materials at higher grades).

| Promote | Missions (current tier) | Skill rank req | Cost (tune vs `07-economy`) | Points gained |
|---------|------------------------|----------------|------------------------------|---------------|
| F → E | 3 | R2 | 200g | +8 |
| E → D | 5 | R2 | 500g | +10 |
| D → C | 8 | R3 | 1000g + common mat | +12 |
| C → B | 12 | R3 | 2000g + common mat | +15 |
| B → A | 16 | R4 | 4000g + rare mat | +25 |
| A → S | 20 | R5 | 8000g + rare mat | +40 |

**Points gained on promotion are player-allocated** (preserves build agency — the one allocation decision left after leveling is removed). Allocation uses `allocatePoint()` (repurposed from the old level-up flow).

**Three-system lock:** promotion requires *missions* (achievement loop) + *Training Yard* (skill-rank loop) + *economy* (resource loop) — the three progression systems reinforce each other instead of running in parallel.

---

## Upkeep Folds Into Grade

The old RECRUIT→COMMANDER upkeep modifier is **replaced by grade-scaled upkeep** — stronger characters cost more to retain (a natural gold sink that scales with power):

| Grade | Daily upkeep mult (proposal) |
|-------|------------------------------|
| F | 0.8× |
| E | 1.0× |
| D | 1.2× |
| C | 1.4× |
| B | 1.6× |
| A | 2.0× |
| S | 2.5× |

Mercenaries remain pay-per-mission (no upkeep), as today.

---

## Combat Formula Retune (remove `level`)

Removing leveling breaks every formula that references `level`. Proposed rebase (validate in balance pass):

| Formula | Current | Proposed |
|---------|---------|----------|
| Max HP | `50 + END×5 + level×10` | `60 + END×5 + gradeHpBonus` |
| HP regen | `END×0.1 + level×0.05` | `END×0.1` (+ optional small grade term) |
| Influence (guild) | `CHA×2 + INT×1 + level×0.5` | `CHA×2 + INT×1 + gradeIndex×1` |
| Leadership (guild) | `CHA×2 + INT×1 + STR×0.5` | unchanged (no level term) |

`gradeHpBonus` proposal: `[0, 15, 30, 45, 60, 90, 150]` by grade (mirrors budget deltas so durability scales with grade even for low-END builds). `gradeIndex` = 0(F)…6(S). **All values first-pass — tune after playtest.**

---

## Code Impact

- **Remove:** `leveling-system.ts` (EXP curve, gainExp, level-up), `ranks.ts` (RECRUIT–COMMANDER).
- **Add:** grade definitions (`grades.ts`?), grade-roll + weighted-distribution on recruit, promotion eligibility check (missions + skill rank + resources), grade-scaled upkeep.
- **Modify:** `Member` — drop `level`/`exp`, add `grade`; combat & guild derived-stat formulas; recruit flow (tavern); save migration.
- **Reuse:** `allocatePoint()` for promotion point allocation; mission-tier system for the achievement gate; `Member.skillRanks` (from [16](16-linh-son-class-skills.md)) for the skill gate.

---

## Resolved Decisions

- **S-rank acquisition:** recruitable, but **hard-gated** — Tavern Lv5 + high failure rate + CHA-driven negotiation. Not easy RNG. (See *Recruitment & Grade Acquisition*.)
- **Mission tier dependency:** ✅ already in code — `QuestTier = F|E|D|C|B|A|S` (`game-state.ts:252`), missions carry a `tier` field, `TIER_REQUIREMENTS` gates by guild level. F/E/D missions are authored today; C/B/A/S missions need **content authoring** (not a system change) before those promotion gates are reachable.

## Open Questions

- Recruit grade drop-rates per tavern level (how often E/D/C/B/A/S appear) — tune vs economy + tavern reroll cost.
- `gradeHpBonus` / upkeep multipliers / promotion costs are all first-pass — balance pass required.
- Is **respec** of allocated points allowed? With grade as the only growth axis, respec would aid build experimentation. (Recommend yes.)

---

*Cross-references: [05 Characters (as-built)](05-characters-progression.md) | [06 Combat](06-combat.md) | [07 Economy](07-economy.md) | [16 Linh Sơn Skills](16-linh-son-class-skills.md) | [Training Yard](rooms/training-yard.md)*
