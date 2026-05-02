# Alchemy Lab — Game Mechanics Reference

## Tổng quan

Alchemy Lab là cơ sở sản xuất cho phép guild chế tạo Healing Syringe từ Slime Gel. Thành viên được giao phòng sẽ tự động sản xuất mỗi ngày, đồng thời nâng cấp kỹ năng Alchemy Craft (AC) theo thời gian.

**Nguyên liệu:** SLIME_GEL (Common, 5g/unit)  
**Sản phẩm:** HEALING_SYRINGE (Common, 12g/unit — hồi 30% HP tối đa)  
**Primary Stats:** INT + DEX

---

## Cấu trúc Facility

| Level | Chi phí | Member Slots | Mở khóa |
|-------|---------|-------------|---------|
| 0 | — | — | Chưa xây |
| 1 | 400g | 1 | Recipe healing-syringe |
| 2 | +500g | 2 | (Design: thêm recipe mới) |
| 3 | +800g | 3 | (Design: Tier 3 recipes) |

**Tile footprint:** 3×3  
**Zone position:** [5, 0, 5]

---

## Alchemy Craft Skill (AC)

Kỹ năng của từng thành viên, tính theo **tổng syringes đã craft** (XP proxy).

### Level Thresholds

| AC Level | Syringes tích lũy | Hiệu ứng |
|----------|-------------------|---------|
| 0 | 0 | Khởi điểm |
| 1 | 10 | — |
| 2 | 25 | — |
| 3 | 50 | (Design: giảm ingredient cost) |
| 4 | 100 | — |
| 5 | 200 | (Design: 15% chance double batch) |
| 6 | 400 | — |
| 7 | 700 | — |
| 8 | 1,100 | (Design: Tier 3 ingredient cost reduction) |
| 9 | 1,700 | — |
| 10 | 2,500 | (Design: 10% chance craft Grand Elixir từ Tier 3) |

> **Lưu ý:** Các hiệu ứng lv3/5/8/10 được định nghĩa trong design doc nhưng **chưa implement** trong code hiện tại.

---

## Production Formula (Auto-Production)

### Batches Per Day

```
batchesPerDay = max(1, floor(INT × 0.08 + DEX × 0.04 + facilityLevel + 1))
```

### Ingredient Cost Per Batch

```
gelsPerBatch = acLevel + 1
syringesProduced = gelsPerBatch   (1 gel → 1 syringe)
```

### Daily Production Flow

1. Mỗi thành viên được giao tính `batchesPerDay` từ INT, DEX, facility level
2. Tính `gelsPerBatch = acLevel + 1`
3. Cap bởi lượng SLIME_GEL khả dụng: `floor(remainingGel / gelsPerBatch)`
4. Kết quả: `batchesDone × gelsPerBatch` syringes sản xuất
5. AC XP của thành viên tăng: `newXp = acXp + syringesProduced`
6. Thành viên bị block nếu không đủ SLIME_GEL

### Ví dụ Tham Khảo

| INT / DEX | AC Level | Facility Lv | Batches/Day | Syringes/Day |
|-----------|----------|------------|-------------|-------------|
| 10 / 10 | 0 | 1 | 3 | 3 |
| 15 / 15 | 3 | 2 | 7 | 28 |
| 20 / 20 | 7 | 3 | 12 | 96 |
| 25 / 20 | 10 | 3 | 14 | 154 |

> Syringes/Day = batches × gelsPerBatch (= acLevel + 1)

---

## Active Crafting Queue (Thủ công)

Player có thể craft thủ công thông qua Craft Panel UI bên cạnh auto-production.

### Craft Time Calculation

```
secondsPerUnit = max(15, round(120 / batchesPerDay))
totalSeconds = qty × secondsPerUnit
```

Dùng `batchesPerDay` tính từ **max INT** và **max DEX** của các thành viên được giao.

### Craft Job Structure

```typescript
interface AlchemyCraftJob {
  id: string;            // "craft-{timestamp}"
  recipeId: string;
  outputItemId: string;
  outputQuantity: number;
  remainingSeconds: number;
  totalSeconds: number;
}
```

Queue được tick mỗi giây. Khi `remainingSeconds <= 0` → thêm item vào inventory, xóa job.

---

## Recipe System

### Công thức hiện tại (MVP)

| Recipe ID | Input | Output | Yêu cầu AC |
|-----------|-------|--------|-----------|
| `healing-syringe` | 1× SLIME_GEL | 1× HEALING_SYRINGE | Lv 0 |

### Recipe Matching Algorithm

1. Scan tất cả recipes tuần tự
2. Filter theo AC level requirement
3. Kiểm tra số lượng ingredients trong slot khớp chính xác
4. Verify tất cả required items có trong filled slots
5. Trả về match đầu tiên hoặc `null`

---

## Crafting UI (AlchemyCraftPanel)

### Layout

- **Trái:** Inventory grid (5 cột, item 50px) — kéo thả theo độ hiếm màu viền
- **Phải:** Ingredient slots + output preview + quantity input + nút Craft/Cancel

### Số Slot Hiển Thị

```
maxAcLevel = max(AC của các thành viên được giao)
visibleSlots = min(4, maxAcLevel + 1)
```

| AC Level | Slots visible |
|----------|--------------|
| 0 | 1 |
| 1 | 2 |
| 2 | 3 |
| ≥3 | 4 |

Slot bị khóa hiển thị tooltip "Lv.{i+1}".

### Craft Flow

1. Player kéo ingredient vào slot
2. `matchRecipe()` kiểm tra tự động
3. Output item hiển thị nếu recipe khớp
4. Nút Craft active khi: recipe tồn tại + đủ quantity trong inventory
5. Khi craft: tiêu nguyên liệu ngay + thêm job vào `craftQueue`

---

## Syringe Loadout (Auto-Use trong combat)

Mỗi thành viên có thể cấu hình ngưỡng HP để tự động dùng syringe:

```typescript
interface SyringeLoadout {
  autoUseThresholdPct: number;  // 0–1, mặc định 0.30
}
```

- Khi HP < threshold → tự dùng 1 HEALING_SYRINGE → hồi 30% maxHP
- Player set qua `setSyringeLoadout(memberId, loadout)`

> **Trạng thái hiện tại:** Cấu trúc dữ liệu đã sẵn sàng nhưng **combat auto-trigger chưa implement**.

---

## Offline Production Report

Khi apply production result:

```typescript
{
  facilityType: 'alchemy-lab',
  itemGains: { HEALING_SYRINGE: N },
  itemConsumed: { SLIME_GEL: N },
  alchemyXpGains: {
    [memberId]: { newXp: N, newLevel: N }
  }
}
```

---

## 3D Room

| Component | File |
|-----------|------|
| Walls | `facility-room-alchemy-walls.tsx` |
| Wall decorations (copper pipes) | `facility-room-alchemy-wall-decor.tsx` |
| Furniture | `facility-room-alchemy-decor.tsx` |

**Furniture models:** alchemy-table.glb, alchemy_workbend.glb, alchemy_reactor.glb, alchemy_shelf.glb, alchemy_silo.glb  
**Wall decor:** Mạng ống đồng (copper pipe network) dùng PBR metallic material (metalness 0.75–0.8, roughness 0.25–0.3)

---

## Implementation Status

| Mechanic | Status |
|----------|--------|
| AC Skill (0–10) | ✅ Implemented |
| Healing Syringe recipe | ✅ Implemented |
| Auto-production formula | ✅ Implemented |
| Active craft queue | ✅ Implemented |
| Craft Panel UI | ✅ Implemented |
| 3D room rendering | ✅ Implemented |
| Syringe Loadout config | ✅ Implemented |
| AC Lv yield bonuses | ❌ Design only |
| Double batch (Lv5 15%) | ❌ Design only |
| Grand Elixir (Lv10 10%) | ❌ Design only |
| Ingredient cost reduction (Lv3, Lv8) | ❌ Design only |
| Buff potions (Tier 2–3 recipes) | ❌ Design only |
| Combat auto-use trigger | ❌ Not implemented |

---

## Source Files

| File | Mục đích |
|------|----------|
| `src/game/data/alchemy-recipes.ts` | Recipe definitions |
| `src/game/systems/alchemy-production-system.ts` | Auto-production logic |
| `src/game/data/facility-definitions.ts` | ALCHEMY_CONFIG, facility spec |
| `src/game/state/game-state.ts` | Types: AlchemySkill, AlchemyCraftJob, SyringeLoadout |
| `src/game/state/guild-slice.ts` | State actions: apply production, craft queue |
| `src/ui/panels/alchemy-craft-panel.tsx` | Crafting UI |
| `src/scene/facility-room-alchemy-walls.tsx` | 3D walls |
| `src/scene/facility-room-alchemy-wall-decor.tsx` | Copper pipe decor |
| `src/scene/facility-room-alchemy-decor.tsx` | Furniture placement |
| `src/game/systems/facility-production-system.ts` | Integration point |

**Design Reference:** `plans/reports/game-design-260417-2156-alchemy-lab-facility.md`
