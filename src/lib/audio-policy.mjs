/**
 * @param {{previousText?:string,text:string,hasAudio:boolean,uploaded:boolean,regenerate:boolean}} input
 * @returns {"upload"|"generate"|"keep"}
 */
export function audioAction({previousText,text,hasAudio,uploaded,regenerate}){
  if(uploaded)return "upload";
  if(!hasAudio||previousText!==text||regenerate)return "generate";
  return "keep";
}
