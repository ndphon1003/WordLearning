/**
 * @param {{previousText?:string,text:string,hasAudio:boolean,uploaded:boolean}} input
 * @returns {"upload"|"keep"|"required"}
 */
export function audioAction({previousText,text,hasAudio,uploaded}){
 if(uploaded)return "upload";
 if(!hasAudio||previousText!==text)return "required";
 return "keep";
}
