export type Topic = {
  id:string; name:string; description:string; color:string; emoji:string;
  cover?:string; createdAt:string; updatedAt:string;
};
export type Word = {
  id:string; topicId:string; text:string; description:string; emoji:string;
  image?:string; video?:string; audio?:string; createdAt:string; updatedAt:string;
};
export type Catalog = {topics:Topic[];words:Word[];demo:boolean};
export const colors = ["#D8EFC3","#FFE4A8","#FAD9E9","#DCDFFF","#CBEAFF","#CBF0DF"];
export const emojis = ["🐾","🍎","🏠","📚","🚗","🌳","⭐","🐘","🐦","🐱","🐰","🌈"];
export const isId = (id:string) => /^[a-f0-9-]{36}$/.test(id) && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
export const mediaUrl = (kind:"topic"|"word",id:string,slot:string) => "/api/media/"+kind+"/"+id+"/"+slot;
