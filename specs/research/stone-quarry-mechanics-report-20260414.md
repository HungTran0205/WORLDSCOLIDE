# Stone Quarry Mechanics — Research Report
**Date:** 2026-04-14  
**Author:** tm.researcher  
**Scope:** Reference game analysis + design synthesis cho Stone Quarry facility trong Worlds Collide

---

## 1. Games Analyzed

| Game | Genre | Relevance |
|------|-------|-----------|
| **Stardew Valley** | Farm/RPG | Quarry node types, depth progression, gem node rarity |
| **Melvor Idle** | Idle RPG | Rock HP model, gem vein discovery, node respawn, mastery system |
| **IdleOn MMO** | Idle MMO | AFK efficiency model, multi-character dispatch, ore tier gating |
| **Worlds Collide Logging Site** | Idle Guild | Direct precedent (finite reserve, per-tick, WC skill, permit gate) |

---

## 2. Mechanic Patterns by Category

### 2.1 Node HP / Reserve Depletion Model

#### Melvor Idle — Rock HP System (⭐ Most relevant)
- Mỗi node có **Rock HP** = `5 + mastery_level + boosts`
- Mỗi lần mine → HP giảm 1. HP = 0 → node **respawn** (chờ cooldown)  
- Node **passively regenerate** 1 HP / 10 giây (ngoại trừ khi respawning)
- Cơ chế đặc biệt: **"Perfect Swing Potion"** = chance không damage HP khi mine → node sống lâu hơn
- Formula hiệu quả: `effective_HP = base_HP / (1 - preserve_chance)`
- **Gem Veins**: không regen tự nhiên, được **discover ngẫu nhiên** 0.533% per action

**Insight cho WC**: Thay vì linear reserve như Logging Site, dùng HP+regen model = node gần như infinite nếu skill đủ cao. Tạo ra **investment meaningful** (build mastery → node không bao giờ cạn).

#### Stardew Valley — Node Tier by Floor Depth
- Ore node chỉ xuất hiện theo **floor level**:
  - Copper: floor 1+
  - Iron: floor 41–80
  - Gold: floor 81+
  - Iridium: floor 100+ (Skull Cavern)
- **Daily Luck** ảnh hưởng gem node spawn rate
- Profession fork: **Miner** (+1 ore/vein) vs **Geologist** (50% chance gem spawns double)

**Insight cho WC**: Depth gate không chỉ là số — mỗi tier có **visual identity khác nhau** (copper = orange seam, gold = yellow glitter). Player biết nhìn vào là biết đang ở đâu.

#### IdleOn MMO — Efficiency Gate System
- Mỗi ore vein có **required efficiency** (6 cho Copper, 35 cho Iron, 250 cho Gold...)
- Character không đạt 5% efficiency tối thiểu = **không thể mine** vein đó
- Multi-ore drop: khi efficiency >> requirement, drop nhiều ore cùng lúc
- Formula: `ore_per_drop = f(efficiency / required_efficiency)`

**Insight cho WC**: Dùng **stat gate** thay vì level gate. STR/DEX của worker phải đủ threshold mới unlock vein tiếp theo. Elegant hơn "cần level X".

---

### 2.2 Gem / Rare Discovery System

#### Melvor Idle — Gem Vein Discovery (⭐ Highly applicable)
- **Discover chance**: 0.533% per mining action (sau khi unlock Dragonite tier)
- **Vein type**: 85% Onyx / 10% Oricha / 5% Cerulean (rarity-weighted)
- **Vein size** (random):
  - Small: 62.5% chance, HP 5–15
  - Medium: 25% chance, HP 10–25
  - Large: 12.5% chance, HP 20–60
- Gem veins **không regen** — khai thác xong là hết
- Meteorite: discovered qua **Astrology** skill (cross-skill trigger) → HP tăng random 5–24

**Insight cho WC**: Gem vein discovery là **passive serendipity** — player không mua, không trigger, chỉ mining thì tự lộ ra. Tạo cảm giác "unexpected reward" rất mạnh. Cross-skill trigger (vein từ quest completion hay CHA check) có thể replicate Meteorite model.

#### Stardew Valley — Geode System
- Geode là node đặc biệt, không phải ore thông thường
- Đập geode tại blacksmith → random item từ hidden loot table
- **Mystic Stone** (floor 100+): drop 1–3 Iridium + 1–4 Gold + 25% Prismatic Shard
- **Gem Node**: drop 1 random gem từ 7 loại, rarity-weighted

**Insight cho WC**: Geode = **mystery box mechanic phù hợp** — player find geode khi mine, mang về đập. Tách reward moment khỏi mining moment = 2 dopamine hits.

---

### 2.3 Vein/Node Respawn & Cooldown

| Game | Respawn Mechanic |
|------|-----------------|
| Melvor Idle | Node respawn sau khi HP = 0; cooldown = respawn interval; có thể giảm bằng mastery pool |
| Stardew Valley | Mine floor reset mỗi ngày; Quarry reset mỗi tuần; permanent node không reset |
| IdleOn MMO | AFK system — ore vein không "cạn" theo nghĩa literal, chỉ cần đủ efficiency |
| OSRS (pattern) | 30–60s rock cooldown per player; shared node tranh chứa với player khác |

**Pattern tổng hợp**: 3 model phổ biến:
1. **HP + regen** (Melvor): node tự hồi, có thể maintain vô thời hạn
2. **Daily reset** (Stardew): finite trong ngày, fresh mỗi ngày
3. **Infinite AFK** (IdleOn): không cạn, chỉ lock/unlock

**Recommendation cho WC**: Hybrid — Quarry có **finite reserve per vein** (giống Logging Site), nhưng sau khi vein cạn không phải chờ — **mở ngay vein tiếp theo** (khác với Logging Site cần regrow). Rock HP model cho Quarry tạo ra vibe "đào sâu" rõ ràng hơn.

---

### 2.4 Tool / Equipment Upgrade System

#### Melvor Idle — Pickaxe Progression
- Pickaxes là **permanent shop purchase** (không equip item slot)
- Iron → Steel → Black → Mithril → Adamant → Rune → Dragon → Corundum...
- Mỗi tier: -5% đến -10% mining interval (tốc độ), +1% double ore chance
- High-tier pickaxes unlock **rare gem chance** và **meteorite ore bonus**
- **Pickaxe Coatings** (Abyssal expansion): thêm layer upgrade ko cần replace

**Insight cho WC**: Không cần hệ thống pickaxe phức tạp, nhưng **tool upgrade as permanent purchase** là pattern đúng. "Quarry Level" upgrade (vd: Crude Pickaxe → Iron Pickaxe → Dwarven Pickaxe) là sạch và comprehensible.

#### IdleOn MMO — Efficiency Scaling
- Mining efficiency = (STR stat × multiplier) + pickaxe power + stamp bonus + alchemy bubble
- Nhiều nguồn stack multiplicative/additive với nhau
- Có "Multi-Ore" mechanic: 1 swing → drop 2+ ore nếu efficiency >> required

**Insight cho WC**: **Multi-ore drop** là elegant way to show stat investment paying off. Thay vì "faster harvest", player thấy "1 tick = 2 stone" khi STR cao — more satisfying visually.

---

### 2.5 Mastery / Skill Progression

#### Melvor Idle — Mastery per Rock (⭐ Excellent design)
- Mỗi rock type có **independent mastery** (bronze mastery, iron mastery, etc.)
- Mastery level → tăng Rock HP của đúng loại rock đó
- Mastery Pool Checkpoints (aggregate across all rocks):
  - 10% pool: +5% Mastery XP
  - 25% pool: -10% respawn interval
  - 50% pool: -0.2s mining interval
  - 95% pool: +10 Node HP (global)

**Insight cho WC**: **Per-vein mastery** là quá phức tạp cho WC. Nhưng "Mastery Pool Checkpoint" = **tiered benefits đạt được khi đủ XP aggregate** — có thể simplify thành "Mining Level milestones" với unlocks rõ ràng.

#### IdleOn MMO — Skill Mastery
- Skill Mastery (late game): unlock khi total level account-wide đủ cao
- 150 total Mining level → +25% Mining EXP gain
- 200 → +10% Efficiency
- 500 → +5% all skill efficiency

---

### 2.6 Event / Hazard Systems

#### Stardew Valley — Mine Events
- Không có "hazard" trong quarry (farm quarry = safe)
- Trong The Mines: monsters spawn làm gián đoạn
- Skull Cavern: **Prehistoric Floor** event = đặc biệt nhiều Iridium
- **Meteorite Fall** = random farm event → tảng đá đặc biệt xuất hiện (phải đào trong X ngày)

**Insight cho WC**: Time-limited special event node (Meteorite equivalent) = "stone geode crash lands next to quarry — 48h để khai thác rare ore" là compelling idle notification hook.

#### Melvor Idle — Meteorite & Starfall
- Meteorite discovered qua **Astrology** action → tăng HP của Meteorite rock thêm 5–24
- Starfalls (Abyssal): discovered qua Abyssal Constellations → tăng HP của 3 abyssal rocks

**Insight cho WC**: Cross-skill event trigger. Ví dụ: khi guild hoàn thành một số quest nhất định → **"Geological Survey Report"** event → reveal rare vein hidden trong Quarry.

---

## 3. Synthesis — Mechanic Matrix cho Stone Quarry

| Mechanic | Source Game | Apply to WC? | Priority |
|----------|-------------|--------------|----------|
| Rock HP + passive regen | Melvor Idle | ✅ Simplified (không regen, dùng vein reserve) | MVP |
| Depth-gated ore tiers | Stardew Valley | ✅ Depth 0–3 (Stone → Iron → Crystal) | V1 |
| Gem vein random discovery | Melvor Idle | ✅ Blast Charge → random vein reveal | V1 |
| Efficiency gate (stat threshold) | IdleOn MMO | ✅ STR+DEX threshold per depth | V1 |
| Multi-ore drop (efficiency bonus) | IdleOn MMO | ✅ High STR → 1 tick = 2 stone | V1 |
| Mastery pool checkpoints | Melvor Idle | ⚠️ Simplify → Mining Level milestones | V2 |
| Per-node mastery | Melvor Idle | ❌ Quá phức tạp | Skip |
| Geode mystery box | Stardew Valley | ✅ Stone Geode item → smash for random | V2 |
| Meteorite/time-limited event | Stardew + Melvor | ✅ Guild quest trigger → rare vein event | V2 |
| Daily luck multiplier | Stardew Valley | ⚠️ CHA-based "Fortune" already exists | V1 |
| Tool upgrade (permanent purchase) | Melvor Idle | ✅ Quarry Level (pickaxe tier) | V1 |
| Cross-skill trigger | Melvor (Astrology) | ✅ Quest completion → vein discovery | V2 |

---

## 4. Proposed Core Mechanic Stack (KISS-ordered)

### MVP — Logging Site Clone + Stone Identity
```
- Single STONE reserve (800 units)
- Per-tick production (1s)
- Mining Skill XP = total STONE extracted
- Mining Level 1–10 (same WC pattern)
- Permit gate via QUARRY_SITE_ACCESS (mission drop)
- Stat driver: STR (gatherSpeed)
```

### V1 — Depth + Multi-Vein + Efficiency
```
+ Quarry Depth (1–3): unlock khi vein cạn, cost Gold
+ Vein types per depth:
    Depth 1: STONE-heavy (95% stone, 5% iron)
    Depth 2: MIXED (70% stone, 25% iron, 5% geode)
    Depth 3: IRON-heavy (40% stone, 40% iron, 15% geode, 5% crystal)
+ Blast Charge consumable → random vein reveal trong depth hiện tại
+ STR efficiency gate: cần STR ≥ threshold để mine depth mới
+ Multi-ore drop: worker STR cao → chance 2x stone per tick
+ Quarry Level milestone unlocks (Mining Level 3/6/9)
```

### V2 — Events + Mastery Depth
```
+ Stone Geode: rare drop → smash at Workshop → random reward
+ Mining Level milestones:
    Lv 5: unlock Depth 2 access at lower Gold cost
    Lv 7: +10% chance IRON_ORE per tick
    Lv 10: daily "Ore Surge" bonus (2h x2 output)
+ Cross-skill event: quest completion → reveal hidden vein (time-limited 24h)
+ END stat → "Cave-in Resistance" (bypass hazard roll)
+ LCK stat → Blast Charge reveal bias toward rare veins
```

---

## 5. Design Risk Analysis

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Multi-vein state complexity | Medium | Use flat array `veins[]` in quarrySlice, same pattern as inventory |
| Blast Charge consumable adds new ItemID | Low | 1 new item, same ITEM_DATABASE pattern |
| Depth progression pace (too slow/fast) | Medium | Playtest với fixed reserve sizes; start conservative |
| CRYSTAL item dilutes economy | Low | Gate Crystal usage behind late-game recipes only |
| Worker hazard → Injury state | High complexity | Skip in V1, treat as V2 |
| Stone Geode requires Workshop integration | Medium | Implement as standalone smash action, not workshop queue |

---

## 6. Key Insights from Research

1. **Melvor Idle's Rock HP** = best analog cho WC: simple math, visible progression, infinite-feeling với investment
2. **Stardew's depth-gated tiers** = sạch nhất về player mental model — "đào sâu hơn = ore tốt hơn"
3. **IdleOn's efficiency gate** = dùng STAT thay vì LEVEL để gate content = phù hợp WC's 7-talent system
4. **Multi-ore drop** (IdleOn) là elegant reward dopamine — "watch numbers go higher when STR high"
5. **Gem vein discovery** (Melvor) = cơ chế passive luck quan trọng nhất — tạo "unexpected" moment trong idle context
6. **Cross-skill event triggers** (Melvor Astrology → Meteorite) là conceptually áp dụng được nhưng cần V2+ scope

---

## 7. Unresolved Questions

1. Quarry Depth progression trigger: **auto** khi vein cạn (chọn Stay/Descend) hay **manual** Gold payment?  
2. `CRYSTAL` có vào MVP không hay chỉ V2+? (Ảnh hưởng ItemID, icon, loot table)  
3. **Blast Charge** drop từ mission hay từ Quarry action tích lũy (passive self-gen sau Level 10)?  
4. Quarry facility **level** = bao nhiêu tầng upgrade? 3 hay 5? Mỗi level có buildCost là gì?  
5. Multi-ore drop với **STONE** có cần inventory capacity check trước khi apply không?

---

*Status:* **DONE**  
*Summary:* Research 3 trò chơi lớn (Stardew Valley, Melvor Idle, IdleOn), chiết xuất 6 mechanic categories, đề xuất 3-tier implementation stack KISS-aligned, identify 5 key design risks.
