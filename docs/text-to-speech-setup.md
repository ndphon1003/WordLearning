# Bản thu âm và media bài học

Không sử dụng TTS tự động. Giáo viên tự thu hoặc chuẩn bị bản thu tiếng Việt và upload MP3/WAV (tối đa 5 MiB), cùng ảnh và video MP4. Mỗi từ mới bắt buộc có cả ba media. Nếu từ cũ chưa có audio, nút Âm thanh hiển thị thông báo; mở /admin và bổ sung bản thu. Khi sửa từ ngữ, cần bản thu mới để không phát sai chữ. Nếu chỉ sửa mô tả/ảnh/video và từ đã có audio thì giữ nguyên bản thu, có thể nghe thử hoặc tải bản thay thế trong trang quản trị. Dữ liệu Drive cũ không bị tự động xóa hay migrate.

Trang học:
- Danh sách từ chỉ hiện chữ; ảnh bìa chủ đề giữ nguyên.
- Bài học mặc định chỉ hiện từ, mô tả nếu có và ba nút Âm thanh, Hình ảnh, Video.
- Âm thanh: phát bản thu ở tốc độ gốc, nhấn lại để dừng.
- Hình ảnh: mở/đóng ảnh minh họa.
- Video: mở/đóng trình phát; học sinh bấm Play để xem, không autoplay.
- Chuyển media hoặc chuyển từ sẽ dừng phát media trước đó. Trò chơi chọn hình vẫn hiện ảnh để làm bài tập.

Sau khi pull chạy npm install để loại bỏ thư viện TTS cũ, sau đó npm run dev. Không cần credentials mới. Không cần cài eSpeak, tải model AI hay Google Cloud Billing. Âm thanh được lưu trên Google Drive, tương tự ảnh và video.

Kiểm thử: tạo từ mới với cả ba media, kiểm tra thiếu audio bị từ chối, sửa mô tả giữ audio cũ, đổi chữ yêu cầu audio mới. Kiểm tra trang từ ban đầu không tải ảnh/video, mở từng nút, chuyển từ và kiểm tra âm thanh dừng. Kiểm tra trên điện thoại và máy tính trước khi sử dụng.
