# Alchemy

## 1.1.4 Chi tiết Alchemy System

Alchemy là hệ thống chế tạo potion thành syringes (ống tiêm - injectable consumables) để tăng hiệu quả và immersion. Recipes tự mở khi nâng level alchemy. Cơ chế combine random nguyên liệu để tạo ra các loại buff/debuff/healing đã define.

**Upgrade System:** Tier unlock system with penalties for higher rarity items.

### 1.1.4.2 Alchemy Upgrade Table

| Tier | Unlocks | Material Cost Multiplier | Success Rate Penalty | Notes |
|------|---------|------------------------|----------------------|-------|
| Base | Basic Syringes | 1.0x | 90-95% | Healing/Buff/Debuff |
| Tier 1 | Advanced Syringes | 1.5x | -10% (80-85%) | Stronger effects |
| Tier 2 | Rare Syringes | 2.25x | -20% (70-75%) | Multi-target |
| Tier 3 | Epic Syringes | 3.375x | -30% (60-65%) | Permanent buffs |
| Tier 4 | Legendary Syringes | 5.0625x | -40% (50-55%) | Ultimate effects |

**Crafting Time:** Fixed 5-10 min, but random combination complexity increases.

### 1.1.4.3 Cơ chế Unlocking và Slots

- **Level Progression:** Mỗi level alchemy mở thêm slots combine.
  - Level 1: 1 slot (basic potions).
  - Level 3: 3 slots (vd: 3 Slime Gel → Super Healing Syringe).
  - Max Level: 5 slots (random combine đa dạng).
- **Syringe Benefits:** Injectable consumables, hiệu quả cao hơn potion (vd: healing syringe hồi 150% HP thay vì 100%, hoặc instant inject).

### 1.1.4.3 Random Combination Mechanics

- **Base Magic Items:** 8 loại (Etherbloom Herb, Mist Essence, Ancient Shard, Mutation Gel, Void Dust, Radiant Fragment, Fogweed, Etheric Slime) với lore ties to Ether, Mist, ancient civilizations, mutations.
- **Mapping to Enemies/Bosses:**
  - Slimes: Mutation Gel, Etheric Slime (biological ooze from amorphous creatures).
  - Mutated Creatures: Radiant Fragment, Mutation Gel (radiation and transmutation from experiments).
  - Ether Beings: Etherbloom Herb, Etheric Slime, Void Dust (Ether-infused and void-related).
  - Mist Entities: Mist Essence, Fogweed (Mist vapor and fog-grown herbs).
- **Combinatorics Calculation:** Với 8 items, max 5 slots, số combinations ≈ 8^5 = 32,768 (order matters, duplicates allowed). Map thành 22 potion types (10 buffs, 9 debuffs, 3 healing) qua random generation, với một số combos tạo same type để balance.
- **Random Recipe Mapping:** Dưới đây là mapping mẫu cho 22 types (10 buffs, 9 debuffs, 3 healing). Mỗi type có 1-3 combos ví dụ; trong game, random roll dựa trên items selected để tạo variety.

  - **Buff Damage %:** Etherbloom Herb + Radiant Fragment + Void Dust (high chance); Mist Essence + Ancient Shard.
  - **Buff Defend %:** Etheric Slime + Mutation Gel + Fogweed; Ancient Shard + Void Dust.
  - **Buff Spell Damage %:** Mist Essence + Etherbloom Herb + Radiant Fragment; Void Dust + Fogweed.
  - **Buff Resist Spell:** Etheric Slime + Ancient Shard + Mutation Gel; Radiant Fragment + Mist Essence.
  - **CC Immunity 5s:** Void Dust + Etherbloom Herb + Fogweed; Mutation Gel + Ancient Shard.
  - **Shield:** Etheric Slime + Radiant Fragment + Void Dust; Fogweed + Mist Essence.
  - **Buff Ranged Damage Resist:** Ancient Shard + Etherbloom Herb + Mutation Gel; Radiant Fragment + Fogweed.
  - **Attack % Buff có Stun:** Mist Essence + Void Dust + Etheric Slime; Ancient Shard + Radiant Fragment.
  - **Summon (TBC):** Etherbloom Herb + Fogweed + Mutation Gel; Void Dust + Mist Essence.
  - **Giảm Cooldown:** Radiant Fragment + Etheric Slime + Ancient Shard; Fogweed + Void Dust.

  - **Reduce Damage:** Mutation Gel + Void Dust + Fogweed; Etheric Slime + Radiant Fragment.
  - **Reduce Defense:** Ancient Shard + Mist Essence + Mutation Gel; Void Dust + Etherbloom Herb.
  - **Silence:** Fogweed + Etheric Slime + Radiant Fragment; Mist Essence + Ancient Shard.
  - **Reduce Healing %:** Void Dust + Mutation Gel + Etherbloom Herb; Fogweed + Radiant Fragment.
  - **Slow:** Etheric Slime + Ancient Shard + Mist Essence; Mutation Gel + Void Dust.
  - **Reduce Attack Speed:** Radiant Fragment + Fogweed + Etherbloom Herb; Ancient Shard + Etheric Slime.
  - **Increase Miss Chance:** Mist Essence + Void Dust + Mutation Gel; Fogweed + Ancient Shard.
  - **Hex:** Etherbloom Herb + Radiant Fragment + Fogweed; Void Dust + Etheric Slime.
  - **Immobilize:** Mutation Gel + Mist Essence + Ancient Shard; Radiant Fragment + Void Dust.

  - **Instant Heal:** Etherbloom Herb + Etheric Slime + Radiant Fragment; Mist Essence + Mutation Gel.
  - **Heal-over-Time:** Fogweed + Void Dust + Ancient Shard; Etheric Slime + Radiant Fragment.
  - **Regen Buff:** Mutation Gel + Etherbloom Herb + Mist Essence; Void Dust + Fogweed.

### 1.1.4.4 Các chỉ số cơ bản

- Chỉ số có thể không tiêu hao nguyên liệu (`resource saving chance`)
- Chỉ số có tỉ lệ tạo ra 2 sản phẩm cùng lúc (`double product chance`)

#### 1.1.4.5 Input

- Người chơi chọn loại spell mình muốn craft hoặc là potion (Buff, Debuff, Potion)
  - Magic item
  - Gỗ (Define later)
  - Recipe
  - Improve success rate tăng +10~+25% success rate
    - Normal: 90-95%
    - Rare: 75-85%
    - Epic: 50-70%
    - Legendary: 30-50%

#### 1.1.4.6 Output

- Rare spell hoặc potion có success rate thấp hơn và yêu cầu công thức + nguyên liệu hiếm hơn
- Dùng magic item enchant để tạo ra spell hoặc portion enchant với bonus (TBC)
  - Magic tier effect không chỉ là tăng tỉ lệ rớt, mà nên là:
  - Tăng duration
  - Tăng potency %
  - Tăng HP amount
  - Tăng chance stun / silence / miss
  - Giảm cooldown hoặc giảm charge cost
  - Tăng quality nếu dùng Enchanted Essence
- Vì buff/debuff/potion chỉ tồn tại trong 1 map, tier càng cao => giá trị mỗi lần dùng càng quan trọng.

#### 1.1.4.7 Buff

- Buff nên chia thành lớp và có hiệu ứng rõ:
  - Buff damage % (tăng sát thương thường)
  - Buff defend % (giảm sát thương nhận vào)
  - Buff spell damage % (tăng sát thương phép)
  - Buff resist spell (tăng kháng phép)
  - CC immunity 5s (miễn khống chế trong 5 giây)
  - Shield (hấp thụ damage theo giá trị cố định)
  - Buff ranged damage resist (giảm damage từ đánh xa)
  - Attack % buff có stun (tăng % xác suất gây stun khi đánh)
  - Summon (TBC)
  - Giảm cooldown

- Nên phân biệt:
  - Single-target buff vs team buff
  - Short duration (5-10s) cho map-limited
  - Có stack hay không

#### 1.1.4.8 Debuff

- Các debuff khả thi:
  - Reduce damage (giảm damage đầu ra của kẻ thù)
  - Reduce defense (giảm phòng thủ mục tiêu)
  - Silence (cấm dùng skill trong X giây)
  - Reduce healing % (giảm heal hoặc regen của đối phương)
  - Slow (giảm tốc độ di chuyển/tấn công)
  - Reduce attack speed (giảm tốc độ đánh)
  - Increase miss chance (tăng khả năng đánh trượt)
  - Hex (Hóa cừu, gà)
  - Immobilize (Khóa chân nhưng vẫn đánh được)

- Nên phân biệt:
  - Single-target buff vs team buff
  - Short duration (5-10s) cho map-limited
  - Có stack hay không

#### 1.1.4.9 Healing potion

- Instant heal: hồi ngay 1 lượng HP
- Heal-over-time: hồi theo tick trong vài giây
- Regen buff: tăng tốc hồi HP trong X giây
- Healing potion có thể có:
- HP amount cố định
- Percentage heal (% Máu tối đa)
- Shield on heal (hồi + tạo lá chắn nhỏ)
