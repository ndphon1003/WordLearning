import type {Catalog} from "./model";
const date="2026-11-26T00:00:00.000Z";
const animal="10000000-0000-4000-8000-000000000001";
const fruit="10000000-0000-4000-8000-000000000002";
const topic=(id:string,name:string,description:string,color:string,emoji:string)=>({id,name,description,color,emoji,createdAt:date,updatedAt:date});
const word=(n:number,topicId:string,text:string,description:string,emoji:string)=>({id:"20000000-0000-4000-8000-"+String(n).padStart(12,"0"),topicId,text,description,emoji,createdAt:date,updatedAt:date});
export const demo:Catalog={demo:true,topics:[topic(animal,"Động vật","Khám phá các bạn động vật", "#D8EFC3","🐾"),topic(fruit,"Trái cây","Trái cây ngon và bổ dưỡng","#FFE4A8","🍎")],words:[
word(1,animal,"Đà điểu","Đà điểu là loài chim lớn, không biết bay nhưng chạy rất nhanh.","🐦"),
word(2,animal,"Con voi","Voi có chiếc vòi dài và đôi tai lớn.","🐘"),
word(3,animal,"Con thỏ","Thỏ có hai tai dài và thích nhảy.","🐰"),
word(4,animal,"Con mèo","Mèo có bộ lông mềm và kêu meo meo.","🐱"),
word(5,fruit,"Quả táo","Táo là một loại quả giòn và ngọt.","🍎"),
word(6,fruit,"Quả chuối","Chuối chín có vỏ màu vàng.","🍌"),
word(7,fruit,"Quả cam","Cam có nhiều múi mọng nước.","🍊")]};
