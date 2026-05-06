---
title: "Workshop Room v2 — Crafting / Enhance / Repair / Dismantle"
description: "Replace passive Workshop facility với hệ thống worker-queue: craft weapon/armor (no-fail, material affinity → stat slots), enhance (add slot / reroll), repair (timed, no-fail), dismantle (instant). Hỗ trợ blueprint batch + offline progression đầy đủ."
status: complete
priority: P1
effort: 16-20h
branch: feature/workshop-room-v2 (chưa tạo, hiện đang ở feature/combat-panel-idle)
tags: [gameplay, facility, workshop, crafting, equipment, offline-progression]
created: 2026-05-05
mvp_scope: phase-01..phase-07 (T1, Path A/B, Slime Drop only — đúng theo spec §8)
blockedBy: []
blocks: []
---

# Workshop Room v2

## Mục tiêu

Implement đầy đủ MVP scope tại [docs/feature/Room/workshop-room-v2.md §8](../../docs/feature/Room/workshop-room-v2.md):

- Craft T1 weapon từ Wood/Stone (Path A — 20% chance slot)
- Craft T1 weapon + Slime Gel (Path B — HP 50-200 guaranteed)
- Enhance: Add Slot + Reroll Value (T1, Slime category)
- Worker queue: 1 worker = 1 task song song, skip nếu thiếu mat
- Blueprint: save + batch craft (3 slots ở Workshop Lv1)
- Repair (no-fail, timed, đọc tier từ template)
- Dismantle (instant, recovery 70-80% / 50-60%)
- **Offline progression: queue chạy bình thường khi offline**

**Excluded (future phases — không làm trong plan này):**
- Path B+ (2 materials → 2 slots)
- Gem Elemental Slot
- Materials ngoài Slime Gel (Bat Wing, Spider Legs, Metal Plate, Drone Sensor, Slime King Core)
- Crafting Skill (XP, axes, knowledge unlock, masterwork)
- Workshop Lv 2-5 unlocks
- Trading/Market

## PX Goals (theo spec §0)

| Goal | Mechanic phục vụ trong MVP |
|------|---------------------------|
| **Agency** (Primary) | Path B chọn material → biết stat category. Reroll thấy current value + range trước khi quyết định. |
| **Mastery** | Material affinity table hiển thị rõ trong panel. Stat range theo tier minh bạch. |
| **Anticipation** | Blueprint queue → offline → quay lại xem kết quả. |

**Anti-goals (phải tránh):** Mất nguyên liệu khi offline. RNG hoàn toàn không có agency. Confusion về stat nào sẽ ra.

## Bối cảnh kỹ thuật (xem reports)

- `facilityProductionSystem` đã có pattern pure-function — workshop sẽ follow.
- Alchemy queue (`AlchemyCraftJob` trong `game-state.ts:75-82`) là model gần nhất, nhưng **thiếu** logic skip-on-missing-mat → workshop phải tự implement.
- `EquipmentItem` (`game-state.ts:8-14`) hiện chỉ `{id, templateId, durability}` — **chưa có affix system**. Phase 01 mở rộng schema để hỗ trợ stat slots.
- Offline progression (`offline-progression.ts:24-81`) hiện **không tick facility queues** — Phase 04 thêm hook.
- Workshop facility định nghĩa cũ (`facility-definitions.ts:57-66`) là "passive material producer" — sẽ được **viết lại** thành queue-driven crafting.
- Multi-instance facility (3 workshops max) đã hoạt động; reuse y nguyên.

## Phases

| # | File | Mô tả | Effort | Status |
|---|------|-------|--------|--------|
| 01 | [phase-01-data-model.md](phase-01-data-model.md) | Mở rộng `EquipmentItem` với stat slots, thêm material affinity data, định nghĩa workshop types (Task, Blueprint, Stat) | 3h | ✅ complete |
| 02 | [phase-02-workshop-systems.md](phase-02-workshop-systems.md) | Pure functions: craft (Path A/B), enhance (add/reroll), repair, dismantle. RNG helpers. Stat roll engine. | 4h | ✅ complete |
| 03 | [phase-03-state-and-save.md](phase-03-state-and-save.md) | Slice actions (`addWorkshopTask`, `tickWorkshopQueues`, `saveBlueprint`, `dismantleEquipment`), save migration v22→v23 | 3h | ✅ complete |
| 04 | [phase-04-offline-progression.md](phase-04-offline-progression.md) | Hook workshop queue vào `processOfflineTime()`, tick advance theo gameSecondsElapsed, cap protection | 2h | ✅ complete |
| 05 | [phase-05-panel-ui.md](phase-05-panel-ui.md) | `WorkshopPanel` shell + 4 tabs (Craft, Enhance, Repair, Dismantle) + queue display + worker assignment readout | 5h | ✅ complete |
| 06 | [phase-06-blueprint-ui.md](phase-06-blueprint-ui.md) | Blueprint save/list/edit/delete UI, batch quantity, queue dispatch | 2h | ✅ complete |
| 07 | [phase-07-tests-and-polish.md](phase-07-tests-and-polish.md) | Unit tests systems + save migration + E2E flow, copy review, i18n | 1-2h | ✅ complete |

## Critical decisions (locked-in giả định cho plan)

1. **Stat affix system mới**, mở rộng từ `EquipmentItem`. Không dùng template hardcode → mỗi craft tạo instance unique.
2. **Workshop facility re-purposed**: bỏ field `description` cũ ("Produces materials daily"), không động `assignedMemberIds` semantics — vẫn dùng pattern `assignMemberToFacility`. Worker count = `assignedMemberIds.length` quyết định parallelism.
3. **Crafting time** giảm xuống cho dev experience: T1 base **30s** đúng spec §4.3; tốc độ Lv1 = **1.0x**, không scale theo Workshop level trong MVP.
4. **Offline tick**: workshop queue advance theo `gameSecondsElapsed` đã cap 30 ngày sẵn. Không cần cap riêng.
5. **Reroll: không có floor** — đúng spec §4.6 "informed risk". Player thấy current value + range trước khi confirm.
6. **Material affinity (MVP)**: chỉ Slime Gel → Tanky (HP 50-200). Bảng đầy đủ stub trong code nhưng disabled cho non-Slime materials.
7. **Stat range theo tier** dùng "common slot" pool tier T1 trong spec workshop v1 §1.1.3.4 làm baseline cho Slime → HP 50-200 (đã match spec v2).
8. **Branch strategy**: tạo branch mới `feature/workshop-room-v2` nhánh từ `develop` (KHÔNG nhánh từ `feature/combat-panel-idle` đang dở). Confirm với user trước khi push.

## Cross-plan dependencies

| Plan | Quan hệ | Note |
|------|---------|------|
| `260429-2255-facilities-panel-redesign` (in-progress) | **soft dep** — ko block plan này | Phase 05 sẽ thêm "Enter Workshop" button vào `FacilityDetailTray`. Nếu redesign chưa xong, target file là `facility-detail-tray.tsx` (đã có sẵn theo plan đó) — đợi merge trước khi rebase Phase 05 commit. |
| `260430-0725-multi-instance-facilities` (completed) | reuse | Multi-instance đã hoạt động → 3 workshops độc lập, mỗi cái có queue/blueprint riêng (per-facility-id). |

## Success Criteria (rút gọn từ MVP scope)

- [ ] Build & assign worker vào Workshop → có 1 task chạy song song
- [ ] Craft T1 wood → weapon instance vào inventory, có 20% slot xuất hiện
- [ ] Craft T1 stone + 1 Slime Gel → weapon có 1 slot HP+50..200
- [ ] Enhance Add Slot → slot mới, value trong range
- [ ] Enhance Reroll → có thể ra value thấp hơn (random full range)
- [ ] Save Blueprint "HP Sword 5x" → reload session vẫn còn → Add to Queue → 5 craft chạy tuần tự
- [ ] Đóng app 10 phút → mở lại → queue đã advance đúng số task hoàn thành
- [ ] Repair item durability < max → sau ~1-3 phút → full durability
- [ ] Dismantle Plain weapon → 70-80% wood/stone trả lại; Crafted weapon → 50-60% + 30% chance recover material
- [ ] TypeScript compile clean, tất cả test pass
- [ ] Save migration v22 → v23 round-trip không mất dữ liệu cũ

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Stat affix schema vỡ với equipment cũ trong save | Migration `v22→v23` set `slots: []` cho equipment cũ; combat code đọc slots an toàn (default empty array). |
| Offline queue chạy quá xa khiến gold/inventory overflow | Reuse cap 30 ngày của `processOfflineTime`. Mỗi craft cap log report → notification dùng count chứ không list. |
| Skip-on-missing-mat infinite loop | Mỗi tick chỉ skip TỐI ĐA 1 lần per worker, lần sau queue head pause. |
| Reroll RNG seeding không deterministic test | Inject `rng()` factory vào pure functions (test pass `() => 0.5`). |
| Combat code panic khi đọc slot stats chưa định nghĩa | Phase 02 limit slot stat type chỉ `'HP'` cho MVP. Combat-passives đọc generic flat HP đã hoạt động. |
| `feature/combat-panel-idle` branch hiện tại đang dở → conflict | Tạo branch mới từ `develop`, KHÔNG cherry-pick combat work. |

## Unresolved Questions (theo spec §10)

1. **Worker assignment UI** — drag-drop hay button? → Plan dùng pattern `assignMemberToFacility` hiện tại (button trong FacilityDetailTray). Có thể clarify sau.
2. **Queue persistence** — có. Save vào IndexedDB qua save-migration v23.
3. **Inventory cap khi craft đầy** — Phase 03 reject task → notification "Inventory full". Không auto-transfer.
4. **Reroll confirmation UI** — Phase 05 hiện current + new value qua modal "Confirm Reroll?".
5. **Stat range display** — tooltip trên material trong panel (Phase 05). Codex riêng future phase.
