"use client";
import {useState,type FormEvent} from "react";
import {colors,emojis,type Catalog,type Topic,type Word} from "../lib/model";
type Editing={kind:"topics"|"words";id?:string;topicId?:string};
const acceptImage="image/jpeg,image/png,image/webp";
export default function Admin({data,reload}:{data:Catalog;reload:()=>Promise<void>}){
 const [edit,setEdit]=useState<Editing>({kind:"topics"}),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState(false),[deleting,setDeleting]=useState<Editing|null>(null);
 const t=edit.kind==="topics"?data.topics.find(t=>t.id===edit.id):undefined;
 const w=edit.kind==="words"?data.words.find(w=>w.id===edit.id):undefined;
 const key=edit.kind+":"+(edit.id??"new")+":"+(edit.topicId??"");
 function choose(value:Editing){setEdit(value);setDeleting(null);setMessage("");}
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||data.demo)return;
  const form=e.currentTarget;const fd=new FormData(form);const password=String(fd.get("password")??"");fd.delete("password");
  const target=deleting??edit;
  setBusy(true);setMessage("");setError(false);
  try{
   const response=await fetch("/api/admin/"+target.kind+(target.id?"/"+target.id:""),{method:deleting?"DELETE":target.id?"PATCH":"POST",headers:{"x-admin-password":password},body:deleting?undefined:fd});
   const result=await response.json();if(!response.ok)throw Error(result.error??"Không lưu được.");
   form.reset();setDeleting(null);setEdit({kind:edit.kind,topicId:w?.topicId??edit.topicId});await reload();setMessage("Đã lưu thay đổi thành công.");
  }catch(e){setError(true);setMessage(e instanceof Error?e.message:"Lỗi kết nối.");}finally{setBusy(false);}
 }
 function beginDelete(kind:"topics"|"words",id:string){setDeleting({kind,id});setMessage("");}
 return <section className="admin"><div className="admin-heading"><span className="eyebrow">GÓC GIÁO VIÊN & PHỤ HUYNH</span><h1>Quản lý bài học</h1><p>Dành cho giáo viên và phụ huynh. Mật khẩu chỉ dùng cho từng thao tác.</p></div>{data.demo&&<p className="notice">Demo chỉ đọc. Hãy kết nối Google Drive để tạo nội dung thật.</p>}<div className="admin-grid"><aside className="panel"><h2>Chủ đề & từ ngữ</h2><div className="admin-actions"><button className="button blue" onClick={()=>choose({kind:"topics"})}>+ Chủ đề</button><button className="button orange" disabled={!data.topics.length} onClick={()=>choose({kind:"words",topicId:data.topics[0]?.id})}>+ Từ ngữ</button></div>{data.topics.map(topic=><div className="admin-topic" key={topic.id}><div className="admin-row"><strong>{topic.emoji} {topic.name}</strong><button className="mini" onClick={()=>choose({kind:"topics",id:topic.id})}>Sửa</button><button className="mini danger" onClick={()=>beginDelete("topics",topic.id)}>Xóa</button></div>{data.words.filter(word=>word.topicId===topic.id).map(word=><div key={word.id} className="admin-row subrow"><span>{word.text}</span><button className="mini" onClick={()=>choose({kind:"words",id:word.id,topicId:topic.id})}>Sửa</button><button className="mini danger" onClick={()=>beginDelete("words",word.id)}>Xóa</button></div>)}<button className="mini" onClick={()=>choose({kind:"words",topicId:topic.id})}>+ Thêm từ vào chủ đề</button></div>)}</aside><div className="panel admin-editor"><h2>{deleting?"Xác nhận xóa":edit.id?"Chỉnh sửa "+(t?"chủ đề":"từ ngữ"):"Thêm "+(edit.kind==="topics"?"chủ đề":"từ ngữ")}</h2>
 {message&&<p role="status" className={error?"notice":"success"}>{message}</p>}
 <form key={deleting?"delete:"+deleting.id:key} onSubmit={submit}>
 {deleting?<p>Thao tác sẽ xóa nội dung đã chọn khỏi website. Chủ đề phải không còn từ ngữ. Bạn có chắc không?</p>:edit.kind==="topics"?<>
 <label>Tên chủ đề<input name="name" required maxLength={60} defaultValue={t?.name}/></label>
 <label>Mô tả ngắn<textarea name="description" maxLength={200} defaultValue={t?.description??""}/></label>
 <label>Màu chủ đạo<select name="color" defaultValue={t?.color??colors[0]}>{colors.map((c,i)=><option key={c} value={c}>{["Xanh lá","Vàng","Hồng","Tím","Xanh dương","Xanh bạc hà"][i]}</option>)}</select></label>
 <label>Biểu tượng<select name="emoji" defaultValue={t?.emoji??emojis[0]}>{emojis.map(e=><option key={e}>{e}</option>)}</select></label>
 <label>Ảnh bìa (tối đa 5 MB){t&&<small>Để trống để giữ ảnh hiện tại.</small>}<input type="file" name="cover" accept={acceptImage} required={!t}/></label>
 </>:<>
 <label>Chủ đề<select name="topicId" defaultValue={w?.topicId??edit.topicId??data.topics[0]?.id} required disabled={!!w}>{data.topics.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>{w&&<input type="hidden" name="topicId" value={w.topicId}/>}</label>
 <label>Từ ngữ<input name="text" required maxLength={60} defaultValue={w?.text}/></label>
 <label>Mô tả ngắn<textarea name="description" maxLength={300} defaultValue={w?.description??""}/></label>
 <label>Biểu tượng dự phòng<select name="emoji" defaultValue={w?.emoji??emojis[0]}>{emojis.map(e=><option key={e}>{e}</option>)}</select></label>
 <label>Hình ảnh (tối đa 5 MB)<input type="file" name="image" accept={acceptImage} required={!w}/></label>
 <label>Video MP4 (tối đa 30 MB)<input type="file" name="video" accept="video/mp4" required={!w}/></label>
 <label>Bản thu âm MP3/WAV (tối đa 5 MB)<input type="file" name="audio" accept="audio/mpeg,audio/wav,.mp3,.wav" required={!w?.audio}/><small>{w?.audio?"Để trống để giữ bản thu hiện tại. Nếu đổi từ ngữ, cần tải bản thu mới.":"Bắt buộc tải bản thu phát âm rõ ràng của từ ngữ. Hệ thống không tự tạo giọng đọc."}</small></label>
 {w?.audio&&<div className="recording-preview"><small>Bản thu hiện tại:</small><audio controls preload="none" src={w.audio}/></div>}
 </>}
 <label>Mật khẩu quản trị<input name="password" type="password" autoComplete="off" required maxLength={256}/></label>
 <div className="admin-actions"><button className={"button "+(deleting?"red":"blue")} disabled={busy||data.demo||(edit.kind==="words"&&!data.topics.length&&!deleting)} type="submit">{busy?"Đang xử lý…":deleting?"Xác nhận xóa":"Lưu nội dung"}</button>{deleting&&<button type="button" className="pill" onClick={()=>setDeleting(null)}>Hủy</button>}</div>
 </form></div></div></section>;
}
