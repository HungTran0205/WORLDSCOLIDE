# Feature List

## 1. Hệ thống phòng và thu thập tài nguyên

### 1.1 Phòng khai thác

#### 1.1.1 Chi tiết phòng khai thác gỗ

##### 1.1.1.1 Các chỉ số cơ bản

- Capacity room: giới hạn lượng gỗ chứa trong phòng trước khi cần thu hoạch (ví dụ 1000 / 2000 / 4000)
- Adventure upgrade cost: khi đi adventure có thể farm ra currency rồi dùng currency để nâng cấp phòng khai thác gỗ mở rộng limit chứa gỗ

##### 1.1.1.2 Các chỉ số khi nhân vật được assign vào room

- Tốc độ chặt gỗ: số đơn vị gỗ / giây hoặc chu kỳ (ví dụ 5s / 10 gỗ)
- Durability / tool break chance: tỉ lệ dụng cụ hỏng mỗi lần khai thác (ví dụ 5% base, giảm khi nâng cấp tool)
- Double harvest chance: tỉ lệ nhận gỗ x2 / bonus yield (ví dụ 10% base, tăng khi nâng cấp hoặc buff)
- Enchanted wood chance: tỉ lệ thu được gỗ enchant hiếm với bonus đặc biệt (ví dụ 2% base)
  - Gỗ enchant có thể cho bonus stat dựa trên STR, DEX, AGI, INT, END, LUK, CHA
  - Bonus stat ngẫu nhiên +1 đến +5 cho mỗi chỉ số phù hợp với item hoặc nhân vật

##### 1.1.1.3 Các chỉ số khi có furniture

- Bonus modifiers: tăng thêm yield khi room level cao, khi có nhân sự phù hợp, hoặc khi dùng boost item

##### 1.1.1.4 Các cơ chế khác

- Auto-collect trigger: khi phòng đầy đến limit, tự chuyển gỗ vào kho hoặc giữ để đợi thu hoạch
  - Nếu còn slot inventory: tự nạp gỗ vào kho / nhân vật khi offline
  - Nếu đầy slot inventory: giữ gỗ tại phòng hoặc tạo backlog cho lần thu hoạch tiếp theo sau khi giải phóng slot
- Risk/reward động lực: tăng tốc độ và tỉ lệ loot hiếm đổi bằng chi phí bảo trì hoặc tool durability

#### 1.1.2 Chi tiết phòng khai thác đá

##### 1.1.2.1 Các chỉ số cơ bản

- Capacity room: giới hạn lượng đá chứa trong phòng trước khi cần thu hoạch (ví dụ 100 / 200 / 400)
- Upgrade tier effect: mỗi cấp mỏ đá mở thêm cơ hội rớt nguyên liệu hiếm khác nhau (ví dụ từ Stone -> Iron Ore -> Crystal -> Rare Ore)
- Rare material drop chance: khi cấp mỏ đá tăng từ 1 lên 10, tỉ lệ rớt Stone giảm và tỉ lệ rớt các loại khoáng hiếm tăng.
  - Level 1: Stone 100%, Iron Ore 0%, Crystal 0%, Rare Ore 0%
  - Level 2: Stone 95%, Iron Ore 3%, Crystal 2%, Rare Ore 0%
  - Level 4: Stone 80%, Iron Ore 12%, Crystal 6%, Rare Ore 2%
  - Level 6: Stone 60%, Iron Ore 20%, Crystal 12%, Rare Ore 8%
  - Level 8: Stone 40%, Iron Ore 25%, Crystal 20%, Rare Ore 15%
  - Level 10: Stone 20%, Iron Ore 25%, Crystal 30%, Rare Ore 25%
- Enchanted ore chance: tỉ lệ nhận ore enchant hiếm, mỗi ore enchant cho bonus stat ngẫu nhiên +1 đến +5
  - Bonus stat có thể dựa trên STR, DEX, AGI, INT, END, LUK, CHA
  - Ví dụ bonus: +1~+5 STR, +1~+5 DEX, +1~+5 AGI, +1~+5 INT, +1~+5 END, +1~+5 LUK, +1~+5 CHA

##### 1.1.2.2 Các chỉ số khi nhân vật được assign vào room

- Tốc độ khai thác: số đơn vị đá / giây hoặc chu kỳ (ví dụ 5s / 8 đá)
- Double harvest chance: tỉ lệ nhận đá x2 / bonus yield (ví dụ 10% base, tăng khi nâng cấp hoặc buff)
- Bonus modifiers: tăng thêm yield khi room level cao, khi có nhân sự phù hợp, hoặc khi dùng boost item
- Adventure upgrade cost: khi đi adventure có thể dùng currency để nâng cấp mỏ đá nhanh hơn, tăng tốc độ / tỉ lệ rơi rare và mở rộng limit chứa đá
- Auto-collect trigger: offline, nếu còn slot inventory thì tự chuyển đá vào kho; nếu đầy slot inventory thì giữ đá tại phòng hoặc backlog cho lần thu hoạch tiếp theo
- Risk/reward động lực: tăng tốc độ và tỉ lệ loot hiếm đổi bằng chi phí bảo trì hoặc tool durability

#### 1.1.3 Chi tiết phòng khai thác phép thuật

##### 1.1.3.1 Các chỉ số cơ bản

- Capacity room: giới hạn lượng magic item chứa trong phòng trước khi cần thu hoạch (ví dụ 50 / 100 / 200)
- Player choice: người chơi phải chọn trước loại magic item muốn thu thập, ví dụ `Buff Spell Fragment`, `Debuff Spell Fragment`, hoặc `Healing Potion Ingredient`
- Magic tier effect: mỗi cấp phòng không mở thêm loại item mới mà cải thiện chỉ số của loại item đã chọn
  - Các buff / debuff / potion chỉ tồn tại trong 1 map duy nhất
- Drop profile theo cấp phép thuật:
  - Level 1: Arcane Shard 100%, Spell Fragment 0%, Potion Ingredient 0%, Enchanted Essence 0%
  - Level 3: Arcane Shard 80%, Spell Fragment 12%, Potion Ingredient 6%, Enchanted Essence 2%
  - Level 5: Arcane Shard 60%, Spell Fragment 20%, Potion Ingredient 12%, Enchanted Essence 8%
  - Level 7: Arcane Shard 40%, Spell Fragment 30%, Potion Ingredient 20%, Enchanted Essence 10%
  - Level 10: Arcane Shard 25%, Spell Fragment 30%, Potion Ingredient 25%, Enchanted Essence 20%
- Craft material unlock: sử dụng các item phép thu được để craft:
  - `Buff Spell`: tăng ATK / DEF / AGI / INT trong combat
  - `Debuff Spell`: giảm sức mạnh hoặc tốc độ kẻ thù
  - `Healing Potion`: hồi HP hoặc regen trong combat
- Enchanted Essence chance: tỉ lệ nhận essence phép có bonus stat ngẫu nhiên +1 đến +5
  - Buff Spell: tăng duration, buff %, hoặc bonus stat
  - Debuff Spell: tăng duration, debuff %, hoặc negative effect strength
  - Healing Potion: tăng HP amount hoặc regen amount

##### 1.1.3.2 Các chỉ số khi nhân vật được assign vào room

- Tốc độ khai thác phép: số đơn vị item / giây hoặc chu kỳ (ví dụ 6s / 6 items)
- Double harvest chance: tỉ lệ nhận item x2 / bonus yield (ví dụ 8% base, tăng khi nâng cấp hoặc buff)
- Bonus modifiers: tăng thêm yield khi room level cao, khi có nhân sự phù hợp, hoặc khi dùng spell catalyst
- Adventure upgrade cost: khi đi adventure có thể dùng currency để nâng cấp phòng phép nhanh hơn, tăng tốc độ / tỉ lệ rơi rare và mở rộng limit chứa item
- Auto-collect trigger: offline, nếu còn slot inventory thì tự chuyển magic item vào kho; nếu đầy slot inventory thì giữ item tại phòng hoặc backlog cho lần thu hoạch tiếp theo
- Risk/reward động lực: tăng tốc độ và tỉ lệ loot hiếm đổi bằng chi phí reagent / breakdown chance

#### 1.1.4 Chi tiết Workshop: Chế tạo Vũ khí, Giáp, và Đúc Quặng

##### 1.1.4.1 Tổng quan Workshop

Workshop là phòng chế tạo thống nhất, kết hợp chức năng đúc quặng, chế tạo vũ khí, chế tạo giáp, sửa chữa, và tháo rời. Người chơi chỉ có thể chọn 1 chế độ hoạt động tại một thời điểm: Đúc Quặng, Chế tạo Vũ khí, hoặc Chế tạo Giáp. Các chế độ khác (sửa chữa, tháo rời) là instant actions không chiếm slot chế độ.

##### 1.1.4.2 Chế độ Đúc Quặng (Ore Smelting)

- **Mục đích:** Chuyển đổi quặng thô thành quặng tinh luyện để dùng cho chế tạo.
- **Input:** Quặng thô (Stone, Iron Ore, Crystal, Rare Ore), nhiên liệu (Wood hoặc Essence).
- **Output:** Quặng tinh luyện với tỉ lệ thành công cao (95% base), thất bại tiêu tốn nhiên liệu nhưng giữ nguyên quặng.
- **Thời gian:** Chu kỳ 10-30 giây tùy level workshop.
- **Bonus:** Double smelt chance (10% base), Enchanted Ore chance (2% base) cho bonus stat +1~+5.

##### 1.1.4.3 Chế độ Chế tạo Vũ khí / Giáp (Crafting)

- **Hybrid System Recommendation:** Kết hợp time-based queue cho guaranteed progress với optional success rate boosts cho instant attempts.
- **Core Mechanic:** Queue-based crafting đảm bảo thành công sau thời gian (5-15 phút tùy rarity), phù hợp idle gameplay. Offline completion tích lũy items.
- **Optional Instant Attempt:** Người chơi có thể "rush" craft với success rate (70-90% cho rare, 50-70% cho epic, 30-50% cho legendary). Thất bại tiêu tốn materials nhưng không mất time. Boost success rate bằng catalysts (+10~+25% per catalyst).
- **Input:** Quặng tinh luyện, Wood/Gỗ, Recipe, optional catalysts.
- **Output:** Vũ khí/Giáp với rarity và stats. Enchanted items với bonus stat +1~+5.
- **Double Product Chance:** 5% base, tăng với workshop level.
- **Resource Saving Chance:** 10% base, giảm tiêu hao materials.

##### 1.1.4.4 Chức năng Sửa chữa (Repair)

- **Hybrid System:** Kết hợp time-based queue cho guaranteed repair với optional instant attempt success rate.
- **Core Mechanic:** Queue repair đảm bảo phục hồi durability sau thời gian (1-5 phút tùy damage level), phù hợp idle gameplay.
- **Optional Instant Attempt:** "Rush" repair với success rate (80-95% base, giảm nếu damage nặng). Thất bại giữ nguyên durability, tiêu tốn materials. Boost success rate bằng catalysts (+10~+25%).
- **Cost:** Tùy % durability còn lại, dùng quặng và wood.
- **Output:** Item phục hồi full durability nếu thành công.

##### 1.1.4.5 Chức năng Tháo rời (Dismantle)

- **Instant Action:** Phá hủy item để lấy lại materials (70-90% recovery rate).
- **Output:** Quặng và wood từ item, enchanted items giữ bonus nhưng recovery thấp hơn.

##### 1.1.4.6 Các chỉ số cơ bản

- Capacity: Giới hạn queue slots (3-10 tùy level).
- Upgrade: Tăng tốc độ, success rates, double chances, capacity.
- Auto-collect: Items hoàn thành tự chuyển vào inventory nếu có slot.

#### 1.1.5 Chi tiết phòng chế tạo: Phép thuật và máu

##### 1.1.5.1 Tổng quan Alchemy System

Alchemy là hệ thống chế tạo potion thành syringes (ống tiêm - injectable consumables) để tăng hiệu quả và immersion. Recipes tự mở khi nâng level alchemy. Cơ chế combine random nguyên liệu để tạo ra các loại buff/debuff/healing đã define.

##### 1.1.5.2 Cơ chế Unlocking và Slots

- **Level Progression:** Mỗi level alchemy mở thêm slots combine.
  - Level 1: 1 slot (basic potions).
  - Level 3: 3 slots (vd: 3 Slime Gel → Super Healing Syringe).
  - Max Level: 5 slots (random combine đa dạng).
- **Syringe Benefits:** Injectable consumables, hiệu quả cao hơn potion (vd: healing syringe hồi 150% HP thay vì 100%, hoặc instant inject).

##### 1.1.5.3 Random Combination Mechanics

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

##### 1.1.5.4 Các chỉ số cơ bản

- Chỉ số có thể không tiêu hao nguyên liệu (`resource saving chance`)
- Chỉ số có tỉ lệ tạo ra 2 sản phầm cùng lúc (`double product chance`)

###### 1.1.5.5 Input

- Người chơi chọn loại spell mình muốn craft hoặc là portion (Buff, Debuff, Portion)
  - Magic item
  - Gỗ (Define later)
  - Recipe
  - Improve success rate tăng +10~+25% success rate
    - Normal: 90-95%
    - Rare: 75-85%
    - Epic: 50-70%
    - Legendary: 30-50%

###### 1.1.5.6 Output

- Rare spell hoặc portion có success rate thấp hơn và yêu cầu công thức + nguyên liệu hiếm hơn
- Dùng magic item enchant để tạo ra spell hoặc portion enchant với bonus (TBC)
  - Magic tier effect không chỉ là tăng tỉ lệ rớt, mà nên là:
  - Tăng duration
  - Tăng potency %
  - Tăng HP amount
  - Tăng chance stun / silence / miss
  - Giảm cooldown hoặc giảm charge cost
  - Tăng quality nếu dùng Enchanted Essence
- Vì buff/debuff/potion chỉ tồn tại trong 1 map, tier càng cao => giá trị mỗi lần dùng càng quan trọng.

###### 1.1.5.7 Buff

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

###### 1.1.5.8 Debuff

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

###### 1.1.5.9 Healing portion

- Instant heal: hồi ngay 1 lượng HP
- Heal-over-time: hồi theo tick trong vài giây
- Regen buff: tăng tốc hồi HP trong X giây
- Healing potion có thể có:
- HP amount cố định
- Percentage heal (% Máu tối đa)
- Shield on heal (hồi + tạo lá chắn nhỏ)

### 1.2 Phòng mặc định

#### 1.2.1 Inventory

##### 1.2.1.1 Phân loại inventory phù hợp với game

- Resources / Materials
  - Wood, Stone, Iron, Crystal, Essence, Arcane Shard, Spell Fragment, Potion Ingredient, Enchanted Essence
- Gear
  - Weapon
  - Armor
- Spell / Portion
  - Buff Spell
  -Debuff Spell
  - Healing Potion / Healing Portion
- Crafting tools / vouchers
  - Success vouchers, enchant catalysts, recipe scrolls

##### 1.2.1.2 Filter UI đề xuất

- Tab chính:
  - All
  - Resources
  - Gear
  - Spells / Potions
  - Crafting
- Filter phụ:
  - Type (Wood / Ore / Fragment / Potion / Spell)
  - Rarity (Common / Rare / Epic / Legendary)
  - Source (Mining / Craft / Reward / Shop)
  - Stackable / Non-stackable
  - Equipped / Unequipped
- Search:
  - Search theo tên item
  - Search theo tag: buff, heal, magic, weapon, armor
- Sort:
  - Quantity, rarity, most recent, type

##### 1.2.1.3 Cơ chế mở rộng kho đồ

- Cơ chế hiện tại + mở rộng rất phù hợp:
  - Base slots fixed
  - Furniture / storage room add slots
- Đề xuất thêm:
  - Chest / Vault +20 slots mỗi cái
  - Max storage giới hạn theo số furniture / facility level
  - Upgrade storage tăng thêm slots cho Resources hoặc cho Equipment
- Cụ thể:
  - Storage Furniture (regular) tăng slot chung
  - Magic Vault tăng slot cho spells / potions
  - Material Silo tăng stack capacity hoặc giảm slot dùng cho materials
Option premium / event:
  - temporary overflow khi craft nhiều item
  - storage expansion token

##### 1.2.1.4 Cân bằng slot giữa materials và gear/spell

- Materials nên stackable lớn, tiêu dùng nhiều slot ít
- Gear / Spells nên non-stackable hoặc stack thấp
- Đề xuất:
  - Materials: stack max 99
  - Spells/Healing portions: stack 10 / 20
  - Weapons/Armor: 1 slot mỗi món
- Giải pháp:
  - Filter materials riêng để tránh nghẽn UI
  - auto-stack tự gom cùng loại

##### 1.2.1.5 UX & cảnh báo

- Thanh capacity rõ: 34 / 60 slots
- Khi full:
  - cảnh báo Inventory full
  - cho phép auto-store vào room backlog nếu loại item là resource
  - cho phép đổi thẳng sang sell / salvage
- Cần chú thích:
  - resources stack nhiều
  - spells / potions chiếm slot
  - weapon/armor chiếm 1 slot
- Nên hiển thị trên panel:
  - item icon + category badge
  - effect summary cho spells
  - quantity + slot cost

##### 1.2.1.6 Risk / Reward cho expansion

- Có thể thêm:
  - storage cost để giữ item lâu hơn
  - overflow penalty nếu full: giảm auto-collect, giữ backlog ở phòng until slot free
  - Nếu không đủ slot, phải lựa chọn sell / salvage / bỏ qua

##### 1.2.1.7 Gear Comparison và Item Details

- **Compare Gear Currently Equipped với Gear trong túi:**
  - Khi hover hoặc click vào item trong inventory, hiển thị popup so sánh với item đang equip.
  - Hiển thị stats difference: +5 STR, -2 AGI, etc.
  - Color coding: xanh cho tốt hơn, đỏ cho kém hơn, vàng cho bằng.
  - Preview visual của item mới trên nhân vật (sprite change nếu có).
  - Quick equip button từ popup.
- **Item Detail, Rarity, Stats hiển thị rõ:**
  - Tooltip chi tiết khi hover: name, rarity (Common/Rare/Epic/Legendary với màu sắc), stats base + bonuses.
  - Enchant bonuses: +1~+5 stats, special effects.
  - Durability bar cho weapons/armor.
  - Source info: crafted, dropped, bought.
  - Sell value, dismantle value.
  - Flavor text hoặc lore snippet cho immersion.

#### 1.2.2 Phòng hồi phục / Infirmary

- Mục tiêu: chữa thương cho nhân vật injured, không phải phòng sản xuất.
- Nhân vật bị injured vẫn có thể vào phòng hồi sức.
- Sức chứa phòng hồi sức giới hạn bằng tổng slot trong 1 party:
  - Ví dụ party 4 người → infirmary chỉ có 4 recovery slots.
  - Điều này giữ tính chiến lược: phòng hồi sức chỉ đủ cho 1 party cùng lúc.
- Nếu số injured vượt quá số slot, phần còn lại xếp queue slot chờ:
  - Queue slot giữ nhân vật chờ hồi sức, không thể tham gia phòng khác.
  - Queue slot có thể tăng khi nâng cấp infirmary.
- Thời gian hồi phụ thuộc vào máu tối đa:
  - `RecoveryTime = maxHp × 1.2 giây` hoặc công thức tương tự.
  - Máu càng nhiều thì thời gian hồi càng lâu.
  - Ví dụ: 100 maxHP ~ 2 phút, 200 maxHP ~ 4 phút, 300 maxHP ~ 6 phút.
- Nếu thời gian còn lại ≤ 5 phút thì xuất hiện nút `Skip 5 phút`:
  - Bấm để hồi full ngay lập tức.
  - Chỉ cho phép khi tiến trình hồi còn lại nhỏ hơn hoặc bằng 5 phút.
- Có thể rút nhân vật ra khỏi phòng khi chưa hồi full HP:
  - Nhân vật được trả về trạng thái `idle` hoặc `recovering` ở ngoài.
  - Nhưng nếu HP chưa đầy, nhân vật không thể vào phòng khai thác hoặc phòng chế tạo.
  - Điều này giữ đúng quy tắc: chưa phục hồi đủ không được dùng cho production.
- Hồi phục bằng premium currency:
  - Thêm tùy chọn `Premium Revival` hoặc `Instant Recovery`.
  - Người chơi tiêu premium để hồi full ngay lập tức hoặc bỏ qua phần còn lại của thời gian.
  - Giá có thể tính theo thời gian còn lại hoặc theo level/slot.
- Hạn chế thêm:
  - Nếu đang trong phòng hồi sức và chưa hồi full, không thể sử dụng item repair / upgrade trên nhân vật.
  - Nếu rút ra sớm, hiện trạng healing time vẫn có thể tiếp tục nếu đưa trở lại infirmary.
- UI cần hiển thị rõ:
  - `Max HP` của nhân vật,
  - `Remaining recovery time`,
  - trạng thái `Injured / Recuperating`,
  - cảnh báo `Cannot assign to Mining/Crafting until full HP`,
  - trạng thái `Queue` nếu đang chờ.

#### 1.2.3 Tuyển dụng tại Tavern

- Tavern là nơi tuyển member mới cho Guild.
- Mỗi lần mở Tavern hiển thị tối đa 5 candidate để người chơi chọn.
- Candidate bao gồm:
  - `archetype` / class
  - `civId` / civilisation source
  - `tier` / quality định hướng
  - `stat range` hoặc `trait`
- Khi chọn 1 candidate:
  - candidate đó vào roster,
  - slot đó bắt đầu `cooldown 4 giờ`,
  - ứng với giới hạn 5 slot hiện tại.
- Người chơi có thể chọn `Skip` trên từng candidate:
  - loại candidate hiện tại,
  - slot bắt đầu `cooldown 4 giờ`,
  - candidate mới chỉ xuất hiện khi slot cooldown kết thúc.
- Người chơi có thể chọn `Skip All`:
  - loại bỏ tất cả candidate hiện có,
  - tất cả 5 slot vào hàng đợi cooldown.
- Cơ chế queue cooldown:
  - cooldown được xử lý tuần tự theo queue slot,
  - slot kế tiếp chỉ bắt đầu cooldown sau khi slot trước đã hoàn thành và tạo candidate mới.
- Điều này tạo nhịp tuyển dụng rõ ràng,
  - tránh spam skip,
  - giữ lượng tuyển ổn định.
- Mở rộng nâng cấp:
  - Tavern higher level có thể cải thiện chất lượng candidate,
  - hoặc giảm thời gian cooldown / tăng tốc độ refill queue.

-----------------------------------------------------------------------------------------------------

## 2. Tài nguyên và nền kinh tế

- Tài nguyên cơ bản: Wood, Stone, Iron, Crystal, Essence
- Tài nguyên chế tạo: Metal Ore, Cloth, Leather, Alloy
- Tài nguyên hiếm: Boss Shard, Token, Rare Material
- Currency chính: Gold / Coin
- Currency phụ: Gem / Token / Premium Shard
- Hệ thống mua bán, bán thừa, đổi tài nguyên

## 4. Combat

- Combat turn base, dễ tiếp cận cho idle game
- Kết hợp chỉ số nhân vật + vũ khí + giáp
- Skill/passive đơn giản nhưng có tác dụng chiến thuật
- Combat result trả thưởng luôn, có thể xem lại log
- Độ khó tăng dần theo map và boss
- Roguelike ???
- Mỗi nhân vật sẽ chỉ có 1 skill passive 1 skill active

## 5. Reward khi đánh quái

- Drop vàng và tài nguyên cơ bản
- Drop vật liệu chế tạo rare
- Drop shards/mảnh trang bị boss
- Reward theo streak / kill combo
- Offline reward khi player không online

## 6. Map và progression

- Map chia thành vùng / zones với tier khác nhau
- Mỗi zone có enemy theme và loot riêng
- Zone mới unlock bằng progress, resource hoặc boss key
- Map có checkpoint và boss cuối vùng
- Mở khóa map mới mở rộng vòng lặp idle

## 7. Boss

- Boss cuối mỗi khu vực / region boss
- Boss có cơ chế riêng: shield, summon, phase
- Reward boss cao hơn: blueprint, shard hiếm, premium token
- Có thể có boss hàng ngày hoặc boss sự kiện

## 9. Trade / Market not in MVP

- Shop NPC bán resource và consumable
- Bán tài nguyên dư thừa lấy vàng
- Đổi token / boss shard lấy item hiếm
- Có thể có market daily / offer thay đổi

## 10. Currency và tiến trình

- Gold dùng nâng cấp phòng, craft, trade
- Gem / Token dùng mua premium, tăng tốc, mở khóa
- Điểm tiến trình / EXP dùng mở map, unlock room
- Hệ thống progress gating rõ ràng giữa các phase

## 11. Tính năng bổ trợ

- Offline progress + collect reward
- Tutorial / guided onboarding cho hệ thống phòng + craft
- Daily quest / mission để giữ retention
- Save / restore game và progress persist
- UI hiển thị rõ: phòng, resource, combat, map, inventory

## 12. Civilization

| Civilization | Main job | Mô tả | Chỉ số lợi thế |
|------|------|--------| --------|
| Linh Sơn | Tank / Defender | Chiến binh cổ đại bám rễ vào núi rừng, bền bỉ như đá, trung thành với tổ tiên. | END++ DEX+ STR+ |
| Đế Quốc | Tactician / Support-DPS | Nền văn minh hiện đại tái sinh thành đế chế điện-hơi nước-kính thép. | CHA++ INT+ AGI+ |
| Thiên Lữ | Speed DPS / Crit Striker | Du mục thần bí sống theo sao trời, mang theo cả bầu trời trong bước chân. | AGI++ INT+ DEX+ |

### Note

Với mỗi dấu cộng tương ứng +1 chỉ số tương ứng

## 13. Hiện trạng — Base Talent Stats

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

-----------------------------------------------------------------------------------------------------

# Resource Consumption & Specialization Mechanics Brainstorm

**Date:** April 21, 2026  
**Status:** Research & Ideation Phase  
**Topic:** Resource scarcity progression + specialization incentives

---

## Problem Statement

**Current State:**

- Multiple rooms consume wood, stone, ore, magic items, and gold
- Players can build all rooms if resources are sufficient
- No penalty for "building everything" (generalist approach)
- No strong incentive to specialize (e.g., "I only want armor production")

**Target State:**

- **Low/Medium difficulty:** Resources feel abundant → building all rooms is viable
- **High difficulty:** Specialization becomes necessary → resource scarcity forces choices
- **Specialization bonus:** Investing in ONE production line unlocks bonus rooms elsewhere
  - Example: "Skip alchemy room → can build 2x stone mines instead"
- **Risk/reward system:** Generalist = balanced progression; Specialist = accelerated but focused

---

## Section 1: Resource Inventory & Current Flows

### 1.1 Primary Resources

| Resource | Source | Consumption | Storage |
|----------|--------|------------|---------|
| **Wood** | Wood extraction room | Workshop (crafting, repair), Alchemy fuel | Per room capacity |
| **Stone** | Stone mine (tier 1) | Workshop (smelting, crafting) | Per room capacity |
| **Iron Ore** | Stone mine (tier 2+) | Workshop (crafting armor/weapons) | Per room capacity |
| **Crystal** | Stone mine (tier 3+) | High-tier crafting, rare spells | Per room capacity |
| **Rare Ore** | Stone mine (tier 4+) | Legendary crafting, best equipment | Per room capacity |
| **Magic Items** (8 types) | Magic extraction room | Alchemy syringe crafting | Per room capacity |
| **Gold** | Quest rewards, mission completion | Recruitment, room upgrades, upkeep | Treasury |
| **Enchanted Items** | Double harvest/success procs | Stat boosts, equipment quality | Inventory |

### 1.2 Consumption Rates (Per Active Member / Assigned to Room)

**Wood Extraction:**

- 10 wood/min (base) per assigned member

**Stone Mining:**

- 8 stone/min (base) per assigned member at Tier 1
- Ore drops: Iron (3-5%), Crystal (1%), Rare (0%) at Tier 1

**Magic Extraction:**

- 6 magic items/min (base) per assigned member

**Workshop (Crafting Mode):**

- Weapon: 12 iron ore + 8 wood + recipe (per queue slot, 5-15min craft time)
- Armor: 10 iron ore + 6 wood + recipe (per queue slot, 5-15min craft time)
- Higher rarity = 2-3x material cost

**Alchemy Crafting:**

- Buff spell: 3 magic items + 4 wood (per syringe, 90-95% success rate)
- Debuff spell: 3 magic items + 4 wood (per syringe, 75-85% success rate)
- Healing potion: 4 magic items + 2 wood (per syringe, 90-95% success rate)

**Workshop Repair:**

- Cost scales with durability loss: ~2-4 ore + 2-3 wood per 20% durability restoration

---

## Section 2: Difficulty Tiers & Resource Demand

### 2.1 Map Difficulty Progression (Proposed)

| Difficulty | Enemy Tier | Party Req | Win Rate (avg) | Loot Multiplier | Upkeep Scaling |
|-----------|-----------|----------|----------------|-----------------|-----------------|
| **Easy** (F-Rank) | Tier 1 | 1-2 members | 90%+ | 1x | 1x |
| **Normal** (E-D Rank) | Tier 2 | 2-3 members | 75-85% | 1.2x | 1.2x |
| **Hard** (C-B Rank) | Tier 3 | 3-4 members | 60-70% | 1.5x | 1.5x |
| **Very Hard** (A-Rank) | Tier 4 | 4-5 members | 45-55% | 2x | 1.8x |
| **Nightmare** (S-Rank) | Tier 5 | 5-6 members | 30-40% | 2.5x | 2.5x |

### 2.2 Equipment Obsolescence & Replacement Demand

**Key Insight:** Players need fresh equipment for harder difficulties.

- **Low difficulty:** Equipment lasts 10+ missions (low breakage)
- **Medium difficulty:** Equipment lasts 5-8 missions (moderate repair costs)
- **High difficulty:** Equipment lasts 2-4 missions (frequent repairs, replacements needed)

**Material Demand Example (6-member party facing Hard Rank):**

- Initial equip: 6 weapons + 6 armor = 72 ore + 48 wood
- Per 5 missions: 3-4 equipment replacements + 4-6 repairs = 36 ore + 24 wood (combined)
- **5-mission cycle:** ~36 ore + 24 wood consumed purely for equipment maintenance

---

## Section 3: Current State Analysis

### 3.1 Production Capacity Calculation

**Scenario: Player with 6 members, builds ALL standard rooms**

- Tavern: No resource consumption (social hub)
- Training: No resource consumption (stat bonuses only)
- Infirmary: No resource consumption (healing bonuses)
- Barracks: No resource consumption (stat bonuses)
- Library: No resource consumption (EXP bonuses)
- Wood extraction: 3 assigned members
- Stone mine: 3 assigned members (some ore drops)
- Magic extraction: 1-2 assigned members
- Workshop: 0 members assigned (craft-only room)
- Alchemy: 1 assigned member
- **Total roster used:** 10-11 members (need to recruit extras)

### 3.2 Resource Flow at Easy Difficulty (Small Roster: 4 members)

**Production Per Hour (with 2 extraction rooms, 1 magic room):**

- Wood: 2 assigned members → 1,200 wood/hour
- Stone: 2 assigned members → 960 stone/hour
- Magic items: 1 assigned member → 360 items/hour

**Consumption Per Hour (1 Hard difficulty quest, 3 member party):**

- Quest equipment wear: 2-3 repairs (6-12 ore + 6-9 wood)
- Alchemy production (if running): 3 syringes/hour (9 magic items + 12 wood)
- Workshop crafting (if running): 1-2 weapons/hour (12-24 ore + 8-16 wood)

**Result:** Massive surplus. Players accumulate 500+ wood/hour net gain.

### 3.3 Resource Flow at Nightmare Difficulty (Full Roster: 8+ members)

**Production Per Hour (same setup):**

- Wood: 2 assigned members → 1,200 wood/hour
- Stone: 2 assigned members → 960 stone/hour
- Magic items: 1 assigned member → 360 items/hour

**Consumption Per Hour (3 S-Rank quests, 18-member total dispatches):**

- Equipment replacement: 5-6 pieces/hour (60-72 ore + 36-48 wood)
- Armor crafting (players want tier-2 gear): 3-4 pieces/hour (30-40 ore + 18-24 wood)
- Alchemy consumption (buff all squads): 12+ syringes/hour (36 magic items + 48 wood)
- Repairs (from failed attempts): 8-10 repairs/hour (16-40 ore + 16-30 wood)

**Demand:** 130-160 ore + 118-150 wood per hour  
**Supply:** ~960 stone/hour, but only ≈15-20% converts to ore at high tiers  
**Result:** **SHORTAGE** if player hasn't upgraded mining heavily.

---

## Section 4: Specialization Mechanics (Core Proposal)

### 4.1 Specialization Framework

**Concept:** Players declare a primary "Production Focus" at guild setup or mid-game. Each focus unlocks bonus room slots while disabling access to 1-2 other rooms.

### 4.2 Specialization Profiles

#### Profile A: **Armory Master** (Armor Production Focus)

**Primary Output:** High-tier armor + weapons

**Enabled Rooms:**

- Wood extraction
- Stone mine (max tier unlocked)
- Workshop (crafting mode preferred)
- Tavern, Training, Infirmary, Barracks, Library

**Disabled Rooms:**

- Alchemy (removed from grid)
- Magic extraction (removed from grid)

**Bonus Slots:**

- +1 Workshop slot (can queue 2 crafts simultaneously)
- +1 Stone mine slot (can assign 1 extra member)

**Tradeoff:** No potions/buffs → must rely on equipment + stat allocation for combat survivability

**Use Case:** Players who want deterministic progression through gear optimization. Risk: immobile in-game if equipment breaks during quest.

---

#### Profile B: **Potion Master** (Alchemy Focus)

**Primary Output:** Buff/debuff/healing syringes

**Enabled Rooms:**

- Wood extraction
- Magic extraction (max capacity)
- Alchemy
- Tavern, Training, Infirmary, Barracks, Library

**Disabled Rooms:**

- Stone mine (removed from grid)
- Workshop (removed from grid)

**Bonus Slots:**

- +2 Alchemy slots (can craft 3 syringe types simultaneously)
- +1 Magic extraction slot

**Tradeoff:** No equipment crafting → must farm lower-difficulty quests longer to get gear, OR buy from NPC shop at premium prices

**Use Case:** Players who want combat advantages through buffing/debuffing. Risk: if alchemy output drops, combat effectiveness plummets.

---

#### Profile C: **Generalist** (Balanced Approach)

**Primary Output:** Modest amounts of everything

**Enabled Rooms:**

- All standard rooms (wood, stone, magic, workshop, alchemy)
- Tavern, Training, Infirmary, Barracks, Library

**Disabled Rooms:**

- None

**Bonus Slots:**

- None (baseline configuration)

**Tradeoff:** Must allocate roster across 5+ production rooms → fewer members on quests simultaneously. Progression slower than specialists.

**Use Case:** Players who want flexibility and don't like permanent decisions.

---

### 4.3 Dynamic Specialization (Alternative: Non-Permanent)

**"Specialization Season" Mechanic:**

- Players choose focus for 7-day periods (game time or real time)
- At end of season, can switch specialization with cooldown (24 hours, 1 gold cost)
- Bonus rooms scale with how long focus maintained (1 day = no bonus, 7 days = full bonus)

**Benefit:** Reduces decision paralysis. Players can experiment.  
**Risk:** Less impactful choices (can just respec constantly).

---

## Section 5: Resource Scarcity Progression Curve

### 5.1 Dynamic Upkeep Scaling

**Current:** Gold upkeep = fixed amount per room + roster size

**Proposal: Difficulty-Based Resource Tax**

```
Upkeep Cost = (Base Roster Cost) + (Active Mission Penalty)

Active Mission Penalty = (Number of Concurrent Missions) × (Mission Tier Difficulty) × (Modifier)

Example:
- Running 2 F-Rank quests: +5% upkeep
- Running 1 A-Rank + 1 B-Rank quest: +35% upkeep
- All roster on missions: +50% upkeep (unsustainable long-term)
```

**Effect:** Encourages players to let roster rest, not keep 100% mission saturation.

### 5.2 Resource Fatigue System

**Concept:** The longer a resource room runs, the lower its efficiency (simulating "ore depletion").

```
Production Multiplier = 1.0 - (Hours Running / 100)

After 50 hours continuous mining: 0.5x output
After 80 hours: 0.2x output
After 100+ hours: 0.1x output (nearly exhausted)

Recovery: Multiplier resets daily at midnight (simulated "resource respawn")
```

**Effect:**

- Prevents infinite progression without active attention
- Creates cycle of planning: "I need X ore this session, so I'll run mining for Y hours"
- Encourages mixed gameplay (not AFK farming forever)

### 5.3 Tiered Material Scarcity Curves

**Low Difficulty (F-E Rank):**

- Demand: 20-30 ore/hour
- Supply (3 miners): 960 stone/hour raw, but ore conversion ~5-8% = 48-77 ore/hour
- **Result:** Surplus (net +20-50 ore/hour). Player can build equipment.

**Medium Difficulty (D-C Rank):**

- Demand: 60-80 ore/hour (more equipment replacement)
- Supply (3 miners): Same, ~48-77 ore/hour with low tier drops
- **Result:** Breakeven to slight deficit. Player needs to choose: Farm more time or skip alchemy.

**Hard Difficulty (B-A Rank):**

- Demand: 120-160 ore/hour (frequent replacements + crafting)
- Supply (3 miners, tier drops at 10-15%): 96-144 ore/hour
- **Result:** Minor deficit (-20 ore/hour). Must specialize or add 4th miner (requires more gold, creates new cost).

**Nightmare Difficulty (S Rank):**

- Demand: 180-220 ore/hour
- Supply (same miners): 96-144 ore/hour
- **Result:** Major deficit (-80 ore/hour). Unsustainable without specialization.
  - If **Armory Master:** +1 mine slot → 144-192 ore/hour, now breakeven
  - If **Potion Master:** Cannot access mines → forced to buy premium ore from NPC shop

---

## Section 6: Specialization Incentive Mechanics

### 6.1 Specialization Bonus Framework

| Mechanic | Armory Master | Potion Master | Generalist |
|----------|---------------|---------------|-----------|
| **Extra Room Slots** | +1 Workshop, +1 Mine | +2 Alchemy, +1 Magic | None |
| **Production Speed** | +15% workshop speed | +20% alchemy speed | Baseline |
| **Material Efficiency** | -10% ore consumption | -10% potion ingredient cost | Baseline |
| **Unlock Tier Faster** | 20% faster mine tier unlock | 20% faster alchemy tier unlock | Baseline |
| **NPC Vendor Discount** | Equipment: -20% shop price | Potions: -30% shop price | Baseline |

### 6.2 Specialization Unlock Triggers

**Armory Master Unlocked When:**

- Craft 50+ total weapons/armor pieces, OR
- Reach B-Rank difficulty (require better gear), OR
- Player manually selects at start

**Potion Master Unlocked When:**

- Craft 50+ total syringes, OR
- Win S-Rank quest with only syringe buffs (no equipment advantage), OR
- Player manually selects at start

**Generalist (Default):** Always available, no unlock required

---

## Section 7: Specific Resource Consumption Numbers

### 7.1 Revised Consumption Per Difficulty Tier

**Easy Difficulty (F-Rank), 1 mission/hour, 2-member party:**

- Equipment wear: 1 replacement/3 hours = 0.33 ore/hour
- Alchemy (optional): 0 (no buff needed)
- **Total: 0.33 ore/hour**

**Normal Difficulty (E-D Rank), 2 missions/hour, 3-member party:**

- Equipment wear: 1 replacement/2 hours = 0.5 ore/hour
- Repairs: 0.5 repairs/hour = 1 ore/hour
- Alchemy (1 buff per mission): 3 syringes/hour = 9 magic items/hour
- **Total: 11.5 ore + 9 magic items/hour**

**Hard Difficulty (C-B Rank), 2 missions/hour, 4-member party:**

- Equipment wear: 1 replacement/1.5 hours = 0.67 ore/hour
- Repairs: 1.5 repairs/hour = 3 ore/hour
- Weapon/armor crafting for upgrades: 1 item/hour = 10 ore + 6 wood/hour
- Alchemy (2 buffs per mission): 4 syringes/hour = 12 magic items/hour
- **Total: 113.67 ore + 12 magic items + 6 wood/hour**

**Very Hard Difficulty (A Rank), 1.5 missions/hour, 5-member party:**

- Equipment wear: 1 replacement/1 hour = 1 ore/hour
- Repairs: 2.5 repairs/hour = 5 ore/hour
- Weapon/armor crafting: 1.5 items/hour = 15 ore + 9 wood/hour
- Alchemy (3 buffs per mission): 4.5 syringes/hour = 13.5 magic items/hour
- **Total: 21 ore + 13.5 magic items + 9 wood/hour**

**Nightmare Difficulty (S Rank), 1 mission/hour, 6-member party:**

- Equipment wear: 1 replacement/0.5 hour = 2 ore/hour
- Repairs: 4 repairs/hour = 8 ore/hour
- Weapon/armor crafting for tier-up: 2-3 items/hour = 20-30 ore + 12-18 wood/hour
- Alchemy (4-5 buffs per mission): 5+ syringes/hour = 15+ magic items/hour
- **Total: 30-40 ore + 15+ magic items + 12-18 wood/hour**

---

## Section 8: Resource Abundance vs. Scarcity Analysis

### 8.1 Production Scenarios

**Setup A: Casual (2 assignment members per extraction, 1 alchemy)**

- Production/hour: 1200 wood, 960 stone (48-77 ore at avg tier), 360 magic items

**Setup B: Balanced (3 per extraction, 1-2 alchemy)**

- Production/hour: 1800 wood, 1440 stone (72-115 ore), 540 magic items

**Setup C: Specialization (Armory: 4 miners, 1 magic; Potion: 3 magic, 2 alchemy)**

- Armory Production/hour: 2400 stone (120-192 ore), 180 magic items
- Potion Production/hour: 1200 wood, 540 magic items

### 8.2 Breakeven Analysis Per Difficulty

| Difficulty | Ore Demand/hr | Setup A Ore Supply/hr | Setup B Supply/hr | Setup C (Armory)/hr |
|-----------|--------------|----------------------|-------------------|----------------------|
| Easy | 0.33 | 48-77 (✓✓ Huge surplus) | 72-115 (✓✓) | 120-192 (✓✓) |
| Normal | 11.5 | 48-77 (✓ Surplus) | 72-115 (✓) | 120-192 (✓) |
| Hard | 113.67 | 48-77 (✗ Deficit) | 72-115 (✓ Breakeven) | 120-192 (✓ Surplus) |
| Very Hard | 21 | 48-77 (✓ Surplus) | 72-115 (✓) | 120-192 (✓) |
| Nightmare | 30-40 | 48-77 (✓ Tight) | 72-115 (✓ Tight) | 120-192 (✓ Comfortable) |

**Key Insight:** Hard Difficulty is the pivot point where generalist struggles but specialists thrive.

---

## Section 9: Mechanic Interactions & Emergent Gameplay

### 9.1 Specialization Trade-off Examples

**Scenario 1: Player is "Armory Master"**

- Can equip 6-member party with tier-2 armor consistently
- Cannot produce buffs → must either:
  - Accept reduced win rate on S-Rank (rely on gear/stats)
  - Buy potions from NPC shop (-30% discount, still costs gold)
  - Downgrade to A-Rank quests where buffs less critical
- **Emergent Play:** Gear-focused player might optimize for high DEF/VIT and sustain instead of ATK.

**Scenario 2: Player is "Potion Master"**

- Can buff/debuff 3 squads per hour with potions
- Cannot produce weapons/armor → must either:
  - Farm Easy/Normal difficulty longer to accumulate gear naturally
  - Buy equipment from NPC shop (expensive, no specialization discount)
  - Rely on enchanted drops (risky, low rate)
- **Emergent Play:** Buff-focused player might optimize for support-heavy team that doesn't need premium gear.

**Scenario 3: Player is "Generalist" attempting Nightmare**

- Has balanced production of ore + potions
- But production rates are lower than specialists
- Takes longer to reach Nightmare, but more flexible when facing new enemy types
- **Emergent Play:** Generalist is riskier but more adaptable.

---

## Section 10: Gold Economy Integration

### 10.1 Upkeep Scaling Model

**Current:** Upkeep = roster size × base cost

**Proposal:**

```
Daily Upkeep = (Roster Size × 50) + (Room Count × 20) + (Difficulty Penalty)

Difficulty Penalty:
- Easy: +0
- Normal: +10% upkeep
- Hard: +25% upkeep
- Very Hard: +50% upkeep
- Nightmare: +100% upkeep

Example (Nightmare, 8 roster, 7 rooms):
(8 × 50) + (7 × 20) + (400 + 100%) = 400 + 140 + 800 = 1,340 gold/day
```

### 10.2 Gold Income vs. Difficulty

| Difficulty | Avg Gold/Mission | Missions/Day (3 active) | Daily Income | Daily Upkeep | Net Position |
|-----------|-----------------|------------------------|--------------|--------------|--------------|
| Easy | 100 | 36 | 3,600 | 300 | +3,300 |
| Normal | 250 | 36 | 9,000 | 330 | +8,670 |
| Hard | 500 | 36 | 18,000 | 450 | +17,550 |
| Very Hard | 1,200 | 24 | 28,800 | 600 | +28,200 |
| Nightmare | 2,500 | 12 | 30,000 | 1,340 | +28,660 |

**Insight:** Nightmare is profitable but SLOWER progression (fewer missions). Players must choose between safety (Normal) and speed (Nightmare).

---

## Section 11: NPC Shop Integration (Economic Safety Valve)

### 11.1 Purpose

Prevent specialization from creating "stuck" scenarios where players cannot progress due to resource shortage.

### 11.2 Shop Inventory

| Item | Base Price | Armory Master Discount | Potion Master Discount |
|------|-----------|----------------------|----------------------|
| Iron Ore (10x) | 100 gold | -20% (80) | No discount |
| Magic Items (10x) | 80 gold | No discount | -30% (56) |
| Wood (20x) | 40 gold | -10% (36) | -10% (36) |
| Buff Syringe | 50 gold | No discount | -20% (40) |
| Common Weapon | 200 gold | -20% (160) | No discount |
| Common Armor | 180 gold | -20% (144) | No discount |

### 11.3 Purchase Limits

- Max 10 purchases per day per item type (prevent infinite grinding = gold → resources)
- Resets daily

---

## Section 12: Progression Curves (Visualization Reference)

### 12.1 Resource Scarcity Curve

```
Resource Sufficiency %
100% │         Generalist (easy)
      │      ╱───────────────
 80%  │     ╱ 
      │    ╱  Hard pivot point
 60%  │   ╱───┐ 
      │  ╱    │ Specialist bonus
 40%  │ ╱     │╲
      │╱      │ ╲_____ Armory Master (nightmare)
 20%  │       │        Potion Master (struggle)
      │       │
  0%  ├───────┴──────────────────
      Easy  Normal  Hard  VeryHard  Nightmare
```

### 12.2 Specialization Impact on Difficulty Progression

```
Time to Complete Tier
  ▲
  │ Generalist
  │    ╱╲
  │   ╱  ╲  (flexible, slower)
  │  ╱    ╲
  │ ╱      ╲___
  │           ╲
  │ ┌──────┐   ╲___
  │ │Armor │ ╱─────ヽ (fast, then plateau)
  │ │Master│╱       ╲
  │ └──────┘        
  │ ┌──────┐
  │ │Potion│╱─────ヽ (slow, then catch-up)
  │ │Master│        ╲
  │ └──────┘ 
  │
  ├─────────────────────────────
  Easy  Normal  Hard  VeryHard  Nightmare
```

---

## Section 13: Implementation Recommendations

### 13.1 Phase 1: Core Mechanics (Low Risk)

1. **Resource Consumption Adjustment**
   - Implement difficulty-based equipment wear rates
   - Test at each difficulty tier
   - Validate that Easy/Normal stay surplus, Hard becomes tight

2. **Upkeep Scaling**
   - Add difficulty penalty to upkeep calculation
   - Tunable via config (start conservative: +10% per tier)

3. **NPC Shop**
   - Add buy dialog with item limits
   - Track daily purchase count
   - Simple implementation, high value for soft-gating

### 13.2 Phase 2: Specialization (Medium Risk)

1. **Specialization Selection UI**
   - Add screen during character creation (or migration dialog)
   - Show pros/cons of each choice
   - Allow toggle later (with cooldown to prevent constant respec)

2. **Grid Reconfiguration**
   - Hide/show rooms based on specialization
   - Preserve inventory if player switches
   - Database migration to handle existing saves

3. **Bonus Application**
   - Apply multipliers to production/consumption
   - Apply discount to NPC shop
   - Track active specialization in save file

### 13.3 Phase 3: Balance Tuning (Ongoing)

1. **Telemetry & Data Gathering**
   - Log specialization choices
   - Log resource surplus/deficit per tier
   - Identify balance deviations (e.g., Armory too strong at C-Rank)

2. **Iterative Rebalance**
   - Adjust consumption rates if needed
   - Modify specialization bonuses
   - Add new specializations if needed

---

## Section 14: Edge Cases & Risks

### 14.1 Risk: Specialization Remorse

**Problem:** Player picks Armory Master but wanted Potion Master after 10 hours.

**Mitigation:**

- Allow free respec during first 48 game-hours
- Subsequent respec requires 500 gold + 24-hour cooldown
- Warning dialog before committing to specialization

### 14.2 Risk: Accidental Softlock

**Problem:** Player specializes, then encounters new enemy type that requires specifically buffed stats.

**Mitigation:**

- NPC shop always available (players can buy potions)
- Specialization bonuses are +efficiency, not permission (Armor Master can still farm ore, just slowly)
- Difficulty selector lets players downgrade if stuck

### 14.3 Risk: Specialization Dominance

**Problem:** Armory Master is so strong that Potion Master is unviable.

**Mitigation:**

- Regular balance reviews (see telemetry above)
- A/B test different bonus structures
- Add new specializations if meta becomes stale

### 14.4 Risk: Economic Inflation/Deflation

**Problem:** If resource consumption is too low, gold accumulates infinitely. If too high, players starve.

**Mitigation:**

- NPC shop prices auto-adjust based on resource scarcity (buy high when gold surplus, sell low when gold scarce)
- Upgrade costs scale exponentially (prevent endgame stagnation)
- New difficulty tiers unlock that consume more

---

## Section 15: Alternative Approaches (Considered & Rejected)

### 15.1 "Flexible Rooms" (Rejected)

**Idea:** Players assign same physical room to multiple functions (e.g., same room = wood + ore mining, toggle per day).

**Why Rejected:**

- Too confusing in UI
- Removes specialization consequences
- Doesn't encourage meaningful choices

### 15.2 "Soft Specialization" (Considered, Lower Priority)

**Idea:** No permanent specialization, but bonus multipliers based on current resource production ratios.

- If you've been producing 80% ore → +10% ore production this session
- Incentivizes focused play without locking choices

**Status:** Valid alternative, but requires more UI clarity. Recommend Phase 1 permanent specialization first, then explore.

### 15.3 "Random Events" Resource Loss (Rejected)

**Idea:** Occasionally resources are "destroyed" (fire in workshop, ore theft, etc.) to create scarcity.

**Why Rejected:**

- Players hate losing progress to RNG
- Feels punishing rather than strategic
- Unpredictable, hard to plan around

---

## Section 16: Success Metrics & Validation Criteria

### 16.1 Metrics to Track

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Easy tier median clear time** | <5 min | Should feel trivial |
| **Hard tier win rate (generalist)** | 60-70% | Achievable but challenging |
| **Hard tier win rate (specialist)** | 75-85% | Specialization provides measurable edge |
| **Nightmare tier resource deficit** | -30 to -80 ore/hour for generalist | Motivates specialization choice |
| **Specialization adoption rate** | >70% of new players pick specialist | Positive reception |
| **Generalist retention at Nightmare** | <20% abandon (soft exit) | Specialization helps but not mandatory |
| **Gold income/upkeep ratio** | 10:1 at Normal, 3:1 at Nightmare | Meaningful economic pressure |

### 16.2 Validation Checkpoints

- **Week 1:** Monitor Easy/Normal resource surpluses (should be boring/stable)
- **Week 2:** Monitor Hard tier balance (should see resource pressure emerging)
- **Week 3:** Monitor Nightmare adoption and specialization rates
- **Week 4:** Balance pass based on telemetry

---

## Section 17: Open Questions for Refinement

1. **Specialization Switching Cost:** Should respec be free once/game, free always, or paid? Current proposal: paid after 48 hours.

2. **Room Slot Scarcity:** Is the 3x3 grid enforced? If we add specialization rooms, do we need 4x4 grid? (Assume yes, needs UI refactor)

3. **Difficulty Scaling:** Should resource demand curve be aggressive (exponential) or gentle (linear)? Recommend aggressive to create meaningful pivot at Hard.

4. **NPC Shop Prices:** Static or dynamic? Recommend dynamic (explained in Section 11).

5. **Specialization Count:** Start with 2 (Armory + Potion)? Or add "Harvester" (wood/stone focus) later? Recommend start small (2), expand based on feedback.

6. **Early-Game Specialization:** Should new players choose immediately (character creation) or after reaching Normal tier (informed choice)? Recommend mid-game unlock (level 10+).

---

## Summary & Recommendations

### Core Design Decisions

1. **Resource Scarcity via Difficulty:** Implement consumption rates that create natural scarcity at Hard+, not artificial RNG loss.

2. **Specialization as Trade-off:** Offer 2 specialization paths that trade room access for efficiency. No "best choice" — both viable but different.

3. **Economic Safety Valve:** NPC shop prevents permanent softlock scenarios. Discounts for specialists encourage investment without forcing it.

4. **Gradual Pressure:** Easy/Normal should feel abundant. Hard becomes tight. Nightmare forces specialization. Clear progression.

### Next Steps

1. **Immediate:** Propose these numbers to design team for review. Gather feedback on target difficulty curves and specialization appeal.

2. **Week 1:** Implement Phase 1 (resource consumption + upkeep scaling). Test at all difficulty tiers.

3. **Week 2:** Implement Phase 2 (specialization UI + grid reconfiguration).

4. **Week 3-4:** Balance tuning based on early player telemetry.

---

**Created:** April 21, 2026  
**Last Updated:** April 21, 2026  
**Status:** Ready for Design Review & Stakeholder Feedback

---

# Section 18: Player-to-Player Trading System

**Purpose:** Enable specialization players to trade surplus resources/items with other players. Armory Master trades excess ore to Potion Master who trades excess magic items back. Creates living economy and mutual benefit.

---

## Section 18.1: Trading Mechanics Overview

### 18.1.1 Core Concept

**Primary Goal:** Create resource flows between specialized players so specialization choice doesn't create permanent scarcity but enables trade opportunities.

**Example Trade Flows:**

- **Armory Master** produces 200 ore/hour surplus → lists 100 ore on market for 50 gold each
- **Potion Master** produces 300 magic items/hour surplus → lists 100 items on market for 30 gold each
- Both players buy from each other → stabilizes economy + creates gold sinks

### 18.1.2 Trade Platform Types

**Option A: Centralized Marketplace (Recommended for MVP)**

- Asynchronous player-to-player transactions
- Players list items/resources with asking price
- Other players browse + purchase instantly
- Simpler to implement than real-time matching
- Better for idle game (players don't need to be online simultaneously)

**Option B: Direct Player Trade (Secondary)**

- Real-time trade request system
- Both players must be online
- Higher trust environment (see who you're trading with)
- Risk: griefing, scams if not careful

**Recommendation:** Launch with Option A (marketplace), add Option B later as social feature.

---

## Section 18.2: Marketplace Mechanics

### 18.2.1 Tradeable Item Categories

| Category | Item Type | Tradeable | Notes |
|----------|-----------|-----------|-------|
| **Resources** | Wood, Stone, Iron Ore, Crystal, Rare Ore | ✅ YES | Stack 99, core trade goods |
| **Magic Items** | All 8 types (Herb, Essence, etc.) | ✅ YES | Stack 99, high trade volume |
| **Common Equipment** | Tier 1-2 Weapons/Armor | ✅ YES | Enables gear acquisition |
| **Rare Equipment** | Tier 3+ Weapons/Armor | ✅ YES | Enchanted items valuable |
| **Spells/Potions** | Buff, Debuff, Healing syringes | ⚠️ LIMITED | Can trade (see decay below) |
| **Crafting Materials** | Recipes, catalysts, vouchers | ✅ YES | Enable new crafting paths |
| **Currency** | Gold, Gems | ❌ NO | Prevent RMT abuse |

**Why Spells/Potions Limited:**

- Syringes designed for single-map use (decay when zone changes)
- Trading potions meant for different maps = lower value
- Risk: players spam-buy potions to trivialize content
- **Mitigation:** Limited listings per day (max 20 potion listings/player), higher tax (15% instead of 5%)

### 18.2.2 Listing Mechanics

**Creating a Listing:**

- Player selects item → clicks "List for Sale"
- Dialog: **Item Name | Quantity | Price Per Unit | Duration**
- Price validation: min 1 gold, max reasonable cap (prevents gold waste)
- Duration options: 24 hours / 7 days / 30 days
- Listing fee: **5 gold per listing** (small, covers server cost concept)

**Active Listings Limit:**

- Max 50 active listings per player (prevents market spam)
- Can remove listings anytime (get listing fee back)
- When listing expires or sells out, returns to available pool

**Listing Tax Example:**

```
Listing: 50 Iron Ore @ 40 gold each
  - Subtotal if sold: 2,000 gold
  - Marketplace fee: 2,000 × 5% = 100 gold
  - Player receives: 1,900 gold
  - (Plus 5 gold listing fee refunded if removed)
```

### 18.2.3 Buying & Transaction

**Purchase Flow:**

- Player browses marketplace tab
- Filters by category, sort by price/rating/recency
- Clicks item → preview stats/enchants
- Confirm purchase → gold deducted instantly
- Item delivered to inventory (or backlog if full)

**Transaction Confirmation:**

- Buyer receives item immediately (on marketplace backend)
- Seller gold credited after ~5 minutes delay (prevents "flip" botting)
- Both parties see transaction history (optional reputation track)

**Failure Handling:**

- If buyer inventory full: item goes to backlog queue (auto-deliver when space opens)
- If seller disconnects: listing remains active (async system)
- If price changes during transaction: locked at listed price when clicked

### 18.2.4 Marketplace Tax & Gold Sinks

**Transaction Fee Schedule:**

| Item Type | Marketplace Fee | Reasoning |
|-----------|-----------------|-----------|
| Resources (ore, wood, items) | 5% | Common trade good, low friction |
| Common Equipment | 8% | Moderate value, prevent inflation |
| Rare Equipment | 10% | High value, steep sink |
| Spells/Potions | 15% | Risk mitigation, limited copies |
| Crafting Materials | 7% | Medium priority |

**Gold Flow Example (Nightmare Economy):**

- 10 players trading daily
- Average transaction: 500 gold per trade
- Total traded: 5,000 gold daily
- Marketplace tax collected: ~400 gold (8% average) → removed from economy

**Benefit:** Prevents gold inflation at endgame, creates sustainable sink alongside upkeep costs.

---

## Section 18.3: Integration with Specialization System

### 18.3.1 Specialization Trade Flows

**Armory Master Surplus:**

- Produces: 150-200 ore/hour
- Needs: ~100 ore/hour for crafting + repairs
- **Surplus:** 50-100 ore/hour available for trade
- Market price: 35-50 gold per ore (determined by supply/demand)
- **Gold/hour from trading:** 1,750 - 5,000 gold

**Potion Master Surplus:**

- Produces: 400-500 magic items/hour
- Needs: ~300 items/hour for syringe crafting
- **Surplus:** 100-200 items/hour available for trade
- Market price: 20-35 gold per item
- **Gold/hour from trading:** 2,000 - 7,000 gold

**Generalist Modest Production:**

- Produces: 50 ore + 100 items/hour
- Needs: 80 ore + 150 items/hour (balanced demand)
- **Surplus:** Minimal or deficit
- **Strategy:** Generalists might buy specialty resources to bridge gaps

### 18.3.2 Specialization Encourages Trading

**Scenario 1: Armory Master reaches Nightmare**

- Cannot produce potions → faces lower win rates
- Options:
  1. Buy potions from marketplace (expensive, -15% tax)
  2. Keep NPC shop discount (still -30% but limited per day)
  3. Trade ore to Potion Masters for gold, buy potions → no gold penalty
- **Result:** Trading creates alternative progression path

**Scenario 2: Potion Master needs tier-3 equipment**

- Cannot craft tier-3 gear (no workshop)
- Options:
  1. Farm gear from lower-difficulty drops (slow)
  2. Buy from NPC shop (expensive)
  3. **Trade magic items for gold → buy from marketplace Armory Masters**
- **Result:** Marketplace becomes natural meeting point

**Scenario 3: Guild-wide coordination (future)**

- Armory Master player trades excess ore to Potion Master player
- Potion Master shares crafted potions with Armory Master for quests
- Creates **guild economy** without formal trade mechanics (good emerging behavior)

### 18.3.3 Anti-Specialization Exploitation

**Risk: "Arbitrage Flipping"**

- Player buys ore cheap, relists expensive (no added value)
- **Mitigation:** 5% tax + 5 gold listing fee makes flipping unprofitable (lose 10+ gold instantly)

**Risk: NPC Shop Undercutting**

- NPC shop sets price floor (discount applies to specialists)
- Players cannot trade lower than NPC floor (unfair comparison)
- **Mitigation:** NPC shop prices linked to marketplace median price (dynamic pricing)
  - If ore > 50 gold average on market, NPC shop buys at 40 gold (incentives trade-in)
  - If ore < 30 gold on market, NPC shop sells at 35 gold (price support)

---

## Section 18.4: Scam Prevention & Trust System

### 18.4.1 Marketplace Safety

**No Direct P2P Risk** (marketplace is escrow-like):

- Player lists → gold taken immediately, item in escrow
- Buyer pays → item released to inventory, gold released to seller after delay
- No scamming possible (system mediates all transactions)

**Risk: Fake Listings**

- Player lists item at 1 gold to artificially deflate market
- **Mitigation:**
  - Price floor based on rarity (common ore min 10 gold, rare min 50 gold)
  - Listing flagged if <50% of median market price (warning popup)
  - Rate limiting on price changes (can only adjust every 6 hours)

### 18.4.2 Reputation System (Optional, Phase 2)

**Player Reputation Tracked:**

- Transaction count (how many trades)
- Average price paid/received (reliability metric)
- Feedback rating (1-5 stars) from recent trades
- **Display in marketplace:** Player badge showing "Trustworthy Trader" or "New Player"

**Benefits:**

- Transparency builds confidence
- Encourages honest pricing (players avoid suspiciously cheap listings)
- Basis for future guild features

---

## Section 18.5: Marketplace Balancing

### 18.5.1 Supply Controls

**Resource Abundance Throttle:**

- If ore trading exceeds 10,000 units/day, marketplace tax increases to 7%
- If magic items exceed 30,000 units/day, tax increases to 8%
- **Rationale:** Prevent flooding if specialization creates too much surplus

**Rare Item Scarcity:**

- Tier-3+ equipment drops capped at ~5% encounter rate (prevent inflation)
- Marketplace limits: max 1 listing per Tier-4 item per player per week
- **Rationale:** Preserve legendary item value

### 18.5.2 Price Stability

**Weekly Price Report (Optional):**

- System tracks median prices weekly
- Large deviations trigger balance review
- If ore median price jumps >20% week-over-week → adjust NPC shop price

**Example:**

```
Week 1: Ore median = 40 gold
Week 2: Ore median = 55 gold (+37.5%)
Action: Flag for review, consider reducing mine tier ore drop rates slightly
Week 3: Ore median = 42 gold (stabilized)
```

### 18.5.3 Deflation Protection

**If Resources Become Too Cheap:**

- Players stop trading (no profit incentive)
- Economic stagnation
- **Solution:** New demand sinks
  - Introduce cosmetic upgrades (costs ore/gold)
  - Add "Guild Vault" storage rooms (upgrading costs resources)
  - Premium crafting catalyst (10 ore + 5 gold per craft)

---

## Section 18.6: Implementation Phases

### Phase 1: Basic Marketplace (Week 1)

1. **Listing system:** Create/remove listings, price limits
2. **Buying flow:** Browse, filter, instant purchase
3. **Inventory delivery:** Items land in inventory or backlog
4. **Marketplace fee:** 5% tax, automatically deducted
5. **Persistence:** Listings stored in save file + cloud backup

### Phase 2: Anti-Abuse (Week 2)

1. **Price floors/caps** by rarity
2. **Daily listing limits** per item type
3. **Tax adjustments** if supply explodes
4. **Cooldown:** Can't buy then immediately resell same item (6-hour min hold)

### Phase 3: Enhanced Features (Week 3+)

1. **Reputation system** (stars, trade count, median price)
2. **Advanced filters** (by seller rating, price range, enchant stats)
3. **Wishlist** (save searches, get notified when item listed)
4. **Marketplace history** (price trends, rarity heatmaps)
5. **Guild marketplace** (guild-only listings, internal trades)

---

## Section 18.7: Projected Economic Impact

### 18.7.1 Gold Flow Simulation

**Scenario: 100 active players, mix of specializations**

- 40 Armory Masters (ore surplus)
- 40 Potion Masters (magic item surplus)
- 20 Generalists (balanced)

**Daily Activity:**

```
Armory Masters
- Each trades 1,500 ore/day @ avg 40 gold = 60,000 gold per player
- Total: 2.4M gold traded daily
- Marketplace fee (5%): 120K gold removed from economy

Potion Masters
- Each trades 3,000 items/day @ avg 25 gold = 75,000 gold per player
- Total: 3M gold traded daily
- Marketplace fee (5%): 150K gold removed from economy

Generalists
- Buy ore + items to bridge gaps
- Average 50K gold spent daily per player
- Total: 1M gold traded daily
- Marketplace fee (5%): 50K gold removed

Daily Gold Sink via Marketplace: 320K gold
Combined with upkeep (assume 500K/day total) = 820K gold/day removed
Balanced against quest rewards + NPC shop sales
```

**Result:** Healthy deflationary pressure on top-tier economy without harsh penalties.

### 18.7.2 Player Engagement Metrics

**Expected Outcomes:**

- **Marketplace activity:** >70% of active players list/buy weekly
- **Trade completion rate:** >90% (items sell within 3 days)
- **Specialization satisfaction:** Specialists report marketplace trading as "profitable" vs "stuck with surplus"
- **Economic diversity:** Generalists remain viable through smart marketplace purchases

---

## Section 18.8: Edge Cases & Risk Mitigation

### 18.8.1 Risk: Multi-Account Farming

**Problem:** Player creates 10 alt accounts, each specialist, funnels surplus to main.

**Mitigation:**

- Marketplace fee scales with transaction count (10+ trades/day → +2% fee)
- Daily listing limits (50 listings per player, shared across alts if detected)
- Rate limiting: Can only trade same item type 5 times/hour
- Account linking: If IPs overlap, system flags accounts as related (optional restriction)

### 18.8.2 Risk: Gold Inflation Spiral

**Problem:** Players farm ore, sell to marketplace, buy potions, repeat → gold accumulates endlessly.

**Mitigation:**

- Marketplace tax (5-15%) removes gold consistently
- Upkeep costs scale with progression (endgame upkeep ~500K/day for full roster)
- New content introduces expensive cosmetics/upgrades
- NPC shop always available but discounted only for specialists (generalists pay full price)

### 18.8.3 Risk: Price Fixing Collusion

**Problem:** Armory Master players agree to list ore at 100 gold to artificially inflate prices.

**Mitigation:**

- Marketplace shows price history (last 7 days median price visible)
- Price gouging flag: Listing >150% median price gets warning icon
- Player reviews/reputation: Buyers avoid suspicious traders
- Moderator oversight: Can observe unusual price spikes, adjust NPC prices if needed

### 18.8.4 Risk: Dead Specialization

**Problem:** Potion Master produces so much surplus that prices crash (ore drops to 5 gold).

**Mitigation:**

- Dynamic difficulty: New content introduced requiring more potions (demand increases)
- Marketplace scaling: Tax increases when resource supply exceeds threshold (natural brake)
- NPC shop price floor: If marketplace price drops below threshold, NPC shop price supports it
- Seasonal rebalance: Every month, adjust specialization bonuses if needed

---

## Section 18.9: Success Metrics & Validation

### 18.9.1 Marketplace Health Metrics

| Metric | Target | Reasoning |
|--------|--------|-----------|
| **Weekly active traders** | >60% of players | High engagement with economy |
| **Median listing time** | <24 hours | Fast turnover indicates healthy demand |
| **Price variance (weekly)** | <±15% | Stable economy, predictable |
| **Average transaction size** | 500-2000 gold | Sweet spot for meaningful trades |
| **Specialization trade volume** | >50% of all marketplace activity | Validates specialization → trading loop |

### 18.9.2 Economic Health Indicators

| Indicator | Target | Action if Exceeded |
|-----------|--------|-------------------|
| **Daily gold sink** | 300-500K per 100 players | Add more sinks (cosmetics, guild upgrades) |
| **Ore average price** | 30-60 gold | Adjust mine drop rates, NPC shop price |
| **Potion average price** | 20-40 gold | Adjust alchemy production speed |
| **Generalist wealth ratio** | 80-120% of specialist average | Rebalance if generalists fall too far behind |

---

## Section 18.10: Marketplace Rules & TOS

### 18.10.1 Prohibited Conduct

**Not Allowed:**

- Listing items for 0 gold (market spam)
- Repeatedly buying/selling same item to manipulate prices (must hold 6+ hours)
- Account sharing or trading (accounts are personal)
- Phishing/scam communications (marketplace is safe, but external contact unsafe)
- Selling accounts or items for real money (RMT forbidden)

### 18.10.2 Enforcement

- **First offense:** Warning + listing fee forfeit
- **Second offense:** 7-day marketplace suspension
- **Third offense:** Permanent marketplace ban + rollback of suspicious trades
- **Severe (RMT):** Account permanent ban

---

## Section 18.11: Future Expansions

### Phase 4+: Advanced Trading

1. **Guild Marketplace:** Guild-only listings, internal trading at reduced tax (3%)
2. **Trading Contracts:** Players pre-agree trades, execute when items ready (scheduled trades)
3. **Escrow for High-Value:** For rare items, neutral marketplace holds pending 24-hour confirmation
4. **Trading Chat:** In-game channel for negotiation (moderated)
5. **Dynamic Events:** "Rare ore shortage" events that spike market prices for 24 hours

---

## Section 18.12: Summary

**Player-to-Player Trading System Design:**

✅ **Enables specialization economy** - Armory Masters trade ore, Potion Masters trade items, mutual benefit created  
✅ **Prevents abuse** - 5-15% tax + listing fees + price controls prevent exploitation  
✅ **Remains simple** - No complex matching algorithms, just list & buy at fixed price  
✅ **Scales gold sinks** - 300-500K gold removed daily keeps economy healthy  
✅ **Creates emergent gameplay** - Players discover trading as natural progression path  

**Launch with Phase 1 (basic marketplace) → iterate based on telemetry → expand to Phase 3+ features as needed.**

---

**Marketplace System Status:** Ready for Implementation  
**Integration with Specialization:** Direct (ore/potion trade flows)  
**Expected Player Impact:** +40% retention via economic engagement

---

# Section 19: Enhanced Specialization Branches with Interdependencies

**Purpose:** Adjust specialization branches to create meaningful interdependencies. Each specialization produces surpluses but requires marketplace purchases and adventure drops to progress, creating a living economy where players must engage with multiple systems.

---

## Section 19.1: Revised Specialization Framework

### 19.1.1 Core Philosophy

**Before:** Specializations were self-contained (produce everything needed internally)  
**After:** Specializations create surpluses but require external inputs to maximize potential

**Key Changes:**
- Each specialization has **surplus outputs** (what they produce in abundance)
- Each specialization has **critical dependencies** (what they must buy/acquire externally)
- Dependencies tie into **marketplace trading** and **adventure quest drops**
- Creates **economic loops** where specializations feed each other

---

## Section 19.2: Armory Master (Weapon/Armor Production Focus)

### 19.2.1 Core Production (Surplus)

**Primary Output:** High-tier weapons and armor  
**Surplus Items:** Tier 2-4 weapons/armor, refined ore, crafting catalysts  
**Marketplace Role:** Seller of equipment, buyer of recipes/materials

### 19.2.2 Critical Dependencies (What They Need)

**High-Tier Recipes:** Cannot craft Tier 3+ equipment without rare recipes
- **Source:** Marketplace purchases from Adventure Masters
- **Cost:** 500-2,000 gold per rare recipe
- **Drop Rate:** Rare recipes drop from S-Rank quests (5-10% chance)
- **Problem:** Armory Master doesn't do quests → must buy recipes from players who do

**Rare Crafting Materials:** Enchanted ore, crystal shards for legendary gear
- **Source:** Adventure drops (boss encounters) OR marketplace
- **Cost:** 200-500 gold per enchanted ore
- **Drop Rate:** 2-5% from A-Rank+ enemies
- **Problem:** Armory Master mines basic ore → needs rare materials for best gear

### 19.2.3 Economic Flow Example

```
Armory Master Progression Path:
├─ Early Game: Craft Tier 1-2 gear (self-sufficient)
├─ Mid Game: Need Tier 3 recipes → Buy from marketplace @ 1,000 gold each
├─ Late Game: Need enchanted materials → Buy from marketplace OR do occasional quests
├─ Revenue: Sell surplus Tier 2 gear @ 300 gold each → 5,000 gold/hour
├─ Net Position: Breaks even at mid-game, profitable at end-game
```

### 19.2.4 Balance Adjustments

**Production Bonuses:**
- +25% workshop speed (existing)
- +20% ore production (existing)
- **NEW:** +15% success rate on high-tier crafts (reduces recipe waste)

**Dependency Costs:**
- Must buy 80% of rare recipes from marketplace
- Must acquire 60% of enchanted materials externally
- **Mitigation:** -20% discount on equipment marketplace purchases (existing)

---

## Section 19.3: Potion Master (Alchemy Focus)

### 19.3.1 Core Production (Surplus)

**Primary Output:** Buff/debuff/healing syringes  
**Surplus Items:** Common syringes, excess magic items, alchemy catalysts  
**Marketplace Role:** Seller of potions, buyer of rare ingredients

### 19.3.2 Critical Dependencies (What They Need)

**Rare Magic Ingredients:** Enchanted essence, mutation gel, void dust
- **Source:** Adventure quest drops (specific enemy types)
- **Cost:** 150-400 gold per rare ingredient on marketplace
- **Drop Rate:** 3-8% from mutated creatures, ether beings, mist entities
- **Problem:** Potion Master extracts basic magic items → needs rare drops for advanced potions

**High-Tier Alchemy Recipes:** Advanced syringe formulas
- **Source:** Marketplace purchases OR occasional quest completion
- **Cost:** 800-1,500 gold per advanced recipe
- **Drop Rate:** 5-15% from boss encounters
- **Problem:** Potion Master focuses on alchemy → rarely completes quests for recipes

### 19.3.3 Economic Flow Example

```
Potion Master Progression Path:
├─ Early Game: Basic healing/buff syringes (self-sufficient)
├─ Mid Game: Need rare ingredients → Buy from marketplace @ 300 gold each
├─ Late Game: Need advanced recipes → Buy from marketplace OR complete 1-2 quests/week
├─ Revenue: Sell surplus syringes @ 50 gold each → 3,000 gold/hour
├─ Net Position: Small deficit at mid-game, highly profitable at end-game
```

### 19.3.4 Balance Adjustments

**Production Bonuses:**
- +30% alchemy speed (existing)
- +25% magic item production (existing)
- **NEW:** +20% double product chance on rare syringes

**Dependency Costs:**
- Must buy 70% of rare ingredients from marketplace
- Must acquire 50% of advanced recipes externally
- **Mitigation:** -30% discount on potion marketplace purchases (existing)

---

## Section 19.4: Adventure Master (Quest Completion Focus)

### 19.4.1 Core Production (Surplus)

**Primary Output:** Quest completion, rare drops, boss loot  
**Surplus Items:** Rare recipes, enchanted materials, surplus gear/potions  
**Marketplace Role:** Seller of rare drops/recipes, buyer of consumables

### 19.4.2 Critical Dependencies (What They Need)

**High-Quality Gear:** Tier 3+ weapons/armor for harder quests
- **Source:** Marketplace purchases from Armory Masters
- **Cost:** 800-2,000 gold per piece of rare gear
- **Problem:** Adventure Master focuses on quests → limited crafting time for gear

**Combat Consumables:** Buff/debuff syringes for boss fights
- **Source:** Marketplace purchases from Potion Masters
- **Cost:** 100-300 gold per syringe
- **Problem:** Adventure Master focuses on combat → limited alchemy time for potions

### 19.4.3 Economic Flow Example

```
Adventure Master Progression Path:
├─ Early Game: Basic quests with starter gear (self-sufficient)
├─ Mid Game: Need better gear → Buy from marketplace @ 1,200 gold each
├─ Late Game: Need potions for bosses → Buy from marketplace @ 200 gold each
├─ Revenue: Sell rare recipes @ 1,000 gold each + enchanted ore @ 400 gold each
├─ Net Position: Moderate deficit throughout, but highest quest rewards
```

### 19.4.4 Balance Adjustments

**Production Bonuses:**
- +20% quest completion speed
- +15% rare drop rate from enemies
- **NEW:** +25% gold rewards from quests (compensates for marketplace spending)

**Dependency Costs:**
- Must buy 60% of rare gear from marketplace
- Must buy 70% of combat potions from marketplace
- **Mitigation:** +10% sell price on all quest drops (recipes, materials)

---

## Section 19.5: Mining Master (Ore Production Focus)

### 19.5.1 Core Production (Surplus)

**Primary Output:** Raw ore, stone, refined metals  
**Surplus Items:** All ore types, surplus stone/wood  
**Marketplace Role:** Pure seller, minimal buyer

### 19.5.2 Critical Dependencies (What They Need)

**Mining Tools/Upgrades:** Advanced pickaxes, mining catalysts
- **Source:** Marketplace purchases OR occasional crafting
- **Cost:** 300-800 gold per mining upgrade
- **Problem:** Mining Master focuses on extraction → limited workshop time

**Rare Ore Processing:** Need workshop access for smelting
- **Source:** Must use limited workshop slots OR buy refined ore
- **Cost:** 50-100 gold per refined ore unit
- **Problem:** Mining Master has no workshop → must process externally

### 19.5.3 Economic Flow Example

```
Mining Master Progression Path:
├─ Early Game: Basic stone/ore mining (self-sufficient)
├─ Mid Game: Need mining upgrades → Buy from marketplace @ 500 gold each
├─ Late Game: Need smelting capacity → Rent workshop slots OR buy refined ore
├─ Revenue: Sell ore @ 40 gold each → 4,000 gold/hour
├─ Net Position: Small deficit at mid-game, highly profitable at end-game
```

### 19.5.4 Balance Adjustments

**Production Bonuses:**
- +30% mining speed (existing)
- +25% ore production (existing)
- **NEW:** +20% rare ore drop rate

**Dependency Costs:**
- Must buy 40% of mining upgrades from marketplace
- Must process 50% of rare ore externally
- **Mitigation:** -15% discount on mining-related marketplace purchases

---

## Section 19.6: Magic Item Master (Magic Extraction Focus)

### 19.6.1 Core Production (Surplus)

**Primary Output:** All magic item types, spell fragments  
**Surplus Items:** Common/rare magic items, excess fragments  
**Marketplace Role:** Pure seller, minimal buyer

### 19.6.2 Critical Dependencies (What They Need)

**Magic Extraction Tools:** Advanced catalysts, extraction enhancers
- **Source:** Marketplace purchases OR occasional crafting
- **Cost:** 400-900 gold per magic tool
- **Problem:** Magic Master focuses on extraction → limited workshop time

**Rare Magic Processing:** Need alchemy access for advanced items
- **Source:** Must use limited alchemy slots OR buy processed items
- **Cost:** 60-120 gold per processed magic item
- **Problem:** Magic Master has no alchemy → must process externally

### 19.6.3 Economic Flow Example

```
Magic Item Master Progression Path:
├─ Early Game: Basic magic extraction (self-sufficient)
├─ Mid Game: Need extraction tools → Buy from marketplace @ 600 gold each
├─ Late Game: Need processing capacity → Rent alchemy slots OR buy processed items
├─ Revenue: Sell magic items @ 25 gold each → 3,500 gold/hour
├─ Net Position: Small deficit at mid-game, highly profitable at end-game
```

### 19.6.4 Balance Adjustments

**Production Bonuses:**
- +30% magic extraction speed (existing)
- +25% magic item production (existing)
- **NEW:** +20% rare magic item drop rate

**Dependency Costs:**
- Must buy 40% of magic tools from marketplace
- Must process 50% of rare magic items externally
- **Mitigation:** -15% discount on magic-related marketplace purchases

---

## Section 19.7: Inter-Specialization Trade Flows

### 19.7.1 Economic Web Diagram

```
Armory Master ────► Adventure Master
     │                       │
     │                       │
     ▼                       ▼
Potion Master ◄─── Mining Master
     │                       │
     │                       │
     ▼                       ▼
Magic Item Master ◄────────────
```

**Key Trade Pairs:**
- **Armory ↔ Adventure:** Gear for recipes/materials
- **Potion ↔ Adventure:** Potions for rare ingredients/recipes
- **Mining ↔ Armory:** Raw ore for refined ore/tools
- **Magic ↔ Potion:** Raw magic items for processed items/tools

### 19.7.2 Marketplace Price Dynamics

**Supply/Demand by Specialization:**

| Item Type | High Supply From | High Demand From | Price Trend |
|-----------|------------------|------------------|-------------|
| Rare Recipes | Adventure Master | Armory Master | High (1,000-2,000 gold) |
| Rare Ingredients | Adventure Master | Potion Master | Medium-High (300-500 gold) |
| Raw Ore | Mining Master | Armory Master | Low-Medium (40-60 gold) |
| Raw Magic Items | Magic Item Master | Potion Master | Low-Medium (25-40 gold) |
| Tier 3+ Gear | Armory Master | Adventure Master | High (1,000-2,000 gold) |
| Syringes | Potion Master | Adventure Master | Medium (100-300 gold) |

### 19.7.3 Economic Balance Checks

**Profitability Comparison (End-Game):**

| Specialization | Revenue/Hour | Costs/Hour | Net Profit | Viability |
|----------------|--------------|------------|------------|----------|
| Armory Master | 5,000 gold | 3,000 gold | +2,000 | High |
| Potion Master | 3,000 gold | 2,500 gold | +500 | Medium-High |
| Adventure Master | 4,000 gold | 4,500 gold | -500 | Medium (quest rewards compensate) |
| Mining Master | 4,000 gold | 1,500 gold | +2,500 | High |
| Magic Item Master | 3,500 gold | 1,500 gold | +2,000 | High |

**Key Insight:** No specialization is "broken" - each has unique advantages and dependencies.

---

## Section 19.8: Adventure System Integration

### 19.8.1 Quest Drop Tables by Enemy Type

**Mutated Creatures (Potion Master needs these drops):**
- Mutation Gel: 8% drop rate
- Radiant Fragment: 5% drop rate
- Void Dust: 3% drop rate

**Ether Beings (Potion Master needs these drops):**
- Etherbloom Herb: 6% drop rate
- Etheric Slime: 4% drop rate

**Mist Entities (Potion Master needs these drops):**
- Mist Essence: 7% drop rate
- Fogweed: 5% drop rate

**Ancient Guardians (Armory Master needs these drops):**
- Enchanted Ore: 4% drop rate
- Crystal Shards: 6% drop rate
- Rare Ore: 2% drop rate

### 19.8.2 Boss Encounter Rewards

**Zone Bosses (S-Rank):**
- Rare recipes: 15% chance
- Advanced alchemy formulas: 10% chance
- Legendary crafting materials: 5% chance

**World Bosses (Special Events):**
- Unique recipes: 100% chance (one per boss)
- Epic materials: 20% chance
- Guild-wide marketplace listings

### 19.8.3 Adventure Master Quest Bonuses

**Quest Completion Rewards:**
- Base gold: 2,500 per S-Rank quest
- Rare drops: 25% bonus chance
- Recipe drops: 20% bonus chance
- **Total value:** 3,000-4,000 gold per quest (compensates for marketplace spending)

---

## Section 19.9: Implementation Phases

### Phase 1: Core Dependencies (Week 1-2)
1. **Recipe System:** Implement rare recipe drops from quests
2. **Marketplace Categories:** Add recipe and rare material trading
3. **Adventure Drops:** Balance drop rates for specialization dependencies
4. **Specialization Locks:** Prevent crafting without required recipes/materials

### Phase 2: Economic Balancing (Week 3-4)
1. **Price Monitoring:** Track marketplace prices by item type
2. **Dependency Ratios:** Tune how much each specialization must buy externally
3. **Profit Balancing:** Ensure no specialization is unviable
4. **Cross-Specialization Trades:** Verify trade flows work as intended

### Phase 3: Advanced Features (Week 5+)
1. **Recipe Research:** Allow players to research recipes (alternative to buying)
2. **Guild Trades:** Internal guild marketplace with reduced fees
3. **Seasonal Events:** Special quests that favor certain specializations
4. **Economic Analytics:** Dashboard showing specialization profitability

---

## Section 19.10: Risk Assessment & Mitigations

### 19.10.1 Risk: Specialization Frustration

**Problem:** Players get stuck because they can't buy critical dependencies  
**Mitigation:**
- NPC shop sells basic versions of all dependencies (expensive, no discount)
- Tutorial quests provide starter recipes/materials
- Free respec option during first 24 hours of specialization choice

### 19.10.2 Risk: Economic Imbalance

**Problem:** One specialization becomes dominant through trading  
**Mitigation:**
- Regular economic reviews (weekly price monitoring)
- Dynamic marketplace taxes (increase on oversupplied items)
- Balance patches that adjust dependency requirements

### 19.10.3 Risk: Player Confusion

**Problem:** Complex interdependencies overwhelm new players  
**Mitigation:**
- Clear UI indicators showing what each specialization needs/buys
- Specialization onboarding quests
- Marketplace tutorials with trade recommendations

### 19.10.4 Risk: Market Manipulation

**Problem:** Players coordinate to manipulate prices  
**Mitigation:**
- Price floors/ceilings prevent extreme manipulation
- Transaction volume limits per player
- Anti-bot measures (transaction delays, captcha for high-volume traders)

---

## Section 19.11: Success Metrics

### 19.11.1 Economic Health

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Cross-specialization trade volume** | >40% of marketplace activity | Validates interdependency design |
| **Specialization satisfaction** | >75% of players report feeling "strategic" | Dependencies create meaningful choices |
| **Marketplace dependency fulfillment** | >80% of critical items available | Prevents frustration |
| **Economic diversity** | No specialization <60% profitability of best | Maintains choice viability |

### 19.11.2 Player Behavior

| Behavior | Target | Measurement |
|----------|--------|-------------|
| **Specialization switching** | <15% switch within first week | Players commit to chosen path |
| **Marketplace engagement** | >70% of players trade weekly | Active participation in economy |
| **Adventure completion** | >60% of Adventure Masters complete 5+ quests/week | Core loop engagement |
| **Cross-system usage** | >50% of players use marketplace + adventures | Interdependency success |

---

## Section 19.12: Alternative Approaches Considered

### 19.12.1 "Soft Dependencies" (Rejected)

**Idea:** Specializations can slowly research dependencies internally (no marketplace requirement)  
**Why Rejected:** Removes trading incentive, makes specializations too self-sufficient

### 19.12.2 "Guild-Only Trading" (Deferred)

**Idea:** Dependencies only tradable within guilds  
**Why Deferred:** Too restrictive for solo players, implement after basic system proves successful

### 19.12.3 "Dynamic Specialization" (Considered)

**Idea:** Allow players to temporarily "borrow" other specialization capabilities  
**Why Considered:** Could reduce frustration, but might dilute specialization identity

---

## Section 19.13: Summary & Recommendations

**Enhanced Specialization Framework:**

✅ **Creates meaningful interdependencies** - Each specialization needs external inputs to maximize potential  
✅ **Integrates marketplace deeply** - Trading becomes core to specialization success  
✅ **Balances adventure system** - Quest drops become critical for progression  
✅ **Maintains specialization identity** - Each path still has unique advantages  
✅ **Prevents softlocks** - NPC shop + tutorial support ensure accessibility  

**Implementation Priority:**
1. **Phase 1:** Recipe drops + marketplace categories (core dependencies)
2. **Phase 2:** Economic balancing + price monitoring
3. **Phase 3:** Advanced features + analytics

**Expected Outcome:** Specializations become strategic choices with real trade-offs, creating a vibrant player-driven economy where marketplace activity is essential for optimal progression.

---

**Status:** Ready for Design Review  
**Complexity:** Medium-High (requires marketplace + adventure integration)  
**Timeline:** 4-6 weeks implementation  
**Risk Level:** Medium (economic balancing requires iteration)
