# Stone Quarry Feature

Branch: `feature/WC-STONEQUARY`

---

## Overview

Stone Quarry là facility sản xuất stone vô hạn (không có reserve cạn kiệt như Logging Site).
Miners tích lũy MC (Mining Craft) skill XP qua mỗi tick, mở khóa yield bonus và vein strike chance cao hơn.
Vein strikes cho bonus item ngẫu nhiên (Iron Ore, Rich Stone Pocket, Gem).

**Cần:** `guildLevel >= 2`, build cost 250g.

---

## Files

| File | Vai trò |
|------|---------|
| `src/game/data/facility-definitions.ts` | `STONE_QUARRY_CONFIG` + `FacilityDef` entry |
| `src/game/systems/stone-quarry-production-system.ts` | Pure function production logic |
| `src/game/state/guild-slice.ts` | `applyStoneQuarryProduction` action |
| `src/ui/hooks/use-game-tick-loop.ts` | Gọi processStoneQuarryTick mỗi tick |
| `src/scene/facility-room-quarry-decor.tsx` | `QuarryRoomDecor` + `QuarryZoneCard` |
| `src/scene/facility-room.tsx` | Render `QuarryZoneCard` khi camera settled |
| `src/game/state/game-state.ts` | `MiningSkill`, `CraftSkills` types |
| `src/game/save/save-migrations.ts` | v15→v16: add mining skill to all members |
| `src/game/data/items.ts` | `STONE`, `IRON_ORE`, `GEM` item definitions |

---

## Config (`STONE_QUARRY_CONFIG`)

```ts
baseRate: 0.002315          // stone/tick per (STR×0.5)/100
levelMult: [1.0, 2.0, 3.5] // lv1/lv2/lv3 production multiplier
ticksPerDay: 86_400
```

**Calibration:** STR 20 → baseScore=10 → `0.002315 × 0.1 × 86400 ≈ 20 stone/day` tại lv1, MC0.

### Facility Definition

```ts
buildCost: 250g
upgradeCosts: [300g, 500g]
maxSlots: [1, 2, 3]        // miners per level
primaryStats: 'STR + LCK'
defaultSlot: 10            // FACILITY_SLOTS[10] = [13.5, 0, -32.5]
```

---

## Production System

**File:** `src/game/systems/stone-quarry-production-system.ts`

### Per-tick formula (per miner)

```
baseScore  = STR × 0.5
mcLevel    = calcMcLevel(craftSkills.mining.xpAccumulated)
yieldMult  = 1 + mcSkillYieldPct[mcLevel] / 100
stoneThisTick = baseRate × (baseScore / 100) × levelMult × yieldMult
```

### Vein Strike

Mỗi tick roll xác suất (daily chance ÷ ticksPerDay):

```
dailyStrikeChance =
  baseStrikeChancePerDay (0.01)
  + mcSkillStrikePct[mcLevel]
  + fortune × fortuneStrikeScale (0.0002)
  + levelStrikeBonus[level-1]

fortune = LCK × 3 + CHA × 0.5
```

| Roll | Vein type | Loot |
|------|-----------|------|
| < 0.65 | Iron Vein | 2–4 IRON_ORE |
| 0.65–0.90 | Rich Stone Pocket | +10–20 STONE (bonus lên stoneForMember) |
| > 0.90 | Gem Vein | +1 GEM |

### MC Skill XP

XP = stone produced (base tick only, không tính vein bonus).
Level tính bằng `calcMcLevel(xpAccumulated)` — scan thresholds từ cao xuống thấp.

| Level | XP threshold (cumulative stone) | Yield bonus | Daily strike bonus |
|-------|-------------------------------|-------------|-------------------|
| 0 | 0 | +0% | +0 |
| 1 | 100 | +8% | +0.003 |
| 2 | 250 | +18% | +0.006 |
| 3 | 563 | +32% | +0.01 |
| 4 | 1,063 | +50% | +0.015 |
| 5 | 1,875 | +72% | +0.02 |
| 6 | 3,125 | +98% | +0.025 |
| 7 | 5,000 | +128% | +0.03 |
| 8 | 7,500 | +162% | +0.035 |
| 9 | 11,250 | +200% | +0.04 |
| 10 | 16,250 | +245% | +0.05 |

Level strike bonus thêm vào theo facility level: `[0, +0.015, +0.035]`.

---

## State & Actions

### Types (`game-state.ts`)

```ts
interface MiningSkill {
  level: number;         // 0–10
  xpAccumulated: number; // total stone mined
}

interface CraftSkills {
  woodcutting: WoodcuttingSkill;
  mining: MiningSkill;   // thêm trong v16
}
```

`craftSkills` optional trên `Member` — old saves migrate qua v15→v16.

### `applyStoneQuarryProduction(result)` (`guild-slice.ts`)

Nhận `StoneQuarryTickResult`, cập nhật `craftSkills.mining` cho từng member trong `mcXpGains`.
Stone và bonus items được add riêng bởi `use-game-tick-loop` qua `addItem`.

### Tick Loop (`use-game-tick-loop.ts`)

```ts
// 1s cadence
const quarryResult = processStoneQuarryTick(store.facilities, allMembersForTick);
if (quarryResult.stoneProduced > 0 || quarryResult.mcXpGains.length > 0) {
  store.applyStoneQuarryProduction(quarryResult);
  store.addItem('STONE', quarryResult.stoneProduced);
  for (const [itemId, qty] of Object.entries(quarryResult.bonusItemGains)) {
    store.addItem(itemId, qty);
  }
}
```

---

## Items

| ID | Name | Rarity | Base Price | Source |
|----|------|--------|------------|--------|
| `STONE` | Rough Stone | COMMON | 3g | Normal mining |
| `IRON_ORE` | Iron Ore | UNCOMMON | 8g | Vein strike (65%) |
| `GEM` | Gemstone | RARE | 50g | Vein strike (10%) |

---

## Scene Components

### `QuarryRoomDecor` (`facility-room-quarry-decor.tsx`)

Cave prop layout trong 7×7 room (cx, cz = room center):

| Prop GLB | Position | Height | Notes |
|----------|----------|--------|-------|
| `p_stonepilla.glb` | cx-2.6, cz-2.5 | 3.5 | Back-left pillar cluster |
| `p_stonepilla.glb` | cx+2.5, cz-2.4 | 2.8 | Back-right pillar |
| `p_stonepilla.glb` | cx-2.4, cz+0.5 | 1.8 | Mid-left smaller pillar |
| `p_stone_pillar_falling.glb` | cx+0.6, cz-1.8 | 1.0 | Fallen pillar mid-back |
| `p_standing_torch.glb` | cx-2.8, cz-0.5 | 1.6 | Left torch |
| `p_standing_torch.glb` | cx+2.8, cz-0.5 | 1.6 | Right torch |

GLBs từ `/arena/cave/3dprops/`, preload khi module load.

### `QuarryZoneCard` (`facility-room-quarry-decor.tsx`)

Hiển thị: facility level, số miners, ước tính stone/day.
Render vị trí: `[cx - 6.5, 1, cz + 0.5]` (in `facility-room.tsx`).

**Bug đã fix:** Selector ban đầu `useGameStore((s) => [...founder, ...roster])` tạo array mới mỗi render → infinite loop. Fix: tách thành 2 selector riêng (`founder`, `roster`).

**Bug đã fix:** Position `[cx-6.5, 1, oz+0.8]` = `cz-2.7` (gần back wall) → project lên quá cao màn hình 1280×720. Fix: đổi thành `cz+0.5`.

### Điều kiện render (`facility-room.tsx`)

```tsx
isActive && cameraSettled && isQuarry
```

- `isActive`: camera target trùng với room center
- `cameraSettled`: camera đã lerp xong (không còn mid-animation)
- User phải click nav bar button "Stone Quarry" để trigger

Room colors: floor `#2a2a2a`, wall `#252525`, point light `#aaaacc` intensity 5.

---

## Save Migration

### v11→v12
Add `stone-quarry` facility entry (level 0) nếu chưa có trong save cũ.

### v15→v16
Thêm `craftSkills.mining = { level: 0, xpAccumulated: 0 }` cho mọi member (founder, roster, tavern mercenaries) trong save cũ chưa có mining skill.

---

## Khác biệt với Logging Site

| | Logging Site | Stone Quarry |
|-|-------------|--------------|
| Reserve | Có (1000 wood, cạn kiệt) | Không (vô hạn) |
| Primary stat | STR + WC Skill | STR + LCK |
| Skill XP | WC (woodcutting) | MC (mining) |
| XP proxy | Wood harvested | Stone mined |
| Thresholds | 25% dễ hơn MC | Harder |
| Bonus items | Không | Iron Ore, Gem (vein strike) |
| Build cost | 0g (permit only) | 250g |
| Upgrade path | Không | Có (lv2: 300g, lv3: 500g) |
