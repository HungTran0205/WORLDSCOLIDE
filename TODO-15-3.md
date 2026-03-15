# 🎮 WORLDS COLIDE — Game Designer Review (15/3/2026)

## 📊 Tình trạng hiện tại

### ✅ Đã có (hoạt động)
| Hệ thống | Trạng thái | Ghi chú |
|---|---|---|
| **Combat Simulator Engine** | ✅ Hoàn chỉnh | Tick-based, auto-attack, skill, poison, crit, status effects |
| **Mission Data** | ✅ Có | 5 mission (F→D tier), 5 enemy templates |
| **Mission Board UI** | ⚠️ Một nửa | Hiển thị quest list, chọn member, dispatch — nhưng thiếu chi tiết quest |
| **Mission Dispatch** | ✅ Có | Validate đội hình, tạo ActiveMission, lock member status |
| **Mission Resolver** | ✅ Có logic | Chạy combat sim → tính gold/exp — nhưng **chưa ai gọi nó** |
| **Game Clock** | ✅ Có | 1 giây thực = 6 giây game |
| **Offline Progression** | ⚠️ Một nửa | Phát hiện mission hết hạn nhưng chưa resolve reward |
| **Save/Load System** | ✅ Hoàn chỉnh | IndexedDB, multi-slot, backup, auto-save, validation |
| **Title Screen** | ✅ Có | Save slot selection, new game, continue |
| **Character Creation** | ✅ Có | Stat allocation, naming, civilization |
| **Guild Roster UI** | ✅ Có | Hiển thị member list |
| **3D Scene (R3F)** | ✅ Có | Guild hall cơ bản |

### 🔴 BUG / Missing — Vòng lặp game bị đứt

> **Vấn đề cốt lõi**: Combat engine là pure function chạy offline nhưng **không có gì trigger nó khi quest hết thời gian**. Game loop bị đứt tại đây:
>
> `Dispatch Quest → ⏳ Chờ hết giờ → ❌ KHÔNG CÓ GÌ XẢY RA`

Cần có:
1. **Game Tick Loop** — Kiểm tra `activeMissions` mỗi tick, khi `estimatedEndTime <= now` → gọi `resolveMission()`
2. **Resolve → Apply Rewards** — Sau resolve: cộng gold, cộng EXP cho từng member, thay đổi status member (idle/injured)
3. **Completion Notification** — Hiển thị kết quả cho player

---

## 📋 TODO LIST cho H

### 🔥 Ưu tiên 1: Nối Combat vào Game Loop (CRITICAL)

> Không làm xong cái này thì game chỉ là UI tĩnh, không phải game.

- [ ] **1.1 — Mission Tick System** (`game/systems/mission-tick.ts` MỚI)
  - Tạo function `processMissionTick(now)` kiểm tra tất cả `activeMissions`
  - Khi `estimatedEndTime <= now` → gọi `resolveMission()` 
  - Apply kết quả: cộng gold (`addGold`), cộng EXP (`addMemberExp`)
  - Set member status: survivor → `idle`, injured → `injured` + set `injuredUntil`
  - Gọi `completeMission(missionId)` hoặc `failMission(missionId)`

- [ ] **1.2 — Game Loop Integration** (`ui/app.tsx` hoặc hook mới)
  - Thêm `useEffect` / `setInterval` (mỗi 1s) gọi `processMissionTick()`
  - Đồng thời gọi `tickClock()` để cập nhật game time

- [ ] **1.3 — Mission Result Notification**
  - Khi mission resolve xong → lưu `lastMissionResult` vào store
  - Hiển thị popup/toast: "Quest hoàn thành! +50 Gold, +100 EXP" hoặc "Quest thất bại! 2 member bị thương"

---

### 🟡 Ưu tiên 2: Quest Detail Panel

> Bấm vào quest thì phải thấy nó nguy hiểm cỡ nào chứ!

- [ ] **2.1 — Mission Detail Data** — Bổ sung field vào `Mission` type:
  - `description: string` — mô tả quest ("Khu rừng độc, đầy slime nhầy nhụa...")  
  - `zone: string` — khu vực ("Rừng Độc", "Hang Orc", "Đồng Cỏ")
  - `enemyPreview` — hiển thị danh sách quái: "Slime ×2, Slime King ×1"

- [ ] **2.2 — Quest Detail Modal UI** (`ui/panels/quest-detail.tsx` MỚI)
  - Bấm vào quest trong Quest Board → mở panel chi tiết
  - Hiển thị: tên quest, tier, zone, description
  - Hiển thị **enemy list** với icon/tên/level (ví dụ: 🟢 Slime Lv.1 ×3)
  - Hiển thị reward range: 💰 10-20 Gold, ⭐ 100 EXP
  - Hiển thị yêu cầu: 👥 1+ members, Lv.1+
  - Nút "Dispatch" ngay trong detail panel

---

### 🟡 Ưu tiên 3: Completion Tick & Member Return

> Member đi quest rồi thì phải thấy trở về chứ!

- [ ] **3.1 — Active Mission Progress Bar** trong Quest Board
  - Mỗi active mission hiển thị progress bar (thời gian còn lại / tổng)
  - Khi progress = 100% → hiển thị nút "Claim Result" hoặc auto-resolve

- [ ] **3.2 — Member Status Visual Feedback** trong Guild Roster
  - Member `on-mission` → icon ⚔️ + tên quest đang làm
  - Member `injured` → icon 🩹 + thời gian hồi phục còn lại
  - Member `idle` → icon ✅ sẵn sàng

- [ ] **3.3 — Injury Recovery System**
  - Khi member bị injured → set `injuredUntil = now + recoveryTime`
  - Game tick loop kiểm tra `injuredUntil`, khi hết hạn → set status `idle`

---

### 🟢 Ưu tiên 4: Combat View (đã có stub)

- [ ] **4.1 — Combat Log Viewer**
  - Hiển thị combat replay từ `CombatResult.ticks[]`
  - Từng tick hiển thị events: "🗡️ Warrior tấn công Slime, gây 15 damage"
  - Kết quả cuối: Victory / Partial Victory / Wipe

- [ ] **4.2 — Combat Summary Panel** (sau mỗi quest)
  - Tổng damage dealt, thời gian combat
  - Danh sách survivors / injured
  - Gold + EXP earned

---

### 🟢 Ưu tiên 5: Polish & QoL

- [ ] **5.1 — Offline Mission Resolve** — Sửa `offline-progression.ts`
  - Khi game load lại, nếu có mission đã hết hạn → chạy `resolveMission()` cho mỗi mission
  - Hiển thị offline report: "Khi bạn offline: 2 quest hoàn thành, +120 Gold, +400 EXP"

- [ ] **5.2 — Quest Board Refresh** 
  - Board chỉ hiện N quest ngẫu nhiên, refresh mỗi game-day (đã có `refreshBoard()` nhưng chưa dùng)

- [ ] **5.3 — Sound Effects**
  - Quest dispatch → sound
  - Quest complete → fanfare
  - Quest fail → sad sound

---

## 🗺️ Flow hoàn chỉnh sau khi fix

```
Player mở Quest Board
  → Bấm quest → Xem chi tiết (zone, enemy list, reward)
  → Chọn member → Dispatch
  → Member status → "on-mission" ⚔️
  → Progress bar chạy...
  → Hết giờ → Mission Tick resolve combat
  → Combat engine chạy → tính result
  → Thắng: Gold + EXP cộng, member → idle ✅ 
  → Thua: Member → injured 🩹, recovery timer
  → Popup thông báo kết quả
  → Player xem combat log (optional)
  → Tiếp tục dispatch quest mới!
```

---

## ⚡ Đề xuất thứ tự làm

| Bước | Task | Lý do |
|------|------|-------|
| 1 | Mission Tick System (1.1 + 1.2) | **Cốt lõi** — không có thì game chết |
| 2 | Completion + Rewards (1.3 + 3.1) | Player cần thấy kết quả |
| 3 | Member Return (3.2 + 3.3) | Feedback visual cho player |
| 4 | Quest Detail (2.1 + 2.2) | Giúp player ra quyết định |
| 5 | Combat View (4.1 + 4.2) | Nice-to-have, thêm depth |
| 6 | Offline + Polish (5.x) | QoL improvements |

> **Ước tính**: Bước 1-3 khoảng 3-4 tiếng code. Bước 4-6 thêm 2-3 tiếng nữa.
