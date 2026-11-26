/**
 * @param {{previousText?:string,text:string,hasAudio:boolean,uploaded:boolean,remove:boolean}} input
 * @returns {"upload"|"drop"|"keep"|"speech"}
 */
export function audioAction({previousText,text,hasAudio,uploaded,remove}){
  if(uploaded)return "upload";
  if(!hasAudio)return "speech";
  if(previousText!==text||remove)return "drop";
  return "keep";
}
/**
 * @template {{lang:string, default?:boolean, localService?:boolean}} T
 * @param {T[]} voices
 * @returns {T|undefined}
 */
export function selectVietnameseVoice(voices){
  const vietnamese=voices.filter(v=>/^vi(?:[-_]|$)/i.test(v.lang));
  return vietnamese.find(v=>/^vi[-_]VN$/i.test(v.lang)&&v.localService)
    ?? vietnamese.find(v=>/^vi[-_]VN$/i.test(v.lang)&&v.default)
    ?? vietnamese.find(v=>/^vi[-_]VN$/i.test(v.lang))
    ?? vietnamese.find(v=>v.localService)
    ?? vietnamese[0];
}
