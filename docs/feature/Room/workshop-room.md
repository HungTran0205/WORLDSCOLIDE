# Workshop

## 1.1.3 Chi tiết Workshop: Chế tạo Vũ khí, Giáp, và Đúc Quặng

### 1.1.3.1 Tổng quan Workshop

Workshop là phòng chế tạo thống nhất, kết hợp chức năng tạo phôi, chế tạo vũ khí, chế tạo giáp, sửa chữa và tháo rời. Workshop sử dụng hệ thống queue song song cho mỗi tác vụ, với giới hạn slots (3-5 ban đầu, tăng theo level workshop) để buộc người chơi lựa chọn ưu tiên giữa các tác vụ và cân nhắc xây thêm workshop.

3 tác vụ chính với queue riêng:
- **Tạo Phôi (Blank Crafting)**: Queue dựa trên nguyên liệu (wood/ore), xử lý parallel, dừng nếu thiếu materials.
- **Chế tạo Vũ khí/Giáp (Weapon/Armor Crafting)**: Yêu cầu phôi + nguyên liệu quái, queue parallel nhưng dừng nếu thiếu blank hoặc monster drops.
- **Sửa Đồ (Repair)**: Queue sequential cho từng item, xử lý tuần tự trong queue.

Mỗi tác vụ xử lý parallel trong giới hạn slots, nhưng tổng thể buộc strategic choices. Khi queue của tác vụ hết, Workshop có thể chuyển sang tác vụ khác nếu có item chờ. Hệ thống hỗ trợ offline progression và idle gameplay.

**Upgrade System:** Tier unlock system with penalties for higher rarity items.

### 1.1.3.2 Workshop Upgrade Table

| Tier | Unlocks | Material Cost Multiplier | Success Rate Penalty | Notes |
|------|---------|------------------------|----------------------|-------|
| Base | Tier 1 Weapons/Armor | 1.0x | 95% (common) | Baseline crafting |
| Tier 1 | Tier 2 Weapons/Armor | 1.5x | -10% (85% for rare) | Increased durability |
| Tier 2 | Tier 3 Weapons/Armor | 2.25x | -20% (75% for epic) | Enchanted stats |
| Tier 3 | Tier 4 Weapons/Armor | 3.375x | -30% (65% for legendary) | Rare materials required |
| Tier 4 | Tier 5 Weapons/Armor | 5.0625x | -40% (55% for mythic) | Boss-tier quality |

**Crafting Time:** Scales with tier (5-15 min base, +50% per tier).

### 1.1.3.3 Chế độ Tạo Phôi (Blank Crafting)

- **Mục đích:** Tạo ra phôi vũ khí hoặc giáp cơ bản từ gỗ hoặc quặng thô.
- **Input:** Gỗ (cho vũ khí) hoặc Quặng thô (Stone, Iron Ore, Crystal, Rare Ore) cho giáp.
- **Output:** Phôi trắng với chỉ số cơ bản khóa cứng (vd: Weapon Blank +10 Damage, Armor Blank +50 HP). Phôi có thể stack trong inventory.
- **Thời gian:** Chu kỳ 5-15 giây tùy level workshop.
- **Bonus:** Double blank chance (10% base), Enchanted blank chance (2% base) cho bonus stat +1~+5.

### 1.1.3.4 Chế độ Chế tạo Vũ khí / Giáp (Crafting with Stats)

- **Hybrid System Recommendation:** Kết hợp time-based queue cho guaranteed progress với optional success rate boosts cho instant attempts.
- **Core Mechanic:** Sử dụng phôi kết hợp với nguyên liệu đánh rớt từ quái để thêm dòng stats unique. Tối đa 4 dòng stats. Mỗi dòng stats thêm vào item sẽ tăng fail rate thêm 10% so với base.
  - Slot 1: 30%.
  - Slot 2: 40%.
  - Slot 3: 50%.
  - Slot 4: 60%.
- **Stat Ranges:** Random min-max (vd: Crit Rate 5%-20%, HP 50-500).
  - Modifiers have min/max values randomized within ranges. Low-level mods (e.g., +10 life) scale to high-level (e.g., +100 life). Tiers are enforced by mod level requirements.
  - Hybrid mods combine flat and % (e.g., +10% physical damage, +5 flat).
  - Slot 1: Common/Basic
    - Suitable for early slots to build foundational power without creep. Linear scaling, essential for survival/utility.
    - Threat: 5-50 (aggro generation)
    - Defense Rating: 10-200 (damage reduction)
    - HP: 50-500 (health pool)
    - Mana: 20-200 (resource pool)
    - Mana Regen: 1-10/sec (sustained recovery)
    - Accuracy: 1%-10% (hit chance)
    - AS (Attack Speed): 5%-15% (action rate)
    - Dodge: 1%-5% (evasion chance)
    - Duration: 10%-50% (effect length)
    - Chance: 5%-20% (proc probability)

  - Slots 2-3: Powerful/Mid-Tier
    - Mid-game progression stats with multiplicative effects. Balanced for power without trivializing content.
    - Damage Melee: 10-100 (flat physical damage)
    - Crit Rate: 5%-20% (critical hit chance)
    - Crit Dam: 50%-150% (critical multiplier)
    - Effect Chance: 10%-30% (special effect probability)
    - Damage Range: 10-100 (flat ranged damage)
    - Magic Damage: 10-100 (flat elemental damage)
    - Element Chance: 5%-15% (elemental proc chance)
    - Heal Amount: 20-200 (healing potency)
    - Buff Duration: 20%-50% (beneficial effect extension)
    - Shield: 50-500 (absorptive defense)
    - Invi Duration: 5-30 sec (stealth uptime)

  - Slot 4: Legendary/Overpowered
    - End-game stats with extreme scaling/caps. Reserved for legendary gear to prevent early access.
    - Crit Dam: 200%-500% (extreme multipliers, cap at 500%)
    - Effect Chance: 50%-100% (guaranteed procs)
    - Heal Amount: 500-2000 (massive regen, diminishing returns)
    - Buff Duration: 100%-200% (near-permanent buffs)
    - Shield: 1000-5000 (high absorptive, cap at 50% max HP)
    - Invi Duration: 60-300 sec (extended stealth)

- **Stat Placement for Power Creep Prevention**
Early slots focus on survival/utility to enable progression. Late slots introduce damage/output boosts to reward investment without front-loading power.
  - **Early Slots (1-2)**: Defense Rating, HP, Mana, Dodge, Accuracy, Mana Regen, Threat, Duration, Chance. Builds tanky/sustainable builds.
  - **Mid Slots (2-3)**: AS, Damage Melee/Range, Crit Rate, Effect Chance, Element Chance, Heal Amount, Buff Duration, Shield. Enhances offense/defense without extremes.
  - **Late Slots (4)**: Crit Dam, Invi Duration. Game-changing but gated by high risk/failure.
- **Input:** Phôi, Nguyên liệu quái (Monster Essence/Gem), optional catalysts.
- **Output:** Vũ khí/Giáp với dòng stats. Enchanted items với bonus stat +1~+5.
- **Double Product Chance:** 5% base, tăng với workshop level.
- **Resource Saving Chance:** 10% base, giảm tiêu hao materials.
- **Crafting**: Introduce 20-50% fail rates with destruction for high-stakes upgrades, ensuring risk/reward favors skilled play.

### 1.1.3.5 Chức năng Sửa chữa (Repair)

- **Hybrid System:** Kết hợp time-based queue cho guaranteed repair với optional instant attempt success rate.
- **Core Mechanic:** Queue repair đảm bảo phục hồi durability sau thời gian (1-5 phút tùy damage level), phù hợp idle gameplay.
- **Optional Instant Attempt:** "Rush" repair với success rate (80-95% base, giảm nếu damage nặng). Thất bại giữ nguyên durability, tiêu tốn materials. Boost success rate bằng catalysts (+10~+25%).
- **Cost:** Tùy % durability còn lại, dùng quặng và wood.
- **Output:** Item phục hồi full durability nếu thành công.

### 1.1.3.6 Chức năng Tháo rời (Dismantle)

- **Instant Action:** Phá hủy item để lấy lại materials (70-90% recovery rate).
- **Output:** Quặng và wood từ item, enchanted items giữ bonus nhưng recovery thấp hơn.

### 1.1.3.7 Các chỉ số cơ bản

- Capacity: Giới hạn queue slots (3-10 tùy level).
- Upgrade: Tăng tốc độ, success rates, double chances, capacity.
- Auto-collect: Items hoàn thành tự chuyển vào inventory nếu có slot.
