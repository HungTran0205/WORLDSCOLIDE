# Phase 01 — Update FACILITY_SLOTS positions + visual verify

**Status:** Ready
**Priority:** High (UX polish)
**Effort:** ~10 min code change + ~15 min manual verify
**Plan:** [../plan.md](../plan.md)

## Context Links

- File chính: [src/game/data/facility-slot-positions.ts](../../../src/game/data/facility-slot-positions.ts)
- Consumer list (đã verify — chỉ đọc, không cần sửa):
  - [src/scene/world.tsx:121](../../../src/scene/world.tsx#L121) — alchemy ambient gate
  - [src/scene/facility/facility-room.tsx:162](../../../src/scene/facility/facility-room.tsx#L162) — room render
  - [src/scene/facility/facility-slot-debug-panel.tsx:30](../../../src/scene/facility/facility-slot-debug-panel.tsx#L30) — debug picker
  - [src/scene/atmospheric/use-active-room-id.ts:33](../../../src/scene/atmospheric/use-active-room-id.ts#L33) — atmosphere swap
  - [src/scene/atmospheric/particles/particle-bounds.ts:52](../../../src/scene/atmospheric/particles/particle-bounds.ts#L52) — particle volumes
  - [src/ui/screens/game-screen.tsx:70,122,128,134](../../../src/ui/screens/game-screen.tsx#L70) — WASD nav + auto-open panel
  - [src/ui/components/facility-detail-tray.tsx:94](../../../src/ui/components/facility-detail-tray.tsx#L94) — tray jump
  - [src/ui/hud/facility-compass.tsx:68](../../../src/ui/hud/facility-compass.tsx#L68) — compass
  - [src/ui/hud/room-nav-bar.tsx:84](../../../src/ui/hud/room-nav-bar.tsx#L84) — nav bar
  - [src/ui/panels/facilities-panel.tsx:150](../../../src/ui/panels/facilities-panel.tsx#L150) — panel grid

## Math

```
HALL center: [5, 0, 3.5]
S = 18 (new spacing center-to-center)
outer = 2·S = 36
```

| Idx | Name          | Old position        | New position        | Δ                |
|-----|---------------|---------------------|---------------------|------------------|
| 0   | N inner       | `[5, 0, -10.5]`     | `[5, 0, -14.5]`     | z: -4            |
| 1   | E inner       | `[19, 0, 3.5]`      | `[23, 0, 3.5]`      | x: +4            |
| 2   | S inner       | `[5, 0, 17.5]`      | `[5, 0, 21.5]`      | z: +4            |
| 3   | W inner       | `[-9, 0, 3.5]`      | `[-13, 0, 3.5]`     | x: -4            |
| 4   | W far         | `[-23, 0, 3.5]`     | `[-31, 0, 3.5]`     | x: -8            |
| 5   | NW            | `[-9, 0, -10.5]`    | `[-13, 0, -14.5]`   | x: -4, z: -4     |
| 6   | N far         | `[5, 0, -24.5]`     | `[5, 0, -32.5]`     | z: -8            |
| 7   | NE            | `[19, 0, -10.5]`    | `[23, 0, -14.5]`    | x: +4, z: -4     |
| 8   | E far         | `[33, 0, 3.5]`      | `[41, 0, 3.5]`      | x: +8            |
| 9   | SE            | `[19, 0, 17.5]`     | `[23, 0, 21.5]`     | x: +4, z: +4     |
| 10  | S far         | `[5, 0, 31.5]`      | `[5, 0, 39.5]`      | z: +8            |
| 11  | SW            | `[-9, 0, 17.5]`     | `[-13, 0, 21.5]`    | x: -4, z: +4     |

## Implementation Steps

### Step 1 — Update `FACILITY_SLOTS` array

File: `src/game/data/facility-slot-positions.ts`

Replace the array `FACILITY_SLOTS` (lines 12–25) with new values from the table above.

```ts
export const FACILITY_SLOTS: [number, number, number][] = [
  [5,   0, -14.5],  // slot 0  — North inner
  [23,  0,   3.5],  // slot 1  — East inner
  [5,   0,  21.5],  // slot 2  — South inner
  [-13, 0,   3.5],  // slot 3  — West inner
  [-31, 0,   3.5],  // slot 4  — West far
  [-13, 0, -14.5],  // slot 5  — Northwest
  [5,   0, -32.5],  // slot 6  — North far
  [23,  0, -14.5],  // slot 7  — Northeast
  [41,  0,   3.5],  // slot 8  — East far
  [23,  0,  21.5],  // slot 9  — Southeast
  [5,   0,  39.5],  // slot 10 — South far
  [-13, 0,  21.5],  // slot 11 — Southwest
];
```

### Step 2 — Update doc comment

File header (lines 1–11). Replace `Spacing = 14 units` → `Spacing = 18 units`, `14 units N/E/S/W` → `18 units N/E/S/W`, `28 units` → `36 units`.

```ts
/**
 * 12 placement slots in a Bát Quái (八卦) radial layout around the guild hall.
 * Each slot is a 7×7 building pad. Center (HALL) at [5, 0, 3.5]. Spacing = 18 units.
 *
 * Inner cross  (slots 0–3):  18 units N/E/S/W from center.
 * Diagonal     (slots 5,7,9,11): 18 units on each axis.
 * Outer cardinal (slots 4,6,8,10): 36 units N/E/S/W from center.
 *
 * Slot map (image 1–12 → index 0–11):
 *   0=N, 1=E, 2=S, 3=W, 4=W-far, 5=NW, 6=N-far, 7=NE, 8=E-far, 9=SE, 10=S-far, 11=SW
 */
```

### Step 3 — Compile check

```bash
npm run build
```

Expect: no TS errors. `FACILITY_SLOTS` type signature unchanged → tất cả consumer typecheck pass.

### Step 4 — Dev server visual verify

```bash
npm run dev
```

Manual checklist:

1. **Camera framing per facility** — Mở từng facility qua compass (12 slot nếu đã unlock; nếu không, ít nhất kiểm tra tavern/training-yard/infirmary/workshop/logging-site/quarry):
   - Pad 7×7 nằm trọn trong khung hình
   - Wall facing camera không bị cắt
   - Furniture/decor không bị lệch khỏi viewport

2. **WASD navigation** — Đứng ở HALL, nhấn W/S/A/D:
   - W → đến slot 0 (N inner) → vị trí mới `[5,0,-14.5]`
   - A → đến slot 3 (W inner) → vị trí mới `[-13,0,3.5]`
   - Tiếp tục từ slot 0 nhấn W → slot 6 (N far) → vị trí `[5,0,-32.5]`
   - Camera lerp mượt, không jerky.

3. **Room auto-open panel** — Navigate vào tavern/workshop/alchemy:
   - Panel tự mở khi camera settle (dùng `<=3.5` radius detection, không phụ thuộc spacing).
   - Đóng panel, navigate ra: panel đóng đúng lúc.

4. **Build mode** — Mở build mode (B key hoặc nút):
   - Grid lines render quanh guild hall floor (10×7) — không bị lệch.
   - Place furniture ở 1-2 cell xa → ghost preview valid.

5. **Atmospheric / particles** — Tới logging-site:
   - Sương/lá rơi xuất hiện trong room (7×7 quanh slot mới).
   - Không có particle ra ngoài room boundary.

6. **Facility compass + nav bar** — Click từng nút:
   - Camera nhảy đúng slot.
   - Active state highlight đúng facility hiện tại.

### Step 5 — (Optional) Capture before/after screenshot

Nếu user muốn so sánh: trước khi sửa, chụp 1 ảnh isometric overview từ camera Hall. Sau khi sửa, chụp lại cùng góc. Lưu vào `plans/260518-2025-facility-slot-spacing-widen/visuals/`.

## Todo

- [x] Update `FACILITY_SLOTS` array (Step 1)
- [x] Update doc comment header (Step 2)
- [x] `npm run build` pass (Step 3) — built in 7.42s, 0 errors
- [x] Code review (code-reviewer agent) — 12/12 math PASS, 0 consumer breaks, ship as-is
- [ ] Manual visual verify all 6 checks pass (Step 4) — pending user run `npm run dev`
- [ ] Commit: `feat(facility): widen Bát Quái slot spacing 14→18 (gap 7→11)`

## Success Criteria

- Build pass, no TS errors.
- All 6 visual checks pass.
- Subjective: facility ring "thở" hơn rõ rệt vs trước.

## Risk / Rollback

- **Risk:** Subjective feel — nếu thấy outer slot xa quá hoặc inner vẫn gần quá → bump S (e.g. 16 hoặc 20).
- **Rollback:** Git revert single commit. Zero side-effect (slot index không đổi, save data không corrupt).

## Open Questions

(none — math + scope đã chốt với user)
