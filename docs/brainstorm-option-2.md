# Brainstorming: Room Expansion cho Option 2 (Hybrid Room + Decor)

Chào Hưng! Lựa chọn **Option 2 (Hybrid Room + Decor)** là một hướng đi cực kỳ khôn ngoan! Vuốt ve được đam mê "xếp hình" của người chơi mà coder chúng ta không khóc thét vì vụ thuật toán nhận diện không gian kín. 

Vậy nếu người chơi lỡ tay xây cái **Tavern** bé tí, lúc sau full thành viên muốn mở rộng ra thì làm thế nào? Min đã nghiên cứu và lọc ra 3 hướng đi (Approaches) hợp lý nhất cho Hưng đây:

---

## 🏗️ Approach 1: Nâng cấp tại chỗ (In-place Upgrade)
Người chơi bấm vào phòng hiện tại -> Chọn "Upgrade Size". Căn phòng sẽ "nở" ra theo kích thước định sẵn (vd: 3x3 -> 4x4 -> 5x5).

**Cách hoạt động (Technical flow):**
1. Check xem xung quanh phòng hiện tại có đủ ô trống (Grid cells) để "nở" ra không.
2. Nếu đủ chỗ: Trừ tiền -> Xóa Mesh cũ -> Thay bằng Mesh to hơn -> Cập nhật `width, depth` trong DB.
3. Cập nhật lại UI sức chứa (Capacity) của phòng.

**Ưu điểm (Pros):**
- **CỰC KỲ DỄ CODE**: Chỉ là thay thế object A bằng object B to hơn. Hệ thống cũ của Hưng (checkCollision) đã gánh hết rồi.
- UI gọn gàng: Mở bảng thông tin phòng -> Bấm 1 nút là xong.
- Dễ dàng quản lý số lượng đồ đạc: (Phòng cấp 2 cho đặt max 10 đồ, phòng cấp 1 max 5 đồ).

**Nhược điểm (Cons):**
- Thiếu tính linh hoạt: Người chơi không thể biến phòng thành hình chữ L hay hình chữ T được, chỉ có hình vuông/chữ nhật to dần.
- Nếu lỡ xây san sát nhau, lúc upgrade sẽ báo lỗi "không đủ chỗ", buộc người chơi phải... bứng cả lò dời đi chỗ khác rộng hơn mới upgrade được.

---

## 🧩 Approach 2: Ghép khối (Block / Module Merging)
Người chơi mua các "Khối phòng nhỏ" (vd: 1x1 hoặc 2x2) và ghép chúng sát vào nhau. Game sẽ tự "hợp nhất" (Merge) các khối cùng loại.

**Cách hoạt động (Technical flow):**
1. Hưng xây 1 cục Tavern 2x2.
2. Hưng mua tiếp 1 cục Tavern 2x2 khác, đặt dính (Adjacent) vào cục cũ.
3. Game quét thấy 2 cục Tavern chạm nhau -> Gom chúng lại thành 1 "Cụm Tavern" (Tavern Cluster).
4. Sức chứa và hiệu ứng sẽ bằng tổng các khối cộng lại. Hình dạng Mesh (3D) có thể dùng các bức tường "mở" (Open Wall) bên trong giao diện tiếp xúc.

**Ưu điểm (Pros):**
- **Tùy biến hình dáng 100%**: Xây hình chữ L, chữ U, chữ Z thoải mái!
- Cảm giác "xây dựng" đã tay nhất trong 3 phương án. Rất giống các game Tycoon (như Two Point Hospital).

**Nhược điểm (Cons):**
- **Đau đầu phần Rendering 3D**: Làm sao để 2 cục block chạm nhau thì cái vách tường ở giữa ... biến mất? Hưng sẽ phải code thuật toán tính toán "tường ngoài/tường trong" (Auto-tiling algorithm) để lưới 3D trông liền mạch.
- **Khó quản lý Logic**: Đồ đạc (Decor) thuộc về Khối A hay Khối B? Nếu đập bỏ Khối A đi thì đồ đạc trên đó tính sao?

---

## 📦 Approach 3: Tách rời Logic và Hiển thị (Zone Designation)
Kiểu như game *Prison Architect*. Người chơi không xây "Phòng 3D" có sẵn tường ráp, mà dùng chuột "Quét" (Paint) một khu vực trên sàn nhà, đánh dấu khu đó là "Tavern".

**Cách hoạt động (Technical flow):**
1. Chọn công cụ "Paint Tavern Zone".
2. Quét chuột lên sàn nhà, tô màu sàn thành màu của Tavern (ví dụ màu cam).
3. Người chơi sau đó tự do thả các đồ vật (Bàn rượu, quầy bar) vào cái vùng màu cam đó.
4. Tường là hệ thống riêng, người chơi có kéo tường bao quanh hay không tùy ý.

**Ưu điểm (Pros):**
- Hủy bỏ hoàn toàn khái niệm "Room = 1 cục Object cứng ngắc".
- Cực kỳ linh hoạt, giải quyết triệt để vấn đề "hợp nhất/mở rộng" (Cứ lấy cọ quét to cái Zone ra là xong).

**Nhược điểm (Cons):**
- **Phá nát hệ thống Hưng đang có**: Plan trước Hưng làm "Prefab Room" cầm nắm quăng quật, giờ chuyển sang "Paint Zone" là đập đi làm lại hết từ UI đến Data Structure.
- Đòi hỏi AI (Pathfinding) của nhân vật phải thông minh nhận diện Zone.

---

### 💡 Lời khuyên chốt hạ từ Min (The Verdict)

Dựa trên nguyên tắc **KISS (Keep It Simple, Stupid)** và hệ thống Hưng vừa code hôm qua:

🏆 **Min vote mạnh cho APPROACH 1 (In-place Upgrade)**!

**Lý do:**
1. Nó tận dụng 100% hệ thống `checkCollision` và `activeItem` Hưng vừa làm.
2. Dễ dàng scale up sau này (Cấp 1 -> Cấp 5).
3. Code nhanh gọn lẹ, để dành thời gian trau chuốt phần **Decorator (Trang trí đồ nội thất)** - đấy mới là phần "hút máu" thời gian của tính năng này.
4. Giải pháp cho vụ "hết chỗ để nở": Đơn giản là cho người chơi cầm nguyên căn phòng đem ra bãi đất trống bự hơn rồi nâng cấp!

Hưng chốt phương án nào? Bấm bụng chọn **Approach 1** cho nhàn, hay thích thử thách thuật toán Auto-tiling của **Approach 2**? Cho Min biết để Min xuất Plan nào! 🚀
