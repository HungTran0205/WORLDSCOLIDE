# Room: Training Yard

**Def:** `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS['training-yard']`
**System:** `src/game/systems/skill-training-system.ts` — `processSkillTraining(facility, members, dtMs)` (pure, per-ms), `resolveTrainingRows()` (UI resolver), `applySkillRankMilestones()` (combat). Store actions in `src/game/state/guild-slice.ts`: `startSkillTraining`, `cancelSkillTraining`, `applySkillTrainingResults`. Tick-wired in `src/ui/hooks/use-game-tick-loop.ts` (online + offline catch-up).

> **Implementation status:** IMPLEMENTED (2026-05-30). Cancel policy: 50% gold refund + forfeit all progress. See [`../16-linh-son-class-skills.md`](../16-linh-son-class-skills.md) §Skill Ranks & Mastery.
>
> **Repurpose note:** the Training Yard previously granted **passive character EXP** (`facility-production-system.ts` training-yard branch). That behavior is **removed** — the yard now exclusively trains **skill ranks**. Character leveling is removed entirely; power comes from grade + gear + skill ranks ([05 Characters & Progression](../05-characters-progression.md) §3). The Training Yard's skill-rank gate is also one of the three promotion requirements for grade-up.

## Purpose

Trains a guild member to raise the **rank (1→5) of their currently carried combat skill**. Not a production room — no resource output. Slots are **training slots** occupied by members who voluntarily train here; while training (`status === 'training'`) a member is **benched and cannot be dispatched on missions**. This opportunity cost is the core decision: long-term power vs immediate deployment.

Skill ranks are stored **per (character, skill) pair** (`Member.skillRanks`), so investment is character-bound but switching skills never erases earned ranks. No permadeath (injured members recover via [Infirmary](infirmary.md)) makes character-bound investment safe.

## Build Requirements

- Cost: **250g** (`buildCost`)
- Upgrades: +300g → Lv2, +500g → Lv3 (`upgradeCosts: [300, 500]`)
- `maxSlots: [2, 3, 4]` — simultaneous **training slots** by level
- **No primary stat dependency** — training speed does NOT depend on any member's stats (DEX, AGI, or otherwise). Higher facility level is the only accelerator.
- Requires guild level 3 before appearing in the build picker (`requiredGuildLevel: 3`)

## Training Model

### PX Goal
Make skill mastery feel like a deliberate **investment with a cost**: committing a character to the yard means losing them from the mission rotation for a while. Upgrading the yard should feel like unlocking deeper mastery (higher rank ceiling) and more throughput (more slots, faster training).

### Slots (hard cap, no overflow queue)
- Active **training slots** = `maxSlots[level]` → 2 / 3 / 4.
- Unlike the Infirmary (where injury is involuntary and queues), training is **voluntary assignment** — the player simply cannot assign more trainees than there are slots. To train more, free a slot or upgrade.
- A trainee occupies a slot until the current rank-up completes (or the player cancels).

### Rank cap gated by facility level
The reachable rank ceiling scales with Training Yard level — the primary reason to upgrade:

| Level | Slots | Max rank reachable |
|-------|-------|--------------------|
| 1 | 2 | Rank 2 |
| 2 | 3 | Rank 4 |
| 3 | 4 | Rank 5 |

### Training speed (independent of member stats)
Each rank-up has a base train-time, reduced **only by facility level** — never by member stats (mirrors Infirmary's stat-independent recovery; avoids a rich-get-richer loop where strong characters train faster).

| Location | Speed factor |
|----------|-------------|
| Training Yard Lv1 slot | ×1.0 (base) |
| Training Yard Lv2 slot | ×0.8 (20% faster) |
| Training Yard Lv3 slot | ×0.6 (40% faster) |

Per tick: `skillRankProgress += (dt / baseTrainMs) × rateMultiplier`, where `rateMultiplier = 1 / speedFactor`. Rank-up completes when progress ≥ 1; progress resets for the next rank.

### Cost & time per rank (proposal — tune vs `07-economy`)

| Rank | Upfront cost | Base train-time | Effect |
|------|-------------|-----------------|--------|
| 2 | ~150g | ~0.5 game-day | +6% effect |
| 3 | ~350g + 3 common mat | ~1 game-day | **Mastery milestone** (qualitative) |
| 4 | ~700g + 5 common mat | ~2 game-days | +6% effect |
| 5 | ~1500g + 8 rare mat | ~3 game-days | **Mastery milestone** (qualitative) |

1 game-day = 30 real minutes (`clock-slice.ts`). Upfront cost is paid when training starts; time accrues per-tick while the member occupies a slot.

## Interaction Rules

- A training member (`status === 'training'`) **cannot be dispatched on missions** or assigned to production rooms until training completes or is cancelled.
- Cancelling training mid-rank: design choice — **refund upfront cost partially OR forfeit progress**. (Open question, see below.)
- Rank-ups are blocked above the facility-level cap (Lv1 cannot reach Rank 3, etc.).
- **Learning model:** a member starts with **one learned skill (Lv1)** — the rest of their class pool is **Lv0 (not learned)**. The Training Yard is where skills are *learned* (Lv0→Lv1) and *ranked up* (Lv1→Lv5). A skill's level is `skillRanks[skillId].rank`; absent entry = Lv0.
- **Training ≠ equipping (decoupled).** Picking a pool skill in the room card trains its level (learn or rank-up) but does **not** change the carried skill. Equipping is a separate action.
- **Equipping** the carried (combat) skill happens in the **roster Skills tab** (`equipMemberSkill`): only **learned (Lv1+)** skills can be equipped; Lv0 skills show "Learn at Training Yard" and are not selectable. Swapping is locked while the member is training. Earned ranks are stored per (character, skill) and persist across swaps.
- Learning (→Lv1) is allowed at **any** yard level; higher ranks are gated by the level cap below.

## UI (REQUIRED)

Two surfaces:

### A) Facilities-grid tray card (read-only)
Selecting the Training Yard in the Bát Quái facilities grid shows a **status-only**
tray: header (`Slots: {occupied}/{maxSlots} · Max Rank: {cap}`), the active slot
rows (progress + remaining time), a hint to enter the room, and an **Enter Room**
button. No assigning happens here.

### B) In-room function panel (diegetic — the assign surface)
Inside the room, clicking the **training dummy** (`InteractiveFacilityObject`,
`facilityType='training-yard'`) opens `TrainingYardPanel`. This is the **sole assign
path** (mirrors the Workshop/Tavern object-click panels). It shows:

- **Active slot rows**: portrait · skill icon · name · carried skill · current rank →
  target rank · progress bar · remaining time · speed badge (×1.0 / ×0.8 / ×0.6) · Cancel.
- **Two-step assign flow** (mirrors the Tavern's pick-then-act pattern):
  1. **Member picker**: lists every idle member (no carried-skill prerequisite —
     members without a skill can still be assigned and pick one here).
  2. **Class skill picker**: lists the member's archetype skill pool, each row with a
     skill icon, current rank, upfront cost to the next rank, and a Train button
     (disabled when maxed / above the level cap / unaffordable). The currently carried
     skill is flagged. Picking Train equips that skill and starts the rank-up.

Skill icons resolve from `public/ui/icons/skills/{skillId}.png` via `SkillIcon`, with
a glyph fallback keyed by skill type when an icon is absent.

```
Training Yard  Lv2       Slots: 2/3 · Max Rank: 4
─────────────────────────────────────────────────
  An    Cleave   R2→R3  [######····] 60%  4m 30s  ×0.8
  Bình  Barrage  R1→R2  [###·······] 30%  2m 10s  ×0.8
  + 1 free slot
```

## Upgrade Path

| Level | Slots | Train speed | Rank ceiling | Notes |
|-------|-------|------------|--------------|-------|
| 1 | 2 | ×1.0 | Rank 2 | Entry training |
| 2 | 3 | ×0.8 | Rank 4 | +1 slot, faster, mid milestones |
| 3 | 4 | ×0.6 | Rank 5 | +1 slot, fastest, R5 mastery unlocked |

## References

- Facility def: `src/game/data/facility-definitions.ts` — `FACILITY_DEFINITIONS['training-yard']`
- Member skill-rank state (NEW): `src/game/state/game-state.ts` — `Member.skillRanks`, `Member.status: 'training'`
- Training engine (NEW, mirrors infirmary): `src/game/systems/training-yard.ts` — `resolveTrainingQueue`, `processTraining`
- Pattern source: `src/game/systems/infirmary-recovery.ts`
- Skill definitions & milestones: [`../16-linh-son-class-skills.md`](../16-linh-son-class-skills.md)
- Old passive-EXP logic to remove: `src/game/systems/facility-production-system.ts` (training-yard branch)

## Open Questions

- Cancel-training policy: partial refund vs forfeit progress — pick after first playtest.
- Cost/time values are first-pass placeholders — tune against `07-economy`.
