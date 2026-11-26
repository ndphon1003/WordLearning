import "server-only";
import {OAuth2Client} from "google-auth-library";
import {randomUUID} from "node:crypto";
import type {Topic,Word} from "./model";

export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export type Kind="topic"|"word";
type DriveFile={id:string;name?:string;mimeType?:string;parents?:string[];appProperties?:Record<string,string>};
type List={files?:DriveFile[];nextPageToken?:string};
export type StoredTopic=Omit<Topic,"cover">&{coverId?:string};
export type StoredWord=Omit<Word,"image"|"video"|"audio">&{imageId?:string;videoId?:string;audioId?:string};
export type Stored=StoredTopic|StoredWord;
export type Entry<T extends Stored=Stored>={file:DriveFile;value:T};
const fields="id,name,mimeType,parents,appProperties";
const base="https://www.googleapis.com/drive/v3/";
const uploadBase="https://www.googleapis.com/upload/drive/v3/";
let client:OAuth2Client|undefined;
function root(){
  const id=process.env.GOOGLE_DRIVE_FOLDER_ID;
  if(!id||!/^[A-Za-z0-9_-]+$/.test(id)) throw new HttpError(503,"Chưa cấu hình thư mục Google Drive.");
  return id;
}
async function token(){
  if(!client){
    const {GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,GOOGLE_REFRESH_TOKEN}=process.env;
    if(!GOOGLE_CLIENT_ID||!GOOGLE_CLIENT_SECRET||!GOOGLE_REFRESH_TOKEN) throw new HttpError(503,"Chưa cấu hình Google Drive.");
    client=new OAuth2Client(GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET);
    client.setCredentials({refresh_token:GOOGLE_REFRESH_TOKEN});
  }
  const {token}=await client.getAccessToken();
  if(!token) throw new HttpError(503,"Không thể kết nối Google Drive.");
  return token;
}
async function request(url:string,init:RequestInit={},allowed:number[]=[]){
  const h=new Headers(init.headers);
  h.set("Authorization","Bearer "+await token());
  const response=await fetch(url,{...init,headers:h,cache:"no-store"});
  if(!response.ok&&!allowed.includes(response.status)){
    await response.body?.cancel();
    if(response.status===404) throw new HttpError(404,"Không tìm thấy dữ liệu.");
    throw new HttpError(502,"Google Drive chưa phản hồi thành công.");
  }
  return response;
}
function url(path:string,query:Record<string,string>={}){
  return base+path+"?"+new URLSearchParams(query);
}
async function list(kind:Kind,topicId?:string,id?:string){
  const clauses=["'"+root()+"' in parents","trashed = false","appProperties has { key='wlKind' and value='"+kind+"' }"];
  if(topicId) clauses.push("appProperties has { key='topicId' and value='"+topicId+"' }");
  if(id) clauses.push("appProperties has { key='recordId' and value='"+id+"' }");
  let pageToken:string|undefined;
  const files:DriveFile[]=[];
  do{
    const r=await request(url("files",{q:clauses.join(" and "),fields:"nextPageToken,files("+fields+")",pageSize:"100",...(pageToken?{pageToken}:{})}));
    const data=await r.json() as List;
    files.push(...(data.files??[]));pageToken=data.nextPageToken;
  }while(pageToken);
  return files;
}
async function read<T extends Stored>(file:DriveFile):Promise<Entry<T>>{
  if(file.mimeType!=="application/json")throw new HttpError(502,"Dữ liệu lưu trữ không hợp lệ.");
  const r=await request(url("files/"+encodeURIComponent(file.id),{alt:"media"}));
  const value=await r.json() as T;
  if(value.id!==file.appProperties?.recordId) throw new HttpError(502,"Bản ghi không hợp lệ.");
  if("topicId" in value && value.topicId!==file.appProperties?.topicId) throw new HttpError(502,"Chủ đề không hợp lệ.");
  return {file,value};
}
export async function entries<T extends Stored>(kind:Kind,topicId?:string){
  const all=await list(kind,topicId);
  const result:Entry<T>[]=[];
  for(let i=0;i<all.length;i+=8)result.push(...await Promise.all(all.slice(i,i+8).map(f=>read<T>(f))));
  return result.sort((a,b)=>a.value.createdAt.localeCompare(b.value.createdAt));
}
export async function entry<T extends Stored>(kind:Kind,id:string){
  const files=await list(kind,undefined,id);
  if(files.length!==1) throw new HttpError(files.length?409:404,"Không tìm thấy bản ghi duy nhất.");
  return read<T>(files[0]);
}
async function multipart(metadata:object,data:Uint8Array,mime:string){
  const boundary="wl_"+randomUUID();
  const body=Buffer.concat([Buffer.from("--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+JSON.stringify(metadata)+"\r\n--"+boundary+"\r\nContent-Type: "+mime+"\r\n\r\n"),Buffer.from(data),Buffer.from("\r\n--"+boundary+"--\r\n")]);
  const response=await request(uploadBase+"files?uploadType=multipart&fields="+encodeURIComponent(fields),{method:"POST",headers:{"Content-Type":"multipart/related; boundary="+boundary},body:new Uint8Array(body)});
  return await response.json() as DriveFile;
}
export async function addRecord(kind:Kind,value:Stored){
  return multipart({name:kind+"-"+value.id+".json",parents:[root()],mimeType:"application/json",appProperties:{wlKind:kind,recordId:value.id,...("topicId" in value?{topicId:value.topicId}:{})}},Buffer.from(JSON.stringify(value)),"application/json");
}
export async function updateRecord(file:DriveFile,value:Stored){
  const r=await request(uploadBase+"files/"+encodeURIComponent(file.id)+"?uploadType=media",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
  await r.body?.cancel();
}
export async function addMedia(ownerId:string,slot:string,file:File){
  const data=new Uint8Array(await file.arrayBuffer());
  return multipart({name:ownerId+"-"+slot+"."+({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4","audio/mpeg":"mp3","audio/wav":"wav"}[file.type]??"bin"),parents:[root()],mimeType:file.type,appProperties:{wlKind:"media",ownerId,slot}},data,file.type);
}
export async function trash(id:string){
  const r=await request(url("files/"+encodeURIComponent(id)),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({trashed:true})});
  await r.body?.cancel();
}
export async function cleanup(ids:string[]){
  for(const id of ids){try{await trash(id);}catch{console.warn("WordLearning: orphan cleanup required");}}
}
export async function streamMedia(id:string,ownerId:string,slot:string,range:string|null){
  const info=await request(url("files/"+encodeURIComponent(id),{fields:fields+",trashed"}));
  const f=await info.json() as DriveFile&{trashed?:boolean};
  const types=slot==="video"?["video/mp4"]:slot==="audio"?["audio/mpeg","audio/wav"]:["image/jpeg","image/png","image/webp"];
  if(f.trashed||!f.parents?.includes(root())||f.appProperties?.wlKind!=="media"||f.appProperties.ownerId!==ownerId||f.appProperties.slot!==slot||!types.includes(f.mimeType??""))throw new HttpError(404,"Không tìm thấy media.");
  if(range&&!/^bytes=(\d+-\d*|-\d+)$/.test(range))throw new HttpError(416,"Range không hợp lệ.");
  const r=await request(url("files/"+encodeURIComponent(id),{alt:"media"}),{headers:range?{Range:range}:{}},[416]);
  const headers=new Headers({"Content-Type":f.mimeType!,"Cache-Control":"public, max-age=60","X-Content-Type-Options":"nosniff","Accept-Ranges":"bytes"});
  for(const key of ["content-length","content-range"]){const value=r.headers.get(key);if(value)headers.set(key,value);}
  return new Response(r.body,{status:r.status,headers});
}
