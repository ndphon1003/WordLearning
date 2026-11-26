import "server-only";
import {GoogleAuth} from "google-auth-library";
import {HttpError} from "./drive";

const auth=new GoogleAuth({scopes:["https://www.googleapis.com/auth/cloud-platform"]});
export async function synthesizeVietnamese(text:string):Promise<File>{
  const project=process.env.GOOGLE_CLOUD_PROJECT_ID?.trim();
  if(!project||!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project))throw new HttpError(503,"Chưa cấu hình GOOGLE_CLOUD_PROJECT_ID. Có thể tải MP3 thay thế.");
  const voice=process.env.GOOGLE_TTS_VOICE?.trim()||"vi-VN-Standard-A";
  if(!/^vi-VN-(Standard|Wavenet|Neural2)-[A-Z]$/.test(voice))throw new HttpError(503,"GOOGLE_TTS_VOICE không hợp lệ.");
  let token:string|null|undefined;
  try{token=await auth.getAccessToken();}catch{throw new HttpError(503,"Chưa cấp quyền Google Cloud Text-to-Speech (ADC). Xem hướng dẫn cấu hình hoặc tải MP3.");}
  if(!token)throw new HttpError(503,"Không lấy được quyền Text-to-Speech.");
  let response:Response;
  try{
    response=await fetch("https://texttospeech.googleapis.com/v1/text:synthesize",{
      method:"POST",headers:{Authorization:"Bearer "+token,"x-goog-user-project":project,"Content-Type":"application/json"},
      body:JSON.stringify({input:{text},voice:{languageCode:"vi-VN",name:voice},audioConfig:{audioEncoding:"MP3",speakingRate:0.85}}),
      cache:"no-store",signal:AbortSignal.timeout(30_000)
    });
  }catch{throw new HttpError(502,"Không kết nối được dịch vụ tạo giọng đọc. Vui lòng thử lại.");}
  if(!response.ok){
    await response.body?.cancel();
    if(response.status===401||response.status===403)throw new HttpError(503,"Text-to-Speech chưa có quyền, API chưa bật hoặc Billing chưa cấu hình.");
    if(response.status===429)throw new HttpError(429,"Đã chạm giới hạn tạo giọng đọc. Vui lòng thử lại sau.");
    if(response.status===400)throw new HttpError(400,"Google không chấp nhận cấu hình giọng đọc hoặc từ ngữ.");
    throw new HttpError(502,"Google Text-to-Speech chưa phản hồi thành công.");
  }
  let payload:{audioContent?:unknown};
  try{payload=await response.json();}catch{throw new HttpError(502,"Dữ liệu giọng đọc không hợp lệ.");}
  if(typeof payload.audioContent!=="string"||payload.audioContent.length>7*1024*1024)throw new HttpError(502,"Google không trả về âm thanh hợp lệ.");
  const bytes=Buffer.from(payload.audioContent,"base64");
  if(bytes.length<3||bytes.length>5*1024*1024||!(bytes.subarray(0,3).toString("ascii")==="ID3"||(bytes[0]===255&&(bytes[1]&224)===224)))throw new HttpError(502,"Dữ liệu MP3 không hợp lệ.");
  return new File([new Uint8Array(bytes)],"pronunciation.mp3",{type:"audio/mpeg"});
}
