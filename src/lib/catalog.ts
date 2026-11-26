import "server-only";
import {randomUUID} from "node:crypto";
import {addMedia,addRecord,cleanup,entries,entry,HttpError,trash,updateRecord,type StoredTopic,type StoredWord} from "./drive";
import {color,emoji,field,id,media} from "./security";
import {mediaUrl,type Catalog,type Topic,type Word} from "./model";
import {demo} from "./demo";
import {audioAction} from "./audio-policy.mjs";
export function publicTopic(t:StoredTopic):Topic{const {coverId,...v}=t;return {...v,...(coverId?{cover:mediaUrl("topic",v.id,"cover")}:{})};}
export function publicWord(w:StoredWord):Word{const {imageId,videoId,audioId,...v}=w;return {...v,...(imageId?{image:mediaUrl("word",v.id,"image")} : {}),...(videoId?{video:mediaUrl("word",v.id,"video")} : {}),...(audioId?{audio:mediaUrl("word",v.id,"audio")+"?v="+encodeURIComponent(v.updatedAt)} : {})};}
export async function catalog():Promise<Catalog>{
  if(process.env.DEMO_MODE==="true")return demo;
  const [topics,words]=await Promise.all([entries<StoredTopic>("topic"),entries<StoredWord>("word")]);
  const ids=new Set(topics.map(t=>t.value.id));
  return {topics:topics.map(t=>publicTopic(t.value)),words:words.filter(w=>ids.has(w.value.topicId)).map(w=>publicWord(w.value)),demo:false};
}
const stamp=()=>new Date().toISOString();
async function upload(owner:string,slot:string,file:File|undefined,created:string[]){
  if(!file)return undefined;const data=await addMedia(owner,slot,file);created.push(data.id);return data.id;
}
export async function saveTopic(form:FormData,key?:string){
  const old=key?await entry<StoredTopic>("topic",key):undefined;
  const value:StoredTopic={id:old?.value.id??randomUUID(),name:field(form,"name",1,60),description:field(form,"description",0,200),emoji:emoji(form),color:color(form),createdAt:old?.value.createdAt??stamp(),updatedAt:stamp(),coverId:old?.value.coverId};
  const cover=await media(form,"cover",!old);
  const created:string[]=[];
  try{
    if(cover)value.coverId=await upload(value.id,"cover",cover,created);
    if(old)await updateRecord(old.file,value);else await addRecord("topic",value);
  }catch(e){await cleanup(created);throw e;}
  if(cover&&old?.value.coverId)await cleanup([old.value.coverId]);
  return publicTopic(value);
}
export async function saveWord(form:FormData,key?:string){
  const old=key?await entry<StoredWord>("word",key):undefined;
  const topicId=id(field(form,"topicId",36,36));
  await entry<StoredTopic>("topic",topicId);
  if(old&&old.value.topicId!==topicId)throw new HttpError(400,"Không thể đổi chủ đề của từ ngữ.");
  const value:StoredWord={id:old?.value.id??randomUUID(),topicId,text:field(form,"text",1,60),description:field(form,"description",0,300),emoji:emoji(form),createdAt:old?.value.createdAt??stamp(),updatedAt:stamp(),imageId:old?.value.imageId,videoId:old?.value.videoId,audioId:old?.value.audioId};
  const [image,video,manualAudio]=await Promise.all([media(form,"image",!old),media(form,"video",!old),media(form,"audio")]);
  const action=audioAction({previousText:old?.value.text,text:value.text,hasAudio:!!old?.value.audioId,uploaded:!!manualAudio});
  if(action==="required")throw new HttpError(400,"Hãy tải bản thu âm MP3/WAV cho từ ngữ này.");
  const audio=manualAudio;
  const created:string[]=[];const replaced:string[]=[];
  try{
    for(const [slot,file,prop] of [["image",image,"imageId"],["video",video,"videoId"],["audio",audio,"audioId"]] as const){
      if(file){if(value[prop])replaced.push(value[prop]!);value[prop]=await upload(value.id,slot,file,created);}
    }
    if(old)await updateRecord(old.file,value);else await addRecord("word",value);
  }catch(e){await cleanup(created);throw e;}
  await cleanup(replaced);
  return publicWord(value);
}
export async function deleteRecord(kind:"topic"|"word",key:string){
  if(kind==="topic"){
    const t=await entry<StoredTopic>("topic",key);
    if((await entries<StoredWord>("word",key)).length)throw new HttpError(409,"Hãy xóa các từ trong chủ đề trước.");
    await trash(t.file.id);await cleanup(t.value.coverId?[t.value.coverId]:[]);
  }else{
    const w=await entry<StoredWord>("word",key);
    await trash(w.file.id);await cleanup([w.value.imageId,w.value.videoId,w.value.audioId].filter((x):x is string=>!!x));
  }
}
