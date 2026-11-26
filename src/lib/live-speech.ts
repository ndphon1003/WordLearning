import "server-only";
import {execFile} from "node:child_process";
import {HttpError} from "./drive";

// Only published words, never arbitrary command-line or user-supplied synthesis text.
// The optional local executable is configured by the server owner. No shell, files or cloud API.
let active=0;
export async function liveSpeech(text:string):Promise<Response>{
  if(!text.trim()||text.length>60)throw new HttpError(400,"Từ ngữ không hợp lệ.");
  if(active>=3)throw new HttpError(429,"Giọng đọc đang bận. Bé thử lại nhé!");
  const executable=process.env.ESPEAK_NG_PATH?.trim()||"espeak-ng";
  active++;
  try{
    const wav=await new Promise<Buffer>((resolve,reject)=>{
      const child=execFile(executable,["-v","vi","-s","140","-b","1","--stdout","--stdin"],{encoding:"buffer",timeout:5000,maxBuffer:2*1024*1024,windowsHide:true,shell:false},(error,stdout)=>{
        if(error)reject(error);else resolve(stdout);
      });
      child.stdin?.on("error",()=>{});
      child.stdin?.end(text.normalize("NFC"),"utf8");
    }).catch(()=>{throw new HttpError(503,"Máy chủ chưa có giọng đọc eSpeak NG. Nhờ người lớn cài đặt hoặc tải bản thu.");});
    if(wav.length<44||wav.toString("ascii",0,4)!=="RIFF"||wav.toString("ascii",8,12)!=="WAVE")throw new HttpError(502,"Giọng đọc chưa sẵn sàng.");
    // eSpeak may use placeholder lengths when writing to stdout. Correct the WAV container in memory.
    let offset=12;
    let found=false;
    while(offset+8<=wav.length){
      const size=wav.readUInt32LE(offset+4);
      if(wav.toString("ascii",offset,offset+4)==="data"){
        wav.writeUInt32LE(wav.length-offset-8,offset+4);found=true;break;
      }
      if(size>wav.length-offset-8)break;
      offset+=8+size+(size%2);
    }
    if(!found)throw new HttpError(502,"Dữ liệu giọng đọc không hợp lệ.");
    wav.writeUInt32LE(wav.length-8,4);
    return new Response(new Uint8Array(wav),{headers:{"Content-Type":"audio/wav","Content-Length":String(wav.length),"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
  }finally{active--;}
}
