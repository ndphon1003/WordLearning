# Giọng đọc tiếng Việt miễn phí

WordLearning có một nút Nghe phát âm cho cả từ, không đọc từng tiếng riêng. Nếu từ có bản thu MP3/WAV, phát bản thu. Nếu không, thử Web Speech API bằng giọng tiếng Việt; nếu thiếu giọng hoặc lỗi, tải và chạy Piper/VITS trên trình duyệt bằng ONNX Runtime Web. Không dùng Google Cloud TTS, Billing, API key, eSpeak NG trên server hoặc endpoint nội bộ Google Dịch.

## Chạy local

Sau khi pull, chạy:

```powershell
npm install
npm run dev
```

Giữ nguyên các biến môi trường Google Drive. Không cần ESPEAK_NG_PATH, GOOGLE_CLOUD_PROJECT_ID hay GOOGLE_TTS_VOICE. Nếu đã thêm chúng trước đó, có thể xóa. Vào /admin, thêm từ ngữ, ảnh và video, bỏ trống audio. Mở bài học và bấm Nghe phát âm.

## Model AI

Dùng @diffusionstudio/vits-web 1.0.3, voice vi_VN-vais1000-medium. Model khoảng 63 MB; thư viện tải model từ Hugging Face và runtime từ các CDN được cấu hình bởi thư viện. Trình duyệt cần Internet ở lần đầu và môi trường secure context (localhost hoặc HTTPS), WebAssembly và Origin Private File System (OPFS). Model có thể được cache theo origin của website; trình duyệt có thể xóa cache. Chỉ tải model khi cần fallback, hiển thị tiến độ nếu có. Văn bản được tổng hợp tại thiết bị, audio chỉ ở bộ nhớ; không lưu audio xuống Drive hoặc filesystem. Trên một số thiết bị, chính sách autoplay có thể yêu cầu bấm nghe lần nữa. Nếu hủy, kết quả đang tạo sẽ không phát; tiến trình tải/inference của thư viện có thể vẫn hoàn thành.

Nguồn model: https://huggingface.co/rhasspy/piper-voices/blob/main/vi/vi_VN/vais1000/medium/MODEL_CARD (dataset VAIS-1000, CC BY 4.0); thư viện MIT: https://github.com/diffusionstudio/vits-web . Mẫu giọng: https://k2-fsa.github.io/sherpa/onnx/tts/all/Vietnamese/vits-piper-vi_VN-vais1000-medium.html . Kiểm tra phát âm trước khi sử dụng với học sinh lớp 1.

## Kiểm thử và deploy

- Dùng Chrome/Edge bản mới trên máy tính và thử thêm điện thoại. Kiểm tra HTTPS khi deploy; HTTP qua IP LAN có thể không hỗ trợ OPFS.
- DevTools Console: speechSynthesis.getVoices().filter(v => /^vi(?:[-_]|$)/i.test(v.lang)) ; nếu không có giọng vi, nút sẽ chuyển sang Piper. DevTools Network có thể dùng để xem tải model và runtime.
- Khi đã tải, thử lại để kiểm tra cache, đổi bài và bấm Dừng để xác nhận không phát từ cũ. Kiểm tra âm lượng và phát âm có dấu.
- Nếu CDN bị chặn, thiếu RAM/storage, trình duyệt không hỗ trợ hoặc tải chậm, dùng thiết bị khác hoặc upload bản thu giáo viên. Không bảo đảm giọng AI hoạt động trên mọi máy. Không có phí API, nhưng có tải mạng và tài nguyên thiết bị.
- Backend Next.js không cần cài chương trình TTS nào. Các giới hạn upload video hiện tại vẫn áp dụng khi chọn hosting.

Từ cũ, bản thu thủ công và dữ liệu Drive giữ nguyên. Không migration.
