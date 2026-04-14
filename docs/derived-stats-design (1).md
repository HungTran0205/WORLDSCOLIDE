# 🗡️ Derived Stats System Design — Worlds Collide

## PX Goals (Player Experience Goals)

| Goal | Mô tả |
|------|--------|
| **Primary** | Người chơi HIỂU rõ nhân vật mình build ảnh hưởng gì → cảm giác "smart choices matter" |
| **Secondary** | Theorycraft-able — so sánh được 2 nhân vật qua các con số cụ thể |
| **Anti-goal** | KHÔNG overwhelm player — họ chỉ allocate 7 talent points, derived stats tự tính |

---

## 1. Hiện trạng — Base Talent Stats

7 talents hiện có: **STR, END, INT, DEX, CHA, LCK, AGI**

| Talent | Tên đầy đủ | Ý nghĩa Fantasy |
|--------|-----------|------------------|
| **STR** | Strength / Sức mạnh | Đánh mạnh, bền bỉ vật lý |
| **END** | Endurance / Sức bền | Chịu đòn, sống lâu, dẻo dai |
| **INT** | Intelligence / Trí tuệ | Kiến thức, chiến thuật, kỹ năng |
| **DEX** | Dexterity / Khéo léo | Chính xác, tinh tế, tay nghề |
| **CHA** | Charisma / Uy lực | Lãnh đạo, đàm phán, sức ảnh hưởng |
| **LCK** | Luck / Vận may | Bạo kích, loot, may mắn toàn diện |
| **AGI** | Agility / Nhanh nhẹn | Tốc độ, phản xạ, linh hoạt |

---

## 2. Combat Derived Stats ⚔️

### 2.1 Stats đã implement (đang hoạt động)

| # | Stat | Tên VN | Formula | Talent chính | File |
|---|------|--------|---------|-------------|------|
| 1 | **Max HP** | Máu tối đa | `50 + END×5 + level×10` | END | `combat-formulas.ts` |
| 2 | **Physical ATK** | Sát thương vật lý | `STR × weaponMult` | STR | `combat-formulas.ts` |
| 3 | **Attack Speed** | Tốc độ đánh | `weaponBase / (1 + AGI/100)` ms/hit, floor 300ms | AGI | `combat-formulas.ts` |
| 4 | **Crit Rate** | Tỉ lệ bạo kích | `min(50%, 5% + LCK × 0.3%)` | LCK | `combat-formulas.ts` |
| 5 | **Crit Multiplier** | Sát thương bạo kích | `150%` (hiện flat) | — | `combat-formulas.ts` |
| 6 | **Skill DMG Bonus** | Bonus skill | `DEX × 0.5%` | DEX | `combat-formulas.ts` |
| 7 | **Defense Rating** | Giảm sát thương | `END / (END + 100)` → max 75% | END | `combat-formulas.ts` |

### 2.2 Stats đề xuất mới 🆕

| # | Stat | Tên VN | Formula | Talent | Mục đích |
|---|------|--------|---------|--------|----------|
| 8 | **Crit DMG** | Sát thương bạo kích | `150% + LCK × 0.5%` | LCK | LCK giờ scale cả rate + damage |
| 9 | **Dodge Rate** | Tỉ lệ né tránh | `min(30%, AGI×0.2% + DEX×0.1%)` | AGI, DEX | Tránh damage hoàn toàn |
| 10 | **Block Rate** | Tỉ lệ đỡ đòn | `min(25%, END×0.2% + STR×0.1%)` | END, STR | Giảm 50% damage khi block |
| 11 | **HP Regen** | Hồi máu/tick | `END×0.1 + level×0.05` HP/s | END | Sustain trong combat dài |
| 12 | **Skill Haste** | Giảm CD skill | `min(30%, INT×0.3%)` | INT | INT có giá trị combat |
| 13 | **Status Resist** | Kháng trạng thái | `min(40%, INT×0.2% + END×0.1%)` | INT, END | Chống CC/debuff |
| 14 | **Morale Aura** | Cổ vũ đồng đội | Avg CHA team → `+CHA×0.1%` dmg cho cả party | CHA | CHA có combat presence |

### 2.3 Hits/Second hiển thị (UI-friendly)

```
Hits per Second = 1000 / Attack Interval (ms)
Ví dụ: AGI=20, weaponBase=1800ms
  → interval = 1800 / (1 + 20/100) = 1500ms
  → 0.67 hits/s
  → Hiển thị: "0.67 hit/s"
```

### 2.4 Effective DPS (tham khảo, ko show trực tiếp)

```
Effective DPS = Physical ATK × Hits/s × (1 + CritRate × (CritDMG - 1)) × (1 + SkillBonus)
```

---

## 3. Guild / Non-Combat Derived Stats 🏰

| # | Stat | Tên VN | Formula | Talent | Dùng ở đâu |
|---|------|--------|---------|--------|-------------|
| 1 | **Influence** | Uy tín | `CHA×2 + INT×1 + level×0.5` | CHA, INT | Recruit quality, quest unlock tier |
| 2 | **Stamina** | Thể lực | `END×3 + STR×1` | END, STR | Mission duration capacity, work hours |
| 3 | **Craft Skill** | Tay nghề | `DEX×2 + INT×1` | DEX, INT | Workshop rare item chance, quality |
| 4 | **Training Eff.** | Hiệu suất tập | `+0.2% per (DEX+AGI)` | DEX, AGI | Training Yard EXP bonus |
| 5 | **Gather Speed** | Tốc độ khai thác | `+0.4% per STR` | STR | Workshop production speed |
| 6 | **Negotiation** | Thương lượng | `CHA×2 + LCK×1` | CHA, LCK | Tavern upkeep reduction, shop price |
| 7 | **Recovery** | Tốc hồi phục | `base − (END+INT)×0.1%` | END, INT | Infirmary injury recovery |
| 8 | **Exploration** | Thám hiểm | `AGI×2 + LCK×1` | AGI, LCK | Travel time reduction, hidden quest |
| 9 | **Leadership** | Lãnh đạo | `CHA×2 + INT×1 + STR×0.5` | CHA,INT,STR | Max party size bonus, team morale |
| 10 | **Fortune** | Vận may | `LCK×3 + CHA×0.5` | LCK, CHA | Loot rarity, recruit quality, event bonus |

---

## 4. Talent Impact Matrix 🗺️

> Bảng tổng: mỗi talent ảnh hưởng những derived stats nào

| Talent | Combat Stats | Guild Stats | Total |
|--------|-------------|-------------|-------|
| **STR** | Physical ATK ⭐, Block Rate | Stamina, Gather Speed, Leadership | 5 |
| **END** | Max HP ⭐, Defense, Block Rate, HP Regen, Status Resist | Stamina, Recovery | 7 |
| **INT** | Skill Haste ⭐, Status Resist | Influence, Craft Skill, Recovery, Leadership | 6 |
| **DEX** | Skill DMG Bonus ⭐, Dodge Rate | Craft Skill, Training Eff. | 4 |
| **CHA** | Morale Aura | Influence ⭐, Negotiation, Leadership, Fortune | 5 |
| **LCK** | Crit Rate ⭐, Crit DMG | Negotiation, Exploration, Fortune ⭐ | 5 |
| **AGI** | Attack Speed ⭐, Dodge Rate | Training Eff., Exploration | 4 |

> ⭐ = Primary derived stat (highest scaling)

> [!IMPORTANT]
> Không talent nào là "dump stat" — mọi talent đều ảnh hưởng ít nhất 4 derived stats (2 combat + 2 guild).
> END là versatile nhất (7 impacts) — phù hợp vì tank/bruiser archetype cần nhiều survival tools.

---

## 5. Talent Identity — "Khi nào tôi cần stat này?"

| Talent | Tóm tắt 1 dòng cho Player | Archetype phù hợp |
|--------|---------------------------|-------------------|
| **STR** | "Đánh mạnh — đỡ giỏi — khai thác nhanh" | Warrior, Tank, Miner |
| **END** | "Sống lâu — chịu đòn — dẻo dai" | Tank, Bruiser, Worker |
| **INT** | "Skill xoay nhanh — kháng CC — quản lý guild" | Strategist, Scholar, Manager |
| **DEX** | "Skill đánh mạnh — né giỏi — tay nghề cao" | Assassin, Crafter, Scout |
| **CHA** | "Lãnh đạo — đàm phán — uy tín guild" | Guild Master, Diplomat, Commander |
| **LCK** | "Bạo kích — may mắn — loot tốt" | Gambler, Fortune Hunter, Scout |
| **AGI** | "Đánh nhanh — né nhanh — thám hiểm" | Speedster, Scout, Explorer |

---

## 6. Build Archetype Examples 🧪

### Build 1: Tank/Bruiser — "Bất Tử"
```
Priority: END > STR > AGI
Key stats: HP cao, Defense 60%+, Block 20%, HP Regen
Trade-off: DPS thấp, crit ít, không có guild utility
```

### Build 2: DPS Assassin — "Sát Thủ"
```
Priority: AGI > DEX > LCK
Key stats: Attack Speed 1.5+ hit/s, Dodge 25%, Crit 40%, Skill DMG +15%
Trade-off: HP thấp, dễ chết nếu bị hit, guild stats yếu
```

### Build 3: Strategist — "Quân Sư"
```
Priority: INT > CHA > LCK
Key stats: Skill Haste 25%, Status Resist 30%, Influence cao
Trade-off: Auto-attack yếu, HP trung bình
```

### Build 4: Guild Manager — "Thương Gia"
```
Priority: CHA > LCK > INT
Key stats: Influence max, Negotiation, Fortune, Leadership
Trade-off: Combat yếu toàn diện — cần team carry
```

### Build 5: All-Rounder Crafter — "Thợ Rèn"
```
Priority: DEX > STR > INT
Key stats: Craft Skill cao, Gather Speed tốt, Skill DMG decent
Trade-off: Không excel ở combat hay guild management
```

---

## 7. Civilization Passive Interactions 🌏

### Với Derived Stats mới

| Civilization | Combat Passive | Guild Synergy |
|-------------|---------------|---------------|
| **LinhSon** 🏔️ | END/DEX +15% khi HP>50% → Defense & Dodge tăng đáng kể | Recovery Rate tốt hơn (END boost) |
| **DeQuoc** 🏛️ | CHA/INT +3%/stack (max 5) → Morale Aura & Skill Haste scale | Influence + Leadership tăng theo combat |
| **ThienLu** 🌿 | AGI +15% permanent + 10% base dodge → Attack Speed & Dodge Rate cực cao | Exploration + Training Eff. tăng |

### Ví dụ cụ thể: ThienLu Dualblade

```
Base Stats: STR=12, END=5, INT=4, DEX=15, CHA=5, LCK=10, AGI=25
After ThienLu passive (AGI +15%): AGI → 28

Combat Derived:
  - Physical ATK: 12 (weapon x1.0)
  - Attack Speed: 1800 / (1 + 28/100) = 1406ms → 0.71 hit/s  
  - Crit Rate: 5% + 10×0.3% = 8%
  - Crit DMG: 150% + 10×0.5% = 155%
  - Dodge Rate: min(30%, 28×0.2% + 15×0.1%) = 7.1% + ThienLu base 10% = 17.1%
  - Defense: 5/(5+100) = 4.8%
  - Block Rate: 5×0.2% + 12×0.1% = 2.2%
  - Max HP: 50 + 5×5 + 1×10 = 85
  
Guild Derived:
  - Exploration: 28×2 + 10×1 = 66
  - Training Eff: (15+28)×0.002 = +8.6%
  - Craft Skill: 15×2 + 4×1 = 34
```

→ Rõ ràng: ThienLu Dualblade = "Nhanh, né giỏi, damage ổn nhưng giấy". Player hiểu liền!

---

## 8. UI Display Suggestion 📊

### Tab Combat Stats (hiển thị trên character sheet)

```
┌─────────────────────────────────────┐
│  ⚔️ COMBAT STATS                    │
│─────────────────────────────────────│
│  ❤️  Max HP          85             │
│  ⚔️  Physical ATK    12             │
│  ⚡  Attack Speed     0.71 hit/s    │
│  🎯  Crit Rate        8%            │
│  💥  Crit Damage      155%          │
│  🌀  Skill DMG Bonus  +7.5%         │
│  🛡️  Defense          4.8%          │
│  💨  Dodge Rate        17.1%         │
│  🔰  Block Rate        2.2%          │
│  💚  HP Regen          0.5/s         │
│  ⏱️  Skill Haste       1.2%          │
│  🔮  Status Resist     1.8%          │
└─────────────────────────────────────┘
```

### Tab Guild Stats (hiển thị trên character sheet)

```
┌─────────────────────────────────────┐
│  🏰 GUILD STATS                     │
│─────────────────────────────────────│
│  👑  Influence        16            │
│  💪  Stamina          27            │
│  🔨  Craft Skill      34            │
│  📚  Training Eff.    +8.6%         │
│  ⛏️  Gather Speed     +4.8%         │
│  🤝  Negotiation      20            │
│  💊  Recovery Rate     0.99x        │
│  🗺️  Exploration      66            │
│  👥  Leadership        16.5         │
│  🍀  Fortune          32.5          │
└─────────────────────────────────────┘
```

---

## 9. Formulas Tổng Hợp (Implementation Reference)

### Combat Formulas

```typescript
// Existing
calcMaxHp(end, level) = 50 + end * 5 + level * 10
calcAttackInterval(agi, weaponBase = 1800) = max(300, weaponBase / (1 + agi/100))
calcAutoAttackDamage(str, targetEnd, weaponMult = 1.0) = max(1, str * weaponMult * (1 - min(0.75, targetEnd/(targetEnd+100))))
calcSkillDamage(base, mult, dex) = base * mult * (1 + dex * 0.005)
rollCrit(lck) = random() < min(0.50, 0.05 + lck * 0.003)

// New / Modified  
calcCritDamage(lck) = 1.5 + lck * 0.005                    // 150% + 0.5% per LCK
calcDodgeRate(agi, dex) = min(0.30, agi * 0.002 + dex * 0.001)
calcBlockRate(end, str) = min(0.25, end * 0.002 + str * 0.001)
calcHpRegen(end, level) = end * 0.1 + level * 0.05          // per second
calcSkillHaste(int) = min(0.30, int * 0.003)                 // CD reduction %
calcStatusResist(int, end) = min(0.40, int * 0.002 + end * 0.001)
calcMoraleAura(avgCha) = avgCha * 0.001                      // +% dmg for team
```

### Guild Formulas

```typescript
calcInfluence(cha, int, level) = cha * 2 + int * 1 + level * 0.5
calcStamina(end, str) = end * 3 + str * 1
calcCraftSkill(dex, int) = dex * 2 + int * 1
calcTrainingEff(dex, agi) = (dex + agi) * 0.002             // multiplier bonus
calcGatherSpeed(str) = str * 0.004                           // multiplier bonus
calcNegotiation(cha, lck) = cha * 2 + lck * 1
calcRecoveryRate(end, int, baseRate) = max(0.2, baseRate - (end + int) * 0.001)
calcExploration(agi, lck) = agi * 2 + lck * 1
calcLeadership(cha, int, str) = cha * 2 + int * 1 + str * 0.5
calcFortune(lck, cha) = lck * 3 + cha * 0.5
```

---

## 10. Open Questions ❓

> [!IMPORTANT]
> **Q1:** Có nên thêm **Morale Aura** (CHA → team combat buff) hay quá phức tạp cho MVP?
> CHA hiện = 0 combat impact. Nếu không thêm, CHA sẽ là dump stat cho combat-focused builds.
> answer: Thêm buff Morale Aura lấy theo CHA của thành viên có CHA cao nhất trong party. Cơ chế đơn giản, dễ hiểu, tăng giá trị CHA trong combat mà không quá phức tạp.
> [!IMPORTANT]
> **Q2:** **Block mechanic** — khi block thì giảm bao nhiêu damage? Min đề xuất 50%. 
> Hay dùng formula: `BlockReduction = 30% + END×0.2%` (scale theo END)?
> answer : 50% OK cho MVP — dễ hiểu, dễ implement. Sau này có thể thêm END scaling nếu muốn tăng depth.
> [!IMPORTANT]
> **Q3:** **HP Regen** — nên tick mấy giây 1 lần? 
> Đề xuất: Mỗi 1 giây = dễ implement + visual feedback rõ ràng.
> answer: Tạm thời 1 giây 1 tick là hợp lý cho MVP.
> [!IMPORTANT]
> **Q4:** Các guild stats mới (Influence, Stamina, Exploration, v.v.) — implement luôn hay chỉ design trước, implement khi cần?
> Recommend: Implement formula functions trước, hook vào gameplay sau.
> Tạm thời chỉ show guild stats trên character sheet, chưa cần integrate vào mission/facility mechanics ngay để tránh scope creep.
> [!WARNING]
> **Q5:** **Status Effect system** — game hiện CHƯA có status effects (stun, slow, poison...). 
> Status Resist sẽ vô nghĩa nếu không có. Nên prioritize status effects trước hay để Status Resist = placeholder?
> answer : place holder cho Status Resist trong MVP, prioritize combat stats khác trước. Sau khi có status effects, sẽ implement Status Resist và điều chỉnh formula nếu cần. 
---

## 11. Recommended Priority

| Phase | Nội dung | Effort |
|-------|----------|--------|
| **Phase A** (ngay) | Implement `calcDerivedCombatStats()` + `calcDerivedGuildStats()` pure functions + UI hiển thị | 4h |
| **Phase B** (sau) | Hook Dodge Rate, Block Rate, HP Regen vào combat-simulator.ts | 3h |
| **Phase C** (sau nữa) | Hook guild derived stats vào gameplay systems (mission, facility) | 4h |
| **Phase D** (future) | Status effects system + Status Resist + Skill Haste | 6h |
