"use client";

export const VIETNAMESE_VOICE="vi_VN-vais1000-medium" as const;
type Progress=(percent:number|undefined)=>void;
type Job={text:string;promise:Promise<Blob>;listeners:Set<Progress>;percent:number|undefined};
let pending:Job|undefined;

// vits-web uses shared WASM state. Serialize requests and share in-flight work for the same word.
export async function predictVietnamese(text:string,onProgress:Progress):Promise<Blob>{
 const normalized=text.normalize("NFC").trim();
 if(!normalized||normalized.length>60)throw new Error("Invalid word");
 if(!window.isSecureContext||!navigator.storage?.getDirectory)throw new Error("Secure browser storage required");
 while(pending&&pending.text!==normalized){
  const earlier=pending;
  onProgress(undefined);
  try{await earlier.promise;}catch{}
 }
 if(!pending){
  const listeners=new Set<Progress>();
  const job:Job={text:normalized,listeners,percent:undefined,promise:Promise.resolve().then(async()=>{
   const tts=await import("@diffusionstudio/vits-web");
   const blob=await tts.predict({text:normalized,voiceId:VIETNAMESE_VOICE},progress=>{
    job.percent=progress.total>0?Math.max(0,Math.min(100,Math.round(progress.loaded*100/progress.total))):undefined;
    for(const listener of listeners)listener(job.percent);
   });
   if(!blob.size)throw new Error("Empty pronunciation");
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
