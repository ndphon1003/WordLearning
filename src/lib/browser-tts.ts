"use client";

export const VIETNAMESE_VOICE="vi_VN-vais1000-medium" as const;
type Progress=(percent:number|undefined)=>void;
type Job={text:string;promise:Promise<Blob>;listeners:Set<Progress>;percent:number|undefined};
let pending:Job|undefined;
// Small, tab-local LRU cache of synthesized audio. Never persisted to Drive or disk.
const cache=new Map<string,Blob>();
const MAX_CACHE_BYTES=4*1024*1024;
let cacheBytes=0;
const key=(text:string)=>text.normalize("NFC").trim();
export function getCachedVietnamese(text:string):Blob|undefined{
 const k=key(text),blob=cache.get(k);
 if(blob){cache.delete(k);cache.set(k,blob);}
 return blob;
}
function remember(text:string,blob:Blob){
 if(blob.size>MAX_CACHE_BYTES)return;
 const previous=cache.get(text);
 if(previous){cacheBytes-=previous.size;cache.delete(text);}
 cache.set(text,blob);cacheBytes+=blob.size;
 while(cache.size>12||cacheBytes>MAX_CACHE_BYTES){
  const oldest=cache.keys().next().value;
  if(oldest===undefined)break;
  cacheBytes-=cache.get(oldest)!.size;cache.delete(oldest);
 }
}

// vits-web uses shared WASM state. Serialize requests and share in-flight work for the same word.
export async function predictVietnamese(text:string,onProgress:Progress):Promise<Blob>{
 const normalized=key(text);
 if(!normalized||normalized.length>60)throw new Error("Invalid word");
 const cached=getCachedVietnamese(normalized);if(cached){onProgress(100);return cached;}
 if(!window.isSecureContext||!navigator.storage?.getDirectory)throw new Error("Secure browser storage required");
 while(pending&&pending.text!==normalized){
  const earlier=pending;
  onProgress(undefined);
  try{await earlier.promise;}catch{}
 }
 const ready=getCachedVietnamese(normalized);if(ready){onProgress(100);return ready;}
 if(!pending){
  const listeners=new Set<Progress>();
  const job:Job={text:normalized,listeners,percent:undefined,promise:Promise.resolve().then(async()=>{
   const tts=await import("@diffusionstudio/vits-web");
   const blob=await tts.predict({text:normalized,voiceId:VIETNAMESE_VOICE},progress=>{
    job.percent=progress.total>0?Math.max(0,Math.min(100,Math.round(progress.loaded*100/progress.total))):undefined;
    for(const listener of listeners)listener(job.percent);
   });
   if(!blob.size)throw new Error("Empty pronunciation");
   remember(normalized,blob);
   return blob;
  })};
  pending=job;
  // Clear only our job; attaching both handlers prevents unhandled rejections.
  void job.promise.then(()=>{if(pending===job)pending=undefined;},()=>{if(pending===job)pending=undefined;});
 }
 const job=pending;
 job.listeners.add(onProgress);onProgress(job.percent);
 try{return await job.promise;}finally{job.listeners.delete(onProgress);}
}
