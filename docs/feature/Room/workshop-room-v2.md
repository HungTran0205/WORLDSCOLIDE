# Workshop v2

## 0. PX Goals

| Goal | Mô tả | Mechanic phục vụ |
|------|-------|-----------------|
| **Agency** (Primary) | Người chơi cảm thấy kiểm soát được output | Essence affinity, Blueprint system |
| **Mastery** | Hiểu affinity → craft tốt hơn theo thời gian | Essence → stat category mapping |
| **Anticipation** | Set up queue → offline → quay lại xem kết quả | Offline queue, no-fail output |

**Anti-goals:** Mất nguyên liệu khi offline. RNG hoàn toàn không có agency. Confusion về stats nào sẽ ra.

---

## 1. Tổng quan

Workshop là phòng chế tạo vũ khí/giáp thống nhất. Queue dựa trên **nhân lực** (workers) trong phòng, không phải upgrade level. Hỗ trợ offline progression đầy đủ — queue chạy bình thường khi không online.

**4 tác vụ:**
- **Blank Crafting** — tạo phôi trắng từ stone hoặc wood
- **Weapon/Armor Crafting** — phôi + essence (optional) + gem (optional)
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
| Slot 3-4 availability | Workshop level |
| Số Blueprint slots | Workshop level |

---

## 3. Workshop Upgrade Table

| Level | Tốc độ | Unlocks | Blueprint Slots | Notes |
|-------|--------|---------|----------------|-------|
| 1 | 1.0x | Blank T1, Slot 1-2 | 3 | MVP baseline |
| 2 | 1.3x | Blank T2, Slot 3 (cần Essence T2) | 5 | |
| 3 | 1.6x | Blank T3, Gem Elemental Slot | 8 | |
| 4 | 2.0x | Blank T4, Slot 4 (20% roll) | 12 | |
| 5 | 2.5x | Blank T5, Slot 4 (35% roll), Legendary Blueprint | 15 | |

---

## 4. Blank Crafting (Phôi Trắng)

- **Input:** Stone (x5) → Stone Blank | Wood (x5) → Wood Blank
- **Output:** Blank tier tương ứng với material tier, base stat range lock theo blank tier
- **Time:** 30-60 giây per blank (nhân hệ số workshop level)
- **Stack:** Blank có thể stack trong inventory

**Blank Tier vs Stat Range** *(placeholder values — sẽ tune ở combat phase)*:

| Blank Tier | Base Material | Stat Range (ví dụ HP nếu slot 1) |
|-----------|---------------|----------------------------------|
| T1 | Stone / Wood | 50-200 |
| T2 | Iron / Hardwood | [placeholder] |
| T3 | Crystal / Ironwood | [placeholder] |
| T4 | Rare Ore / Ancient Wood | [placeholder] |
| T5 | Boss Material | [placeholder] |

---

## 5. Weapon/Armor Crafting

### 5.1 No-Fail System

**Luôn có output.** Không bao giờ mất nguyên liệu hoàn toàn. Chất lượng phụ thuộc:
- Blank tier → stat value range
- Essence type → stat category (affinity)
- Gem → elemental slot đặc biệt (Section 5.4)

### 5.2 Input

```
Blank (bắt buộc)
  + Essence (optional) → xác định stat category cho Slot 1-2
  + Gem (optional)     → mở Elemental Slot riêng biệt
```

### 5.3 Stat Slot System

| Slot | Điều kiện | Outcome nếu không có điều kiện |
|------|-----------|-------------------------------|
| Slot 1 | Luôn roll | — |
| Slot 2 | Luôn roll | — |
| Slot 3 | Essence tier ≥ T2 | Item vẫn ra với Slot 1-2, không mất gì |
| Slot 4 | Workshop Lvl 4+ + Rare Essence | 20-35% chance roll, miss = 3-stat item |

**Stat category xác định bởi Essence (Affinity System):**

| Essence | Nguồn | Stat Affinity | Placeholder Stats |
|---------|-------|--------------|-------------------|
| Slime Essence | Slime | Tanky (HP/Defense) | Slot 1: HP 50-200 |
| Slime King Essence | Slime King | [placeholder] | [placeholder] |
| Bat Essence | Cave Bat | [placeholder] | [placeholder] |
| Spider Essence | Giant Spider | [placeholder] | [placeholder] |
| Dog Bot Essence | Guard Robot Dog | [placeholder] | [placeholder] |
| Drone Essence | Guard Drone | [placeholder] | [placeholder] |
| *(4-6 essences thêm)* | | [placeholder] | [placeholder] |

> **Note:** 10-12 essence types từ 6 monster types — mapping chi tiết sẽ thiết kế ở combat phase.

**Nếu không dùng Essence:** Slot 1-2 roll từ default stat pool của blank type (generic, không bias về category nào).

### 5.4 Gem Elemental Slot

- **Slot riêng biệt** — không conflict với Stat Slots 1-4
- Mở khi Workshop Level ≥ 3
- **Input:** 1 Gem (crafted/mined)
- **Output:** Item có Elemental tag + visual UI effect trên item

| Gem Type | Element | UI Effect | Combat Effect |
|----------|---------|-----------|---------------|
| Ruby | Fire | Glow đỏ | [placeholder] |
| Sapphire | Ice | Glow xanh lam | [placeholder] |
| Topaz | Lightning | Glow vàng, tia sáng | [placeholder] |
| Emerald | Poison | Glow xanh lá | [placeholder] |
| *(thêm types)* | | | [placeholder] |

> **Note:** Gem effect chi tiết sẽ thiết kế cùng combat arena system.

### 5.5 Signature Moments

**Affinity Resonance** *(Workshop Lvl 3+)*
Khi dùng **3+ Essence cùng loại** trong một item → trigger bonus: một Guaranteed Stat tự động roll max value trong range.
> *"Slime Resonance! HP locked at max tier value!"*

**Masterwork Blueprint** *(Workshop Lvl 4+)*
Sau khi craft **50 items cùng Blueprint**, Blueprint đó unlock "Masterwork" mode — Slot 3 guaranteed roll (bỏ điều kiện Essence tier requirement).

---

## 6. Blueprint System

### 6.1 Mục đích
Lưu lại combination để batch craft, không cần chọn nguyên liệu thủ công mỗi lần.

### 6.2 Tạo Blueprint

1. Người chơi mở "Save as Blueprint" sau khi chọn nguyên liệu
2. Đặt tên (ví dụ: "HP Sword", "Fire Armor")
3. Chọn quantity muốn craft (ví dụ: 5x)
4. Blueprint lưu: tên + blank type + essence type + gem type + quantity

### 6.3 Sử dụng Blueprint

- Chọn Blueprint từ list → "Add to Queue"
- Worker xử lý blueprint queue tự động: craft liên tục đến khi hết quantity hoặc hết nguyên liệu
- Nếu giữa chừng hết nguyên liệu → pause blueprint task, skip sang task tiếp theo trong queue

### 6.4 Giới hạn

| Workshop Level | Blueprint Slots |
|---------------|----------------|
| 1 | 3 |
| 2 | 5 |
| 3 | 8 |
| 4 | 12 |
| 5 | 15 |

---

## 7. Repair

- **Queue:** Sequential, mỗi item xử lý tuần tự
- **Input:** Stone hoặc Wood tùy material gốc của item, lượng tùy % damage
- **Time:** 1-3 phút tùy damage level
- **Output:** Item phục hồi full durability (no-fail, luôn thành công)
- **No "rush" option** — thống nhất với no-fail philosophy, repair là tác vụ guaranteed

---

## 8. Dismantle

- **Instant action** — không cần queue
- **Recovery rate:**
  - Basic item (không essence): 70-80% materials
  - Crafted item (có essence): 50-60% materials (value đã extracted vào stats)
- **Essence recovery:** 30% chance nhận lại 1 essence khi dismantle crafted item
- **Gem recovery:** Không — gem bound vào item khi craft

---

## 9. MVP Scope (Phase 1)

Chỉ implement đủ để test crafting flow:

**Included:**
- [ ] Blank weapon từ Stone (Stone Blank)
- [ ] Blank weapon từ Wood (Wood Blank)
- [ ] Slime Essence → Slot 1: HP 50-200
- [ ] Worker queue: 1 worker = 1 task
- [ ] Blueprint: save + batch craft (giới hạn 3 slots)
- [ ] Repair (basic, no-fail, timed)
- [ ] Dismantle (instant, basic recovery)

**Excluded (future phases):**
- Slot 3-4 system
- Gem Elemental Slot + UI effects
- All essences ngoài Slime Essence
- Affinity Resonance + Masterwork Blueprint
- Workshop Lvl 2-5 unlocks
- Trading/Market integration

---

## 10. Future Phases

| Phase | Feature |
|-------|---------|
| Combat Phase | Tune tất cả stat values, define gem combat effects |
| Essence Phase | Map 10-12 essences → affinities cho 6 monster types |
| Gem Phase | Elemental slot UI effects, gem mining integration |
| Late Game | Slot 3-4, Affinity Resonance, Masterwork Blueprint |
| Social Phase | Trading/Market system |

---

## Unresolved Questions

1. **Worker assignment UI** — người chơi assign worker vào Workshop như thế nào? Drag-and-drop hay button?
2. **Queue persistence khi đóng app** — queue state save vào save file không?
3. **Max items trong inventory từ Workshop** — cần giới hạn không hay auto-transfer?
