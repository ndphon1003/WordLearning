"use client";
import {useEffect,useState,useCallback,useRef} from "react";
import {selectVietnameseVoice} from "../lib/audio-policy.mjs";
import {predictVietnamese} from "../lib/browser-tts";
import Link from "next/link";
import {colors,emojis,type Catalog,type Topic,type Word} from "../lib/model";
import Admin from "./Admin";
type Props={view:string[]};
function Art({src,emoji,label,large=false}:{src?:string;emoji:string;label:string;large?:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return <div className={"art"+(large?" art-large":"")}>{src&&!failed?<img src={src} alt={label} onError={()=>setFailed(true)}/>:<span role="img" aria-label={label}>{emoji}</span>}</div>;
}
// Shared stop handler: only one pronunciation plays at a time.
let activePronunciation:(()=>void)|undefined;
function Listen({word}:{word:Word}){
 const [message,setMessage]=useState("");
 const [phase,setPhase]=useState<"idle"|"loading"|"playing">("idle");
 const ownStop=useRef<(()=>void)|undefined>(undefined);
 const availableVoice=useRef<SpeechSynthesisVoice|undefined>(undefined);
 const prepared=useRef<{text:string;blob:Blob}|undefined>(undefined);
 useEffect(()=>{
  if(!("speechSynthesis" in window))return;
  const engine=window.speechSynthesis;
  const refresh=()=>{availableVoice.current=selectVietnameseVoice(engine.getVoices());};
  refresh();
  engine.addEventListener("voiceschanged",refresh);
  const retry=window.setTimeout(refresh,1000);
  return ()=>{engine.removeEventListener("voiceschanged",refresh);window.clearTimeout(retry);};
 },[]);
 useEffect(()=>()=>{ownStop.current?.();prepared.current=undefined;},[word.id,word.audio,word.text]);
 function speak(){
  activePronunciation?.();
  setMessage("");
  let cancelled=false;
  let fallbackStarted=false;
  let audio:HTMLAudioElement|undefined;
  let utterance:SpeechSynthesisUtterance|undefined;
  let context:AudioContext|undefined;
  let source:AudioBufferSourceNode|undefined;
  let objectUrl:string|undefined;
  let timer:number|undefined;
  const clearTimer=()=>{if(timer!==undefined){window.clearTimeout(timer);timer=undefined;}};
  const finish=(error?:string)=>{
   if(cancelled)return;
   cancelled=true;clearTimer();
   if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute("src");audio.load();}
   if(source){source.onended=null;try{source.stop();}catch{}source.disconnect();}
   if(context)void context.close().catch(()=>{});
   if(objectUrl)URL.revokeObjectURL(objectUrl);
   if(utterance){utterance.onend=null;utterance.onerror=null;utterance.onstart=null;window.speechSynthesis.cancel();}
   if(activePronunciation===stop)activePronunciation=undefined;
   if(ownStop.current===stop)ownStop.current=undefined;
   setPhase("idle");setMessage(error??"");
  };
  const stop=()=>finish();
  const arm=(ms:number,error:string)=>{clearTimer();timer=window.setTimeout(()=>finish(error),ms);};
  ownStop.current=stop;activePronunciation=stop;setPhase("loading");
  const playAudio=(url:string,error:string,generated=false)=>{
   if(cancelled)return;
   audio=new Audio(url);audio.onended=()=>finish();audio.onerror=()=>finish(error);
   setPhase("playing");setMessage("");arm(30000,error);
   void audio.play().catch(()=>finish(generated?"Trình duyệt chưa cho phát âm thanh. Bé nhấn Nghe phát âm lần nữa nhé!":error));
  };
  if(word.audio){playAudio(word.audio,"Không phát được bản thu. Nhờ người lớn kiểm tra nhé!");return;}
  // Unlock playback within the click gesture, before the model download or synthesis.
  try{if(typeof AudioContext!=="undefined"){context=new AudioContext();void context.resume().catch(()=>{});}}catch{}
  const playBlob=async(blob:Blob)=>{
   if(cancelled)return;
   prepared.current={text:word.text,blob};
   try{
    if(context&&context.state==="running"){
     const buffer=await context.decodeAudioData(await blob.arrayBuffer());
     if(cancelled)return;
     source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);
     source.onended=()=>finish();setPhase("playing");setMessage("");
     arm(30000,"Giọng đọc chưa phản hồi. Bé thử lại nhé!");source.start();return;
    }
   }catch{if(cancelled)return;}
   if(cancelled)return;
   objectUrl=URL.createObjectURL(blob);
   playAudio(objectUrl,"Không phát được giọng đọc. Bé thử lại nhé!",true);
  };
  const piperSpeech=()=>{
   if(cancelled||fallbackStarted)return;
   fallbackStarted=true;clearTimer();
   if(utterance){utterance.onend=null;utterance.onerror=null;utterance.onstart=null;window.speechSynthesis.cancel();utterance=undefined;}
   setPhase("loading");
   if(prepared.current?.text===word.text){void playBlob(prepared.current.blob);return;}
   setMessage("Đang chuẩn bị giọng đọc tiếng Việt. Lần đầu cần tải model AI…");
   arm(180000,"Tải giọng đọc quá lâu. Bé thử lại khi mạng ổn định nhé!");
   void predictVietnamese(word.text,percent=>{
    if(!cancelled)setMessage(percent===undefined?"Đang chuẩn bị giọng đọc…":percent<100?"Đang tải giọng đọc: "+percent+"%":"Đang tạo giọng đọc…");
   }).then(blob=>playBlob(blob)).catch(()=>{
    if(!cancelled)finish("Chưa tải được giọng đọc tiếng Việt. Kiểm tra mạng, dùng Chrome/HTTPS hoặc nhờ người lớn thêm bản thu.");
   });
  };
  if(prepared.current?.text===word.text){piperSpeech();return;}
  const engine="speechSynthesis" in window?window.speechSynthesis:undefined;
  const voice=engine?selectVietnameseVoice(engine.getVoices())??availableVoice.current:undefined;
  if(!engine||!voice){piperSpeech();return;}
  try{
   engine.cancel();engine.resume();
   utterance=new SpeechSynthesisUtterance(word.text);
   utterance.lang=voice.lang;utterance.voice=voice;utterance.rate=.8;
   utterance.onend=()=>finish();
   utterance.onerror=()=>piperSpeech();
   utterance.onstart=()=>{setPhase("playing");arm(15000,"Giọng đọc chưa phản hồi. Bé thử lại nhé!");};
   timer=window.setTimeout(piperSpeech,2500);
   engine.speak(utterance);
  }catch{piperSpeech();}
 }
 return <div className="listen"><button className="button blue" onClick={phase==="idle"?speak:()=>ownStop.current?.()} aria-label={phase==="idle"?"Nghe phát âm":"Dừng phát âm"}>{phase==="loading"?"⏳ Đang chuẩn bị… (Dừng)":phase==="playing"?"⏹ Dừng":"🔊 Nghe phát âm"}</button>{message&&<p className="small" role="status">{message}</p>}</div>;
}
export default function LearningApp({view}:Props){
 const [data,setData]=useState<Catalog|null>(null),[error,setError]=useState("");
 const load=useCallback(async()=>{try{setError("");const r=await fetch("/api/catalog",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d.error);setData(d);}catch(e){setError(e instanceof Error?e.message:"Không tải được bài học.");}},[]);
 useEffect(()=>{void load();},[load]);
 const topic=data?.topics.find(t=>t.id===view[1]);
 const words=data?.words.filter(w=>w.topicId===topic?.id)??[];
 const word=words.find(w=>w.id===view[3]);
 const isAdmin=view[0]==="admin";
 const [quiz,setQuiz]=useState<{target:Word;options:Word[]}|null>(null),[chosen,setChosen]=useState("");
 useEffect(()=>{setQuiz(null);setChosen("");},[view.join("/")]);
 function startQuiz(){
  if(words.length<3)return;
  const shuffled=[...words].sort(()=>Math.random()-.5);
  const options=shuffled.slice(0,3);
  setQuiz({target:options[Math.floor(Math.random()*options.length)],options});setChosen("");
 }
 return <div className="shell"><header className="header"><Link className="brand" href="/"><span className="logo">🌈</span><span>Bé vui học<br/><b>Tiếng Việt</b></span></Link><nav>{view.length>0&&<Link className="nav-button" href="/">🏠 Trang chủ</Link>}{!isAdmin&&<Link className="admin-link" href="/admin" aria-label="Quản trị dành cho người lớn">⚙ <span>Người lớn</span></Link>}</nav></header>
 <main id="main">
 {error&&<div className="notice" role="alert">{error} <button className="pill" onClick={load}>Thử lại</button></div>}
 {!data&&!error&&<p className="loading" role="status">🌟 Đang tải bài học…</p>}
 {data&&<>{data.demo&&<div className="demo-banner">Bản demo chỉ đọc · dữ liệu minh họa, chưa kết nối Drive</div>}
 {isAdmin?<Admin data={data} reload={load}/>:view.length===0?<><section className="hero"><div><span className="eyebrow">MỖI NGÀY MỘT TỪ MỚI</span><h1>Hôm nay bé<br/>học gì nào?</h1><p>Cùng khám phá thế giới xung quanh nhé!</p></div><div className="hero-mascot" aria-hidden="true">🐻<span>⭐</span></div></section><h2>Chọn chủ đề yêu thích</h2>{!data.topics.length?<div className="empty">Chưa có chủ đề. Nhờ người lớn thêm bài học nhé!</div>:<div className="cards">{data.topics.map(t=><Link key={t.id} className="tile" style={{background:t.color}} href={"/topics/"+t.id}><Art src={t.cover} emoji={t.emoji} label={t.name}/><h3>{t.name}</h3><span className="tile-detail">{data.words.filter(w=>w.topicId===t.id).length} từ ngữ · Khám phá →</span></Link>)}</div>}</>:
 view[0]==="topics"&&topic&&view.length===2?<><Link className="back" href="/">← Các chủ đề</Link><section className="topic-hero" style={{background:topic.color}}><span>{topic.emoji}</span><div><h1>{topic.name}</h1><p>{topic.description}</p></div></section><div className="section-title"><h2>Chọn từ bé muốn học</h2>{words.length>=3&&<button className="button orange" onClick={startQuiz}>⭐ Chơi ôn tập</button>}</div>
 {quiz&&<section className="quiz"><h2>Bé chọn hình đúng nhé!</h2><p className="quiz-word">{quiz.target.text}</p><Listen word={quiz.target}/><div className="cards quiz-cards">{quiz.options.map(w=><button key={w.id} className={"tile quiz-option "+(chosen===w.id?(w.id===quiz.target.id?"correct":"incorrect"):"")} onClick={()=>setChosen(w.id)} aria-label={w.text}><Art src={w.image} emoji={w.emoji} label={w.text}/></button>)}</div><p role="status">{chosen===quiz.target.id?"⭐ Bé giỏi quá!":chosen?"Bé thử lại nhé!":"Chạm vào một hình."}</p><button className="pill" onClick={startQuiz}>Câu khác</button> <button className="pill" onClick={()=>setQuiz(null)}>Đóng</button></section>}
 <div className="cards">{words.map(w=><Link className="tile word-tile" href={"/topics/"+topic.id+"/words/"+w.id} key={w.id}><Art src={w.image} emoji={w.emoji} label={w.text}/><h3>{w.text}</h3><span className="tile-detail">Học ngay →</span></Link>)}</div>{!words.length&&<div className="empty">Chủ đề này chưa có từ ngữ.</div>}</>:
 view[0]==="topics"&&view[2]==="words"&&view.length===4&&topic&&word?<><Link className="back" href={"/topics/"+topic.id}>← {topic.name}</Link><article className="word-detail"><div className="word-top"><span className="eyebrow">TỪ NGỮ CỦA BÉ</span><h1>{word.text}</h1><Listen key={word.id} word={word}/></div><Art src={word.image} emoji={word.emoji} label={word.text} large/>{word.description&&<p className="word-description">{word.description}</p>}<section><h2>🎬 Cùng tìm hiểu</h2>{word.video?<video key={word.video+word.updatedAt} src={word.video} controls playsInline preload="metadata" aria-label={"Video giới thiệu "+word.text}/>:<p className="empty">Chưa có video minh họa.</p>}</section><div className="word-nav">{words.indexOf(word)>0?<Link className="button ghost" href={"/topics/"+topic.id+"/words/"+words[words.indexOf(word)-1].id}>← Từ trước</Link>:<span/>}{words.indexOf(word)<words.length-1?<Link className="button blue" href={"/topics/"+topic.id+"/words/"+words[words.indexOf(word)+1].id}>Từ tiếp theo →</Link>:<Link className="button blue" href={"/topics/"+topic.id}>Về chủ đề →</Link>}</div></article></>:<div className="empty">Không tìm thấy bài học. <Link href="/">Về trang chủ</Link></div>}</>}
 </main><footer>🌱 Học một chút mỗi ngày, lớn khôn từng ngày.</footer></div>;
}
