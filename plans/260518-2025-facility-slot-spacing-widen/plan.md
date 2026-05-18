---
name: facility-slot-spacing-widen
status: completed
created: 2026-05-18
completed: 2026-05-18
branch: feature/wc-tavern
scope: single-constant change + visual verify
mode: fast (trivial scope)
blockedBy: []
blocks: []
progress: 1/1 phases (build pass, code review PASS, awaiting visual verify in `npm run dev`)
---

# Plan: Giãn khoảng cách facility slots (Bát Quái layout)

## Goal

Tăng spacing center-to-center của 12 facility slots từ **14u → 18u** (gap wall-to-wall: 7u → 11u, +57%). Giữ uniform tỷ lệ 1:2 (inner=18, outer=36). Camera framing per-facility KHÔNG đổi.

## Context

- File chính: [src/game/data/facility-slot-positions.ts](../../src/game/data/facility-slot-positions.ts)
- Hằng số `FACILITY_SLOTS` là single source of truth — toàn bộ consumer (rooms, particle bounds, room detection, WASD nav, panel auto-open, compass) đều derive từ đây.
- HALL center: `[5, 0, 3.5]` (constant trong `camera-slice.ts` — KHÔNG đổi)
- Room pad: 7×7 (constant trong `facility-room.tsx` — KHÔNG đổi)
- Per-slot camera offset (`FACILITY_SLOT_CAMERA_OFFSETS`): tinh chỉnh ±1.0/1.5u **relative** đến slot center → không cần đổi vì offset không phụ thuộc spacing.
- `CAM_OFFSET_DEFAULT = [8, 5.5, 8.5]`: cũng relative → camera framing per-facility giữ nguyên 1:1.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Spacing S=18, outer=2·S=36 (uniform scale) | Cân đối Bát Quái, gap +57% mà outer ring chỉ xa thêm 8u (28→36). |
| D2 | Chỉ sửa `FACILITY_SLOTS` array, KHÔNG đụng camera/floor/wall | Camera offset relative, build overlay dynamic bounds, room detection dùng `<=3.5` radius — tất cả tự scale. |
| D3 | KHÔNG sửa save migration | `placedSlot` là index 0..11 (không phải coords) — save data tự động đọc position mới. |
| D4 | Update doc comment trong file: spacing 14→18, "Inner cross: 18 units", "Outer cardinal: 36 units" | Comment phải khớp giá trị mới để LLM/dev đọc không bị nhầm. |

## Phase

- [Phase 01 — Update FACILITY_SLOTS positions + visual verify](./phase-01-update-slot-positions.md)

## Out of scope

- Đổi room pad size (giữ 7×7)
- Đổi camera default offset / per-slot offsets
- Đổi guild hall floor (10×7), walls, shadow frustum
- Đổi atmospheric particle bounds (auto-follow vì derive từ slot pos)
- Animation transition khi save load (positions chỉ là static const — không có migration)

## Risks

| Risk | Mitigation |
|------|------------|
| Outer slot xa hơn → WASD navigation cảm thấy "delay" | Camera lerp dùng exponential step (factor 0.08 at 60fps). Inner→outer khoảng cách tăng từ 14u→18u: thời gian arrive tăng ~14% (~0.05s) — không đáng kể. |
| Particle volume xa hơn → atmospheric particles xuất hiện ngoài viewport | `getRoomBounds` derive trực tiếp từ `FACILITY_SLOTS[i]` → particles bám theo slot mới. Không cần sửa. |
| Save data với `placedSlot` đã set trên layout cũ | Index 0..11 vẫn map đúng vị trí — chỉ là **slot 7** giờ ở [23,0,-14.5] thay vì [19,0,-10.5]. Player thấy room "trôi" ra ngoài — desired effect. |
| Build mode grid lines bị lệch | `BuildOverlay` dùng `getWorldBounds(floorTiles)` (dynamic, không liên quan slots) → không đổi. |

## Success Criteria

- [ ] Game build pass (`npm run build`)
- [ ] Run dev (`npm run dev`), navigate WASD qua 12 slot — mỗi slot vẫn frame đúng (camera khớp center pad 7×7).
- [ ] Compass arrows + room-nav-bar buttons vẫn đưa camera đến đúng vị trí.
- [ ] Inner ring (4 cardinal + 4 diagonal) cách HALL trông "thở" hơn rõ rệt (gap 11u vs 7u).
- [ ] Outer ring (4 far slots) không cảm giác bị isolated quá mức.
- [ ] Build mode grid + ghost preview vẫn đúng (xác minh bằng cách placeFurniture ở vài cell xa).
- [ ] Particle effects (logging-site, alchemy fog, quarry dust) vẫn bám đúng room.

## Next Steps (post-implementation)

- Nếu user feedback "vẫn gần quá" → bump S=20 (gap 13u). Đây là 1-character change.
- Nếu user feedback "outer quá xa" → giảm outer multiplier 2.0→1.8 (chỉ slot 4,6,8,10).
- Cân nhắc thêm pathway sprite/decal nối HALL ↔ slot inner để biến vùng gap thành "courtyard" thay vì khoảng trống thô.
