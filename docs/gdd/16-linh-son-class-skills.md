# 16 — Linh Sơn Class Skills

**Game:** 2000s A.C — After the Collapse
**Status:** Design spec | Pending implementation
**Primary code:** `src/game/data/skills.ts`, `src/game/data/founder-archetypes.ts`, `src/game/systems/combat-engine.ts`, `combat-effects.ts`, `combat-passives.ts`

> Skill pools for the three playable Linh Sơn classes. **Each character carries auto-attack + exactly ONE skill** chosen from its class pool — these are loadout options, not a rotation. Authored against the live combat engine — every skill is tagged with an implementation tier. Names are bilingual (i18n): English key is default, Vietnamese label switchable in settings.

---

## Design Intent

Linh Sơn civ role = **Tank / Defender** (`civilization-config.ts`). The kits express **đứng vững — bảo vệ — phản đòn** (hold — protect — riposte), not raw nuke. Each class owns one role axis; no class self-carries, forcing party synergy.

| Class | Weapon | Archetype | Role axis | Signature moment |
|-------|--------|-----------|-----------|------------------|
| **Templar** | Sword | `sword` | Balanced / flexible off-tank | Riposte turns defense into damage |
| **Forester** | Axe | `warrior` | Frontline / heavy slow AoE | Bulwark — taunt & shield the line |
| **Ranger** | Crossbow | `scout` | Ranged DPS / precision finisher | Barrage — 5-shot burst |

## Loadout Model (CRITICAL)

**A character brings auto-attack + ONE carried skill into battle.** Each class exposes a **pool of 4 skills**; the player picks 1 per character before dispatch. There is no in-battle rotation and no resource system — pure cooldown-based, matching the engine (`skills.ts`).

**Build diversity comes from team composition, not single-character combos:**
- Every skill must stand on its own as a character's *only* skill.
- Two Foresters can run different skills (one Sunder DPS, one Aegis support).
- A character carrying a **buff** becomes a support/banner role without changing class.

Each pool = **3 combat skills (1 signature damage, 1 special, 1 role utility) + 1 buff**. The buff slot is what lets a class field a support variant. The carried skill can be **ranked up with resources** for long-term investment (see *Skill Ranks & Mastery*).

**Shared civ passive:** Sơn Thế — HP ≤ 30% → END +30%, knockback resist (`combat-passives.ts:42`). Applies to all three classes; not a per-class skill, always active alongside the carried skill.

---

## Class 1 — Templar (Sword)

**Fantasy:** Composed swordsman, decisive strikes, parry-then-punish. Never carries the team, never bursts wildly — always the safe flexible pick.
**PX Goals:** Primary = sense of *tempo control*. Secondary = reward for timing (Riposte). Anti-goal: must not feel like pure auto-attack.
**Role:** Balanced bruiser. **Complexity:** Low–Medium.

| EN key | VN label | Effect (tuned) | Mult | CD | Tier |
|--------|----------|----------------|------|----|----|
| **Pierce** | Đâm | Thrust through one lane: hits front-row + back-row enemy in same lane (max 2 targets) | 1.30× each | 9s | 1 |
| **Cleave** | Chém | Single target, **+50% damage** and **+10% crit rate** for this hit | 1.50× | 12s | 0 |
| **Riposte** | Phản | Enter parry stance 3s: when hit, **70% chance to counter** (1.0× auto-dmg, max 1 counter per incoming hit) | — | 16s | 2 |
| **Rally** *(buff)* | Trợ | **Self-buff: +20% damage for 4s** (reuses `boosted` effect, longer duration) | — | 12s | 0 |

**Tuning notes:**
- "Line attack" → engine formation is **lane-based** (Z-axis lanes, `combat-arena-types.ts`), so a line = front + back slot of one lane = up to 2 targets.
- Riposte capped at **1 counter per incoming hit** to prevent infinite loops when multiple enemies strike in one tick.
- Templar should have slightly higher block than Forester (block scales END+STR — Templar has both) to reinforce parry-trade identity.

---

## Class 2 — Forester (Axe)

**Fantasy:** Brawny woodcutter, ground-shaking axe blows. Slow, but each swing is an area of damage; body is a living shield.
**PX Goals:** Primary = *heavy & sturdy* feel. Secondary = satisfaction of clearing a pack. Anti-goal: slowness must not become helplessness vs flyers.
**Role:** Tank / heavy AoE. **Complexity:** Low.

| EN key | VN label | Effect (tuned) | Mult | CD | Tier |
|--------|----------|----------------|------|----|----|
| **Sunder** | Chặt | Single target, **50% chance to ignore all defense** (defRatio = 0 on proc) | 1.40× | 10s | 1 |
| **Quake** | Nện | Slam axe: **damage = 25% attack power to ALL ground enemies**, **no effect on flying** | 0.25× ×N(ground) | 15s | 1 |
| **Bulwark** | Trấn | **+30% defense** and **taunt** (force enemies to target Forester) for **5s** | — | 20s | 2 |
| **Aegis** *(buff)* | Khiên | **Team-buff: whole party +20% defense for 5s** | — | 13s | 1 |

**Tuning notes:**
- **Quake 20% → 25%** (per design review): self-nerfed by flyer immunity + only team AoE; 20% felt weak per 15s cycle.
- Flyer immunity is intentional counterplay: Cave Bat / Flying Drone (`flying:true`, `enemies.ts`) become threats Forester cannot clear → creates demand for Ranger.
- **Bulwark is the civ's Tank pillar** and the most expensive to build (engine aggro is distance-only, `combat-ai.ts`). Cheap fallback: +30% DEF + lower Forester's virtual distance so AI prioritizes it (pseudo-taunt) — ~80% of the feel at ~20% of the cost.
- Axe **must** have high `weaponBaseSpeed` (slow attacks) to deliver "heavy but slow" — that is how the engine differentiates weapon feel (`combat-formulas.ts` `attackIntervalMs`).

---

## Class 3 — Ranger (Crossbow)

**Fantasy:** Hawk-eyed hunter, strikes from the back line, picks off dangerous targets. Fragile but highest single-target damage in the group.
**PX Goals:** Primary = the *decisive shot*. Secondary = burst high on Barrage. Anti-goal: must not be useless when melee closes in (range 5.0).
**Role:** Ranged DPS. **Complexity:** Medium.

| EN key | VN label | Effect (tuned) | Mult | CD | Tier |
|--------|----------|----------------|------|----|----|
| **Snipe** | Tỉa | Precise shot, **+50% accuracy** (subtracts enemy dodge) and **+50% damage** | 1.50× | 9s | 0 |
| **Barrage** | Sấy | **5 consecutive shots** at one target, each **50% base damage**, **each shot crits independently** | 0.50× ×5 (=2.5×) | 16s | 1 |
| **Pin** | Ghim | Shoot the legs: **−50% attack speed** on target for **5s** (new `slowed` status) | 1.0× | 12s | 1 |
| **Mark** *(buff)* | Hiệu | **Team-buff: whole party +10% crit rate for 5s** | — | 12s | 1 |

**Tuning notes:**
- **Barrage = highest burst in game (2.5× / 16s)** but self-balances: 5 separate shots → overkill waste on near-dead targets, each dodgeable, **each crits independently** → scales hard with LCK builds. Drop to 5×0.45 if playtest shows it overpowered.
- **Snipe + accuracy** pierces high-AGI dodgers — Flying Drone (AGI 25), Cave Bat (AGI 8). Ranger reliably finishes flyers that Forester cannot touch → the "enemy teaches party synergy" link.
- **Pin** counters enrage bosses (Moonbear, Warlord Grok) by slowing their attack cadence. `slowed` reuses the existing `boosted/shocked` status framework → cheap.

---

## Buff Skills & Support Variants

Because each character carries only one skill, the **buff slot turns any class into a support variant** without changing class. Buffs are split by role-color so no two overlap:

| Buff | Class | Scope | Effect | Identity fit |
|------|-------|-------|--------|--------------|
| **Rally** | Templar | Self | +20% damage 4s | Lone swordsman pacing own tempo |
| **Aegis** | Forester | **Team** | +20% defense 5s | Tank shielding the whole line — core civ identity |
| **Mark** | Ranger | **Team** | +10% crit 5s | Hunter calling the killing focus |

**Balance guard — uptime ceiling:** a dedicated "buffer" character could stand back and rebuff all battle. To prevent permanent team buffs (snowball), buffs run **~40% uptime**: 5s duration / ~12–13s cooldown. Do **not** let buff uptime exceed ~50% or stacked buffers trivialize content.

**Stacking rule:** team buffs from multiple characters of the same type **refresh duration, do not stack magnitude** (two Aegis = still +20% DEF, longer uptime). Different-type buffs (Aegis + Mark) **do** stack — that is the intended reward for a diverse team.

---

## Skill Ranks & Mastery (Training Yard Investment)

Each carried skill is **ranked 1→5 by training the character at the Training Yard facility** — turning the loadout pick into a long-term investment decision. Ranks are **per-character-instance, stored per (character, skill) pair** — training one character's Cleave does not rank another's, but switching a character to a different skill **does not erase** ranks already earned (returning restores them). No permadeath (injured characters recover via Infirmary) makes character-bound investment safe.

**Why this over use-based leveling:** decision = *which character/skill to commit a training slot + resources to*; investment = real gold/material + the **opportunity cost of a character benched from missions while training**. No passive grind, no penalty for experimenting.

### Training Yard Integration

The Training Yard is **repurposed**: it no longer grants passive character EXP — it now **exclusively trains skill ranks**. (Old behavior in [facility-definitions.ts:43](src/game/data/facility-definitions.ts) / [facility-production-system.ts:135](src/game/systems/facility-production-system.ts) is removed.) There is no character leveling at all — power comes from **rarity grade + gear + skill ranks** (see [17 Rarity Grade System](17-character-rarity-grade-system.md)). Reuses existing scaffolding:

| Mechanic | Reused from | Detail |
|----------|-------------|--------|
| Trainee state | `status: 'training'` (exists, unused) | Trainee is benched — **cannot be dispatched on missions** |
| Slot cap | `maxSlots: [2,3,4]` | 2 / 3 / 4 simultaneous trainees by facility level |
| Per-tick progress | Infirmary `processInjuryRecovery` → new `processTraining` | Progress accrues only while occupying a training slot |
| Training speed | Facility **level only** | Higher Training Yard level = faster training. **Independent of member base stats** (mirrors Infirmary's stat-independent recovery — no rich-get-richer feedback loop) |

**Cost model:** rank-up costs **gold + material (upfront)** *and* **training time** (per-tick progress accrues only while the character occupies a training slot).

**Rank cap gated by facility level** (drives facility-upgrade gold sink):

| Training Yard level | Slots | Max rank reachable |
|---------------------|-------|--------------------|
| 1 | 2 | Rank 2 |
| 2 | 3 | Rank 4 |
| 3 | 4 | Rank 5 |

### Rank Progression

| Rank | Cost (proposal — tune vs `07-economy`) | Train time (proposal) | Per-rank effect |
|------|------|------|------------------|
| 1 (base) | — | — | Skill as specced above |
| 2 | ~150 gold | ~0.5 game-day | +6% effect (dmg / heal / buff magnitude) |
| 3 | ~350 gold + 3 common mat | ~1 game-day | **Mastery milestone** (qualitative, see below) |
| 4 | ~700 gold + 5 common mat | ~2 game-days | +6% effect |
| 5 | ~1500 gold + 8 rare mat | ~3 game-days | **Mastery milestone** (qualitative) |

> Linear `+%` kept small (≤ +12% total across R2+R4) so rank does not stack with char-level + gear into a broken curve. **Power identity lives in the R3/R5 milestones**, not in raw `+%`. Train-time is reduced **only by Training Yard level**, never by member stats.

### Mastery Milestones (R3 / R5)

| Skill | R3 milestone | R5 milestone |
|-------|--------------|--------------|
| **Pierce** | Hits 3 lane slots (front+mid+back) instead of 2 | Last target in line takes +50% damage |
| **Cleave** | Bonus crit rate 10% → 15% | On crit, cooldown reduced 50% |
| **Riposte** | Stance 3s → 4s | Counter deals 1.5× instead of 1.0× |
| **Rally** | Self-buff +20% → +25% dmg | Also grants +15% attack speed |
| **Sunder** | Armor-ignore proc 50% → 70% | On proc, +30% damage |
| **Quake** | 25% → 30% attack power | 25% chance to stun ground enemies (1 tick) |
| **Bulwark** | +30% → +40% defense | Reflects 10% of damage taken back at attacker (thorns) |
| **Aegis** | Team +20% → +25% defense | Also heals team 5% max HP on cast |
| **Snipe** | Accuracy +50% → +75% | Ignores target block |
| **Barrage** | 5 → 6 shots | Final shot deals +100% damage |
| **Pin** | Slow 50% → 60% | Also −20% target accuracy |
| **Mark** | Team crit +10% → +15% | Marked target takes +10% damage from whole team (focus-fire) |

Milestones are where each skill earns its "moment" — they reward commitment without inflating the base balance curve.

---

## New Status Effects & Flags (net-new)

Extends `combat-types.ts:68` status union and `combat-effects.ts`:

| Effect | Source | Duration | Stacking | Rule | Counterplay |
|--------|--------|----------|----------|------|-------------|
| `slowed` | Pin | 5s | No (refresh) | `attackInterval × 2`; obeys `statusResist` (INT/END) | High-resist enemies cut duration |
| `taunted` | Bulwark | 5s | No | Forces target selection = Forester | Reverts to normal AI on expiry |
| `armorPierced` (flag) | Sunder | instant | — | `defRatio = 0` for that hit | — |
| `boosted` (reuse) | Rally | 4s | Refresh | +20% damage (existing effect, extended duration) | — |
| `teamDefUp` | Aegis | 5s | Refresh, no mag-stack | Party +20% defense (extends `_hasDeQuocBuff` flag pattern) | — |
| `teamCritUp` | Mark | 5s | Refresh, no mag-stack | Party +10% crit (extends team-buff flag pattern) | — |

> Note: `statusResist` is defined but not yet wired into status application (`combat-effects.ts:90`). Implementing `slowed`/`taunted` is the natural moment to wire it.

---

## Role Triangle & Balance

| Class | Strengths | Weaknesses |
|-------|-----------|------------|
| Templar | Flexible, strong 1v1, parry-trade | Low burst, weak AoE (2 targets) |
| Forester | AoE, tankiness, armor-pen | Slow, helpless vs flying |
| Ranger | Top single-target, anti-evasion/flyer, control | Squishy, depends on front line |

**Dependency triangle:** Forester holds the line but cannot hit flyers → needs Ranger. Ranger is fragile → needs Forester/Templar to hold front. No class solves combat alone, matching the civ's Tank/Defender identity. Sơn Thể (civ-wide last-stand) is the shared glue — all three get tankier near death.

---

## Implementation Tiers (effort, brutally honest)

| Tier | Skills | Work required |
|------|--------|---------------|
| **0 — data only** | Cleave, Snipe, Bulwark (+DEF part), **Rally** | Add entries to `skills.ts`; Rally reuses `boosted` effect |
| **1 — small code** | Barrage (multi-hit), Pin (`slowed`), Sunder (armor-pen), Pierce (lane line), Quake (AoE all-ground + flyer exclusion), **Aegis** (team DEF buff), **Mark** (team crit buff) | Add to combat-engine/effects, ~half-day each. Aegis/Mark extend the existing team-buff flag (`_hasDeQuocBuff` pattern) |
| **2 — large code** | Bulwark (taunt), Riposte (counter) | Needs threat/aggro system & counter mechanic — neither exists yet |
| **System — new subsystem** | Skill Ranks & Mastery (Training Yard) | **Remove** old passive char-EXP from Training Yard (`facility-production-system.ts` training-yard branch); add `Member.skillRanks: Record<skillId, {rank, xp}>` field; new `processTraining()` mirroring `infirmary-recovery.ts`; reuses `status:'training'`, `maxSlots` (training speed is facility-level-only, NOT stat-scaled). Plus training-slot UI + milestone effect hooks. Ship after base skills; not a blocker for playable skills |

**Recommended rollout:** ship Tier 0+1 first (7/9 skills live immediately), then Bulwark pseudo-taunt fallback + Riposte at Tier 2. All three classes become playable early without waiting on the aggro system.

---

## i18n Keys

Skill display names use i18n keys (English default, Vietnamese switchable in settings). Suggested key namespace `skill.linhson.*`:

| Key | EN | VN |
|-----|----|----|
| `skill.templar.pierce` | Pierce | Đâm |
| `skill.templar.cleave` | Cleave | Chém |
| `skill.templar.riposte` | Riposte | Phản |
| `skill.forester.sunder` | Sunder | Chặt |
| `skill.forester.quake` | Quake | Nện |
| `skill.forester.bulwark` | Bulwark | Trấn |
| `skill.ranger.snipe` | Snipe | Tỉa |
| `skill.ranger.barrage` | Barrage | Sấy |
| `skill.ranger.pin` | Pin | Ghim |
| `skill.templar.rally` | Rally | Trợ |
| `skill.forester.aegis` | Aegis | Khiên |
| `skill.ranger.mark` | Mark | Hiệu |

---

## Open Questions

- Bulwark full taunt vs pseudo-taunt fallback — confirm before Tier 2 scheduling.
- Barrage 5×0.5 vs 5×0.45 — lock after first playtest.
- Buff uptime ceiling (~40%, 5s/12–13s CD) and the "different-type buffs stack, same-type refresh" rule — confirm after playtest with multi-buffer teams.
- Skill rank costs (gold/material amounts) and train-times are placeholders — tune against `07-economy` once the economy curve is locked.
- ~~Char-EXP source after repurpose~~ — **resolved** by [17 Rarity Grade System](17-character-rarity-grade-system.md): leveling is removed entirely, so there is no char-EXP to source. Power comes from grade + gear + skill ranks.
- Confirm rank `+%` ceiling (≤ +12% base) does not compound with char-level + gear into a broken curve — validate in balance pass.
- Should existing placeholder skills (Đánh Mạnh, Kiếm Giá, Chém Mạnh, Bắn Tên Nhanh, Đâm Lướt in `skills.ts`) be **replaced** by these kits or kept as a separate tier? Assumed replace.

---

*Cross-references: [04 Civilizations](04-civilizations.md) | [05 Characters](05-characters-progression.md) | [06 Combat](06-combat.md) | [combat/formulas-damage.md](combat/formulas-damage.md)*
