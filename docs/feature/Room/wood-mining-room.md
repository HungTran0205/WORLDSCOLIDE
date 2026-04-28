# Phòng khai thác gỗ

## 1.1.1 Chi tiết phòng khai thác gỗ

### 1.1.1.1 Các chỉ số cơ bản

- Capacity room: giới hạn lượng item chứa trong phòng trước khi cần thu hoạch (ví dụ 1000 / 2000 / 4000)
- **Upgrade System:** 5-tier exponential scaling system
- **Base Production:** 10 items/min per member
- **Upgrade Framework:** Each tier multiplies production by 1.5x, adds +1 assignable member slot
- **Cost Scaling:** Exponential (doubles each time), starting at 1,000 gold for Tier 1
- **Item Drop Scaling:** Upgrades increase rare item drop rates (e.g., Tier 5: Herb 30%, Magic Fragment 25%, Enchanted Essence 20%)

### 1.1.1.2 Wood Extraction Upgrade Table

| Tier | Production Multiplier | Assignable Slots | Cost (Gold) | Cumulative Effect | Notes |
|------|----------------------|------------------|-------------|-------------------|-------|
| Base | 1.0x (10 items/min/member) | 3 | - | Baseline | Basic harvesting |
| Tier 1 | 1.5x | +1 (4 total) | 1,000 | 15 items/min/member | Improved tools |
| Tier 2 | 2.25x | +1 (5 total) | 2,000 | 22.5 items/min/member | Better techniques |
| Tier 3 | 3.375x | +1 (6 total) | 4,000 | 33.75 items/min/member | Enchanted axes |
| Tier 4 | 5.0625x | +1 (7 total) | 8,000 | 50.625 items/min/member | Rare materials |
| Tier 5 | 7.59375x | +1 (8 total) | 16,000 | 75.9375 items/min/member | Legendary efficiency |

**Item Drop Scaling:** Upgrades increase rare item drop rates (e.g., Tier 5: Herb 30%, Magic Fragment 25%, Enchanted Essence 20%).

**Member Example (Tier 5, 8 members):** Base 75.94 items/min → With diminishing returns: ~1.61x total → ~122 items/min effective.

### 1.1.1.3 Các chỉ số khi nhân vật được assign vào room

- Tốc độ khai thác: Base 10 items/min per member (scales with upgrades above)
- Durability / tool break chance: tỉ lệ dụng cụ hỏng mỗi lần khai thác (ví dụ 5% base, giảm khi nâng cấp tool)
- Double harvest chance: tỉ lệ nhận item x2 / bonus yield (ví dụ 10% base, tăng khi nâng cấp hoặc buff)
- Enchanted item chance: tỉ lệ thu được item enchant hiếm với bonus đặc biệt (ví dụ 2% base)
  - Item enchant có thể cho bonus stat dựa trên STR, DEX, AGI, INT, END, LUK, CHA
  - Bonus stat ngẫu nhiên +1 đến +5 cho mỗi chỉ số phù hợp với item hoặc nhân vật

### 1.1.1.4 Các chỉ số khi có furniture

- Bonus modifiers: tăng thêm yield khi room level cao, khi có nhân sự phù hợp, hoặc khi dùng boost item

### 1.1.1.5 Các cơ chế khác

- Auto-collect trigger: khi phòng đầy đến limit, tự chuyển item vào kho hoặc giữ để đợi thu hoạch
  - Nếu còn slot inventory: tự nạp item vào kho / nhân vật khi offline
  - Nếu đầy slot inventory: giữ item tại phòng hoặc tạo backlog cho lần thu hoạch tiếp theo sau khi giải phóng slot
- Risk/reward động lực: tăng tốc độ và tỉ lệ loot hiếm đổi bằng chi phí bảo trì hoặc tool durability

### 1.1.1.6 Upgrade level effect: khi cấp phòng gỗ tăng từ 1 lên 10, tỉ lệ rớt gỗ giảm và tỉ lệ rớt các loại tài nguyên phép thuật tăng.

- Rare material drop chance: khi cấp phòng gỗ tăng từ 1 lên 10, tỉ lệ rớt Wood giảm và tỉ lệ rớt các loại tài nguyên phép thuật hiếm tăng.
  - Level 1: Wood 100%, Herb 0%, Magic Fragment 0%, Enchanted Essence 0%
  - Level 2: Wood 95%, Herb 3%, Magic Fragment 2%, Enchanted Essence 0%
  - Level 4: Wood 80%, Herb 12%, Magic Fragment 6%, Enchanted Essence 2%
  - Level 6: Wood 60%, Herb 20%, Magic Fragment 12%, Enchanted Essence 8%
  - Level 8: Wood 40%, Herb 25%, Magic Fragment 20%, Enchanted Essence 15%
  - Level 10: Wood 20%, Herb 25%, Magic Fragment 30%, Enchanted Essence 25%
- Craft material unlock: sử dụng các item phép thu được để craft:
  - `Buff Spell`: tăng ATK / DEF / AGI / INT trong combat
  - `Debuff Spell`: giảm sức mạnh hoặc tốc độ kẻ thù
  - `Healing Potion`: hồi HP hoặc regen trong combat
- Enchanted Essence chance: tỉ lệ nhận essence phép có bonus stat ngẫu nhiên +1 đến +5
  - Buff Spell: tăng duration, buff %, hoặc bonus stat
  - Debuff Spell: tăng duration, debuff %, hoặc negative effect strength
  - Healing Potion: tăng HP amount hoặc regen amount
