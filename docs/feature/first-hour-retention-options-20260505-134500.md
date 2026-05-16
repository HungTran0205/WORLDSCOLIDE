# First Hour Retention Options

## 1. Mục tiêu

Giữ người chơi trong 60 phút đầu bằng cách:
- tạo cảm giác tiến độ rõ ràng mỗi 3–10 phút
- mở khóa tính năng mới liên tục
- giảm thời gian không có hành động
- kết hợp idle/active gameplay thành một vòng lặp dễ hiểu
- tôn trọng cơ chế hiện tại: quest/missions, guild hall, combat, crafting/workshop, inventory, member progression

## 2. Hiện trạng cơ chế game

### 2.1 Core loop hiện có

- Build guild hall / furniture
- Dispatch quest → mission state machine → combat / rewards
- Gather resources từ buildings và monsters
- Chế tạo, nâng cấp, sửa chữa, tháo rời trong workshop
- Inventory + equipment + member rank + promotions
- Offline progression via worker tick / mission resolve on load

### 2.2 Các hệ thống đã hoàn thành

- Quest system 7-tier (F → S) với travel/arrived/in-combat/completed
- Combat engine tick-based + GPU instanced rendering
- Build menu + furniture unlock theo guild level
- Guild facilities: Tavern, Training, Infirmary, Workshop
- Tutorial first-session flow đã có: world-board lore, tutorial quest dispatch, Kael recruitment, facility unlock, build/hire assign
- Inventory system + rank badges + audio cues

### 2.3 Workshop hiện tại

- Workshop v2 định nghĩa queue theo workers
- 4 task: Craft / Enhance / Repair / Dismantle
- No-fail crafting output, affinity material → item stat category
- Blueprint batch crafting và worker queue
- Repair no-fail, Dismantle instant recovery
- Crafting skill progression, gem slot, T1–T5 tiers

## 3. Các option giữ chân người chơi trong 60 phút đầu

### Option A: Structured first-hour path

1. Onboarding nhanh với nhiệm vụ tutorial đã có
   - world-board lore → quest dispatch → mission active → reward
   - reward mở khóa workshop hoặc logging permit
2. Giải quyết 3 mini-mốc trong 60 phút:
   - Mốc 1: Hoàn thành quest đầu, nhận gold + member + mở build/furniture
   - Mốc 2: Build workshop/collect resources + craft item T1
   - Mốc 3: Use new gear to send mission C/D hoặc enhance item
3. Hiển thị rõ "Next objective" trong HUD/panel
   - ví dụ: "Gửi nhiệm vụ F tiếp theo", "Mở workshop", "Craft 1 vũ khí"
4. Kết thúc giờ đầu bằng một unlock tính năng mới
   - gem slot, blueprint, member promotion, hoặc multi-wave mission

### Option B: Micro-goals + reward cadence

- Mỗi 5–10 phút có một việc cụ thể hoàn thành
- Gắn kèm reward trực tiếp:
  - gold / material / slot unlock / member EXP
- Cho người chơi thấy progress bar của:
  - guild level
  - workshop level
  - quest chain
  - crafting queue
- Reward examples:
  - hoàn thành 2 quest F → mở logging permit
  - craft 1 T1 weapon → unlock enhance
  - place workshop furniture → +10% quest gold

### Option C: Idle + active hybrid loop

- Đảm bảo người chơi luôn có 2 loại công việc:
  - hành động trực tiếp: dispatch mission, place furniture, assign member, craft
  - công việc nền: queue workshop, mission travel, repair timer
- Cải thiện feedback:
  - queue progress bar
  - countdown/ETA
  - toast notification khi task hoàn thành
- Cho phép "check back" reward
  - chẳng hạn: "Workshop done in 2:30" và "Mission arrived in 30s"

### Option D: System synergy và resource anchor

- Các hệ thống cần liên kết chặt:
  - quest reward drop material cho workshop
  - workshop gear tăng sức mạnh mission
  - furniture tăng efficiency quest/reward
  - member promotion tăng EXP và giảm upkeep
- Ví dụ cụ thể:
  - quest rớt Slime Drop → dùng ngay để craft item có HP/Defense
  - workshop item giúp đạt mission rank C, từ đó unlock next quest tier

### Option E: Narrative-driven retention

- Dùng tutorial quest chain như một câu chuyện nhỏ
  - "Cứu Kael" → nhận reward mở workshop → dùng workshop tạo vũ khí cho party
- Add NPC/milestone story beats trong 60 phút
  - mở tavern story, recruit Kael, nhận permit wood
- Narrative hook giữ người chơi muốn biết bước tiếp theo

## 4. Kịch bản 60 phút đề xuất

### 0–10 phút
- Tutorial quest board + world lore
- Send first quest F
- Receive reward, level up member, mở build panel

### 10–25 phút
- Mở hoặc unlock workshop/logging site
- Collect base materials (wood/stone)
- Build workshop furniture
- Craft first T1 weapon hoặc armor

### 25–40 phút
- Use crafted gear để send mission C/D
- Display mission arrival timer + auto/manual combat choice
- Reward mission + new resource drops

### 40–55 phút
- Enhance hoặc reroll crafted item
- Unlock blueprint / batch craft
- Promote 1 member hoặc place new furniture

### 55–60 phút
- Open preview tính năng tiếp theo
  - gem slot, T2 weapon, battle pass, multi-wave mission
- Leave player with "goal for next session"

## 5. Priorities để triển khai nhanh

### High impact
- Make first-session tutorial path explicit and gated
- Add visible next-objective text + progress bar
- Guarantee first craft/gear reward occurs trước 30 phút
- Keep fail/frustration low trong giờ đầu
- Provide constant feedback for queues and offline progress

### Medium impact
- Use workshop v2 queue + blueprint as core retention hook
- Connect resource drops → immediate use in craft
- Add milestone unlocks with sensory reward: audio + visual

### Low impact / optional
- Add "check back" notifications for offline completion
- Add mini daily challenge or first-hour achievement
- Add return incentive: "come back in 10 min to collect X"

## 6. Recommendation

Đánh vào 2 điểm:
1. Cảm giác tiến độ liên tục: mỗi 5–10 phút phải có reward/tăng lực
2. Chức năng mới mở dần: tutorial → guild build → workshop → combat/gear → upgrade

Nếu cần chọn 1 phương án, dùng **Option A + Option C**:
- Một hướng dẫn rõ ràng năm bước đầu
- Kết hợp queue/idle feedback để giảm thời gian chờ
- Duy trì cảm giác "tôi luôn biết việc phải làm" trong 60 phút.


----- 
Been obsessing over my game's analytics lately and wanted to share some patterns I noticed.

The biggest finding: 45% of players leave within the first 30 seconds. Not 5 minutes, not after the tutorial, literally 30 seconds. Once I redesigned the spawn area to have a clear first action, that number dropped to 18%.

Other stuff that moved the needle:

- D1 retention jumped from 6% to 15% after shortening the tutorial from 5 steps to 3

- Mobile players have 40% shorter sessions than desktop but higher payer conversion

- Daily login rewards increased D7 retention by about 3x

The biggest mistake I made was trying to market the game before fixing retention. Spent money on ads with 6% D1 retention which was basically lighting money on fire.

What's your D1 retention looking like? Curious how others compare.


It's quite likely that the drop off between worlds 1 and 4 is more a pacing issue than a repetition one. The loop probably isn't broken, players are just not hitting that moment where it clicks before they bail. You gotta give the players a little win within the first few minutes, then follow that by a reason for them to return, a pending upgrade or timed unlock perhaps?

Whatever your best mechanic is later in the game, ask yourself why it can't show up in the first 5 minutes in a stripped back form. If boss fights are the highlight, why is the player waiting that long to taste one? Pull the good stuff forward, even a lite version of it.

Short term visible goals help a ton at this stage too. Mini-milestones. Something as simple as 'upgrade 3 more times to unlock X' with a progress bar buys you a surprising amount of goodwill while the deeper loop warms up.

One thing I don't see mentioned much in idle games but actually moves the needle on Day 1 is making that first offline reward feel substantial. If someone closes the app and comes back an hour later to something that genuinely surprised them, you've got a second session. That's half the battle early on.

Games that fail have:

- No visible XP bar on HUD

- Silent gameplay (no sound feedback)

- First upgrade costs too much or takes too long

- Text-heavy tutorials (players skip them)

- (players don't know what to do)

- No progression feeling

Clicker Tycoon dev added XP bar + coin drop sound + lowered first upgrade cost in week 1. D1 jumped from 12% → 38%.\

Players need:

To see progress (XP bar fills)

To feel the action (sound on every action)

To know what to do

Dưới đây là phiên bản **Markdown chuẩn** (bạn có thể copy vào Notion / Git / Docs):

---

# 🎮 Retention trong 1 giờ đầu

## (Idle + Turn-based + Base Building)

---

# 🧠 0. Reality Check

* 20–50% người chơi rời game trong **2–10 phút đầu**
* 80–90% không quay lại nếu trải nghiệm đầu thất bại
* Nếu **không chạm core loop trong 5–15 phút → retention gần như chết**

👉 **1 giờ đầu không phải để “giới thiệu game” → mà để “bán fantasy + loop + dopamine”**

---

# ⚙️ 1. Core Retention Framework

## 3 lớp retention trong 60 phút đầu:

### (A) Immediate Hook (0–5 phút)

> Game này là gì & tại sao mình nên chơi tiếp?

### (B) Core Loop Lock-in (5–20 phút)

> Loop này có gây nghiện không?

### (C) Future Commitment (20–60 phút)

> Có lý do để quay lại không?

---

# 🟢 2. PHASE 1: 0–5 phút — HOOK

## 1. Instant Feedback + Progress

* Damage number
* Resource drop
* EXP bar
* Upgrade trong <10s

```text
Action → Reward → Upgrade → Stronger → repeat
```

---

## 2. First Power Spike

* Tăng sức mạnh nhanh (x2–x5)
* Tạo cảm giác “mình đang giỏi”

---

## 3. Zero Friction Onboarding

* Không tutorial dài
* Học bằng cách chơi

---

## 4. Clear Goal ngay lập tức

* Defeat boss
* Build công trình
* Unlock hero

---

# 🟡 3. PHASE 2: 5–20 phút — LOOP LOCK-IN

## 5. Reveal Core Loop sớm

* Idle: collect → upgrade → scale
* Turn-based: battle → reward → build
* Base: build → wait → collect

---

## 6. Multi-layer Progression

| Layer   | Ví dụ        |
| ------- | ------------ |
| Combat  | thắng battle |
| Economy | tăng income  |
| Meta    | unlock hero  |

---

## 7. Controlled Friction

* Early: dễ
* Sau đó: hơi khó

👉 Buộc player phải:

* upgrade
* optimize
* suy nghĩ

---

## 8. Early Choice

* Chọn hero
* Chọn hướng build
* Chọn nâng cấp

---

## 9. Automation Transition (Idle Core)

* Manual → Auto

👉 “Game chơi giúp mình”

---

# 🔵 4. PHASE 3: 20–60 phút — FUTURE HOOK

## 10. Offline Progression (CRITICAL)

* “While you’re away, you earn X”

---

## 11. Time Gate

* Build time (5–30 phút)
* Energy
* Chest timer

---

## 12. Session Ending Design

* Kết thúc khi:

  * đang build
  * sắp có reward

---

## 13. First Meta Goal

* Unlock:

  * PvP
  * Guild
  * Hero hiếm

👉 “Mai quay lại mở cái này”

---

# 🔁 5. Core Hybrid Loop

```text
Battle (turn-based)
→ Reward (idle resource)
→ Build (base)
→ Power up
→ Battle harder
```

---

# 🔥 6. Key Mechanics (Idle Hybrid)

## AFK Reward

* Thu tài nguyên khi offline
* Có cap

---

## Base = Visual Progression

* Nhìn base phát triển → tăng retention

---

## Team Building

* Unlock 2–3 hero sớm
* Synergy nhẹ

---

## Prestige Tease

* Gợi ý reset sau này mạnh hơn

---

# 🧪 7. Insight thực tế từ dev

* Không có progress visible → mất ~7–10% retention
* 30–45% player rời trong 30s đầu nếu không có action rõ ràng
* Loop lặp lại quá sớm → chán

---

# 🧩 8. Timeline chuẩn (1 giờ đầu)

## 0–2 phút

* Combat ngay
* Upgrade ngay

## 2–5 phút

* Unlock system thứ 2
* Goal rõ

## 5–15 phút

* Full loop xuất hiện
* Có automation

## 15–30 phút

* Difficulty spike nhẹ

## 30–60 phút

* Time gate
* Offline reward
* Tease future

---

# ⚠️ 9. Sai lầm phổ biến

* Unlock feature quá trễ
* Early game quá dễ
* Không có idle reward
* Tutorial dài
* Không có lý do quay lại
* Loop quá nông nhưng lặp nhiều

---

# 🎯 10. Checklist nhanh

✔ Progress trong 30s
✔ Core loop <10 phút
✔ Power spike sớm
✔ Có offline reward
✔ Có reason quay lại

---

Nếu bạn muốn, mình có thể tiếp tục:

* Convert thành **Game Design Document (GDD) đầy đủ**
* Hoặc build luôn **flow + system cụ thể cho game bạn đang làm**
