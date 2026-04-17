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

##### 1.1.5.1 Các chỉ số cơ bản

- Chỉ số có thể không tiêu hao nguyên liệu (`resource saving chance`)
- Chỉ số có tỉ lệ tạo ra 2 sản phầm cùng lúc (`double product chance`)

###### 1.1.5.2 Input

- Người chơi chọn loại spell mình muốn craft hoặc là portion (Buff, Debuff, Portion)
  - Magic item
  - Gỗ (Define later)
  - Recipe
  - Improve success rate tăng +10~+25% success rate
    - Normal: 90-95%
    - Rare: 75-85%
    - Epic: 50-70%
    - Legendary: 30-50%

###### 1.1.5.3 Output

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


###### 1.1.5.4 Buff

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

###### 1.1.5.5 Debuff

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

###### 1.1.5.6 Healing portion

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

- Combat auto / semi-auto, dễ tiếp cận cho idle game
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


## 9. Trade / Market

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