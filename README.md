# Lịch Việt: Văn Hóa & Phong Tục – phiên bản 2.4

Lịch vạn niên âm dương mang bản sắc Việt Nam. Ứng dụng **chạy 100% trên máy**, không cần mạng sau lần mở đầu, và không gửi dữ liệu ra ngoài.

## Tính năng
- **Hôm nay**: tờ lịch bloc truyền thống; điểm ngày; việc nên làm và nên tránh; giờ Hoàng đạo; hướng xuất hành; tuổi xung; chia sẻ tờ lịch thành ảnh (gửi Zalo, Facebook).
- **Tháng**: tô màu ngày tốt xấu chung hoặc theo từng việc; đánh dấu Hoàng đạo, ngày lễ, mùng 1, Rằm.
- **Xem ngày**:
  - Chi tiết ngày:
    - Hoàng đạo/Hắc đạo (12 thần), 12 Trực (theo tiết khí), Nhị thập bát tú;
    - sao tốt và sao xấu (Ngọc Hạp Thông Thư);
    - ngày kỵ: Tam Nương, Nguyệt Kỵ, Dương Công, Sát Chủ âm/dương, Thọ Tử, Nguyệt Tận, Tứ Ly, Tứ Tuyệt;
    - 12 giờ trong ngày: Hoàng đạo và giờ xuất hành Lý Thuần Phong;
    - hướng Hỷ thần, Tài thần, Hạc thần; tuổi xung (nạp âm khắc), lục hợp, tam hợp;
    - đánh giá 8 việc, có giải thích điểm cộng, điểm trừ.
  - **Chọn ngày tốt (trạch nhật)**:
    - 8 việc: cưới hỏi, động thổ, nhập trạch, khai trương, xuất hành, ký kết, an táng, cúng tế;
    - theo năm sinh gia chủ (và chú rể với việc cưới hỏi);
    - xét Kim Lâu, Hoang Ốc, Tam Tai theo năm;
    - lọc ngày thường hoặc cuối tuần; kèm giờ tốt không xung tuổi.
  - Đổi ngày âm ↔ dương: kiểm tra tháng nhuận và tháng thiếu.
- **Nhắc lịch**: nhắc mùng 1, 14, Rằm, cuối tháng; nhắc ngày giỗ lặp hằng năm theo âm lịch; thông báo trên máy.
- **Tiện ích**: Thước Lỗ Ban; 12 Trực; Phong tục; Nhịp sinh học; Chia sẻ ứng dụng; Cài đặt, sao lưu (chế độ tối, 3 cỡ chữ, bật/tắt Trực trên lịch, sao lưu tệp hoặc Google Drive, xóa toàn bộ dữ liệu).

### Mới ở bản 2.4: Phiếu xem ngày theo tuổi
- **Điểm phù hợp /100:** gồm Chất lượng ngày (40), Ngày kỵ (15), Hợp tuổi (30) và Hạn năm cho việc (15). Kim Lâu, Hoang Ốc, Tam Tai trừ điểm nhưng không chặn. Ngày phạm ngày kỵ nặng hoặc xung tuổi mạnh thì tối đa 29 điểm.
- **Kết luận:** Nên làm, Cân nhắc hoặc Không nên, kèm lý do chính và chi tiết từng nhóm.
- **Lời khuyên:**
  - ngày phù hợp gần nhất;
  - năm gần nhất không phạm hạn;
  - mượn tuổi: gợi ý từ người trong nhà và năm sinh ví dụ;
  - giờ tốt hợp tuổi, hướng xuất hành.
- **Cung mệnh Bát trạch** (cần giới tính): 4 hướng tốt và 4 hướng xấu cho việc nhà cửa.
- **Phong tục kèm việc;** lưu hoặc gửi ảnh phiếu.
- **Vị trí:** kết quả Hỏi nhanh; Chi tiết ngày (mục "Xem ngày theo tuổi"); trang Hôm nay (thẻ "Hôm nay với tuổi …").

### Mới ở bản 2.3
- **12 Trực**: nhãn Tốt / Bình hòa / Xấu, nên làm và kiêng kỵ. Hiện trên lịch tháng (tô màu, bật/tắt được), trên trang Hôm nay (thẻ "Trực hôm nay") và trong Chi tiết ngày. Có bảng tra cả 12 Trực.
- **Thước Lỗ Ban**:
  - Dương trạch: 52,2 cm (thông thủy) và 42,9 cm (khối xây, nội thất). Âm phần: 38,8 cm.
  - Nhập kích thước theo cm hoặc mm; xem cung và cung nhỏ.
  - Cung xấu thì gợi ý khoảng tốt gần nhất. Có thước kéo trực quan.
- **Chia sẻ ứng dụng**:
  - Nút ở thanh trên và trong Tiện ích.
  - Chia sẻ qua bảng chia sẻ của máy, sao chép liên kết, gửi tin nhắn hoặc email.
  - Có mã QR của địa chỉ ứng dụng.
- **Ủng hộ tác giả**:
  - Nhập số tiền; mã VietQR có sẵn số tiền.
  - Chọn ngân hàng để mở thẳng app qua deeplink của VietQR (`dl.vietqr.io`). Với VietinBank, BIDV, MB, ACB, OCB, app tự điền thông tin. Với app khác, ứng dụng chép sẵn STK.
  - Lưu hoặc gửi ảnh mã QR.

## Chạy và triển khai
```bash
npm install
npm run dev        # chạy thử: http://localhost:3000
npm test           # kiểm thử đơn vị (vitest)
npm run build      # tạo bản dist/ (có CSP + service worker)
npm run preview    # xem bản build: http://localhost:4173
npm run e2e        # kiểm thử trên trình duyệt (cần Playwright, chạy preview trước)
```
**Vercel**: nhập kho mã, framework Vite, lệnh build `npm run build`, thư mục `dist`. Tệp `vercel.json` đã có header bảo mật.

Không cần khóa API (đã gỡ Gemini).

Biến môi trường (không bắt buộc):
- `VITE_APP_URL=https://ten-mien-cua-ban.vercel.app/`: địa chỉ gửi kèm khi chia sẻ ứng dụng. Nếu bỏ trống, ứng dụng dùng địa chỉ trang đang mở. Bản HTML mở từ tệp thì không có liên kết.
- `VITE_GOOGLE_CLIENT_ID`: bật sao lưu Google Drive (xem HUONG-DAN-GOOGLE-DRIVE.md).

## Bảo mật
- Không tải mã hay phông từ máy chủ ngoài: Tailwind, phông Be Vietnam Pro và Noto Serif được đóng gói sẵn.
- CSP chặn mọi kết nối ra ngoài (`connect-src 'self'`). Không xin quyền camera, micro, vị trí.
- Nút "Mở app ngân hàng" chỉ chuyển trang tới `dl.vietqr.io` khi người dùng bấm. Ứng dụng không gửi dữ liệu nào khác.
- Dữ liệu chỉ lưu trong trình duyệt của máy:
  - đọc lại có kiểm tra, dữ liệu hỏng không làm trắng màn hình;
  - ảnh nền được thu nhỏ và bỏ thông tin GPS.

## Cấu trúc
- `services/lunarCalendar.ts`: âm lịch (thuật toán Hồ Ngọc Đức, UTC+7).
- `services/almanac.ts`: xem ngày, trạch nhật.
- `services/reminders.ts`: nhắc lịch.
- `services/personal.ts`: phiếu đánh giá theo tuổi, cung mệnh, mượn tuổi.
- `services/loban.ts`: thước Lỗ Ban.
- `services/vietqr.ts`: mã VietQR, deeplink app ngân hàng.
- `services/appShare.ts`: chia sẻ ứng dụng.
- `components/`: các màn hình.
- `tests/`: kiểm thử đơn vị; `tests/e2e/`: kiểm thử trình duyệt.

> Nội dung xem ngày, giờ mang tính tham khảo văn hóa, tín ngưỡng dân gian.
