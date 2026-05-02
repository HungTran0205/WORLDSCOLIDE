# Hệ thống stats nhân vật

## 1. Mục tiêu thiết kế

- PX Goal: tạo cảm giác mỗi nhân vật có hai con đường phát triển rõ ràng, chiến đấu và lao động, nhưng vẫn dùng chung hệ thống base stats.
- Combat stats cần là thứ có thể rèn luyện trực tiếp trong Training Yard và có giá trị chiến đấu rõ ràng.
- Life stats cần tăng dần khi nhân vật làm việc trong phòng production room, thúc đẩy lựa chọn phân bổ nhân sự hợp lý.
- Base stats giữ vai trò nền tảng, quyết định tỷ lệ quy đổi cả combat và sản xuất.

## 2. Kiến trúc 3 loại stats

### 2.1 Base stats

Base stats là thuộc tính cốt lõi của nhân vật. Chúng không phải là giá trị combat trực tiếp, mà là nguồn lực cơ bản cho mọi công thức.

- STR (Strength): sức mạnh cơ bắp. Ảnh hưởng Damage vật lý, Carry Weight, mining/chopping efficiency.
- DEX (Dexterity): độ chính xác. Ảnh hưởng Crit Rate, Hit Rate, ranged damage, finesse tasks.
- AGI (Agility): độ linh hoạt. Ảnh hưởng Attack Speed, Move Speed, Dodge, reaction, và **initiative** trong combat.
  - AGI càng cao thì nhân vật càng có ưu tiên đánh trước trong lượt combat.
  - Nếu AGI bằng nhau giữa hai nhân vật, thứ tự đánh được quyết định ngẫu nhiên.
- INT (Intelligence): trí tuệ. Ảnh hưởng Magic Damage, Mana, Spell scaling, recipe efficiency.
- END (Endurance): thể lực. Ảnh hưởng HP, Stamina, Resist, recovery.
- LUK (Luck): may mắn. Ảnh hưởng Drop Rate, Crit Damage, Rare Event, proc chance.
- CHA (Charisma): uy lực. Ảnh hưởng Leadership, Negotiation, Influence, synergy bonuses.

#### CHA và cơ chế tuyển dụng Tavern

- CHA không chỉ là chỉ số social, mà là đồng tiền chính trong môi trường tuyển chọn nhân sự.
- Tại Tavern, CHA ảnh hưởng:
  - **Recruit Quality:** tăng % cơ hội thuê được nhân sự hiếm hoặc có life/stat profile phù hợp.
  - **Recruit Speed:** giảm thời gian chờ tìm người, rút ngắn cooldown của lượt tuyển.
  - **Cost Efficiency:** giảm phí tuyển dụng / gratuity requirement.
  - **Morale Bonus:** tăng chance nhân viên mới bắt đầu với 1-2% bonus synergy hoặc room efficiency.
- Cơ chế gợi ý:
  - Base CHA 10 = standard tavern pool.
  - Mỗi +5 CHA tăng +5% chance nhân sự rare và -5% recruit cost.
  - CHA cao có thể mở ra "Tavern gossip tier" đặc biệt: nhân sự elite (Scholar, Veteran Miner, Specialist) chỉ xuất hiện với CHA ≥ 25.
- CHA cũng tương tác với party leadership:
  - Nếu đeo nhân vật CHA cao vào party, toàn party nhận +1% recruitment luck / VIP encounter chance.

### 2.1.1 Max base stat và threshold perks

- **Max base stat = 50.** Tất cả cơ chế threshold phải nằm trong khoảng 0-50.
- Khuyến nghị dùng 40 và 45 làm các ngưỡng bonus quan trọng, với một số hiệu ứng cao cấp mở ở 50.
- Đây là cách để base stat vẫn có giá trị đáng kể mà không vượt quá giới hạn hệ thống.

### 2.1.2 Combat jobs, life jobs và role design

#### Combat jobs

- Tank: STR, END, DEX.
- DPS melee: STR, AGI, LUK.
- DPS range: DEX, AGI, LUK.
- Spell Caster: INT, LUK.
- Healer: INT, END.
- Scout: DEX, AGI.
- Debuffer: INT, LUK.

#### Life jobs

- Alchemist: INT, DEX, LUK.
- Miner: STR, END, LUK.
- Armorsmith: STR, DEX, LUK.
- Weaponsmith: STR, DEX, LUK.
- Medic: INT, LUK.

#### Role vs job

- Một nhân vật có thể có `role` cụ thể (ví dụ Tank, Miner, Healer) và một hoặc hai `job` chính (combat job hoặc life job).
- Combat job xác định cách họ tăng combat stats và phép trong Training Yard/Expedition.
- Life job xác định cách họ tăng life stats và hiệu suất trong production rooms.
- Role quyết định ưu tiên tuyển dụng và assignment: một Tank sẽ được gán vào combat front line, một Miner sẽ được gán vào quarry/wood camp.

### 2.1.3 Threshold perks theo giới hạn 50

| Stat | Threshold | Combat perk | Production / utility perk |
|------|-----------|-------------|--------------------------|
| STR | 40 | Passive Block: +8% chance chặn một phần damage vật lý | +10% chance giảm tool break, +8% success rate với tools |
| STR | 45 | Heavy Impact: +7% base melee damage, +2% Damage Melee bonus | Tool master: +12% chance craft success, +6% work efficiency |
| END | 40 | Toughness Guard: +3% max HP and +2% resistance | Stable Recovery: +5% heal potency trong infirmary |
| END | 45 | Reflect Damage: 5% damage trả lại attacker khi block | Enduring Shift: +10% double yield chance trong quarry |
| END | 50 | Bulwark: +4% damage reduction, +3% stun resistance | Endurance Work: +15% chance double resource gather |
| DEX | 40 | Sharpshot: +3% Accuracy và +2% Crit Rate | Precision Craft: +8% chance không tiêu nguyên liệu |
| DEX | 45 | Double Shoot: 12% chance tấn công 2 lần bằng ranged | Resource Discipline: +10% material efficiency, +5% quality rolls |
| DEX | 50 | True Aim: +5% Crit Rate, +8% Crit Damage | Material Ghost: +12% chance không tiêu nguyên liệu khi craft |
| AGI | 40 | Initiative Edge: ưu tiên đánh trước theo AGI | Quick Gather: +8% chance double harvest/gather |
| AGI | 45 | Swift Strike: +3% Attack Speed và +4% Dodge | Agile Work: +6% chance extra output khi gather |
| AGI | 50 | Battle Flow: giảm delay theo công thức `weaponBase / (1 + AGI/100)` và nếu AGI tied thì random order | Shadow Harvest: +12% double harvest chance |
| INT | 40 | Spell Clarity: +5% Magic Damage và +3% Mana Regen | Recipe Insight: +8% Craft success rate |
| INT | 45 | Multi-cast: 10% chance cast thêm 1 spell tự động | Enchant Precision: +12% chance produce enchanted output |
| INT | 50 | Overheal Shield: heal vượt thừa chuyển thành shield 20% | Master Alchemy: +15% success rate, giảm craft time 10% |
| LUK | 40 | Lucky Strike: +4% Crit Damage và +3% Crit Rate | Lucky Production: +10% chance craft double / enchanted item |
| LUK | 45 | Double Stack: 8% chance effect stack 2 lần | Rare Harvest: +10% chance harvest enchanted/rare resources |
| LUK | 50 | Fortune Burst: 12% chance instant full heal or extra reward | Craft Fortune: 15% chance create 2 items from 1 recipe |

#### Cách áp dụng

- Combat perks mở khi base stat đạt threshold trước combat.
- Production perks áp dụng trong quá trình dùng production rooms.
- Hiển thị threshold rõ ràng trong character sheet để hướng người chơi đầu tư.

### 2.2 Combat stats

Combat stats là các chỉ số chiến đấu được rèn luyện qua Training Yard. Chúng có thể tăng lên độc lập với production, nhưng vẫn lấy base stats làm hệ số cơ bản.

#### Combat jobs và combat stats chính

1. Tank
   - Primary: Threat, Defense Rating, HP
   - Base anchor: STR, END
2. DPS melee
   - Primary: Damage melee, Crit Damage, Accuracy, Attack Speed, Effect Chance
   - Base anchor: STR, AGI, LUK
3. DPS range
   - Primary: Damage range, Crit Damage, Accuracy, Attack Speed, Effect Chance
   - Base anchor: DEX, AGI, LUK
4. Spell Caster
   - Primary: Magic Damage, Mana, Mana Regen, Element Chance, Crit Rate
   - Base anchor: INT, LUK
5. Healer
   - Primary: Heal Amount, Buff Duration, Shield
   - Base anchor: INT, END
6. Scout
   - Primary: Invi Duration, Dodge, Mobility
   - Base anchor: DEX, AGI
7. Debuffer
   - Primary: Duration, Chance, Control Effectiveness
   - Base anchor: INT, LUK

### 2.3 Life stats

Life stats là các chỉ số chuyên môn của nghề nghiệp production. Chúng tăng khi nhân vật làm việc trong phòng tương ứng.

#### Life jobs và life stats chính

- Alchemist: INT, DEX, LUK
- Miner: STR, END, LUK
- Armorsmith: STR, DEX, LUK
- Weaponsmith: STR, DEX, LUK
- Medic: INT, LUK

Life stats không phải là chỉ số combat trực tiếp; thay vào đó, chúng tăng hiệu suất sản xuất, chất lượng sản phẩm và tốc độ hoàn thành.

## 3. Thiết kế Training Yard cho combat stats

### 3.1 Cơ chế chung

- Training Yard có các bài tập chuyên biệt cho từng combat job.
- Mỗi buổi training tiêu thời gian và resources (ví dụ: 30 phút, 1 training token, 1 combat dummy).
- Kết quả: tăng trực tiếp vào combat stats hoặc tăng điểm training pool dùng để đổi sang combat stat.
- Combat stats có thể tăng mỗi ngày/ mỗi ca, với diminishing returns ở mức cao.

### 3.2 Thiết kế bài tập ví dụ

- Tank Drill: +1 Threat hoặc +1 Defense Rating mỗi 30 phút.
- Melee Sparring: +1 Damage Melee hoặc +0.5% Crit Damage, +0.5 Accuracy.
- Range Practice: +1 Damage Range hoặc +0.5% Crit Damage, +0.5 Accuracy.
- Spell Focus: +1 Magic Damage hoặc +1 Mana, +0.2 Mana Regen.
- Healing Clinic: +1 Heal Amount hoặc +0.5s Buff Duration.
- Stealth Course: +0.5s Invi Duration hoặc +0.5 Dodge.
- Control Seminar: +1 Duration hoặc +1 Chance.

### 3.3 Công thức quy đổi cơ bản

Combat stat = BaseFactor × Base stat + TrainingBonus + GearBonus

- Ví dụ Damage Melee = 1.2 × STR + TrainingDamageMelee
- Crit Rate = clamp(5% + 0.5% × DEX + 0.3% × LUK + TrainingCritRate, 0%, 75%)
- Attack Speed = baseAS + 0.02 × AGI + TrainingAS
- Defense Rating = 0.8 × STR + 0.7 × END + TrainingDefense
- Magic Damage = 1.3 × INT + TrainingMagicDamage
- Heal Amount = 1.0 × INT + 0.5 × END + TrainingHeal
- Shield = 0.6 × END + TrainingShield

### 3.4 Expedition và combat progress

- Expedition là phương pháp huấn luyện “thực chiến” để tăng combat stats nhanh hơn so với Training Yard.
- Chỉ số combat chỉ tăng khi:
  - đánh chết quái (kill), hoặc
  - đạt ngưỡng damage threshold trên mục tiêu (damage dealt). 
- Combat stats tăng mạnh hơn nếu quái khó hơn, kèm theo bonus EXP/Training points.

#### Cơ chế tăng điểm Expedition

- Mỗi kill đem lại `Expedition Points` theo công thức:
  - `EP = BaseEP × DifficultyFactor × KillBonus`
  - `BaseEP` = 5 dành cho quái thường, 10 dành cho elite.
  - `DifficultyFactor` = 1 + (MonsterTier - PlayerTier) × 0.15, clamp 0.5-2.0.
  - `KillBonus` = 1.0 cho kill đơn, +0.25 nếu kill trong time window hoặc khi target trên 20% HP remaining.
- Damage deal cũng có giá trị:
  - `EP_damage = floor(DamageDealt / 50) × DamageFactor`
  - `DamageFactor` = 0.5 + 0.05 × (MonsterTier - PlayerTier), clamp 0.25-1.5.
- Chỉ số combat chỉ tăng khi damage được tính trên mục tiêu sống; damage vào target gần chết không tính bonus tăng thêm.

#### Quy đổi Expedition Points thành combat stats

- `Combat Training Bonus` = `floor(EP / 20)` cho các stat hiện tại hoặc point pool.
- Mỗi 20 EP cho một điểm training bonus, được tự động phân bổ theo job:
  - Tank: +1 Threat / +0.5 Defense Rating mỗi 20 EP.
  - DPS melee: +1 Damage Melee / +0.2% Crit Damage mỗi 20 EP.
  - DPS range: +1 Damage Range / +0.2% Crit Damage mỗi 20 EP.
  - Spell Caster: +1 Magic Damage / +0.5 Mana mỗi 20 EP.
  - Healer: +1 Heal Amount / +0.2s Buff Duration mỗi 20 EP.
  - Scout: +0.2s Invi Duration / +0.5 Dodge mỗi 20 EP.
  - Debuffer: +0.5 Chance / +0.2s Duration mỗi 20 EP.

#### Cơ chế đánh quái khó hơn

- Nếu nhân vật đánh quái mạnh hơn hoặc quái elite, họ nhận thêm multiplier:
  - `Harder Kill Bonus` = 1.0 + 0.1 × max(0, MonsterTier - PlayerTier).
- Đánh boss / elite vào group tăng thêm bonus `Expedition Mastery`:
  - +10% EP nếu kill boss,
  - +5% EP nếu tham gia kill elite monster.
- Cơ chế này giúp khuyến khích người chơi dùng expedition như thử thách, không chỉ farming quái bình thường.

### 3.5 Cân bằng training yard

- Training Yard chỉ tăng combat stats, không tăng base stats.
- Base stats xác định tiềm năng: một caster INT thấp sẽ không thể bù bằng training yard.
- Training có thể mở theo cấp: mỗi level camp unlock thêm 1 slot drill hoặc giảm thời gian 10%.
- Training Yard cũng có thể cung cấp buff tạm thời cho phòng combat, nhưng điểm chính là tăng chỉ số lâu dài.

## 4. Thiết kế production room cho life stats

### 4.1 Cơ chế chung

- Khi một nhân vật làm việc trong production room, họ nhận life XP cho nghề tương ứng.
- Mỗi nghề có 3 life stat chính theo đề bài.
- Life XP quy thành life stat points theo tỷ lệ cố định.
- Life stat points tăng hiệu suất room và mở bonus nghề nghiệp.

### 4.2 Ví dụ cơ chế

- Một ca làm việc 1 giờ trong room sản xuất:
  - Miner: +2 STR Life, +1 END Life, +1 LUK Life
  - Alchemist: +2 INT Life, +1 DEX Life, +1 LUK Life
  - Weaponsmith / Armorsmith: +2 STR Life, +1 DEX Life, +1 LUK Life
  - Medic: +2 INT Life, +1 LUK Life

- Nếu nhân vật có base stat phù hợp, họ nhận thêm bonus +20% life XP.
  - Miner với STR base cao +20% STR Life gain.
  - Alchemist với INT base cao +20% INT Life gain.

### 4.3 Life stats ảnh hưởng gì?

- STR Life: tăng sản lượng lao động vật lý, tốc độ khai thác, loot quantity.
- END Life: giảm fatigue, tăng thời gian làm việc hiệu quả, giảm downtime.
- DEX Life: tăng chính xác công thức, giảm thất thoát materials, tăng chất lượng sản phẩm.
- INT Life: tăng success rate crafting, unlock recipe tiers, giảm time to craft.
- LUK Life: tăng chance nhận rare material, tăng quality rolls, tăng mastery bonus.

### 4.4 Cơ chế rooms và role matching

- Phòng khai thác gỗ/đá: Miner life stats.
- Workshop/Armory: Weaponsmith + Armorsmith life stats.
- Alchemy: Alchemist life stats.
- Infirmary/Medic tent: Medic life stats.

### 4.5 Cân bằng production room

- Life stats là hệ quả của sản xuất, không thể dùng Training Yard để tăng.
- Phòng càng cao cấp thì life XP mỗi ca càng lớn, nhưng nhân sự phải phù hợp.
- Dùng nhân sự không phù hợp vẫn làm việc được, nhưng chỉ nhận 50% life XP bonus.
- Life stats khoá cấp: mỗi 10 điểm life stat mở 1 tier bonus mới cho nghề nghiệp.

## 5. Luồng hệ thống và tương tác

### 5.1 Dòng phát triển nhân vật

- Base stats: tăng bằng level up, equipment, items special.
- Combat stats: tăng qua Training Yard.
- Life stats: tăng qua production room assignment.

### 5.2 Giữ cân bằng và giá trị lựa chọn

- Để tránh quá mạnh, combat stats dùng một cột điểm khác và có cap theo level.
- Life stats tăng hiệu suất production, tạo vòng lặp "gửi NV vào phòng sản xuất để họ mạnh nghề hơn".
- Training Yard dành cho nhân sự chiến đấu, production rooms dành cho nhân sự chuyên môn.
- Một nhân vật hybrid có thể được dùng cả hai, nhưng chậm hơn so với chuyên nghiệp:
  - full combat build: cao combat stats, thấp life stats
  - full production build: cao life stats, thấp combat stats

## 6. Đề xuất số liệu mở đầu

- Combat Training: mỗi 30 phút training +1 điểm công theo job, max +10 points mỗi ngày.
- Life Work Shift: mỗi 1 hour shift +1 life point cho 2 stat chính, +0.5 point cho stat phụ.
- Life stat tiers:
  - 0-9 points: Basic
  - 10-19 points: Skilled
  - 20-29 points: Expert
  - 30+ points: Master

## 7. Ghi chú

- CHA nên làm bonus phụ cho cả combat và production: boost team morale / leadership, tăng room efficiency + party buff duration.
- LUK là stat cầu nối giữa combat và sản xuất.
- Nếu cần, có thể thêm cơ chế "Mentorship" trong Training Yard: nhân vật có CHA cao giúp tăng training efficiency cho cả party.
