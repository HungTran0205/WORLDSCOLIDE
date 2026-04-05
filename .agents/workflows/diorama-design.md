---
description: Quy trình nghiên cứu, thiết kế concept architecture dạng isometric miniature/diorama cho 5 nền văn minh
---

# Workflow: Isometric Diorama Design 

Quy trình này hướng dẫn cách tạo concept art cho công trình/sa bàn (miniature/diorama) của 5 nền văn minh trong Worlds Collide với góc nhìn độ chân thực cao (HD-2D). Khi có yêu cầu thiết kế một công trình (ví dụ: "Tạo Guild Hall cho Linh Sơn"), thực hiện các bước sau:

## 1. Xác định yêu cầu & Triệu tập Team
- Xác định rõ loại công trình cần tạo và thuộc nền văn minh nào.
- Kích hoạt kỹ năng `ck:team` và `ck:brainstorm` để tiến hành research, lên kịch bản và thảo luận ý tưởng chi tiết về công năng, kiến trúc của công trình dựa vào Lore.

## 2. Nắm vững Template Văn Hóa & Kiến Trúc
Dưới đây là đặc điểm kiến trúc và phong cách nghệ thuật được định nghĩa sẵn cho từng nền văn minh, dùng làm bộ khung lý luận và tham chiếu từ vựng cho Prompt:

### Linh Sơn (Việt cổ, Đông Sơn, Tự nhiên)
- **Phong cách:** Mộc mạc, gần gũi thiên nhiên, phảng phất văn hóa phương Đông cổ đại / Đông Sơn.
- **Chất liệu:** Gỗ tốt, tre, nứa, đá núi tảng lớn, ngói âm dương, hoạ tiết mặt trời, chim lạc.
- **Kiến trúc:** Nhà sàn mái cong/võng, cột gỗ lớn vòng tay ôm, không gian mở hòa vào núi rừng tự nhiên, bếp lửa trung tâm.
- **Màu sắc chủ đạo:** Nâu gỗ, đỏ đất, chàm, trắng thô, xanh lá cây mờ.

### Đế Quốc (Điện trở, Hơi nước, Tân kỳ)
- **Phong cách:** Steampunk / Dieselpunk kết hợp Victorian. Nền văn minh hiện đại kẹt trong giới hạn nguyên liệu (không dầu mỏ).
- **Chất liệu:** Thép không gỉ, đồng thau, gốm kỹ thuật dày, kính sáng trong xuốt, ống lõi rỗng.
- **Kiến trúc:** Các công trình cơ học tinh xảo, đường ống hơi nước đan xen gỉ sét nhẹ, lõi thủy tinh phát sáng, máy móc truyền động bánh răng, cột thu lôi.
- **Màu sắc chủ đạo:** Đen than, xám thép, xanh điện quang, đồng ánh vàng.

### Thiên Lữ (Du mục, Tinh tú, Huyền bí)
- **Phong cách:** Du mục thần bí, lều trại di động, phép thuật tâm linh, sa mạc/thảo nguyên ngàn sao.
- **Chất liệu:** Vải vóc nhiều lớp, bạt lều, thảm dệt họa tiết cầu kỳ, xương thú, lồng đèn đá trời.
- **Kiến trúc:** Lều tròn (Yurt) xếp cạnh nhau, xe ngựa/cơ giới kéo khổng lồ cải tiến thành công trình trạm dừng, đài tế bằng đá xếp chồng, chuông gió kính.
- **Màu sắc chủ đạo:** Xanh lam đêm, tím tro, cát xám, bạc mờ, ngọc lam.

### The Eliza (Thánh Quyền, Cực đoan)
- **Phong cách:** Gothic Revival / Thánh đường tôn giáo cực đoan, tráng lệ nhưng mang nét ám ảnh áp bức.
- **Chất liệu:** Đá cẩm thạch trắng, kính màu (stained glass) rực rỡ, kim loại mạ vàng nguyên chất, cờ phướn lụa.
- **Kiến trúc:** Tháp chuông nhọn vút cao, cửa sổ vòm cung, tượng lớn tạc thần ánh sáng mặt vàng, đền thờ uy nghiêm, chật hẹp, khép kín.
- **Màu sắc chủ đạo:** Trắng tinh khôi, đỏ máu tươi, vàng kim, bạc sáng lạnh.

### The Scavenger (Hỗn loạn, Tái chế, Tàn bạo)
- **Phong cách:** Post-apocalyptic / Cyber-Ronin / Khu ổ chuột cơ khí hỗn loạn trên mặt nước hoặc phế tích cảng biển.
- **Chất liệu:** Sắt rỉ sét, lốp xe phế liệu, tôn mạ kẽm răng cưa, thùng phuy hóa chất độc hại, đèn neon phập phù.
- **Kiến trúc:** Công trình chắp vá bất quy tắc nguy hiểm, nhà lợp tôn xếp chồng lên nhau thành cụm, cáp điện giăng mắc, khói toxic bốc lên từ ống cống.
- **Màu sắc chủ đạo:** Xanh toxic (neon green), đen rỉ sét, cam cháy, mảng màu xám bẩn.

## 3. Tổng hợp ý tưởng và Thiết kế Prompt
Khi đã thống nhất hình ảnh, tạo một master prompt chi tiết.
**Quy tắc bắt buộc cho Render và Tỉ lệ (Game HD-2D Asset):**
- **Perspective/Angle:** "Isometric perspective, 45-degree angle downward looking, true orthographic projection."
- **Art Style:** "Miniature, diorama style, tilt-shift photography effect, 3D render, highly detailed."
- **Lighting:** "Studio lighting, soft shadows, indirect illumination, clean single color background."
- **Requirements:** Toàn bộ công trình phải nằm gọn trong khung hình, không bị cắt cúp mép (uncropped). Cần ở trên một mảng đế nhỏ (miniature base) nổi bám sát phong cách nền văn minh.

## 4. Kích hoạt Công cụ AI Generate
Dùng kỹ năng `ck:ai-artist` (hoặc `ck:vn-concept-artist` nếu làm các concept Linh Sơn cần chuyên môn Việt) để sinh ảnh:
- **Tỉ lệ khung hình:** `1:1` (Vuông, chuẩn ISO cho building sprites) hoặc `4:3` nếu công trình dàn ngang.
- **Kích thước ảnh:** Tối ưu hóa ở `1024x1024` pixels. Điều này đảm bảo có thể downscale xuống kích thước tài nguyên game một cách cực kỳ chi tiết.

## 5. Hậu kỳ & Tích hợp (Bàn giao)
Sau khi concept được Generate xong:
- Kích hoạt kỹ năng xử lý ảnh (ví dụ `ck:media-processing`) để tiến hành loại bỏ background (nếu cần), tạo lớp alpha channel (transparent).
- Lưu tài nguyên vào trong thư mục tương ứng trong dự án (ví dụ `/public/arena/buildings/[faction_name]/`).
- Báo cáo và show kèm file assets đã hoàn thiện cho Admin/Guild Master để đưa luôn vào game engine.
