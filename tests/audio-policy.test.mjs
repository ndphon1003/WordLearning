import {test} from "node:test";
import assert from "node:assert/strict";
import {audioAction} from "../src/lib/audio-policy.mjs";
const base={previousText:"Con chó",text:"Con chó",hasAudio:true,uploaded:false,regenerate:false};
test("new word or legacy word with no audio generates MP3",()=>{
 assert.equal(audioAction({...base,previousText:undefined,hasAudio:false}),"generate");
 assert.equal(audioAction({...base,hasAudio:false}),"generate");
});
test("unchanged word keeps existing audio",()=>assert.equal(audioAction(base),"keep"));
test("changed text and explicit regeneration require new audio",()=>{
 assert.equal(audioAction({...base,text:"Con mèo"}),"generate");
 assert.equal(audioAction({...base,regenerate:true}),"generate");
});
test("manual audio always wins",()=>assert.equal(audioAction({...base,uploaded:true,regenerate:true,text:"Con mèo"}),"upload"));
