# Brainstorm Summary: Guild Rank Promotion System

## 📌 Problem Statement & Requirements
Người chơi mới rơi vào game idle dễ bị "ngợp" vì không biết làm gì tiếp theo do có quá nhiều tính năng hiển thị cùng lúc. Yêu cầu lớn nhất của Milestone 1 (First Playable) là cần một luồng dẫn dắt (linear progression) tự nhiên. 

Mục tiêu cốt lõi: Hướng dẫn người chơi qua vòng lặp cơ bản (Recruit -> Build -> Dispatch -> Reward -> Upgrade) một cách mượt mà nhất trong 5 phút đầu, không được khô khan (tutorial lộ liễu) nhưng không quá phức tạp (YAGNI).

## ⚖️ Evaluated Approaches (Các giải pháp đã thảo luận)
1. **Bảng "To-Do List" (KISS):** Rõ ràng, dễ code, nhưng giống checklist công việc. Khô khan.
2. **Nàng Thư Ký "Tutorial Advisor" (Narrative Light):** Thêm flavor cho game, nhưng khó code UI/UX, dễ bị người chơi skip, rườm rà không cần thiết cho Milestone 1.
3. **Guild Rank Promotion (Meta Progression):** Dùng bằng cấp, thứ hạng làm thước đo mở khóa các tính năng và dẫn dắt người chơi qua các nhiệm vụ (Promotion Tasks).

## 🏆 Final Recommended Solution: Guild Rank Promotion
**Rationale (Tại sao lại chọn?):** 
Cách tiếp cận này không chỉ đơn thuần là "Tutorial" một lần rồi vứt, mà nó là một **Meta Progression System** tồn tại vĩnh viễn trong vòng đời của game.
Sẽ không có bảng hướng dẫn khô khan kiểu "Bạn phải xây Tavern đi". Thay vào đó, game sẽ nói: *"Guild của bạn đang ở Rank F. Để lên Rank E (và mở khóa Quest xịn hơn), guild cần hoàn thành 3 Thử Thách Mới Thành Lập: Xây 1 Tavern, Tuyển 1 Lính Mới, và Hoàn Thành 1 Quest."*
Thứ này biến Tutorial thành một chặng đường "thăng quan tiến chức" rất tự nhiên, đánh trúng tâm lý khoái nâng cấp của người chơi Idle.

## ⚙️ Implementation Considerations & Risks (Rủi ro & Đánh đổi)
- **Rủi ro 1 - UI/UX:** Cần vẽ thêm UI hiển thị `Current Rank` và `Promotion Requirements` ở vị trí đập vào mắt người chơi nhất trên HUD chính.
- **Rủi ro 2 - Quản lý Trạng thái:** Sẽ cần code thêm logic check `if (guildRank < requiredRank)` rải rác ở một vài tính năng (ví dụ: Quest board tier, Phòng ốc).
- **Giảm thiểu Rủi ro (KISS):** Thay vì làm nguyên cái bảng UI nhiệm vụ to đùng, Rank đầu tiên (Rank F -> E) gài sẵn đúng 3 task siêu dễ "húp" gắn thẳng vào góc màn hình chính. Cứ xong 3 task là nổ pháo hoa báo "Lên Rank E" để tạo dopamin cho Milestone 1.

## 📊 Success Metrics & Validation
- **Metric:** Tân thủ có trải qua First Playable State (tới lúc hoàn thành Combat đầu tiên và nhận Reward) ngay trong vòng 5 phút đầu không?
- **Validation:** Không cần Developer đứng cạnh "nhắc tuồng", HUD của game tự lead user pass qua 3 step đầu tiên.

## 🚀 Next Steps & Dependencies
1. Cần tạo một `GuildRankSlice` trong Zustand (Track cấp độ Rank hiện tại và mảng các objectives).
2. Xây dựng một file config đơn giản (`data/guild-ranks.ts`) chứa các mốc Rank và điều kiện (Requirements) đi kèm.
3. Đắp một widget nhỏ lên UI HUD kiểu: `[Hạng F]: 0/3 Tới Hạng E`.
4. Viết script chặn logic (filter) các tier của quest và room dựa vào `Guild Rank` này.
