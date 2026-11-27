import {catalog,clearCatalogCache,deleteRecord,saveTopic,saveWord} from "../../../lib/catalog";
import {cachedEntry,clearDriveReadCache,HttpError,streamMedia,type StoredTopic,type StoredWord} from "../../../lib/drive";
import {form,guard,id,serial} from "../../../lib/security";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Context={params:Promise<{path:string[]}>};
function json(data:unknown,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}});}
function failure(error:unknown){if(error instanceof HttpError)return json({error:error.message},error.status);console.error("WordLearning: unexpected request failure");return json({error:"Hệ thống đang gặp sự cố. Vui lòng thử lại."},500);}
export async function GET(req:Request,ctx:Context){
  try{
    const p=(await ctx.params).path;
    if(p[0]==="media"&&p.length===4){
      if(process.env.DEMO_MODE==="true")throw new HttpError(404,"Demo không có tệp media.");
      const key=id(p[2]);const slot=p[3];let file:string|undefined;let version:string|undefined;
      if(p[1]==="topic"&&slot==="cover"){const t=(await cachedEntry<StoredTopic>("topic",key)).value;file=t.coverId;version=t.updatedAt;}
      else if(p[1]==="word"&&["image","video","audio"].includes(slot)){
        const w=(await cachedEntry<StoredWord>("word",key)).value;
        await cachedEntry<StoredTopic>("topic",w.topicId);version=w.updatedAt;
        file=slot==="image"?w.imageId:slot==="video"?w.videoId:w.audioId;
      }
      if(!file)throw new HttpError(404,"Không tìm thấy media.");
      const requestedVersion=new URL(req.url).searchParams.get("v");
      if(requestedVersion&&requestedVersion!==version)throw new HttpError(404,"Phiên bản media đã thay đổi. Hãy mở lại bài học.");
      return await streamMedia(file,key,slot,req.headers.get("range"),!!requestedVersion);
    }
    if(p.length===1&&p[0]==="catalog")return json(await catalog());
    if(!["topics","words"].includes(p[0]))throw new HttpError(404,"Không tìm thấy.");
    const data=await catalog();
    if(p[0]==="topics"&&p.length===1)return json(data.topics);
    if(p[0]==="topics"&&p.length===2){const t=data.topics.find(t=>t.id===id(p[1]));if(t)return json(t);}
    if(p[0]==="topics"&&p.length===3&&p[2]==="words"){const k=id(p[1]);if(data.topics.some(t=>t.id===k))return json(data.words.filter(w=>w.topicId===k));}
    if(p[0]==="words"&&p.length===2){const w=data.words.find(w=>w.id===id(p[1]));if(w)return json(w);}
    throw new HttpError(404,"Không tìm thấy.");
  }catch(e){return failure(e);}
}
async function write<T>(action:()=>Promise<T>):Promise<T>{
  return serial(async()=>{
    clearCatalogCache();clearDriveReadCache();
    try{return await action();}finally{clearCatalogCache();clearDriveReadCache();}
  });
}
async function mutate(req:Request,ctx:Context){
  try{
    const p=(await ctx.params).path;
    if(p[0]!=="admin"||!["topics","words"].includes(p[1]))throw new HttpError(404,"Không tìm thấy.");
    guard(req);
    const kind=p[1]==="topics"?"topic":"word";
    if(req.method==="DELETE"&&p.length===3){await write(()=>deleteRecord(kind,id(p[2])));return json({ok:true});}
    if((req.method==="POST"&&p.length===2)||(req.method==="PATCH"&&p.length===3)){
      const key=p.length===3?id(p[2]):undefined;
      const data=await form(req);
      const value=await write(async()=>kind==="topic"?await saveTopic(data,key):await saveWord(data,key));
      return json(value,req.method==="POST"?201:200);
    }
    throw new HttpError(405,"Thao tác không hợp lệ.");
  }catch(e){return failure(e);}
}
export const POST=mutate;
export const PATCH=mutate;
export const DELETE=mutate;
