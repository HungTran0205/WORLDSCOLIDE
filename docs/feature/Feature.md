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

#### 1.1.4 Chi tiết phòng chế tạo: Vũ khí

##### 1.1.4.1 Các chỉ số cơ bản

- Chỉ số có thể không tiêu hao nguyên liệu (`resource saving chance`)
- Chỉ số có tỉ lệ tạo ra 2 sản phầm cùng lúc (`double product chance`)

###### 1.1.4.2 Input

- Người chơi chọn
  - Loại quặng (Define later)
  - Gỗ (Define later)
  - Recipe
  - Improve success rate tăng +10~+25% success rate
    - Normal: 90-95%
    - Rare: 75-85%
    - Epic: 50-70%
    - Legendary: 30-50%

###### 1.1.4.3 Output

- Rare weapon có success rate thấp hơn và yêu cầu công thức + nguyên liệu hiếm hơn
- Dùng quặng enchant để tạo ra weapon enchant với bonus stat +1~+5 lên STR / DEX / AGI / INT / END / LUK / CHA

#### 1.1.5 Chi tiết phòng chế tạo: Giáp

##### 1.1.5.1 Các chỉ số cơ bản

- Chỉ số có thể không tiêu hao nguyên liệu (`resource saving chance`)
- Chỉ số có tỉ lệ tạo ra 2 sản phầm cùng lúc (`double product chance`)

###### 1.1.5.2 Input

- Người chơi chọn
  - Loại quặng (Define later)
  - Gỗ (Define later)
  - Recipe
  - Improve success rate tăng +10~+25% success rate
    - Normal: 90-95%
    - Rare: 75-85%
    - Epic: 50-70%
    - Legendary: 30-50%

###### 1.1.5.3 Output

- Rare armor có success rate thấp hơn và yêu cầu công thức + nguyên liệu hiếm hơn
- Dùng quặng enchant để tạo ra armor enchant với bonus stat +1~+5 lên STR / DEX / AGI / INT / END / LUK / CHA
  - Tạo enchant mạnh hơn đổi lại success rate thấp hơn ~10-20%

#### 1.1.6 Chi tiết phòng chế tạo: Phép thuật và máu

##### 1.1.6.1 Các chỉ số cơ bản

- Chỉ số có thể không tiêu hao nguyên liệu (`resource saving chance`)
- Chỉ số có tỉ lệ tạo ra 2 sản phầm cùng lúc (`double product chance`)

###### 1.1.6.2 Input

- Người chơi chọn loại spell mình muốn craft hoặc là portion (Buff, Debuff, Portion)
  - Magic item
  - Gỗ (Define later)
  - Recipe
  - Improve success rate tăng +10~+25% success rate
    - Normal: 90-95%
    - Rare: 75-85%
    - Epic: 50-70%
    - Legendary: 30-50%

###### 1.1.6.3 Output

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


###### 1.1.6.4 Buff

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

###### 1.1.6.5 Debuff

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

###### 1.1.6.6 Healing portion

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
  
-----------------------------------------------------------------------------------------------------
- Phòng hỗ trợ: kho chứa, ngân hàng, workshop nâng cấp
- Nâng cấp phòng tăng công suất, tốc độ, dung lượng
- Auto-gather / sản xuất theo chu kỳ để tạo cảm giác idle
- Mỗi phòng có thể mở rộng bằng tài nguyên hoặc điểm tiến trình

## 2. Tài nguyên và nền kinh tế

- Tài nguyên cơ bản: Wood, Stone, Iron, Crystal, Essence
- Tài nguyên chế tạo: Metal Ore, Cloth, Leather, Alloy
- Tài nguyên hiếm: Boss Shard, Token, Rare Material
- Currency chính: Gold / Coin
- Currency phụ: Gem / Token / Premium Shard
- Hệ thống mua bán, bán thừa, đổi tài nguyên

## 3. Chế tạo vũ khí và mảnh giáp

- Công thức chế tạo armor: chỉ 1 mảnh giáp duy nhất, tier cơ bản tới hiếm
- Weapon slot: 1 slot vũ khí
- Armor slot: 1 slot giáp
- Item quality: Normal, Rare, Epic, Legendary
- Salvage / dismantle để lấy lại nguyên liệu

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

## 8. Inventory

- Inventory quản lý materials, gear, shard
- Capacity giới hạn và stack materials
- UI equip / unequip rõ ràng
- Compare gear currently equipped với gear trong túi
- Item detail, rarity, stats hiển thị rõ

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