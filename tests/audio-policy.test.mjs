import {test} from "node:test";
import assert from "node:assert/strict";
import {audioAction} from "../src/lib/audio-policy.mjs";
const base={previousText:"Con chó",text:"Con chó",hasAudio:true,uploaded:false};
test("new and legacy words without recordings require manual upload",()=>{
 assert.equal(audioAction({...base,previousText:undefined,hasAudio:false}),"required");
 assert.equal(audioAction({...base,hasAudio:false}),"required");
});
test("unchanged word keeps recording",()=>assert.equal(audioAction(base),"keep"));
test("changing a word requires a replacement recording",()=>assert.equal(audioAction({...base,text:"Con mèo"}),"required"));
test("manual upload works for new and existing words",()=>{
 assert.equal(audioAction({...base,hasAudio:false,uploaded:true}),"upload");
 assert.equal(audioAction({...base,text:"Con mèo",uploaded:true}),"upload");
});
