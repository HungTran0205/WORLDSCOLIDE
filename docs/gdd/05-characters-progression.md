# 05 — Characters & Progression

**Game:** 2000s A.C — After the Collapse  
**Status:** Living spec | Code-bound  
**Primary code:** `src/game/data/grades.ts`, `src/game/systems/stat-allocation.ts`, `src/game/systems/member-derived-stats.ts`, `src/game/systems/derived-combat-stats.ts`, `src/game/systems/derived-guild-stats.ts`, `src/game/systems/upkeep-system.ts`

> **Grade system shipped (v32 save migration).** Leveling (`leveling-system.ts`) và guild ranks (`ranks.ts`) đã bị xóa. Grade F→S là trục duy nhất của character power. Xem §3 để biết chi tiết.

---

## 1. Attribute Architecture

Bảy base talents — số duy nhất player phân bổ:

| Tag | Name | Primary impact |
|-----|------|----------------|
| STR | Strength | Physical ATK, gather speed |
| END | Endurance | Max HP, defense, HP regen, block rate |
| INT | Intelligence | Skill haste, status resist, craft/alchemy |
| DEX | Dexterity | Skill DMG bonus, dodge rate, craft quality |
| CHA | Charisma | Influence, negotiation, leadership |
| LCK | Luck | Crit rate, crit DMG, fortune/loot |
| AGI | Agility | Attack speed (interval), dodge rate |

Soft per-talent cap **50** (stat bar scales 0–100%; `distributeStatsByWeightsRandom` không enforce cap cứng hiện tại — balance-pass item).

### Stat Allocation

- Starting pool: **50 points** (`INITIAL_STAT_POINTS = 50` — `stat-allocation.ts:4`)
- `unallocatedPoints` trên Member dormant cho đến khi Grade Promotion hoàn thiện (§7)
- `allocatePoint()` / `allocateStat()` — `stat-allocation.ts`, `roster-slice.ts`

---

## 2. Power Axes (3 trục độc lập)

```
Power = Grade (stat budget) + Gear (equipment affixes) + Skill Ranks (GDD §16, deferred)
```

Không có overlap giữa ba trục. Grade quy định *tổng điểm stat*, gear quy định *flat bonus*, skill rank quy định *ability power*.

---

## 3. Grade Model

**Source:** `src/game/data/grades.ts`  
**Save version:** v32 (migration `migrateV31toV32` trong `save-migrations.ts`)

Grade thay thế hoàn toàn level + EXP + guild rank (RECRUIT→COMMANDER).

### Stat Budget

| Grade | Stat budget | Δ | HP bonus | Upkeep/day | Display color |
|-------|-------------|---|----------|------------|---------------|
| F | 50 | — | +0 | 4g | `#95a5a6` (grey) |
| E | 58 | +8 | +15 | 5g | `#7f8c8d` (dark grey) |
| D | 68 | +10 | +30 | 6g | `#3498db` (blue) |
| C | 80 | +12 | +45 | 7g | `#2ecc71` (green) |
| B | 95 | +15 | +60 | 8g | `#9b59b6` (purple) |
| A | 120 | +25 | +90 | 10g | `#e67e22` (orange) |
| S | 160 | +40 | +150 | 13g | `#ffd700` (gold) |

> **Upkeep = `round(BASE_UPKEEP × GRADE_UPKEEP_MULT[grade])`**, `BASE_UPKEEP = 5` — `upkeep-system.ts`.  
> Mercenaries luôn = 0 upkeep (pay-per-mission).

### Grade derivation (migration fallback)

Khi một snapshot cũ không có field `grade`, `gradeFromStatBudget(statSum)` suy ra grade từ tổng stat — highest grade có budget ≤ sum. Được dùng bởi `memberFromMercContract` và `promoteMercToMember` cho frozen in-flight contracts.

---

## 4. Stat Distribution (Archetype-Weighted)

Budget được phân phối **random có trọng số theo archetype** bằng `distributeStatsByWeightsRandom()` — không bao giờ uniform (uniform tạo feel-bad rolls). Deterministic với cùng seed (tavern roster reload-safe).

| Archetype | Primary | Secondary | Dump |
|-----------|---------|-----------|------|
| sword (Templar) | STR, END | DEX, AGI | INT, CHA |
| warrior (Forester) | END, STR | AGI, LCK | INT, CHA, DEX |
| scout (Ranger) | DEX, AGI | LCK, STR | INT, CHA, END |

Civ bonuses được apply *on top* của budget sau khi distribute — stat sum thực tế có thể nhỉnh hơn `GRADE_BUDGET[grade]` một chút.

---

## 5. Founders

- Founder luôn bắt đầu ở **grade F** (budget 50 = `INITIAL_STAT_POINTS`, khớp với char-creation UI).
- Stats do player tự phân bổ trong char-creation screen; civ bonuses apply sau.
- `isMercenary: false`, `isFounder: true`.
- Deferred: weighted F/E founder roll + 55-pt creation UI sẽ đến cùng Grade Promotion plan.

---

## 6. Recruitment & Tavern Spawn

**Source:** `src/game/systems/tavern-spawn.ts`

Grade của visitor được roll từ `GRADE_WEIGHTS` — weighted pick 1 lần duy nhất (deterministic):

| Tavern Lv | F | E | D | C | B | A | S |
|-----------|---|---|---|---|---|---|---|
| 1 | 70 | 30 | 0 | 0 | 0 | 0 | 0 |
| 2 | 55 | 35 | 10 | 0 | 0 | 0 | 0 |
| 3 | 40 | 35 | 25 | 0 | 0 | 0 | 0 |

MVP cap Lv3 → C/B/A/S không accessible cho đến khi Tavern Lv4/5 (deferred). S-rank hard-gated sau Lv5 + high-CHA negotiation.

Keeper LCK biases weights qua `biasGradeWeightsByLuck()`. Stat sum của visitor = đúng `GRADE_BUDGET[grade]` sau distribute (trước civ bonus).

---

## 7. Mercenaries

- `isMercenary: true` — set bởi `memberFromMercContract()` và `hireMercAsTemp()`.
- **0 upkeep.** Không có guild progression.
- `promoteMercToMember()` (tavern-audition) dùng `gradeOf(v)` — đọc `v.grade` nếu có, fallback `gradeFromStatBudget` cho frozen snapshots.
- `inviteMercenary` trong guild-slice: cost = `(gradeIndex(grade)+1) × 150`g, set `isMercenary: false` sau invite.

---

## 8. Combat Derived Stats

**Source:** `combat-formulas.ts`, `derived-combat-stats.ts`, `member-derived-stats.ts`  
Unified facade: `calcMemberDerivedStats(member)`.

| Derived stat | Formula | Source |
|---|---|---|
| **Max HP** | `60 + END×5 + GRADE_HP_BONUS[grade]` (+ gear flatHp) | `combat-formulas.ts:2` |
| Attack interval | `max(300ms, weaponBase / (1 + AGI/100))` | `combat-formulas.ts:8` |
| Crit rate | `min(50%, 5% + LCK×0.3%)` | `combat-formulas.ts:37` |
| Crit DMG | `1.5 + LCK×0.005` | `derived-combat-stats.ts:56` |
| Defense rating | `min(75%, END / (END+100))` | `combat-formulas.ts:47` |
| Skill DMG bonus | `DEX × 0.5%` (additive) | `combat-formulas.ts:52` |
| Dodge rate | `min(30%, AGI×0.2% + DEX×0.1%)` | `derived-combat-stats.ts:60` |
| Block rate | `min(25%, END×0.2% + STR×0.1%)` | `derived-combat-stats.ts:63` |
| HP regen | `END × 0.1` HP/s | `derived-combat-stats.ts:67` |
| Skill haste | `min(30%, INT×0.3%)` | `derived-combat-stats.ts:71` |
| Status resist | `min(40%, INT×0.2% + END×0.1%)` | `derived-combat-stats.ts:75` |
| Morale aura | `CHA × 0.1%` (per member) | `derived-combat-stats.ts:79` |

> **HP bonus nguồn:** members dùng `GRADE_HP_BONUS[member.grade]` (0/15/30/45/60/90/150); enemies dùng `template.level × 10` (enemy balance giữ nguyên, chỉ base tăng 50→60).

Auto-attack damage: `max(1, (STR×weaponMult + gearFlatDmg) × (1 − defRatio) × 1.2)`  
`BASE_DAMAGE_MULTIPLIER = 1.2` — `combat-formulas.ts:16`.

Skill auto-cast: không còn level gate — bất kỳ member có `skill` + `autoEnabled = true` đều auto-cast.

---

## 9. Guild (Non-Combat) Derived Stats

**Source:** `derived-guild-stats.ts`  
`calcDerivedGuildStats(stats, gradeIndex(member.grade))`

| Stat | Formula | Use |
|---|---|---|
| **Influence** | `CHA×2 + INT×1 + gradeIndex×1` | Recruit quality, quest tier unlock |
| Stamina | `END×3 + STR×1` | Mission duration capacity |
| Craft Skill | `DEX×2 + INT×1` | Workshop rare item chance |
| Training Eff | `(DEX+AGI) × 0.2%` | (dormant — Training Yard passive EXP xóa rồi) |
| Gather Speed | `STR × 0.4%` | Production speed bonus |
| Negotiation | `CHA×2 + LCK×1` | Tavern price reduction |
| Recovery | `max(0.2, 1 − (END+INT)×0.1%)` | Injury recovery rate |
| Exploration | `AGI×2 + LCK×1` | Travel time, hidden quests |
| Leadership | `CHA×2 + INT×1 + STR×0.5` | Party size bonus |
| Fortune | `LCK×3 + CHA×0.5` | Loot rarity, event bonus |

<!-- TODO: xác nhận guild stats hooked vào mission/facility mechanics — hiện display-only -->

---

## 10. Grade Promotion *(Deferred — Design Spec)*

Chưa implement. Sẽ có plan riêng "Grade Promotion". Dưới đây là thiết kế đã confirm:

Character promote một grade khi **cả 3 gate** thỏa mãn, sau đó player chi resource:

1. **Achievement** — hoàn thành N missions của tier hiện tại.
2. **Skill mastery** — skill rank của character đạt required rank tại Training Yard (GDD §16).
3. **Resources** — gold (+ materials ở grade cao).

| Promote | Missions (tier hiện tại) | Skill rank | Cost | Points gained |
|---------|--------------------------|-----------|------|---------------|
| F → E | 3 | R2 | 200g | +8 |
| E → D | 5 | R2 | 500g | +10 |
| D → C | 8 | R3 | 1000g + common mat | +12 |
| C → B | 12 | R3 | 2000g + common mat | +15 |
| B → A | 16 | R4 | 4000g + rare mat | +25 |
| A → S | 20 | R5 | 8000g + rare mat | +40 |

Points gained = **player-allocated** qua `allocatePoint()` (`unallocatedPoints` đang được preserve trên mỗi Member).

> **Tại sao 3 gate:** missions (achievement loop) + Training Yard (skill loop) + economy (resource loop) reinforces nhau thay vì chạy song song.

---

## 11. Production Room Stats *(Pool-Based)*

Members assigned to production rooms contribute stat pool.  
Formula (design spec):

```
Total Production = Base × (1 + 1.5 × PoolStats / 400)
Per-member share = Total / MemberCount
```

`Base` = 100 (stone) / 50 (magic) / 150 (wood); pool max = 400 (8 members × stat 50); ceiling 2.5×.

<!-- TODO: verify formula vs actual facility-production-system.ts -->

---

## 12. Save Migration Notes

| Version | Change |
|---------|--------|
| v31 | Cuối item/workshop overhaul |
| **v32** | `Member`: xóa `level`/`exp`/`rank`/`rarity`, thêm `grade`/`isMercenary`. `TavernVisitor`: xóa `level`/`rarity`, thêm `grade`. Stats rebudgeted proportionally. `activeMissions[].combatSnapshot` stripped. `tavern.currentRoster` reset (respawns next day-tick). Idle merc contracts rebudgeted; in-flight contracts frozen. |

Migration: `gradeFromStatBudget(statSum)` xác định grade từ legacy stat sum (không dùng level-band hay rarity-table — đảm bảo member và visitor cùng stat sum luôn land cùng grade).

---

*Cross-references: [02 Core Loop](02-core-loop-pillars.md) | [06 Combat](06-combat.md) | [07 Economy](07-economy.md) | [16 Linh Sơn Skills](16-linh-son-class-skills.md) | [Training Yard](rooms/training-yard.md)*
