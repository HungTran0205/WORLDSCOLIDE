# Inventory

## 1.2.1 Phòng mặc định: Inventory

### 1.2.1.1 Phân loại inventory phù hợp với game

- Resources / Materials
  - Wood, Stone, Iron, Crystal, Essence, Arcane Shard, Spell Fragment, Potion Ingredient, Enchanted Essence
- Gear
  - Weapon
  - Armor
- Spell / Potion
  - Buff Spell
  - Debuff Spell
  - Healing Potion / Healing Portion
- Crafting tools / vouchers
  - Success vouchers, enchant catalysts, recipe scrolls

### 1.2.1.2 Filter UI đề xuất

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

### 1.2.1.3 Cơ chế mở rộng kho đồ

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

### 1.2.1.4 Cân bằng slot giữa materials và gear/spell

- Materials nên stackable lớn, tiêu dùng nhiều slot ít
- Gear / Spells nên non-stackable hoặc stack thấp
- Đề xuất:
  - Materials: stack max 99
  - Spells/Healing portions: stack 10 / 20
  - Weapons/Armor: 1 slot mỗi món
- Giải pháp:
  - Filter materials riêng để tránh nghẽn UI
  - auto-stack tự gom cùng loại

### 1.2.1.5 UX & cảnh báo

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

### 1.2.1.6 Risk / Reward cho expansion

- Có thể thêm:
  - storage cost để giữ item lâu hơn
  - overflow penalty nếu full: giảm auto-collect, giữ backlog ở phòng until slot free
  - Nếu không đủ slot, phải lựa chọn sell / salvage / bỏ qua

### 1.2.1.7 Gear Comparison và Item Details

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
