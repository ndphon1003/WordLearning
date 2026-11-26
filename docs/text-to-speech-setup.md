# Giọng đọc tiếng Việt miễn phí

WordLearning sử dụng Web Speech API của trình duyệt khi không có bản thu. Không tạo file MP3 tự động, không gọi Google Cloud Text-to-Speech và không cần Billing, Google Cloud CLI hoặc credentials bổ sung. Giữ nguyên các biến môi trường Google Drive và mật khẩu.

- Tạo từ: tải ảnh và video, bỏ trống audio; học sinh nhấn Nghe phát âm để trình duyệt đọc từ (vi-VN, tốc độ 0.8).
- Từ có bản thu MP3/WAV: dùng bản thu cho cả từ; các nút đọc từng tiếng vẫn dùng giọng trình duyệt.
- Sửa mô tả, ảnh hoặc video: giữ bản thu.
- Đổi từ ngữ hoặc chọn Bỏ bản thu: chuyển sang đọc tự động nếu không tải bản thu mới. File cũ được đưa vào Trash sau khi bản ghi được lưu.
- Dữ liệu đã có tương thích; không cần migration hay tạo lại dữ liệu. Các MP3 từng được tạo trước đây vẫn dùng được.

## Kiểm tra giọng tiếng Việt

Mở DevTools Console, chạy `speechSynthesis.getVoices().filter(v => /^vi(?:[-_]|$)/i.test(v.lang))`. Danh sách giọng có thể tải bất đồng bộ; đợi vài giây rồi kiểm tra lại. Nếu vẫn trống, trình duyệt/thiết bị chưa cung cấp giọng tiếng Việt. Có thể thử trình duyệt khác hoặc kiểm tra gói giọng đọc tiếng Việt trong hệ điều hành. Cài ngôn ngữ hiển thị không bảo đảm có giọng TTS. Không tự đọc bằng giọng ngoại ngữ vì ứng dụng dành cho học sinh lớp 1. Nếu không hỗ trợ, tải bản thu MP3/WAV do giáo viên thu âm.

Thử trên máy và trình duyệt dùng khi dự thi. Giọng đọc phụ thuộc thiết bị, có thể cần Internet nếu giọng được cung cấp trực tuyến. Nếu trước đó đã bật Cloud TTS/Billing, thay đổi code không tự tắt dịch vụ trên Google Cloud; có thể tắt riêng Cloud Text-to-Speech API, nhưng giữ Google Drive API.
