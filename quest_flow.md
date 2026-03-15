# Quest Flow System — Travel → Arrival → Auto/Manual Combat → Rewards

Nối combat engine vào game loop với pha di chuyển, thông báo đến nơi, lựa chọn auto/manual combat, và phát thưởng. Khi player không chọn trong 30s → auto combat.

## Proposed Changes

### 1. Mission Phase State Machine

Thêm concept **mission phases** vào `ActiveMission`:

```
traveling (10s) → arrived (chờ chọn, timeout 30s) → in-combat → completed/failed
```

#### [MODIFY] [game-state.ts](file:///d:/WORLDCOLIDE/src/game/state/game-state.ts)

- Thêm `MissionPhase` type: `'traveling' | 'arrived' | 'arrived-timeout' | 'in-combat' | 'completed' | 'failed'`
- Thêm fields vào `ActiveMission`: `phase`, `arrivalTime`, `combatMode` (`'auto' | 'manual' | null`)
- Thêm `travelTimeMs` field vào `Mission` type (default 10000ms)
- Thêm `description` và `zone` field vào `Mission` type

#### [MODIFY] [missions.ts](file:///d:/WORLDCOLIDE/src/game/data/missions.ts)

- Bổ sung `travelTimeMs`, `description`, `zone` cho từng mission data

---

### 2. Mission Slice — Thêm actions mới

#### [MODIFY] [mission-slice.ts](file:///d:/WORLDCOLIDE/src/game/state/mission-slice.ts)

- Thêm `pendingResults: MissionResult[]` — queue kết quả chờ hiển thị
- Thêm `updateMissionPhase(missionId, phase)` action
- Thêm `setCombatMode(missionId, mode)` action  
- Thêm `pushMissionResult(result)` / `dismissResult()` actions
- Thêm `currentCombatReplay: CombatResult | null` — cho manual view

---

### 3. Mission Tick System (MỚI)

#### [NEW] [mission-tick.ts](file:///d:/WORLDCOLIDE/src/game/systems/mission-tick.ts)

Core game loop processor, gọi mỗi giây:

```typescript
function processMissionTick(now: number): MissionTickEvent[]
```

Logic:
1. Duyệt `activeMissions`
2. Phase `traveling` + `now >= startTime + travelTimeMs` → chuyển sang `arrived`, emit `'arrival'` event
3. Phase `arrived` + quá 30s không chọn → auto-combat, chuyển `in-combat`
4. Phase `in-combat` → gọi `resolveMission()` → apply rewards (gold, exp) → set member status → chuyển `completed/failed`
5. Return danh sách events cho UI xử lý

---

### 4. Game Loop Hook (MỚI)

#### [NEW] [use-game-loop.ts](file:///d:/WORLDCOLIDE/src/game/hooks/use-game-loop.ts)

React hook chạy `setInterval(1000ms)`:
- Gọi `tickClock(now)`
- Gọi `processMissionTick(now)`
- Xử lý events: arrival → push notification, combat done → push result
- Kiểm tra injured members hết hạn → set idle

#### [MODIFY] [app.tsx](file:///d:/WORLDCOLIDE/src/ui/app.tsx)

- Sử dụng `useGameLoop()` hook trong game screen
- Khi có arrival event → hiện Arrival Modal

---

### 5. UI Components

#### [NEW] [arrival-modal.tsx](file:///d:/WORLDCOLIDE/src/ui/panels/arrival-modal.tsx)

Popup khi đội tới nơi:
- Hiển thị tên quest, zone, enemy preview
- 2 nút: **⚔️ Manual** | **🤖 Auto**
- Auto-dismiss sau 30s (→ auto combat)

#### [MODIFY] [quest-board.tsx](file:///d:/WORLDCOLIDE/src/ui/panels/quest-board.tsx)

- Active missions: hiện phase badge (🚶 Traveling / 📍 Arrived / ⚔️ Combat / ✅ Done)
- Progress bar cho travel time
- Bấm vào completed mission → hiện combat result
- Bấm vào arrived mission → mở arrival modal

#### [MODIFY] [combat-view.tsx](file:///d:/WORLDCOLIDE/src/ui/panels/combat-view.tsx)

- Nhận `CombatResult` → hiển thị combat log từng tick
- Manual mode: hiện replay theo thời gian (play/pause/skip)
- Summary panel: outcome, damage, survivors, rewards

#### [NEW] [mission-result-toast.tsx](file:///d:/WORLDCOLIDE/src/ui/components/mission-result-toast.tsx)

Toast notification khi mission auto-resolve xong:
- "✅ Slime Extermination hoàn thành! +15 Gold, +100 EXP"
- "❌ Orc Stronghold thất bại! 2 member bị thương"

---

### 6. Quest Detail Panel (Bonus)

#### [NEW] [quest-detail.tsx](file:///d:/WORLDCOLIDE/src/ui/panels/quest-detail.tsx)

Bấm quest trong board → hiện chi tiết:
- Zone, description, enemy list (tên + level + số lượng)
- Reward range, requirements
- Nút dispatch

---

### 7. Offline Integration

#### [MODIFY] [offline-progression.ts](file:///d:/WORLDCOLIDE/src/game/systems/offline-progression.ts)

- Mission hết hạn khi offline → chạy `resolveMission()` cho mỗi mission
- Tính reward thực tế (không chỉ đếm số lượng)
- Trả kết quả chi tiết cho offline report

---

## Verification Plan

### Automated Tests

Vitest đã configured với `@` alias, chạy qua `npx vitest run`:

#### [NEW] `tests/mission-tick.test.ts`
- Test phase transitions: traveling → arrived → in-combat → completed
- Test auto-timeout: arrived quá 30s → auto combat
- Test reward application: gold + exp tăng đúng
- Test member status: survivors → idle, injured → injured với injuredUntil
- Test travel time: mission không resolve trước khi hết travel time

#### [MODIFY] `tests/combat-simulator.test.ts`  
- Existing tests vẫn pass (regression)

**Chạy tests**: `npx vitest run` tại root directory

### Manual Verification
1. Chạy `npm run dev`, tạo character, dispatch một quest
2. Chờ 10s → thấy arrival modal popup
3. Chọn Auto → thấy toast kết quả + gold/exp thay đổi
4. Dispatch quest khác → chọn Manual → xem combat log
5. Dispatch quest → đóng tab → chờ 30s → arrival timeout → auto combat
6. Kiểm tra member status trong roster (idle/on-mission/injured)
