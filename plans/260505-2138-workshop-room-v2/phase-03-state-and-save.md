# Phase 03 — State Slice + Save Migration

## Context Links

- Spec: [workshop-room-v2.md §2 Worker Queue, §5 Blueprint](../../docs/feature/Room/workshop-room-v2.md)
- Existing slice: `src/game/state/guild-slice.ts:516-772` (assignMember, tickAlchemyQueues)
- Save: `src/game/save/save-types.ts`, `save-migrations.ts`

## Overview

| | |
|---|---|
| Priority | P1 |
| Effort | 3h |
| Status | complete |

Wire pure systems vào Zustand store. Quản lý queue (parallel theo worker count, skip-on-missing-mat). Save migration v22→v23.

## Key Insights

- **Skip-on-missing-mat** = scheduler logic, không phải systems. Mỗi tick, mỗi worker:
  1. Đọc `workshopQueue[0]`. Nếu task đó đang in-progress → tick down `remainingSeconds`.
  2. Nếu task chờ → check material → nếu OK consume + start; nếu thiếu → **rotate task xuống cuối** (skip), pick task tiếp theo.
  3. Khi task xong → apply systems result → splice ra khỏi queue.
- **Worker count = parallelism**: 1 worker → 1 task active. 3 workers → 3 task active đồng thời. Implement bằng cách track `task.startedAt: number | null` — null = chưa start, !null = đang in-progress.
- **Blueprint queue**: khi user chọn "Add to Queue" với blueprint quantity=5 → tạo 5 individual `WorkshopTask` với `blueprintId` reference.
- **Save migration v22→v23**: equipment cũ thêm `slots: []`, facility cũ workshopQueue=[], workshopBlueprints=[].

## Requirements

### Functional

- [ ] Slice action `addWorkshopTask(facilityId, payload)` — validate input + append.
- [ ] Slice action `tickWorkshopQueues()` — chạy mỗi second từ game-loop worker.
- [ ] Slice action `cancelWorkshopTask(facilityId, taskId)` — refund mat đã consume nếu chưa start.
- [ ] Slice action `saveBlueprint(facilityId, blueprint)` / `deleteBlueprint(facilityId, blueprintId)`.
- [ ] Slice action `enqueueBlueprint(facilityId, blueprintId, qty)` — generate N tasks.
- [ ] Slice action `dismantleEquipment(equipmentInstanceId)` — instant action.
- [ ] Save migration v22→v23 cộng `slots`/`workshopQueue`/`workshopBlueprints`.
- [ ] Blueprint slot limit = 3 ở Lv1 (theo `WORKSHOP_CONFIG.blueprintSlotsByLevel`).

### Non-functional

- Slice file `guild-slice.ts` đã ~800 LOC → **modularize**: tạo `src/game/state/workshop-slice.ts` (NEW) hoặc tách helpers vào `src/game/state/workshop-actions.ts`.
- Decision: Workshop queue thuộc `GuildFacility`, nhưng actions tách thành file riêng `src/game/state/guild-slice-workshop.ts` (extension pattern), import vào `guild-slice.ts`.

## Architecture

```
src/game/state/
├── guild-slice.ts                    ← MODIFY (delegate workshop actions)
├── guild-slice-workshop.ts           ← NEW (workshop actions)
└── game-state.ts                     ← Phase 01 đã extend

src/game/save/
├── save-types.ts                     ← bump SAVE_VERSION = 23
├── save-migrations.ts                ← add migrate v22→v23
└── save-validation.ts                ← extend validate cho workshop fields
```

### Data flow per tick

```
game-loop.worker (1Hz)
  └─> store.tickWorkshopQueues()
        └─> for each facility with workshopQueue
              ├─> activeTasks = queue.filter(t => t.startedAt !== null)
              ├─> capacity = facility.assignedMemberIds.length
              ├─> while (activeTasks.length < capacity && hasPending) {
              │     pendingTask = queue.find(t => t.startedAt === null)
              │     validate(pendingTask, inventory) → ok? consume mat + startedAt = now
              │                                       → no? rotate to end (mark .skipped++)
              │   }
              └─> for each activeTask: remainingSeconds -= 1
                    └─> if remainingSeconds <= 0: process via systems → apply result → splice
```

## Related Code Files

### Modify
- `src/game/state/guild-slice.ts` — re-export workshop actions
- `src/game/save/save-types.ts` — `SAVE_VERSION = 23`
- `src/game/save/save-migrations.ts` — migration v22→v23
- `src/game/save/save-validation.ts` — accept new fields
- `src/game/systems/workers/game-loop.worker.ts` — call `tickWorkshopQueues()` mỗi tick

### Create
- `src/game/state/guild-slice-workshop.ts` (~180 LOC limit)

### Delete
- (none)

## Implementation Steps

1. **`guild-slice-workshop.ts`** — export factory `createWorkshopActions(set, get)`:
   ```ts
   export function createWorkshopActions(set, get) {
     return {
       addWorkshopTask(facilityId, payload) { ... validate + append ... },
       cancelWorkshopTask(facilityId, taskId) { ... refund nếu !startedAt ... },
       saveBlueprint(facilityId, bp) { ... check slot limit ... },
       deleteBlueprint(facilityId, bpId) { ... },
       enqueueBlueprint(facilityId, bpId, qty) {
         const bp = ...; for(let i=0; i<qty; i++) addWorkshopTask(facilityId, {kind:'CRAFT',...});
       },
       dismantleEquipment(equipmentInstanceId) {
         // instant: removeEquipment + addItems(recovered)
       },
       tickWorkshopQueues() { /* see data flow above */ },
     };
   }
   ```

2. **Tick scheduler** — quan trọng nhất:
   ```ts
   tickWorkshopQueues() {
     const state = get();
     const inventoryDelta: Record<ItemID, number> = {};
     const newEquipment: EquipmentItem[] = [];
     const removeEquipmentIds: string[] = [];

     const newFacilities = state.facilities.map(f => {
       if (!f.workshopQueue?.length) return f;
       let queue = [...f.workshopQueue];
       const capacity = f.assignedMemberIds.length;

       // Start pending tasks (skip-on-missing-mat)
       let active = queue.filter(t => t.startedAt !== null).length;
       const tried = new Set<string>();
       while (active < capacity) {
         const pending = queue.find(t => t.startedAt === null && !tried.has(t.id));
         if (!pending) break;
         tried.add(pending.id);
         const validation = validateTask(pending, state.inventory, inventoryDelta);
         if (!validation.ok) {
           queue = queue.filter(t => t.id !== pending.id).concat(pending);
           continue;
         }
         consumeMatsToDelta(pending, inventoryDelta);
         pending.startedAt = state.elapsedSeconds; // or Date.now()
         active++;
       }

       // Tick active tasks
       queue = queue.map(t => {
         if (t.startedAt === null) return t;
         const remain = t.remainingSeconds - 1;
         if (remain > 0) return { ...t, remainingSeconds: remain };
         // Complete: process via systems
         const result = processTask(t, /* equipment refs */);
         if (result.equipment && t.type !== 'REPAIR') newEquipment.push(result.equipment);
         // ... mark for removal
         return null;
       }).filter(Boolean);

       return { ...f, workshopQueue: queue };
     });

     set({ facilities: newFacilities });
     // Apply inventoryDelta + newEquipment + removeEquipmentIds via existing slice actions
   }
   ```

3. **Tick frequency**: `game-loop.worker.ts` đã chạy 1Hz và gọi `tickAlchemyQueues()` — add `tickWorkshopQueues()` cùng pattern.

4. **Save migration v22→v23**:
   ```ts
   // save-migrations.ts
   v22to23(save: SaveDataV22): SaveDataV23 {
     return {
       ...save,
       version: 23,
       inventory: {
         ...save.inventory,
         equipmentInventory: save.inventory.equipmentInventory.map(eq => ({
           ...eq,
           slots: eq.slots ?? [],
           maxSlots: eq.maxSlots ?? 4,
         })),
       },
       facilities: save.facilities.map(f => ({
         ...f,
         workshopQueue: f.workshopQueue ?? [],
         workshopBlueprints: f.workshopBlueprints ?? [],
       })),
     };
   }
   ```

5. **Bump SAVE_VERSION**: `save-types.ts:18` → 23.

6. **Validation**: extend `save-validation.ts` để accept optional `slots`, `workshopQueue`.

## Todo List

- [x] Tạo `guild-slice-workshop.ts` với 7 actions
- [x] Wire vào `guild-slice.ts` (spread actions, GuildSlice extends WorkshopActions)
- [x] Update `GameStoreState` type với new actions (via WorkshopActions interface)
- [x] Tick scheduler: parallel theo worker count
- [x] Skip-on-missing-mat: rotate to end, max 1 lần per tick per task
- [x] Migration v22→v23
- [x] Hook `tickWorkshopQueues()` vào use-game-tick-loop (1Hz tick alongside alchemy)
- [x] `dismantleEquipment` instant action (inventory only — equipped items must unequip first)
- [ ] Notification khi inventory full → reject task (deferred to Phase 05 UI)
- [x] Test save round-trip: v22 fixture → migrate → asserts slots/maxSlots/queue/blueprints

## Outcome

- New file `src/game/state/guild-slice-workshop.ts` (~280 LOC) với 7 actions + helpers (validateTaskStart, completeTask, calcTaskSeconds, findEquipmentInState).
- `GuildSlice` extends `WorkshopActions`; factory spread vào `createGuildSlice` qua `createWorkshopActions(set, get)`.
- Save migration v22→v23: legacy equipment instances auto-get `slots: []` + `maxSlots: 4`; workshop facilities auto-get `workshopQueue: []` + `workshopBlueprints: []`. Idempotent (preserves pre-existing values via Array.isArray/typeof checks).
- `tickWorkshopQueues()` hooked vào `use-game-tick-loop.ts` ngay sau `tickAlchemyQueues()` — both run 1Hz qua game-loop worker.
- Code review fixes applied: (a) `anyWork` check moved INSIDE `set()` callback for race-safety; (b) `enqueueBlueprint` qty clamped to 99; (c) JSDoc rõ ràng cho dismantle inventory-only behavior; (d) comment giải thích worker-count down-shift behavior (active tasks finish, down-shift only blocks new starts).
- TypeScript: tsc --noEmit pass. Tests: src/ 60/60 pass (workshop-system 20, save-migrations 18 incl. new v22→v23 test, save-validation 18, save-types 4).

## Deferred to Future Phases

- **Phase 04**: Offline progression hook (`processOfflineTime` advance queue theo gameSecondsElapsed).
- **Phase 05**: Inventory-full notifications, dropped-task toasts (when equipment vanishes mid-task), worker-count down-shift UX.
- **Phase 07**: Multi-tick fairness/starvation tests, extreme qty stress tests.

## Success Criteria

- [ ] Add task qua dispatch action → queue có task
- [ ] Sau 30s game time → task xong → equipment xuất hiện trong inventory
- [ ] 2 workers → 2 tasks chạy song song
- [ ] Thiếu mat → task rotate xuống cuối, task tiếp theo chạy
- [ ] Cancel pending task → mat refund (nhưng cancel task đang in-progress thì NO refund)
- [ ] Save v22 → load → migrate → equipment có `slots: []`

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Tick scheduler trigger re-render quá nhiều | Selector subscribe chỉ workshopQueue field; UI dùng shallow compare |
| Race condition giữa addTask và tick | Single-threaded JS, set() atomic — OK |
| Equipment instance ID collision | Dùng `crypto.randomUUID()` |
| Migration làm hỏng equipment cũ | Test với fixture v22 save trước |
| Skip loop infinite nếu tất cả task missing mat | `tried` Set + early break khi all pending tried |

## Security Considerations

- Cancel task action validate facility ownership và task tồn tại trước khi modify state.

## Next Steps

→ Phase 04: Hook offline progression — `processOfflineTime` advance queue theo gameSecondsElapsed.
