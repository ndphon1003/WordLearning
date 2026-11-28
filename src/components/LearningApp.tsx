"use client";
import {useEffect,useState,useCallback,useRef} from "react";
import Link from "next/link";
import {type Catalog,type Word} from "../lib/model";
import Admin from "./Admin";
type Props={view:string[]};
function Art({src,emoji,label,large=false}:{src?:string;emoji:string;label:string;large?:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return <div className={"art"+(large?" art-large":"")}>{src&&!failed?<img src={src} alt={label} onError={()=>setFailed(true)}/>:<span role="img" aria-label={label}>{emoji}</span>}</div>;
}
// Only one recording plays at a time; changing lessons stops it.
let activePronunciation:(()=>void)|undefined;
function Listen({word,onSelect,label="Âm thanh",preload=false}:{word:Word;onSelect?:()=>void;label?:string;preload?:boolean}){
 const [message,setMessage]=useState("");
 const [playing,setPlaying]=useState(false);
 const [buffering,setBuffering]=useState(false);
 const ownStop=useRef<(()=>void)|undefined>(undefined);
 const audioRef=useRef<HTMLAudioElement|undefined>(undefined);
 useEffect(()=>{
  setMessage("");
  // Prepare only the open lesson's short recording; never autoplay.
  if(preload&&word.audio){
   const audio=new Audio(word.audio);audio.preload="auto";audioRef.current=audio;
  }
  return ()=>{
   ownStop.current?.();
   const audio=audioRef.current;
   if(audio){audio.pause();audio.removeAttribute("src");audio.load();audioRef.current=undefined;}
  };
 },[word.id,word.audio,preload]);
 function play(){
  if(ownStop.current){ownStop.current();return;}
  activePronunciation?.();onSelect?.();setMessage("");
  if(!word.audio){setMessage("Từ này chưa có bản thu âm. Nhờ người lớn bổ sung nhé!");return;}
  const audio=audioRef.current??new Audio(word.audio);audioRef.current=audio;
  let stopped=false;
  const finish=(error?:string)=>{
   if(stopped)return;stopped=true;
   audio.onended=null;audio.onerror=null;audio.onplaying=null;audio.onwaiting=null;audio.pause();
   try{audio.currentTime=0;}catch{/* Media may not have loaded yet. */}
   if(activePronunciation===stop)activePronunciation=undefined;
   if(ownStop.current===stop)ownStop.current=undefined;
   setPlaying(false);setBuffering(false);setMessage(error??"");
   if(error){audio.removeAttribute("src");audio.load();audioRef.current=undefined;}
  };
  const stop=()=>finish();
  ownStop.current=stop;activePronunciation=stop;setPlaying(true);setBuffering(audio.readyState<3);
  audio.onplaying=()=>setBuffering(false);audio.onwaiting=()=>setBuffering(true);
  audio.playbackRate=1; // Preserve the teacher's recorded pronunciation.
  audio.onended=()=>finish();
  audio.onerror=()=>finish("Không phát được âm thanh. Bé thử lại nhé!");
  void audio.play().catch(()=>finish("Không phát được âm thanh. Bé thử lại nhé!"));
 }
 return <div className="listen"><button type="button" className="button blue" onClick={play} aria-label={playing?"Dừng âm thanh":label} aria-pressed={playing}><span className="action-icon" aria-hidden="true">{playing?"⏹":"🔊"}</span><span>{buffering?"Đang tải…":playing?"Dừng":label}</span></button>{message&&<p className="small" role="status">{message}</p>}</div>;
}
function WordMedia({word}:{word:Word}){
 const [panel,setPanel]=useState<"image"|"video"|null>(null);
 // Warm the browser image cache without rendering the image.
 useEffect(()=>{
  if(!word.image)return;
  const image=new Image();image.src=word.image;
 },[word.image]);
 function toggle(next:"image"|"video"){
  activePronunciation?.();
  setPanel(current=>current===next?null:next);
 }
 return <div className="word-media">
  <div className="media-actions" role="group" aria-label="Khám phá từ ngữ">
   <Listen word={word} preload onSelect={()=>setPanel(null)}/>
   <button type="button" className="button image-button" aria-expanded={panel==="image"} aria-controls="word-media-panel" onClick={()=>toggle("image")}><span className="action-icon" aria-hidden="true">🖼️</span><span>Hình ảnh</span></button>
   <button type="button" className="button video-button" aria-expanded={panel==="video"} aria-controls="word-media-panel" onClick={()=>toggle("video")}><span className="action-icon" aria-hidden="true">🎬</span><span>Video</span></button>
  </div>
  <div id="word-media-panel" className={panel?"media-panel":undefined}>
   {panel==="image"&&<section aria-label="Hình ảnh minh họa"><Art src={word.image} emoji={word.emoji} label={word.text} large/></section>}
   {panel==="video"&&<section className="revealed-video" aria-label="Video minh họa">{word.video?<video key={word.video+word.updatedAt} src={word.video} controls playsInline preload="metadata" aria-label={"Video giới thiệu "+word.text}/>:<p className="empty">Chưa có video minh họa.</p>}</section>}
  </div>
 </div>;
}
function HomeHero(){
 const [coverMissing,setCoverMissing]=useState(false);
 return <section className="hero dictionary-hero">
  <h1 className="dictionary-cover">
   {coverMissing?<span className="dictionary-cover-fallback">Từ điển tương tác<br/>2-trong-1</span>:<img src="/dictionary-cover.webp" width={1200} height={800} alt="Từ điển tương tác 2-trong-1. Dành cho học sinh lớp 1. Bộ sách Kết nối tri thức với cuộc sống." fetchPriority="high" onError={()=>setCoverMissing(true)}/>}
  </h1>
  <div className="dictionary-intro">
   <span className="eyebrow">MỖI NGÀY MỘT TỪ MỚI</span>
   <span className="dictionary-greeting">Bé ơi, cùng khám phá nhé!</span>
   <p>Học từ mới qua hình ảnh, âm thanh và video.</p>
   <a className="button dictionary-cta" href="#chu-de">Khám phá chủ đề <span aria-hidden="true">↓</span></a>
  </div>
 </section>;
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
 return <div className="shell"><header className="header"><Link className="brand" href="/"><span className="logo" aria-hidden="true">🌈</span><span>Bé vui học<br/><b>Tiếng Việt</b></span></Link><nav>{view.length>0&&<Link className="nav-button" href="/">🏠 Trang chủ</Link>}{!isAdmin&&<Link className="admin-link" href="/admin" aria-label="Quản trị dành cho người lớn">⚙ <span>Người lớn</span></Link>}</nav></header>
 <main id="main">
 {error&&<div className="notice" role="alert">{error} <button className="pill" onClick={load}>Thử lại</button></div>}
 {!data&&!error&&<p className="loading" role="status">🌟 Đang tải bài học…</p>}
 {data&&<>{data.demo&&<div className="demo-banner">Bản demo chỉ đọc · dữ liệu minh họa, chưa kết nối Drive</div>}
 {isAdmin?<Admin data={data} reload={load}/>:view.length===0?<><HomeHero/><h2 id="chu-de" className="section-heading">Chọn chủ đề yêu thích</h2>{!data.topics.length?<div className="empty">Chưa có chủ đề. Nhờ người lớn thêm bài học nhé!</div>:<div className="cards">{data.topics.map(t=><Link key={t.id} className="tile topic-tile" style={{background:t.color}} href={"/topics/"+t.id}><Art src={t.cover} emoji={t.emoji} label={t.name}/><h3>{t.name}</h3><span className="tile-detail">{data.words.filter(w=>w.topicId===t.id).length} từ ngữ · Khám phá →</span></Link>)}</div>}</>:
 view[0]==="topics"&&topic&&view.length===2?<><Link className="back" href="/">← Các chủ đề</Link><section className="topic-hero" style={{background:topic.color}}><span className="topic-symbol" aria-hidden="true">{topic.emoji}</span><div><h1>{topic.name}</h1><p>{topic.description}</p></div></section><div className="section-title"><h2>Chọn từ bé muốn học</h2>{words.length>=3&&<button className="button orange" onClick={startQuiz}>⭐ Chơi ôn tập</button>}</div>
 {quiz&&<section className="quiz"><h2>Bé chọn hình đúng nhé!</h2><p className="quiz-word">{quiz.target.text}</p><Listen key={quiz.target.id} word={quiz.target} label="Nghe phát âm"/><div className="cards quiz-cards">{quiz.options.map(w=><button key={w.id} className={"tile quiz-option "+(chosen===w.id?(w.id===quiz.target.id?"correct":"incorrect"):"")} onClick={()=>setChosen(w.id)} aria-label={w.text}><Art src={w.image} emoji={w.emoji} label={w.text}/></button>)}</div><p className={"quiz-feedback "+(chosen===quiz.target.id?"quiz-success":chosen?"quiz-retry":"")} role="status">{chosen===quiz.target.id?"⭐ Bé giỏi quá!":chosen?"Bé thử lại nhé!":"Chạm vào một hình."}</p><div className="quiz-actions"><button className="button blue" onClick={startQuiz}>Câu khác →</button><button className="button ghost" onClick={()=>setQuiz(null)}>Đóng</button></div></section>}
 <div className="cards">{words.map(w=><Link className="tile word-tile" href={"/topics/"+topic.id+"/words/"+w.id} key={w.id}><h3>{w.text}</h3><span className="tile-detail word-open">Học ngay <span aria-hidden="true">→</span></span></Link>)}</div>{!words.length&&<div className="empty">Chủ đề này chưa có từ ngữ.</div>}</>:
 view[0]==="topics"&&view[2]==="words"&&view.length===4&&topic&&word?<><Link className="back" href={"/topics/"+topic.id}>← {topic.name}</Link><article className="word-detail"><div className="lesson-progress"><span>Từ {words.indexOf(word)+1} / {words.length}</span><progress value={words.indexOf(word)+1} max={words.length} aria-label="Tiến độ chủ đề"/></div><div className="word-top"><span className="eyebrow">TỪ NGỮ CỦA BÉ</span><h1>{word.text}</h1></div><p className="lesson-hint">Bé chọn một nút để khám phá nhé!</p><WordMedia key={word.id} word={word}/><div className="word-nav">{words.indexOf(word)>0?<Link className="button ghost" href={"/topics/"+topic.id+"/words/"+words[words.indexOf(word)-1].id}>← Từ trước</Link>:<span/>}{words.indexOf(word)<words.length-1?<Link className="button blue" href={"/topics/"+topic.id+"/words/"+words[words.indexOf(word)+1].id}>Từ tiếp theo →</Link>:<Link className="button blue" href={"/topics/"+topic.id}>Về chủ đề →</Link>}</div></article></>:<div className="empty">Không tìm thấy bài học. <Link href="/">Về trang chủ</Link></div>}</>}
 </main><footer><span aria-hidden="true">🌱</span> Học một chút mỗi ngày, lớn khôn từng ngày.</footer></div>;
}
