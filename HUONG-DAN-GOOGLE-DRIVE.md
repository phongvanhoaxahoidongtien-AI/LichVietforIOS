# Bật sao lưu Google Drive (cách 2) cho bản web

Chỉ người triển khai ứng dụng làm một lần. Người dùng cuối chỉ việc bấm "Kết nối Google Drive".

## 1. Tạo mã OAuth Client ID (miễn phí)
1. Vào https://console.cloud.google.com, đăng nhập Gmail, bấm **Tạo dự án**, đặt tên `Lich Viet`.
2. Vào **APIs & Services → Library**, tìm **Google Drive API** và bấm **Enable**.
3. Vào **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - Tên ứng dụng: `Lịch Việt`; điền email hỗ trợ và email liên hệ.
   - Scopes: thêm `.../auth/drive.file`. Đây là quyền không nhạy cảm, Google không yêu cầu thẩm định.
   - Bấm **Publish app**, chuyển sang chế độ *In production*, để mọi tài khoản Google đều đăng nhập được.
4. Vào **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**: điền địa chỉ trang web, ví dụ `https://lich-viet.vercel.app`. Nếu muốn chạy thử trên máy thì thêm `http://localhost:4173`.
   - Không cần điền Redirect URI.
   - Bấm **Create**, rồi sao chép **Client ID** (dạng `xxxx.apps.googleusercontent.com`). Mã này không phải mật khẩu, được phép công khai.

## 2. Gắn mã vào Vercel
1. Mở Vercel, vào dự án, chọn **Settings → Environment Variables**.
2. Thêm biến `VITE_GOOGLE_CLIENT_ID` với giá trị là Client ID vừa sao chép.
3. Chọn **Deployments → Redeploy**.

Sau khi triển khai lại, mục **Cách 2: Sao lưu lên Google Drive** sẽ hiện nút "Kết nối Google Drive".

## Bảo mật
- **Quyền truy cập Drive:** ứng dụng chỉ xin quyền `drive.file`, nên chỉ tạo và mở đúng tệp "Lịch Việt - sao lưu.json" do chính ứng dụng tạo, không đọc được tệp khác trong Drive.
- **Thư viện đăng nhập:** thư viện của Google chỉ được tải khi người dùng bấm kết nối.
- **Mã truy cập:** chỉ giữ trong bộ nhớ, không lưu lại; đóng ứng dụng là hết hiệu lực.
- **CSP khi bật Google:** chỉ mở cho `accounts.google.com/gsi/` và `www.googleapis.com`.
- **CSP khi không bật Google:** bản không có `VITE_GOOGLE_CLIENT_ID` và bản HTML 1 tệp vẫn chặn mọi kết nối ra ngoài.
- **Bản HTML 1 tệp:** mở trực tiếp từ máy nên Google không cho đăng nhập. Bản này chỉ dùng được Cách 1 (tệp).
