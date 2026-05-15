# Tavern Facility

> Recruitment & mercenary hub. Mỗi ngày in-game, 3+ outsider character xuất hiện. Player thương lượng để **recruit** (join guild vĩnh viễn) hoặc **hire merc** (1 quest, paid upfront, không assign room).

---

## 0. PX Goals

| Goal | Mô tả | Mechanic phục vụ |
|------|-------|------------------|
| **Anticipation** (Primary) | "Hôm nay ai sẽ tới?" — háo hức chờ daily refresh | Rumor system, random spawn, hidden info |
| **Tension** | "Push recruit hay an toàn thuê merc?" | Refusal stakes, counter-offer band |
| **Investment** | Care về từng character, không phải mẫu số | Personality hint, faction lore, hidden traits |
| **Mastery** | Hiểu công thức → recruit có chủ đích | Negotiation formula với knobs rõ ràng |

**Anti-goals:**
- Slot-machine vô hồn (spam thử-đi-thử-lại)
- Frustration vì pure RNG không có agency
- Merc trở thành lựa chọn dominant khiến recruit vô nghĩa
- Save-scum bypass được risk

---

## 1. Tổng quan

Tavern là 1 facility room có không gian visual riêng. Mỗi in-game day (4h real, target 30m sau khi balance), **3 random character** spawn trong tavern. Player có thể:

1. **Inspect** character (info hiển thị tùy Tavern Keeper INT + Tavern level)
2. **Negotiate recruit** → roll success → join guild permanently (nếu pass)
3. **Hire as merc** → trả fixed cost upfront → merc theo 1 quest rồi biến mất
4. **Skip** → character ngày mai biến mất, ngày kia có 3 mặt mới

**Key constraint:**
- Merc **không thể assign room** (không phải member)
- Merc **không cần trả lương** (đã pay upfront)
- Merc **không trả tiền per-quest** (đã pay upfront)
- Member chết → infirmary; **Merc chết → defeated, không vào infirmary** (xem §7)

---

## 2. Daily Refresh & Spawn

### 2.1 Refresh cycle

```
Trigger: in-game day tick (4h real → 30m real sau optimize)
Action:  Despawn 3 character cũ (nếu chưa interact) → Spawn 3 character mới
Seed:    Deterministic per in-game day (anti save-scum, xem §12)
```

### 2.2 Spawn pool

Character được generate theo công thức:

```
1. Pick archetype (random, weighted by Tavern level)
2. Roll Rarity (1=Common → 5=Legendary, weighted by Tavern level + Keeper LCK)
3. Roll Faction (random từ faction unlocked)
4. Distribute 50 talent points (weighted toward archetype affinity)
5. Roll personality trait (placeholder cho future; nay random 1 từ small pool)
6. Calculate Demand (xem §4.2)
```

### 2.3 Rumor system

Trước khi day tick, hiện UI hint (gated by Keeper INT):

| Keeper INT | Rumor reveal |
|------------|--------------|
| < 15 | Không có rumor |
| 15-24 | Vague: "Có lữ khách sắp ghé qua." |
| 25-34 | Class hint: "Một cựu kỵ sĩ sẽ đến." |
| 35+ | Specific: "Một Swordsman elite, faction Au Lac, sẽ tới ngày mai." |

→ Player có lý do prep gold/gift/swap keeper trước khi spawn.

---

## 3. Tavern Keeper Role

Tavern có **1 assignment slot** = Tavern Keeper. Stats của Keeper ảnh hưởng trực tiếp toàn bộ Tavern mechanics.

### 3.1 Stat impact

| Stat | Effect |
|------|--------|
| **CHA** | Driver chính của Negotiation guild-stat → success rate (xem §4) |
| **INT** | Visibility tier — bao nhiêu info về target revealed (xem §10) |
| **LCK** | Tăng chance rare/legendary spawn, +1% trigger lucky modifier |
| **CHA + INT trait** | Unlock keeper passive (vd "Silver Tongue", xem §5) |

### 3.2 Negotiation derivation

```
Keeper.Negotiation = floor(CHA × 1.5 + INT × 0.5) + TraitBonus + EquipBonus
```

Range thực tế (50-point caps):
- Min focus (5/5 CHA/INT): **10**
- Balanced (15/10): **~28**
- CHA build (35/10): **~58**
- Maxed talker (40/10): **~65**
- Hybrid max (30/30): **~60**

→ Pure CHA và CHA+INT hybrid đều viable.

### 3.3 Swap incentive

Player có thể swap Keeper bất kỳ lúc nào (instant, không cooldown). Tạo gameplay:
- **Recon Keeper** (INT cao): reveal full info, đọc Demand chính xác
- **Closer Keeper** (CHA cao): swap vào khi negotiate
- **Hybrid Keeper**: balance, less optimal nhưng ít micro

→ Không có "đúng đáp án", phụ thuộc roster.

---

## 4. Negotiation Formula

### 4.1 Core formula

```
SuccessRate% = 50 + (Keeper.Negotiation - Target.Demand) × 0.6 + Σ Modifiers

Clamped: [5%, 95%]
```

**Justification:**
- Base 50 = equal negotiation gives coin flip → mọi attempt có tension
- × 0.6 scale = ±55 stat spread × 0.6 = ±33% từ stats. Modifiers cộng thêm ±30%
- Cap 95 = không bao giờ guaranteed, vẫn có upset
- Cap 5 = newbie keeper vẫn có hope trên legendary target

### 4.2 Target Demand

```
Target.Demand = floor(TotalCombatPower × 0.4) + Rarity × 5 + DailyMoodBias

Where:
  TotalCombatPower = sum của relevant talent stats theo archetype
    - Fighter: STR + END + DEX + AGI
    - Mage: INT + END + LCK
    - Scout: DEX + AGI + LCK
    - Support: INT + CHA + END
  Rarity = 1..5
  DailyMoodBias = random(-5, +5), refresh mỗi day
```

**Test ranges:**
| Archetype | Stats | Power | Rarity | Demand |
|-----------|-------|-------|--------|--------|
| Common fighter | 15/15/10/10 | 50 | 1 | ~22 |
| Mid mage | 25/15/15 | 55 | 2 | ~32 |
| Rare scout | 30/30/20 | 80 | 3 | ~47 |
| Legendary fighter | 40/40/30/35 | 145 | 5 | ~83 |

→ Demand spread 20-85, match Keeper spread tốt.

### 4.3 Example rolls

| Scenario | Keeper Neg | Target Demand | Mods | Final % |
|----------|-----------|---------------|------|---------|
| Newbie vs common | 25 | 22 | 0 | **52%** |
| Mid keeper, gift matched | 40 | 32 | +15 | **70%** |
| Max keeper, no setup | 60 | 70 | 0 | **44%** |
| Max keeper + perfect | 60 | 70 | +25 | **69%** |
| Newbie attempt legendary | 25 | 83 | 0 | **15%** (clamp 15) |

---

## 5. Modifier Catalog

7 knobs player có thể xoay. Stacks additive, clamp final rate [5, 95].

| Modifier | Value | Source |
|----------|-------|--------|
| **Trait match** | +10% / shared trait | Random — Keeper trait overlap target trait |
| **Gift: generic** | +5% | Spend 1 consumable/material item (vd: rượu, thịt nướng) |
| **Gift: personal** | +15% | Item matching target preference (chỉ reveal khi INT ≥ 30) |
| **Guild fame** | 0 → +20% | Auto: scale theo guild rank/reputation global |
| **Faction reputation** | -10 → +10% | **DEFERRED** — faction system chưa có numeric value. Scaffold trả về 0 đến khi faction rep implemented |
| **Recent refusal** | -10% × count | Same target attempted lại, decay 7 in-game days |
| **Tavern level** | +2% × level | Auto facility upgrade |
| **Treasury flex** | +5% | Guild gold > 10× target's hire cost (signal of wealth) |
| **Keeper trait passive** | +5 → +15% | "Silver Tongue", "Recruiter", "Storyteller" — placeholder |

**Gift system tie-in (existing inventory):**

| Item type | Use as | Notes |
|-----------|--------|-------|
| **Consumable** (food, drink, potion) | Generic gift +5% | Cheap, abundant |
| **Material** (rare ore, monster mat) | Generic gift +5% | High-tier gives +8% |
| **Equipable** | Personal gift +15% | Match target's class affinity required |

→ Reuse inventory system, không cần item type mới.

---

## 6. Refusal Tiers & Counter-offer

Roll result trả về margin so với SuccessRate. Mỗi tier có hệ quả khác nhau.

```
margin = RollResult - SuccessRate    // negative = pass, positive = fail

margin ≤ -15  → SUCCESS (passed comfortably) → Join guild
-15 < margin ≤ 0  → SUCCESS but tight → Join guild
0 < margin ≤ 15   → COUNTER-OFFER: "Tao chỉ làm merc thôi"
15 < margin ≤ 30  → SOFT REFUSE: quay lại 2-3 ngày sau, Demand +5
30 < margin ≤ 45  → HARD REFUSE: cooldown 7 ngày, không spawn
margin > 45       → INSULT EVENT: target gone forever (30%) + Tavern Rep -1
```

### 6.1 Counter-offer mechanic

15% width band → ~15% các fail attempt rơi vào case này:

- Hiện modal: **"[Tên target] từ chối join guild, nhưng đồng ý làm merc với giá +20% standard merc fee."**
- Player có thể **Accept** (instant hire merc) hoặc **Decline** (target rời tavern, có thể quay lại random sau)
- Nếu accept → kích hoạt **Audition Pipeline** (xem §8)

**Vì sao +20%?**
- Phạt vì negotiation kém hơn dự kiến
- Vẫn cheap hơn so với fail hoàn toàn
- Tạo decision-making thay vì auto-accept

### 6.2 Insult event

Margin > 45 = player vô lý push, target xúc phạm:
- **30% chance**: target gone forever, dispatch event log
- **70% chance**: target storms off, Tavern Rep -1
- Cả 2 case: next negotiation roll bất kỳ target có -10% trong 24h in-game

→ Tạo **real cost** cho việc throw rolls.

### 6.3 Diminishing return on retry

Same target attempted lại trong 7 days:
- 1st attempt: full success rate
- 2nd: -10% (target wary)
- 3rd: -25% (target annoyed)
- 4th+: cap at -40%, target nhả lời "Đừng có thử nữa"

Reset sau 7 in-game days.

---

## 7. Merc System

### 7.1 Hire flow

```
Player click "Hire as Merc" trên target
→ Cost = floor(Target.PowerLevel × CostMultiplier + Rarity × 100)
   (CostMultiplier = 2.0 base, +0.2 per Rarity tier)
→ Deduct gold from treasury upfront
→ Merc joins roster as TEMPORARY entity
→ Cannot be assigned to room
→ Can ONLY be assigned to 1 quest
```

### 7.2 Merc lifecycle

```
[Hired] → [Available]
   ↓
[Assigned to Quest] (cannot un-assign mid-quest)
   ↓
Quest completes
   ↓
   ├─ Survived + Success → [Veteran tag, despawned, 5% re-appear chance]
   ├─ Survived + Failure → [Despawned, neutral exit]
   └─ Defeated (HP=0) → [Tavern Rep -1, despawned, NO infirmary]
```

### 7.3 Cost reference

| Rarity | Power 50 | Power 100 | Power 150 |
|--------|----------|-----------|-----------|
| 1 (Common) | 200 | 300 | 400 |
| 3 (Uncommon) | 460 | 660 | 860 |
| 5 (Legendary) | 800 | 1100 | 1400 |

**Balance check:** member salary ~50g/day, quest reward ~100-500g/quest. Merc fee = 2-5x quest reward floor — đáng để dùng cho hard quest mà roster yếu.

### 7.4 Merc death — defeat handling

**Quyết định:** Merc HP=0 = "Defeated", **KHÔNG vào infirmary**.

**Reasoning:**
- Merc là temp contract, không phải guild member → không có quyền dùng facility
- Spec gốc: "merc sẽ biến mất sau khi làm nhiệm vụ" → defeated cũng vẫn "rời đi" sau quest
- Tránh edge case "merc nằm infirmary mãi ai trả phí healing?"

**Resolution:**
- Quest tiếp tục với roster còn lại (nếu merc không phải solo)
- Quest auto-fail nếu merc là solo carry
- Merc despawn vĩnh viễn
- **Tavern Reputation -1** (max -5, recover 1/in-game week)

### 7.5 Concurrent merc cap

Số merc đang active (hired, chưa despawn) cap theo Tavern level:

| Tavern Level | Max concurrent merc |
|--------------|--------------------|
| 1 | 3 |
| 2 | 3 |
| 3 | 4 |
| 4 | 4 |
| 5 | 5 |

Cap match với daily spawn count để không tạo bottleneck artificial. UI block "Hire" button khi đã đạt cap, tooltip "Tavern at merc capacity."

### 7.6 Veteran tag (surviving merc bonus)

Merc sống sót quest có internal flag `veteran=true`:
- 5% chance reappear ở tavern future
- Nếu reappear → +20% recruit modifier (đã thân với guild)
- Reappear không count vào 3-char daily cap, là **bonus 4th slot** ngày đó

→ Tạo organic incentive **chọn quest dễ cho merc đầu tiên** để audition.

---

## 8. Audition Pipeline (Merc → Member)

Mechanism cốt lõi để chuyển counter-offer → permanent member.

### 8.1 Relationship Points (RP)

Merc tích RP qua quest:
```
Quest success + 0 damage          → +30 RP
Quest success + member assist     → +20 RP
Quest success + merc carry        → +25 RP
Quest fail (merc survived)        → -10 RP
Quest fail (member chết)          → -20 RP
Merc defeated                     → -∞ (despawned anyway)
```

### 8.2 Post-quest re-invite prompt

End-of-quest screen, nếu RP ≥ 25:

> **"[Tên merc] có vẻ ấn tượng với guild. Mời gia nhập?"**
> Re-invite roll: **base success +25%** (đã trust)
> + Standard Negotiation formula

Player options:
- **Invite now** (one-shot, không thể retry, dùng current Keeper)
- **Let them go** (merc despawn, có thể reappear với veteran tag)

### 8.3 Cautious archetype gating — DEFERRED

**Status:** defer to separate plan (trait system implementation).

Khi trait system implemented, một số character mang trait **"Cautious"** sẽ chỉ chấp nhận join AFTER hoàn thành ít nhất 1 quest as merc:
- Initial negotiation luôn rơi vào counter-offer band
- Sau merc quest thành công → unlock full negotiation

→ Cross-plan dependency: blocked by trait system. Tavern v1 ship không cần feature này.

---

## 9. Tavern Reputation

Hidden meta-stat của tavern itself, max range [-5, +5].

### 9.1 Triggers

| Event | Rep change |
|-------|-----------|
| Merc defeated | -1 |
| Insult event | -1 |
| Target gone forever (hard refuse) | -1 |
| Successful recruit (rare+) | +1 |
| Audition merc joined guild | +2 |
| Daily passive recovery | +1 / in-game week |

### 9.2 Effect

```
NegotiationModifier = Rep × 5%
SpawnQualityBias    = Rep × 0.5 (shifts Rarity weight)
```

- Rep -5: -25% negotiation, mostly common spawns
- Rep 0: neutral
- Rep +5: +25% negotiation, biased toward higher rarity

### 9.3 Visibility

Hidden by default. UI hint:
- Rep ≥ +3: "Tavern is buzzing with reputation."
- Rep ≤ -3: "Word travels — fewer adventurers visit."
- Tavern level 3+ unlocks **exact Rep value display**.

→ Soft visibility cho mid-game, transparent cho late.

---

## 10. Visibility & Inspect

Information revealed về target scales theo `Keeper.INT + (Tavern.Level × 2)`.

### 10.1 Tier table

| Visibility Score | Info revealed |
|------------------|---------------|
| < 10 | Name, archetype, visible appearance only |
| 10-19 | + Combat stats (HP, ATK, DEF…) |
| 20-29 | + Talent stats (raw STR/END/CHA…) |
| 30-39 | + Hidden traits, today's mood bias |
| 40-49 | + Exact Demand value, preferred gift category |
| 50+ | + Faction reputation effect preview, recommended negotiation play |

### 10.2 Example

```
Keeper INT 20, Tavern Lv 3 → Score = 20 + 6 = 26 → Tier 20-29
  → Reveal talent stats + lower tiers
  → Hide traits, mood, exact Demand

Keeper INT 30, Tavern Lv 5 → Score = 30 + 10 = 40 → Tier 40-49
  → Reveal everything except recommended play
```

→ Tavern upgrade và Keeper INT đều có **clear value**, tạo upgrade path lý do.

---

## 11. Tavern Upgrade Table

| Level | Char/day | Vis Bonus | Spawn Quality | Unlocks |
|-------|----------|-----------|---------------|---------|
| 1 | 3 | +2 | T1 archetype, Rarity 1-2 | MVP baseline |
| 2 | 3 | +4 | + Rarity 3 chance 10% | Re-roll button (cost gold) |
| 3 | 4 | +6 | + Rarity 3 chance 25%, T2 archetype | Rep value visible, weekly special visitor |
| 4 | 4 | +8 | + Rarity 4 chance 15% | Faction targeting (pick faction bias) |
| 5 | 5 | +10 | + Rarity 5 chance 5%, T3 archetype | Legendary visitor event |

**Design intent:** quantity tăng chậm (3→5), quality tăng nhiều, unlocks add meta-knobs.

### 11.1 Re-roll button (Lv 2+)

- Cost: 100g × (Tavern Level) per re-roll
- Refreshes 3 character roster (không trigger day tick)
- Max 1 re-roll per day
- Useful khi rumor không match strategy

### 11.2 Weekly special visitor (Lv 3+)

- Mỗi 7 in-game days, 1 guaranteed Rarity 3+ visitor
- Theme rotates: "Veterans Day", "Festival", "Pilgrimage"
- Specific archetype/faction pool theo theme

### 11.3 Faction targeting (Lv 4+)

- UI: pick 1 faction để bias spawn (50% từ faction đó)
- Cooldown: 3 days giữa các change
- Tie-in faction reputation system

---

## 12. Anti-save-scum

```
DailySeed = hash(SaveID + InGameDay)
NegotiationRoll = deterministic from (DailySeed + TargetID + AttemptCount)
```

Outcome committed khi player click "Negotiate". Reload không đổi result.

Rerun day (vd next reload tới day mới) → new seed → new rolls. Ngăn được scummy "load-attempt-load" loop, không ngăn được legitimate "fast-forward to next day".

→ Player must commit, không retry instant trong same day.

---

## 13. Data Schema (gợi ý)

### 13.1 Tavern state

```typescript
interface TavernState {
  level: 1 | 2 | 3 | 4 | 5;
  keeperId: CharacterId | null;
  reputation: number; // -5 to +5
  currentRoster: TavernVisitor[]; // length = level cap
  rerolledToday: boolean;
  factionBias: FactionId | null;
  rumor: RumorEntry | null;
}
```

### 13.2 Tavern visitor

```typescript
interface TavernVisitor {
  id: CharacterId;
  archetype: Archetype;
  faction: FactionId;
  rarity: 1 | 2 | 3 | 4 | 5;
  talentStats: TalentStats; // STR, END, INT, DEX, CHA, LCK, AGI
  derivedDemand: number;
  dailyMoodBias: number; // refresh each day
  trait: TraitId | null; // placeholder
  preferredGiftCategory: ItemCategory;
  attemptHistory: AttemptRecord[];
  vetaranTag: boolean; // from prior merc quest
}
```

### 13.3 Merc contract

```typescript
interface MercContract {
  visitorId: CharacterId;
  hireCost: number;
  hireAt: InGameTimestamp;
  questId: QuestId | null;
  relationshipPoints: number;
  status: 'available' | 'on-quest' | 'completed' | 'defeated';
}
```

### 13.4 Negotiation roll

```typescript
function rollNegotiation(
  keeper: Character,
  target: TavernVisitor,
  modifiers: ModifierBundle,
  seed: number
): NegotiationResult {
  const keeperNeg = floor(keeper.cha * 1.5 + keeper.int * 0.5)
                  + keeper.traitBonus + keeper.equipBonus;
  const baseRate = 50 + (keeperNeg - target.demand) * 0.6;
  const finalRate = clamp(baseRate + sumModifiers(modifiers), 5, 95);
  const roll = deterministicRoll(seed); // 0-100
  const margin = roll - finalRate;
  return resolveMargin(margin, target);
}
```

---

## 14. Risks & Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Merc dominate over recruit | High | Merc cost scale với power; veteran tag tạo organic recruit path |
| Save-scum negotiate roll | High | Deterministic seed per day (§12) |
| Roster overflow with mercs | Med | Mercs in separate temp-roster, không count cap |
| Player stuck with bad Keeper | Med | Swap instant, no cooldown |
| Audition exploit (defeat-on-purpose) | Low | Defeated merc = no veteran tag, rep penalty |
| Tavern Rep death spiral | Med | Passive recovery +1/week, soft floor at -5 |

---

## 15. Resolved Decisions & Open Questions

### Resolved (2026-05-15)

| # | Question | Decision |
|---|----------|----------|
| Q3 | Faction reputation numeric value | **Deferred** — faction rep chưa có numeric. Scaffold modifier trả 0, hook lại khi faction system ship |
| Q5 | Cautious trait gating | **Deferred** — blocked by trait system, làm plan riêng |
| Q6 | Merc concurrent cap | **Lv1=3, Lv2=3, Lv3=4, Lv4=4, Lv5=5** (xem §7.5) |
| Q7 | UI inspect panel | **Wireframe riêng** — tách plan UI design, không bundle vào tavern logic |

### Still open

1. **Re-roll button** có nên block daily refresh hay tách biệt? (proposal: tách, max 1/day)
2. **Veteran reappear** dùng cùng pool slot (3-5 base) hay extra slot? (proposal: extra)
3. **Insult event** target gone forever — có nên đánh dấu visible trong UI để player biết? (proposal: yes, gravestone marker)

---

## 16. References

- [stat-system.md](./stat-system.md) — CHA/INT/LCK derivation, 50-point cap, CHA recruitment notes
- [Economy.md](./Economy.md) — gold flow, salary baseline
- [Feature.md](./Feature.md) — feature overview index
- [Room/infirmary-room.md](./Room/infirmary-room.md) — member defeat handling (contrast với merc)
- [Room/workshop-room-v2.md](./Room/workshop-room-v2.md) — facility doc style reference
