# WordLearning — Bé vui học Tiếng Việt

Ứng dụng học từ ngữ dành cho học sinh lớp 1. Next.js App Router + TypeScript + CSS nổi 3D; Google Drive là kho dữ liệu duy nhất.

## Chạy thử (không cần tài khoản Google)

Node.js 22+:

```sh
npm install
cp .env.example .env.local
# Sửa DEMO_MODE=true trong .env.local
npm run dev
```

Mở http://localhost:3000. Demo chỉ đọc, dùng emoji thay ảnh thật, không có video; không tự ghi dữ liệu. Trang /admin cho người lớn. Kiểm thử: npm run typecheck, npm test, npm run build.

## Kết nối Drive thật

Xem [hướng dẫn OAuth và triển khai](docs/google-drive-setup.md). Đặt DEMO_MODE=false, điền đủ 5 biến còn lại trong .env.local hoặc môi trường hosting. Mật khẩu ít nhất 12 ký tự ASCII, không dùng mật khẩu Google. Không commit secret hay gửi qua chat. Thư mục đích là WordLearning mà chủ dự án cung cấp.

Không cần khởi tạo database bằng tay: bản ghi và media được tạo tự động khi lưu nội dung đầu tiên. Nếu chưa có dữ liệu, trang chủ sẽ hiển thị trạng thái trống.

## Nghiệp vụ

- Học sinh: xem chủ đề, từ, hình ảnh, phát âm, video, từ trước/sau, luyện từng tiếng và ôn tập chọn hình (từ 3 từ/chủ đề).
- Người lớn: tạo/sửa/xóa chủ đề và từ. Chủ đề phải trống trước khi xóa. Tạo mới yêu cầu ảnh bìa / ảnh và video; file audio tùy chọn. Sửa không cần tải lại file.
- Chỉ dùng mật khẩu cho mỗi thao tác ghi. Không có account học sinh, cookie đăng nhập hay lưu mật khẩu phía client.
- Phát âm: ưu tiên file thu âm, nếu không có dùng giọng tiếng Việt của trình duyệt; không đọc bằng giọng ngoại ngữ. Kiểm tra giọng đọc thật trên thiết bị dự thi.
- Hình ảnh và video do quản trị viên cung cấp; không tự tạo media AI. Giao diện nổi CSS, emoji dự phòng.

## Kiến trúc

Trình duyệt -> Next.js API -> Google Drive API v3 qua OAuth server-only. File Drive không cần public. Media API nhận ID bản ghi và loại media, kiểm tra bản ghi và metadata, hỗ trợ HTTP Range cho video. Không trả token hoặc Drive file ID cho client.

Storage trong thư mục WordLearning: topic-UUID.json, word-UUID.json, UUID-cover.jpg, UUID-image.webp, UUID-video.mp4, UUID-audio.mp3. Dùng appProperties wlKind/recordId/topicId/ownerId/slot để truy vấn. Một JSON mỗi bản ghi tránh ghi đè danh sách lớn. File JSON chỉ là metadata; media tách riêng. Không chỉnh sửa tay metadata/tệp do ứng dụng quản lý.

API: GET /api/catalog, /api/topics, /api/topics/:id, /api/topics/:id/words, /api/words/:id, /api/media/:kind/:id/:slot. POST /api/admin/topics hoặc /words; PATCH/DELETE thêm /:id. Ghi dùng multipart/form-data và x-admin-password. DELETE không cần body.

Giới hạn: 5 MiB mỗi ảnh/audio, 30 MiB MP4, 42 MiB tổng request. Kiểm tra định dạng và magic bytes, không phải công cụ quét mã độc. Chỉ tải nội dung tin cậy. Lỗi upload được dọn best-effort; có thể còn file mồ côi nếu Drive lỗi hoặc request bị ngắt. Drive không phải database giao dịch; dùng một tiến trình Node, không dùng nhiều replica ghi đồng thời. Rate limit mật khẩu trong bộ nhớ (8 lần sai/phút toàn tiến trình), nên dùng thêm rate limit ở proxy khi public. Demo không ghi Drive.

CI chạy typecheck, kiểm tra tĩnh bảo mật và build; chưa thay thế kiểm thử thực tế với OAuth và media.
