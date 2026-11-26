import "server-only";
import {createHash,timingSafeEqual} from "node:crypto";
import {HttpError} from "./drive";
import {colors,emojis,isId} from "./model";

let failed:number[]=[];
const digest=(v:string)=>createHash("sha256").update(v).digest();
export function guard(request:Request){
  if(process.env.DEMO_MODE==="true")throw new HttpError(403,"Chế độ demo chỉ đọc.");
  const secret=process.env.ADMIN_PASSWORD;
  if(!secret||secret.length<12)throw new HttpError(503,"Mật khẩu quản trị chưa được cấu hình an toàn.");
  const now=Date.now();failed=failed.filter(t=>now-t<60_000);
  if(failed.length>=8)throw new HttpError(429,"Thử lại sau một phút.");
  const supplied=request.headers.get("x-admin-password")??"";
  if(supplied.length>256||!timingSafeEqual(digest(supplied),digest(secret))){
    failed.push(now);throw new HttpError(401,"Mật khẩu không đúng.");
  }
}
const maxBody=42*1024*1024;
export async function form(request:Request){
  const type=request.headers.get("content-type")??"";
  if(!type.startsWith("multipart/form-data;"))throw new HttpError(415,"Yêu cầu multipart/form-data.");
  const length=Number(request.headers.get("content-length")??0);
  if(length>maxBody)throw new HttpError(413,"Tệp quá lớn.");
  const reader=request.body?.getReader();
  if(!reader)throw new HttpError(400,"Thiếu nội dung.");
  const chunks:Uint8Array[]=[];let total=0;
  try{while(true){const r=await reader.read();if(r.done)break;total+=r.value.byteLength;if(total>maxBody){await reader.cancel();throw new HttpError(413,"Tổng dữ liệu vượt quá 42 MB.");}chunks.push(r.value);}}finally{reader.releaseLock();}
  const buffer=new Uint8Array(Buffer.concat(chunks));
  try{return await new Response(buffer,{headers:{"Content-Type":type}}).formData();}
  catch{throw new HttpError(400,"Dữ liệu upload không hợp lệ.");}
}
export function field(f:FormData,key:string,min:number,max:number){
  const value=f.get(key);
  if(typeof value!=="string")throw new HttpError(400,"Thiếu trường "+key);
  const text=value.normalize("NFC").trim();
  if(text.length<min||text.length>max)throw new HttpError(400,"Độ dài "+key+" không hợp lệ.");
  return text;
}
export function id(value:string){if(!isId(value))throw new HttpError(400,"ID không hợp lệ.");return value;}
export function color(f:FormData){const v=field(f,"color",1,7);if(!colors.includes(v))throw new HttpError(400,"Màu không hợp lệ.");return v;}
export function emoji(f:FormData){const v=field(f,"emoji",1,16);if(!emojis.includes(v))throw new HttpError(400,"Biểu tượng không hợp lệ.");return v;}
export async function media(f:FormData,key:string,required=false){
  const raw=f.get(key);
  if(!(raw instanceof File)||raw.size===0){if(required)throw new HttpError(400,"Vui lòng chọn "+key);return undefined;}
  const types=key==="video"?["video/mp4"]:key==="audio"?["audio/mpeg","audio/wav"]:["image/jpeg","image/png","image/webp"];
  const limit=(key==="video"?30:key==="audio"?5:5)*1024*1024;
  if(raw.size>limit||!types.includes(raw.type))throw new HttpError(400,"Định dạng hoặc kích thước "+key+" không hợp lệ.");
  const h=Buffer.from(await raw.slice(0,16).arrayBuffer());
  const str=(a:number,b:number)=>h.toString("ascii",a,b);
  const ok=raw.type==="image/jpeg"?h[0]===255&&h[1]===216&&h[2]===255:
    raw.type==="image/png"?h.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
    raw.type==="image/webp"?str(0,4)==="RIFF"&&str(8,12)==="WEBP":
    raw.type==="video/mp4"?str(4,8)==="ftyp":
    raw.type==="audio/wav"?str(0,4)==="RIFF"&&str(8,12)==="WAVE":
    str(0,3)==="ID3"||(h[0]===255&&(h[1]&224)===224);
  if(!ok)throw new HttpError(400,"Nội dung tệp "+key+" không đúng định dạng.");
  return raw;
}
let tail:Promise<void>=Promise.resolve();
export async function serial<T>(action:()=>Promise<T>):Promise<T>{
  const previous=tail;let release!:()=>void;tail=new Promise<void>(r=>release=r);
  await previous;
  try{return await action();}finally{release();}
}
