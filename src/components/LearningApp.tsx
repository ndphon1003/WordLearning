"use client";
import {useEffect,useState,useCallback,useRef} from "react";
import Link from "next/link";
import {colors,emojis,type Catalog,type Topic,type Word} from "../lib/model";
import Admin from "./Admin";
type Props={view:string[]};
function Art({src,emoji,label,large=false}:{src?:string;emoji:string;label:string;large?:boolean}){
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[src]);
 return <div className={"art"+(large?" art-large":"")}>{src&&!failed?<img src={src} alt={label} onError={()=>setFailed(true)}/>:<span role="img" aria-label={label}>{emoji}</span>}</div>;
}
// Only one recording plays at a time; changing lessons stops it.
let activePronunciation:(()=>void)|undefined;
function Listen({word,onSelect,label="Âm thanh"}:{word:Word;onSelect?:()=>void;label?:string}){
 const [message,setMessage]=useState("");
 const [playing,setPlaying]=useState(false);
 const ownStop=useRef<(()=>void)|undefined>(undefined);
 useEffect(()=>{setMessage("");return ()=>ownStop.current?.();},[word.id,word.audio]);
 function play(){
  if(ownStop.current){ownStop.current();return;}
  activePronunciation?.();onSelect?.();setMessage("");
  if(!word.audio){setMessage("Từ này chưa có bản thu âm. Nhờ người lớn bổ sung nhé!");return;}
  const audio=new Audio(word.audio);
  let stopped=false;
  const finish=(error?:string)=>{
   if(stopped)return;stopped=true;
   audio.onended=null;audio.onerror=null;audio.pause();audio.removeAttribute("src");audio.load();
   if(activePronunciation===stop)activePronunciation=undefined;
   if(ownStop.current===stop)ownStop.current=undefined;
   setPlaying(false);setMessage(error??"");
  };
  const stop=()=>finish();
  ownStop.current=stop;activePronunciation=stop;setPlaying(true);
  audio.playbackRate=1; // Preserve the teacher's recorded pronunciation.
  audio.onended=()=>finish();
  audio.onerror=()=>finish("Không phát được âm thanh. Bé thử lại nhé!");
  void audio.play().catch(()=>finish("Không phát được âm thanh. Bé thử lại nhé!"));
 }
 return <div className="listen"><button type="button" className="button blue" onClick={play} aria-label={playing?"Dừng âm thanh":label} aria-pressed={playing}>{playing?"⏹ Dừng âm thanh":"🔊 "+label}</button>{message&&<p className="small" role="status">{message}</p>}</div>;
}
function WordMedia({word}:{word:Word}){
 const [panel,setPanel]=useState<"image"|"video"|null>(null);
 function toggle(next:"image"|"video"){
  activePronunciation?.();
  setPanel(current=>current===next?null:next);
 }
 return <div className="word-media">
  <div className="media-actions" role="group" aria-label="Khám phá từ ngữ">
   <Listen word={word} onSelect={()=>setPanel(null)}/>
   <button type="button" className="button image-button" aria-expanded={panel==="image"} aria-controls="word-media-panel" onClick={()=>toggle("image")}>🖼️ Hình ảnh</button>
   <button type="button" className="button video-button" aria-expanded={panel==="video"} aria-controls="word-media-panel" onClick={()=>toggle("video")}>🎬 Video</button>
  </div>
  <div id="word-media-panel">
   {panel==="image"&&<section aria-label="Hình ảnh minh họa"><Art src={word.image} emoji={word.emoji} label={word.text} large/></section>}
   {panel==="video"&&<section className="revealed-video" aria-label="Video minh họa">{word.video?<video key={word.video+word.updatedAt} src={word.video} controls playsInline preload="metadata" aria-label={"Video giới thiệu "+word.text}/>:<p className="empty">Chưa có video minh họa.</p>}</section>}
  </div>
 </div>;
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
 {quiz&&<section className="quiz"><h2>Bé chọn hình đúng nhé!</h2><p className="quiz-word">{quiz.target.text}</p><Listen key={quiz.target.id} word={quiz.target} label="Nghe phát âm"/><div className="cards quiz-cards">{quiz.options.map(w=><button key={w.id} className={"tile quiz-option "+(chosen===w.id?(w.id===quiz.target.id?"correct":"incorrect"):"")} onClick={()=>setChosen(w.id)} aria-label={w.text}><Art src={w.image} emoji={w.emoji} label={w.text}/></button>)}</div><p role="status">{chosen===quiz.target.id?"⭐ Bé giỏi quá!":chosen?"Bé thử lại nhé!":"Chạm vào một hình."}</p><button className="pill" onClick={startQuiz}>Câu khác</button> <button className="pill" onClick={()=>setQuiz(null)}>Đóng</button></section>}
 <div className="cards">{words.map(w=><Link className="tile word-tile" href={"/topics/"+topic.id+"/words/"+w.id} key={w.id}><h3>{w.text}</h3><span className="tile-detail">Học ngay →</span></Link>)}</div>{!words.length&&<div className="empty">Chủ đề này chưa có từ ngữ.</div>}</>:
 view[0]==="topics"&&view[2]==="words"&&view.length===4&&topic&&word?<><Link className="back" href={"/topics/"+topic.id}>← {topic.name}</Link><article className="word-detail"><div className="word-top"><span className="eyebrow">TỪ NGỮ CỦA BÉ</span><h1>{word.text}</h1></div><WordMedia key={word.id} word={word}/><div className="word-nav">{words.indexOf(word)>0?<Link className="button ghost" href={"/topics/"+topic.id+"/words/"+words[words.indexOf(word)-1].id}>← Từ trước</Link>:<span/>}{words.indexOf(word)<words.length-1?<Link className="button blue" href={"/topics/"+topic.id+"/words/"+words[words.indexOf(word)+1].id}>Từ tiếp theo →</Link>:<Link className="button blue" href={"/topics/"+topic.id}>Về chủ đề →</Link>}</div></article></>:<div className="empty">Không tìm thấy bài học. <Link href="/">Về trang chủ</Link></div>}</>}
 </main><footer>🌱 Học một chút mỗi ngày, lớn khôn từng ngày.</footer></div>;
}
