# Phòng khai thác đá

## 1.1.2 Chi tiết phòng khai thác đá

### 1.1.2.1 Các chỉ số cơ bản

- Capacity room: giới hạn lượng đá chứa trong phòng trước khi cần thu hoạch (ví dụ 100 / 200 / 400)
- **Upgrade System:** 5-tier exponential scaling system
- **Base Production:** 8 stone/min per member
- **Upgrade Framework:** Each tier multiplies production by 1.5x, adds +1 assignable member slot
- **Cost Scaling:** Exponential (doubles each time), starting at 1,000 gold for Tier 1
- **Ore Drop Scaling:** Upgrades increase rare ore drop rates (e.g., Tier 5: Iron 30%, Crystal 25%, Rare 20%)

### 1.1.2.2 Stone Mining Upgrade Table

| Tier | Production Multiplier | Assignable Slots | Cost (Gold) | Cumulative Effect | Notes |
|------|----------------------|------------------|-------------|-------------------|-------|
| Base | 1.0x (8 stone/min/member) | 3 | - | Baseline | Basic mining |
| Tier 1 | 1.5x | +1 (4 total) | 1,000 | 12 stone/min/member | Better pickaxes |
| Tier 2 | 2.25x | +1 (5 total) | 2,000 | 18 stone/min/member | Deeper shafts |
| Tier 3 | 3.375x | +1 (6 total) | 4,000 | 27 stone/min/member | Enchanted tools |
| Tier 4 | 5.0625x | +1 (7 total) | 8,000 | 40.5 stone/min/member | Rare minerals |
| Tier 5 | 7.59375x | +1 (8 total) | 16,000 | 60.75 stone/min/member | Legendary veins |

**Ore Drop Scaling:** Upgrades increase rare ore drop rates (e.g., Tier 5: Iron 30%, Crystal 25%, Rare 20%).

### 1.1.2.3 Upgrade tier effect: mỗi cấp mỏ đá mở thêm cơ hội rớt nguyên liệu hiếm khác nhau (ví dụ từ Stone -> Iron Ore -> Crystal -> Rare Ore)

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

### 1.1.2.4 Các chỉ số khi nhân vật được assign vào room

- Tốc độ khai thác: Base 8 stone/min per member (scales with upgrades above)
- Double harvest chance: tỉ lệ nhận đá x2 / bonus yield (ví dụ 10% base, tăng khi nâng cấp hoặc buff)
- Bonus modifiers: tăng thêm yield khi room level cao, khi có nhân sự phù hợp, hoặc khi dùng boost item
- Auto-collect trigger: offline, nếu còn slot inventory thì tự chuyển đá vào kho; nếu đầy slot inventory thì giữ đá tại phòng hoặc backlog cho lần thu hoạch tiếp theo
- Risk/reward động lực: tăng tốc độ và tỉ lệ loot hiếm đổi bằng chi phí bảo trì hoặc tool durability
