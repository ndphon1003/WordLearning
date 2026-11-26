# Tự động tạo MP3 tiếng Việt

Cloud Text-to-Speech REST v1, mặc định giọng nữ vi-VN-Standard-A, tốc độ 0.85. Backend tạo MP3 khi lưu từ mới không có bản thu, đổi chữ, sửa từ chưa có audio hoặc chọn tạo lại. MP3 lưu trên Drive và phát qua API media, không gọi TTS mỗi lần học sinh bấm nghe.

## Windows (local)

1. Chọn project WordLearning, bật Cloud Text-to-Speech API: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com .
2. Google yêu cầu liên kết Billing kể cả khi dùng hạn mức miễn phí. Xem https://cloud.google.com/text-to-speech/pricing và đặt cảnh báo ngân sách, hạn mức phù hợp.
3. Lấy Project ID (không phải Project name hoặc Project number): https://console.cloud.google.com/iam-admin/settings .
4. Cài Google Cloud CLI nếu chưa có: https://cloud.google.com/sdk/docs/install .
5. Mở PowerShell mới, chạy:

   ```powershell
   gcloud auth application-default login
   gcloud auth application-default set-quota-project YOUR_PROJECT_ID
   ```

   Đăng nhập tài khoản có quyền sử dụng project; cần serviceusage.services.use (Service Usage Consumer hoặc quyền tương đương). ADC lưu ngoài repo, không in access token.
6. Giữ nguyên cấu hình OAuth Drive và ADMIN_PASSWORD trong .env.local, bổ sung:

   ```dotenv
   GOOGLE_CLOUD_PROJECT_ID=YOUR_PROJECT_ID
   GOOGLE_TTS_VOICE=vi-VN-Standard-A
   ```

   DEMO_MODE=false. Restart npm run dev. Không cần thay Refresh Token Drive hay cài npm package mới.
7. Vào /admin, tạo từ Con chó, upload ảnh và video, bỏ trống audio, lưu và thử nghe. Drive sẽ có UUID-audio.mp3. Từ đã tạo chưa có audio: mở Sửa rồi lưu, không phải tải lại ảnh/video. Từ đã có audio: chọn Tạo lại MP3 tự động nếu muốn thay.

## Hosting và bảo mật

Sử dụng ADC qua identity gắn với workload hoặc Workload Identity Federation khi hỗ trợ. Nếu cần file service account, lưu ngoài repo, mount qua secret manager và đặt GOOGLE_APPLICATION_CREDENTIALS là đường dẫn tuyệt đối tới file; cấp quyền tối thiểu để dùng dịch vụ và quota project. Không tải JSON credential lên GitHub, không gửi qua chat. Đặt GOOGLE_CLOUD_PROJECT_ID trên hosting. Không dùng NEXT_PUBLIC_* cho credentials.

Nếu TTS lỗi, thao tác cần tạo audio sẽ báo lỗi và không lưu bản ghi thiếu audio. Có thể tải MP3/WAV thủ công thay thế. Khi chỉ sửa mô tả/ảnh/video, giữ audio cũ. Khi đổi chữ, sinh audio mới trừ khi upload bản thu mới. Nếu tạo lại thất bại, dữ liệu cũ được giữ. Không tự chạy batch dữ liệu cũ để tránh phí ngoài dự kiến. Demo, từ cũ chưa cập nhật và đọc từng tiếng riêng vẫn dùng Web Speech API.

Google có thể tính phí nếu vượt hạn mức; chỉ tạo khi lưu để tránh gọi API lặp lại. Tham khảo https://cloud.google.com/text-to-speech/docs/authentication và https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize .
