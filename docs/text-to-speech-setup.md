# Giọng đọc tiếng Việt miễn phí

Mỗi từ chỉ có một nút Nghe phát âm. Nếu có bản thu MP3/WAV, phát bản thu. Nếu không, ưu tiên Web Speech API với giọng vi của trình duyệt; nếu thiếu giọng hoặc lỗi, gọi GET /api/speech/:wordId để eSpeak NG đọc trực tiếp. Không có Cloud TTS, Billing, API key hoặc file audio tự tạo khi lưu từ. Âm thanh WAV từ eSpeak được trả trong bộ nhớ, không lưu file trên server hoặc Drive. Giọng eSpeak nghe máy hơn Google Dịch; nên nghe thử trước khi dạy trẻ.

## Windows: cài phương án dự phòng một lần

1. Tải bản Windows tại https://github.com/espeak-ng/espeak-ng/releases (MSI phù hợp kiến trúc máy). Cài đặt.
2. Mở PowerShell mới; kiểm tra `espeak-ng --version` và `espeak-ng -v vi "Con chó"`.
3. Nếu chưa có trong PATH, tìm espeak-ng.exe ở thư mục đã cài, bổ sung đường dẫn thật vào .env.local, ví dụ:

```dotenv
ESPEAK_NG_PATH="C:/Program Files/eSpeak NG/espeak-ng.exe"
```

4. Giữ nguyên OAuth Drive, dừng và chạy lại npm run dev. Khi truy cập từ thiết bị khác, server vẫn có thể đọc cho thiết bị đó, không cần cài eSpeak trên từng máy. Khi deploy cần cài eSpeak NG trên server hosting (Linux: apt install espeak-ng).

Không cần cấu hình ESPEAK_NG_PATH nếu executable đã nằm trong PATH. Chỉ nội dung từ ngữ đã công bố được đọc; API không nhận văn bản tùy ý. Nếu không cài eSpeak và thiết bị thiếu giọng vi, nút sẽ báo lỗi; tải bản thu giáo viên nếu không muốn cài công cụ. Không dùng endpoint Google Dịch không chính thức.

## Kiểm tra giọng trình duyệt

DevTools Console: `speechSynthesis.getVoices().filter(v => /^vi(?:[-_]|$)/i.test(v.lang))`. Đợi vài giây và thử lại nếu rỗng. Không đọc bằng giọng ngoại ngữ. Thử trên thiết bị dự thi để kiểm tra chất lượng phát âm. Dữ liệu cũ giữ nguyên, không migration.
