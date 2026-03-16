# Brainstorming: 2D Side-scrolling Auto-Combat (Monster Hunter Style)

Chào Hưng! Ý tưởng làm combat màn hình ngang (side-scrolling) cho các nhân vật tự chạy lại chém quái, xả skill bùm chéo... thực sự là **trái tim của một con game gacha/idle siêu cuốn** đó! Nhìn mấy ẻm chạy lon ton đánh quái mới ép người chơi nạp tiền gacha chứ đúng không? 🤑

Nhưng để Min bóc tách sự thật "đẫm máu" đằng sau hệ thống này nhé. Chuyển từ "Tick-based log combat" (đánh nhau qua từng dòng chữ hoặc máu thụt ở level UI cứng) sang "Visual Side-scrolling Combat" đòi hỏi Hưng phải cấu trúc lại **toàn bộ hệ thống Combat Engine**.

Dưới đây là những gì Hưng **BẮT BUỘC PHẢI THAY ĐỔI VÀ THÊM VÀO**:

### 1. Thêm Không gian (Spatial Logic) & Khoảng cách (Range) 📏
- Hiện tại combat chỉ đọ stat (ai nhanh thì đánh).
- Giờ Hưng phải thêm tọa độ (`positionX`) cho mọi Entity (nhân vật, quái vật).
- Đưa thêm chỉ số `attackRange` (Tầm đánh): Cận chiến (Range = 1) phải chạy xáp lá cà mới chém được. Cung thủ/Pháp sư (Range = 5) đứng từ xa bắn.
- Đưa thêm chỉ số `moveSpeed` (Tốc chạy): Thằng nào chạy nhanh hơn thì vào vị trí đánh sớm hơn.

### 2. Tách biệt Data Logic và Rendering Animation 🎬
- Tránh việc: Logic tính toán "Gây 100 dmg" xong rồi máu quái tụt bùm một cái, trong khi đó nhân vật trên màn hình... chưa kịp vung kiếm!
- Phải có cơ chế **Event-driven / Async Tweening**. 
  Logic xử lý: `Tính toán chém (Xác định Hit/Miss/Crit)` -> `Sinh ra event 'animation_attack'` -> `View (UI/3D) nhận event, chạy render chém` -> `Đợi animation chạy đến frame chém trúng (Hit Frame)` -> `Mới báo cho UI là văng số sát thương (Floating Text) và thanh máu mới tụt`.

### 3. Hệ thống Skill & Vùng Ảnh Hưởng (AoE / Projectile) 💥
- Đã có không gian (`positionX`) -> thì skill phải có mục tiêu cụ thể hoặc vùng ảnh hưởng.
- **Skill Target**: Bắn thẳng vào 1 mục tiêu chỉ định (bay theo quỹ đạo).
- **Skill Area (AoE)**: Chém một nhát quét từ vị trí `x=5` đến `x=7`, đứa nào đứng trong đó ăn đòn (Hitbox/Hurtbox logic).
- **Projectile (Đạn bay)**: Phải code đường đạn bay từ pháp sư đến quái vật, đạn chạm quái (collision 1 chiều) hoặc bay hết thời gian (t=0.5s) mới dính dmg.

---

## 🛠️ 3 Hướng Tiếp Cận (Approaches) dành cho Rendering (Frontend)

Vì Hưng đang dùng React + Web tech, dưới đây là 3 Option để Render cái màn hình ngang (Side-scrolling view) này:

### 🎯 Option 1: DOM Elements (CSS Animation / Framer Motion / React Spring)
- Biến mỗi nhân vật thành một `<div>` có chứa `<img>` hoặc thẻ `<Sprite>`. Chạy bằng CSS `transform: translateX()`.
- **Pro:** Cực dễ làm, code thẳng bằng React cực kì quen thuộc, inspect DOM dễ debug.
- **Con:** Nếu có quá nhiều vụ nổ, hạt particle, chữ số nhảy loạn xạ (Floating Damage) lặp đi lặp lại có thể làm giật DOM (Garbage Collection). Nó hợp game nhẹ chứ game siêu kỹ năng giật giật thì FPS rớt thê thảm.

### 🎯 Option 2: 2D Canvas Engine (Pixi.js / Phaser.js)
- Dùng một Canvas 2D xịn xò để render Spine Animation (2D xương khớp) hoặc Game Sprites.
- **Pro:** Hiệu năng ĐỈNH CAO. Hàng ngàn particle nổ ùm xòe không giật lag. Hỗ trợ runtime xương Spine (Chuẩn ngành gacha 2D). Rất mượt, tha hồ làm FX chớp nháy đắt tiền.
- **Con:** Đòi hỏi Hưng học thêm API của Pixi.js (khá rắc rối), lại phải tích hợp cái luồng của nó chung với React/Zustand khá cực ở giai đoạn setup. Cần Resource (hình ảnh animation) rất đồ sộ.

### 🎯 Option 3: Dùng hệ thống 3D (React-Three-Fiber / Drei) nhưng lock góc quay (Orthographic)
- Hưng đang có sẵn R3F cho Guild Hall (Isometric 3D) rồi đúng không? Mình tạo một Scene 3D khác hệt vậy, dùng `OrthographicCamera` chĩa thẳng ngang sang (nhìn 2D). Các nhân vật là các tấm thẻ `Billboard` hoặc Mesh phẳng.
- **Pro:** Tận dụng 100% engine R3F hiện tại! Không đẻ thêm Lib ngoài (No Pixi). Hưng có thể xoáy camera 3D tạo hiệu ứng chiêu thức (Vd: Camera zoom, rung màn hình cực dễ). Particle effects (hạt bụi, sét) bằng 3D rất hoành tráng.
- **Con:** Lighting và Depth trong một cảnh 2D flat cần phải cẩn thận để không lọt bóng lung tung. Hơi Overkill đôi chút nếu chỉ cần render 2D phẳng lì nhưng lợi ích lâu dài thì đáng đồng tiền bát gạo.

---

### 💡 Lời khuyên "hút máu" từ Min (The Verdict):

Dành cho MVP hoặc giai đoạn đầu của một Solo-Dev (chưa có team Artist hùng hậu chuyên vẽ frame-by-frame):
👉 **MIN VOTE MẠNH CHO OPTION 3 (Sài luôn R3F nhưng set Orthographic Camera nhìn ngang)**

**Lý do:**
1. Hưng **ĐÃ CÓ** setup R3F. Xài lại luôn là vừa đỡ phí, vừa đồng bộ UI với cái Guild Hall. Có thể tái sử dụng luôn các Component 3D của thành viên Guild.
2. Ban đầu chỉ cần dùng các sprite tĩnh, dùng code Tween (R3F Spring) để trượt nhân vật lên chém (Bump) một cái rồi trượt lùi về. (Style game Darkest Dungeon, Epic Seven ban đầu, hoặc mấy con thẻ bài tướng tĩnh).
3. Sau này có lượm được model 3D hay xương 2D Spine ngon thì cũng dễ gắn vào. Gắn Particle 3D vào sướng hơn DIV rất nhiều!

Game loop sẽ là: `Update State ở Zustand` -> `R3F Update Mesh Position (lerp mượt)`.

Hưng thấy sao? Muốn ngắm nhân vật băm chém màn hình ngang trên bộ khung R3F (Option 3) luôn không? Chốt cọc đi để Min châm ngòi nổ làm **Plan** xịn sò hướng dẫn tách State Combat + tạo Scene 3D ngang nhé! Let's goooo! 🔪🐉
