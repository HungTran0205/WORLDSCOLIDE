# 🧪 Test Steps: Quest Manual Combat Flow

> URL: `http://localhost:5173/`
> Yêu cầu: Dev server đang chạy (`npm run dev`)

---

## Chuẩn bị: Tạo nhân vật mới

1. Mở `http://localhost:5173/`
2. Chọn **Slot 1** → bấm **New Game**
3. Nhập tên nhân vật (ví dụ: "TestHero")
4. Nhập tên guild (ví dụ: "TestGuild")
5. Phân bổ stat points (đề xuất: STR 10, END 10, DEX 10, AGI 10 để combat nhanh)
6. Bấm **Begin Adventure**
7. ✅ Verify: Vào được game screen, HUD hiện "100 G Members: 1"

---

## Test 1: Dispatch Quest + Travel Phase

1. Bấm nút **Quests** ở HUD dưới
2. ✅ Verify: Quest Board mở ra, hiện danh sách quest (Slime Extermination, Slime King Lair, ...)
3. Tick checkbox chọn nhân vật trong **Select Members**
4. Bấm nút **Dispatch** của quest "Slime Extermination"
5. ✅ Verify: Quest detail modal hiện (nếu có) → bấm Dispatch xác nhận
6. ✅ Verify: Active Missions hiện "Slime Extermination" với status **Traveling**
7. ✅ Verify: Progress bar travel đang chạy (~10 giây)
8. ✅ Verify: HUD hiện "Missions: 1"

---

## Test 2: Arrival Modal + Manual Combat

1. Chờ ~10 giây cho travel phase kết thúc
2. ✅ Verify: Modal **"⚔️ Party Arrived!"** popup
3. ✅ Verify: Hiển thị đúng tên quest + zone (ví dụ: "Slime Extermination — Outskirts Forest")
4. ✅ Verify: Hiển thị enemy list (ví dụ: "3× Slime (Lv.1)")
5. ✅ Verify: Countdown "Auto-combat in 30s" đang đếm ngược
6. Bấm nút **"⚔️ Manual"**
7. ✅ Verify: **Chuyển sang Combat View screen** (hiện combat log/replay)
8. ✅ Verify: Combat hiển thị các tick events (auto-attack, damage, death, victory/wipe)
9. ✅ Verify: Khi combat kết thúc → hiện summary (outcome, gold earned, exp earned)

> 🐞 **Known Bug (trước fix)**: Bấm Manual → modal đóng nhưng KHÔNG chuyển sang Combat View

---

## Test 3: Auto Combat + Timeout

1. Dispatch một quest mới (lặp lại Test 1 steps 3-5)
2. Chờ arrival modal popup
3. **Không bấm gì** — chờ countdown hết 30s
4. ✅ Verify: Quest tự động resolve (auto combat)
5. ✅ Verify: Toast/notification hiện kết quả (victory/defeat + rewards)

---

## Test 4: Auto Combat (bấm nút Auto)

1. Dispatch quest → chờ arrival modal
2. Bấm nút **"🤖 Auto"**
3. ✅ Verify: Quest resolve ngay lập tức
4. ✅ Verify: Kết quả hiển thị đúng

---

## Test 5: Rewards + Member Return

1. Sau bất kỳ quest hoàn thành:
2. ✅ Verify: **Gold** tăng (check HUD top-left, ví dụ: 100G → 110-120G)
3. ✅ Verify: **Member level** tăng sau vài quest (Lv.1 → Lv.2+)
4. Bấm **Roster** → kiểm tra member
5. ✅ Verify: Member status = **idle** (không còn "on-mission")
6. ✅ Verify: Member có thể dispatch đi quest mới

---

## Test 6: Injury System (nếu thua)

1. Dispatch quest khó hơn (ví dụ: "Orc Stronghold" nếu đã unlock)
2. Hoặc tạo nhân vật yếu (stat thấp) → dispatch "Slime King Lair"
3. Nếu quest kết quả = partial-victory hoặc full-wipe:
4. ✅ Verify: Member bị thương → status = **injured**
5. ✅ Verify: Member injured không thể dispatch đi quest khác
6. ✅ Verify: Sau thời gian hồi phục → member trở về **idle**

---

## Test 7: Bấm Active Quest để xem trạng thái

1. Trong Quest Board, phần **Active Missions**
2. Bấm vào quest đang traveling
3. ✅ Verify: Hiện thông tin travel progress
4. Bấm vào quest đã arrived
5. ✅ Verify: Mở lại arrival modal (Manual/Auto choice)

---

## Checklist tổng kết

| # | Test Case | Expected | Status |
|---|-----------|----------|--------|
| 1 | Dispatch + Travel | Quest vào active, travel 10s | |
| 2 | Arrival + Manual | Modal popup, bấm Manual → Combat View | |
| 3 | Auto Timeout 30s | Không bấm → auto resolve | |
| 4 | Auto bấm nút | Bấm Auto → resolve ngay | |
| 5 | Rewards | Gold + EXP tăng, member idle | |
| 6 | Injury | Member bị thương nếu thua | |
| 7 | Click active quest | Xem trạng thái/mở modal | |
