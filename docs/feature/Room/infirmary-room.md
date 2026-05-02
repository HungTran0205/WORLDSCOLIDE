# Infirmary

## 1.2.2 Phòng hồi phục / Infirmary

- Mục tiêu: chữa thương cho nhân vật injured, không phải phòng sản xuất.
- Nhân vật bị injured vẫn có thể vào phòng hồi sức.
- Sức chứa phòng hồi sức giới hạn bằng tổng slot trong 1 party:
  - Ví dụ party 4 người → infirmary chỉ có 4 recovery slots.
  - Điều này giữ tính chiến lược: phòng hồi sức chỉ đủ cho 1 party cùng lúc.
- Nếu số injured vượt quá số slot, phần còn lại xếp queue slot chờ:
  - Queue slot giữ nhân vật chờ hồi sức, không thể tham gia phòng khác.
  - Queue slot có thể tăng khi nâng cấp infirmary.
- Thời gian hồi phụ thuộc vào máu tối đa:
  - `RecoveryTime = maxHp × 1.2 giây` hoặc công thức tương tự.
  - Máu càng nhiều thì thời gian hồi càng lâu.
  - Ví dụ: 100 maxHP ~ 2 phút, 200 maxHP ~ 4 phút, 300 maxHP ~ 6 phút.
- Nếu thời gian còn lại ≤ 5 phút thì xuất hiện nút `Skip 5 phút`:
  - Bấm để hồi full ngay lập tức.
  - Chỉ cho phép khi tiến trình hồi còn lại nhỏ hơn hoặc bằng 5 phút.
- Có thể rút nhân vật ra khỏi phòng khi chưa hồi full HP:
  - Nhân vật được trả về trạng thái `idle` hoặc `recovering` ở ngoài.
  - Nhưng nếu HP chưa đầy, nhân vật không thể vào phòng khai thác hoặc phòng chế tạo.
  - Điều này giữ đúng quy tắc: chưa phục hồi đủ không được dùng cho production.
- Hồi phục bằng premium currency:
  - Thêm tùy chọn `Premium Revival` hoặc `Instant Recovery`.
  - Người chơi tiêu premium để hồi full ngay lập tức hoặc bỏ qua phần còn lại của thời gian.
  - Giá có thể tính theo thời gian còn lại hoặc theo level/slot.
- Hạn chế thêm:
  - Nếu đang trong phòng hồi sức và chưa hồi full, không thể sử dụng item repair / upgrade trên nhân vật.
  - Nếu rút ra sớm, hiện trạng healing time vẫn có thể tiếp tục nếu đưa trở lại infirmary.
