# Cấu hình Google Drive

1. Dùng tài khoản Google riêng cho WordLearning nếu có thể. Mở Google Cloud Console, tạo project, bật Google Drive API.
2. Cấu hình OAuth consent screen; thêm tài khoản chủ Drive làm test user nếu app External/Testing. Tạo OAuth client loại Web application. Để lấy refresh token thủ công bằng OAuth 2.0 Playground, đăng ký redirect URI https://developers.google.com/oauthplayground và bật Use your own OAuth credentials trong Playground. Chỉ thực hiện trên dịch vụ Google chính thức.
3. Chọn scope https://www.googleapis.com/auth/drive để truy cập thư mục có sẵn (scope rộng; tài khoản chuyên dụng hạn chế ảnh hưởng). Authorize APIs bằng tài khoản có quyền chỉnh sửa thư mục, Exchange authorization code for tokens. Sao chép refresh token vào máy cá nhân. Không chia sẻ, không commit. OAuth consent ở chế độ Testing có thể khiến refresh token hết hạn sau 7 ngày; kiểm tra chế độ phát hành và yêu cầu xác minh của Google trước triển khai lâu dài. Có thể dùng drive.file nếu ứng dụng có quyền cấp riêng cho thư mục và các file do app tạo, nhưng hướng dẫn hiện tại không triển khai Google Picker.
4. Tạo .env.local từ .env.example. Điền GOOGLE_DRIVE_FOLDER_ID (ID sau /folders/ trong link của chủ dự án), GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN và ADMIN_PASSWORD (ít nhất 12 ký tự ASCII, ngẫu nhiên). DEMO_MODE=false. Không dùng NEXT_PUBLIC_ cho secrets. Giữ thư mục Drive riêng tư. Không cần bật Anyone with the link.
5. npm install, npm run dev, mở /admin. Tạo chủ đề với ảnh bìa, thêm từ với ảnh và video MP4 (ưu tiên H.264/AAC), upload MP3/WAV và thử ba nút media. Kiểm tra bằng cửa sổ ẩn danh: nội dung xem được, sai mật khẩu không ghi được, file tùy ý trên Drive không đọc được, tua video được. Xóa/sửa thử dữ liệu kiểm thử; kiểm tra Drive Trash.
6. Deploy một tiến trình Node 22 chạy npm run build rồi npm start. Cấu hình HTTPS, giới hạn body 42 MiB (proxy có thể đặt 43 MiB), timeout phù hợp upload, rate limit POST/PATCH/DELETE ở proxy. Không dùng serverless có giới hạn body thấp (ví dụ payload 4.5 MB) với upload video hiện tại. Cấu hình secret bằng hosting environment, không lưu trong repo. Rotate credential ngay nếu lộ.

Không dùng service account cho My Drive thường (không có quota sở hữu file mới); OAuth user refresh token được sử dụng cho ứng dụng này. Đừng cấp quyền truy cập Drive rộng cho tài khoản chứa dữ liệu nhạy cảm. Không ghi log request headers hoặc multipart. Sau deploy, kiểm tra chất lượng phát âm của bản thu giáo viên trên máy thực tế.

Bảo trì: bản ghi JSON được tạo riêng biệt, file thay thế cũ được đưa vào Trash sau khi bản ghi mới lưu thành công. Khi upload thất bại, ứng dụng thử đưa media mới vào Trash. Không xóa file bằng tay trừ khi đã đối chiếu JSON và appProperties; sao lưu thư mục trước khi bảo trì.

## Bản thu âm

Xem [hướng dẫn media](text-to-speech-setup.md). Giáo viên tải MP3/WAV khi tạo từ; không cần dịch vụ TTS hoặc credentials bổ sung.
