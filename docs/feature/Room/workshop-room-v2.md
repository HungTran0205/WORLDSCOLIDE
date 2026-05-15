# Workshop v2

## 0. PX Goals

| Goal | Mô tả | Mechanic phục vụ |
|------|-------|-----------------|
| **Agency** (Primary) | Người chơi cảm thấy kiểm soát được output | Material affinity, Blueprint system |
| **Mastery** | Hiểu material nào → stat gì → craft/enhance có chủ đích | Material → stat category mapping |
| **Anticipation** | Set up queue → offline → quay lại xem kết quả | Offline queue, no-fail output |

**Anti-goals:** Mất nguyên liệu khi offline. RNG hoàn toàn không có agency. Confusion về stats nào sẽ ra.

---

## 1. Tổng quan

Workshop là phòng chế tạo vũ khí/giáp thống nhất. Queue dựa trên **nhân lực** (workers) trong phòng, không phải upgrade level. Hỗ trợ offline progression đầy đủ — queue chạy bình thường khi không online.

**4 tác vụ:**
- **Weapon/Armor Crafting** — wood/stone + monster material (optional) + gem (optional)
- **Enhance** — vũ khí đã craft + monster material → thêm slot hoặc reroll stat value
- **Repair** — phục hồi durability
- **Dismantle** — tháo rời lấy lại nguyên liệu

---

## 2. Worker Queue System

### 2.1 Cơ chế

- **1 worker = 1 task active** tại một thời điểm
- Người chơi assign worker vào Workshop → worker xử lý queue theo thứ tự
- Worker xong task → tự động pick task tiếp theo trong queue
- Nếu thiếu nguyên liệu → skip task đó, nhảy sang task tiếp theo
- **Offline:** Queue chạy bình thường với tốc độ full

### 2.2 Queue Management

- Người chơi tạo queue thủ công: chọn tác vụ + nguyên liệu + số lượng
- Hoặc queue via **Blueprint** (xem Section 5)
- Queue không giới hạn số lượng entries, nhưng chỉ số task xử lý đồng thời = số workers trong phòng

### 2.3 Workshop Upgrade vs Workers

| Yếu tố | Điều chỉnh bởi |
|--------|---------------|
| Số task chạy song song | Số workers trong phòng |
| Tốc độ crafting | Workshop level |
| Tier vật liệu unlock | Workshop level |
| 2nd material slot khi craft | Workshop level |
| Số Blueprint slots | Workshop level |

---

## 3. Workshop Upgrade Table

| Level | Tốc độ | Unlocks | Blueprint Slots | Notes |
|-------|--------|---------|----------------|-------|
| 1 | 1.0x | T1 weapon, Path A/B, Enhance | 3 | MVP baseline |
| 2 | 1.3x | T2 weapon, Path B+ (2 materials → 2 slots) | 5 | |
| 3 | 1.6x | T3 weapon, Gem Elemental Slot | 8 | |
| 4 | 2.0x | T4 weapon | 12 | |
| 5 | 2.5x | T5 weapon, Legendary Blueprint | 15 | |

---

## 4. Weapon/Armor Crafting

### 4.1 No-Fail System

**Luôn có output.** Không bao giờ mất nguyên liệu hoàn toàn. Chất lượng phụ thuộc:
- Wood/Stone tier → stat value range + crafting time
- Monster Material → stat category (affinity)
- Gem → elemental slot đặc biệt (Section 4.4)

### 4.2 Input

```
Wood / Stone (bắt buộc) — xác định weapon tier và stat range
  + Monster Material (optional, tối đa 1-2) — xác định stat category
  + Gem (optional)                          — mở Elemental Slot riêng biệt
```

**Weapon không stack** — mỗi instance có durability riêng.

### 4.3 Crafting Paths

| Path | Input | Output | Khi nào dùng |
|------|-------|--------|-------------|
| **A — Plain** | Wood/Stone only | Weapon + **20% chance** 1 generic slot | Khi không có/không muốn tốn material quái |
| **B — Guided** | Wood/Stone + 1 Monster Mat | Weapon + **guaranteed** 1 slot (category từ material) | Muốn stat cụ thể, có material |
| **B+ — Dual** | Wood/Stone + 2 Monster Mats | Weapon + **guaranteed** 2 slots (mỗi slot từ 1 mat) | Workshop Lvl 2+, T2+ weapon |

> Path A tạo ra "lucky drop" feel — item ngẫu nhiên ra slot là bonus, không phải expectation. Path B là predictable investment.

**Crafting Time per Weapon** *(nhân hệ số Workshop level)*:

| Tier | Base Material | Base Time | Ghi chú |
|------|--------------|-----------|---------|
| T1 | Stone / Wood | 30s | Học flow, nhanh |
| T2 | Iron / Hardwood | 75s | Bước nhảy đáng kể |
| T3 | Crystal / Ironwood | 3 min | Cảm giác item quan trọng |
| T4 | Rare Ore / Ancient Wood | 8 min | Offline-oriented |
| T5 | Boss Material | 20 min | Rare item, deliberate decision |

> Ví dụ: T5 ở Workshop Lvl 5 (2.5x) = 8 phút thực tế.

### 4.4 Monster Material Affinity

| Material | Nguồn | Stat Category | Placeholder Stats | Enhence item type|
|----------|-------|--------------|-------------------|
| Slime Drop | Slime | Tanky (HP/Defense) | HP 50-200 | Armor|
| Bat Wing | Cave Bat | Dodge | Dodge 1%-5% | Weapon|
| Spider Legs | Giant Spider | Accuracy| hit chance 1% - 10%| Weapon|
| Metal plate | Guard Robot Dog | Block | Block 1%-5%| Armor |
| Drone sensor | Guard Drone | Attack Speed | AS 5%-10% | Weapon |
| Slime King Core | Slime King | Shield | Shield 50-500 | Armor|
| *(4-6 materials thêm)* | | [placeholder] | [placeholder] |


> **Note:** Mapping chi tiết sẽ thiết kế ở combat phase.

**Nếu không dùng material (Path A):** Slot roll từ generic stat pool — không bias về category nào.

### 4.5 Gem Elemental Slot

- **Slot riêng biệt** — không conflict với Stat Slots
- Mở khi Workshop Level ≥ 3
- **Input:** 1 Gem (crafted/mined)
- **Output:** Item có Elemental tag + visual UI effect trên item

| Gem Type | Element | UI Effect | Combat Effect | status effective|
|----------|---------|-----------|---------------|
| Ruby | Fire | Glow đỏ | Chance to burn enemy 10-20% | burn damage 5%-15% of weapon damage over 5s |
| Sapphire | Ice | Glow xanh lam | Chance to freeze enemy 10-20% | slow enemy 10%-30% for 2-5s |
| Topaz | Lightning | Glow vàng, tia sáng | Chance to shock enemy 10-20%| stun enemy for 1 attack |
| Emerald | Poison | Glow xanh lá | Chance to posion enemy 10-20% | poison damage 3%-7% of weapon damage over 10s |
| *(thêm types)* | | | [placeholder] |

> **Note:** Gem effect chi tiết sẽ thiết kế cùng combat arena system.

### 4.6 Enhance System

Post-craft operation — nâng cấp weapon/armor đã có bằng monster material. **Hai operations khác nhau:**

#### Add Slot
Dùng khi weapon còn slot trống.

```
Input:  Weapon (slot trống) + 1 Monster Material
Output: Slot được điền — category từ material, value roll trong FULL range của tier
```

- Guaranteed — không có fail, không mất weapon
- Material tier phải ≥ weapon tier

#### Reroll Value
Dùng khi weapon có slot nhưng muốn giá trị tốt hơn.

```
Input:  Weapon (slot đã có stat) + 1 Monster Material (cùng category với slot đó)
Output: Stat reroll trong FULL range — có thể cao hơn HOẶC thấp hơn current value
```

- **Không có floor** — HP+150 reroll có thể ra HP+60
- Player thấy current value + stat range trước khi quyết định → **informed risk**
- Chỉ dùng khi current value quá thấp, không worth reroll khi đã gần max

> **Tại sao không floor?** Floor = spam đến max → progression collapse. Full range random giữ reroll là *deliberate gamble*, không phải guaranteed upgrade path.

**Constraints chung:**
- Mỗi enhance là 1 queue task — tốn worker slot
- Material tier phải ≥ weapon tier
- Reroll dùng **cùng category material** với slot đang target

### 4.7 Crafting Skill

Skill cá nhân của nhân vật, tăng khi thao tác tại Workshop. Max level 10.

#### Cách tăng skill

**XP per action = tier của item** (T1=1, T2=2, T3=3, T4=4, T5=5). Mọi craft và enhance đều count.

| Level | XP per level | T1 craft cần | Thời gian T1 spam |
|-------|-------------|--------------|-------------------|
| 1→2 | 3 | 3 crafts | ~1.5 phút |
| 2→3 | 70 | 70 crafts | ~35 phút |
| 3→4 | 200 | 200 crafts | ~1.7 giờ |
| 4→5 | 500 | 500 crafts | ~4 giờ |
| 5→6 | 1,000 | 1,000 crafts | ~8 giờ |
| 6→7 | 2,000 | 2,000 crafts | ~16 giờ |
| 7→8 | 3,500 | 3,500 crafts | ~29 giờ |
| 8→9 | 6,000 | 6,000 crafts | ~50 giờ |
| 9→10 | 10,000 | 10,000 crafts | ~83 giờ |

> Lvl 2 đạt sau 3 crafts — onboarding nhanh. Lvl 3 trở đi là commitment thực sự. Mix T1-T3 realistic: Lvl 10 trong ~30-40 giờ gameplay.

#### Axis 1 — Path A Slot Chance

| Skill Lvl | Slot Chance (Plain craft) |
|-----------|--------------------------|
| 1 | 20% |
| 3 | 25% |
| 5 | 30% |
| 7 | 37% |
| 10 | 45% |

> 45% vẫn là gamble — Path B không mất giá trị.

#### Axis 2 — Crafting Speed

-3% crafting time per level → **-27% ở Lvl 10**. Passive background reward.

#### Knowledge Unlock System

Càng lên level, thông tin về nguyên liệu càng được mở khóa. **Information là reward** — không thay đổi stat, chỉ giúp player ra quyết định tốt hơn.

| Skill Lvl | Unlock |
|-----------|--------|
| **1** | T1 material → **category only** *("Slime Drop: HP/Defense")* |
| **2** | T1 material → **probability breakdown** *("HP 50-100: 40% / 101-150: 40% / 151-200: 20%")* |
| **3** | T1 full codex + T2 material → category only |
| **4** | T2 material → probability breakdown |
| **5** | T2 full codex + T3 category + **Reroll Preview** *(milestone)* |
| **6** | T3 material → probability breakdown |
| **7** | T3 full codex + T4 category |
| **8** | T4 material → probability breakdown |
| **9** | T4 full codex + T5 category |
| **10** | T5 full codex + **Masterwork Trigger** *(milestone)* |

**Reroll Preview (Lvl 5):** Khi enhance reroll, player thấy giá trị mới trước khi confirm.
```
"New roll: HP+83. Accept or Reject?"
  Accept → apply, material tốn 100%
  Reject → không apply, material tốn 50%
```

**Masterwork Trigger (Lvl 10):** 5% chance khi craft bất kỳ → tất cả slots roll max value.
> Hiển thị: *"✦ Masterwork!"*

---

## 5. Blueprint System

### 5.1 Mục đích
Lưu lại combination để batch craft, không cần chọn nguyên liệu thủ công mỗi lần.

### 5.2 Tạo Blueprint

1. Người chơi mở "Save as Blueprint" sau khi chọn nguyên liệu
2. Đặt tên (ví dụ: "HP Sword", "Fire Armor")
3. Chọn quantity muốn craft (ví dụ: 5x)
4. Blueprint lưu: tên + wood/stone type + material type + gem type + quantity

### 5.3 Sử dụng Blueprint

- Chọn Blueprint từ list → "Add to Queue"
- Worker xử lý blueprint queue tự động: craft liên tục đến khi hết quantity hoặc hết nguyên liệu
- Nếu giữa chừng hết nguyên liệu → pause blueprint task, skip sang task tiếp theo trong queue

### 5.4 Giới hạn

| Workshop Level | Blueprint Slots |
|---------------|----------------|
| 1 | 3 |
| 2 | 5 |
| 3 | 8 |
| 4 | 12 |
| 5 | 15 |

---

## 6. Repair

- **Queue:** Sequential, mỗi item xử lý tuần tự
- **Input:** Stone hoặc Wood tùy material gốc của item, lượng tùy % damage
- **Time:** 1-3 phút tùy damage level
- **Output:** Item phục hồi full durability (no-fail, luôn thành công)
- **No "rush" option** — thống nhất với no-fail philosophy

---

## 7. Dismantle

- **Instant action** — không cần queue
- **Recovery rate:**
  - Plain item (không material): 70-80% wood/stone
  - Crafted item (có monster material): 50-60% wood/stone
- **Material recovery:** 30% chance recover 1 monster material khi dismantle crafted item
- **Gem recovery:** Không — gem bound vào item khi craft

---

## 8. MVP Scope (Phase 1)

Chỉ implement đủ để test crafting flow:

**Included:**
- [ ] Craft T1 weapon từ Stone/Wood (Path A — 20% chance slot)
- [ ] Craft T1 weapon + Slime Drop (Path B — HP 50-200 guaranteed)
- [ ] Enhance: Add Slot (T1, Slime Drop category)
- [ ] Enhance: Reroll Value (T1, Slime Drop category)
- [ ] Worker queue: 1 worker = 1 task
- [ ] Blueprint: save + batch craft (3 slots)
- [ ] Repair (no-fail, timed)
- [ ] Dismantle (instant, basic recovery)

**Excluded (future phases):**
- Path B+ (2 materials, 2 slots)
- Gem Elemental Slot + UI effects
- All materials ngoài Slime Drop
- Crafting Skill progression (Section 4.7)
- Workshop Lvl 2-5 unlocks
- Trading/Market integration

---

## 9. Future Phases

| Phase | Feature |
|-------|---------|
| Combat Phase | Tune tất cả stat values, define gem combat effects |
| Material Phase | Map 10-12 materials → affinities cho 6 monster types |
| Skill Phase | Crafting Skill XP tracking, Reroll Preview (Lvl 5), Masterwork (Lvl 10) |
| Gem Phase | Elemental slot UI effects, gem mining integration |
| Late Game | Path B+ (dual mat), T4-T5 weapons, Legendary Blueprint |
| Social Phase | Trading/Market system |

---

## Unresolved Questions

1. **Worker assignment UI** — người chơi assign worker vào Workshop như thế nào? Drag-and-drop hay button?
2. **Queue persistence khi đóng app** — queue state save vào save file không?
3. **Max items trong inventory từ Workshop** — cần giới hạn không hay auto-transfer?
4. **Reroll confirmation UI** — show current value + range + "Confirm reroll?" trước khi execute?
5. **Stat range display** — player biết range của từng tier/material ở đâu? Tooltip hay codex riêng?
