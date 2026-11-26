import {test} from "node:test";
import assert from "node:assert/strict";
import {audioAction,selectVietnameseVoice} from "../src/lib/audio-policy.mjs";
const base={previousText:"Con chó",text:"Con chó",hasAudio:true,uploaded:false,remove:false};
test("new or legacy word without recording uses browser speech",()=>{
 assert.equal(audioAction({...base,previousText:undefined,hasAudio:false}),"speech");
 assert.equal(audioAction({...base,hasAudio:false}),"speech");
});
test("unchanged word keeps recording",()=>assert.equal(audioAction(base),"keep"));
test("changed word or removal drops stale recording",()=>{
 assert.equal(audioAction({...base,text:"Con mèo"}),"drop");
 assert.equal(audioAction({...base,remove:true}),"drop");
});
test("manual upload wins",()=>assert.equal(audioAction({...base,uploaded:true,remove:true,text:"Con mèo"}),"upload"));
test("voice selection never falls back to unrelated language",()=>{
 assert.equal(selectVietnameseVoice([]),undefined);
 assert.equal(selectVietnameseVoice([{lang:"en-US"},{lang:"fil-PH"}]),undefined);
 const remote={lang:"vi-VN",localService:false},local={lang:"vi_VN",localService:true};
 assert.equal(selectVietnameseVoice([{lang:"en-US"},remote,local]),local);
 assert.equal(selectVietnameseVoice([remote]),remote);
 assert.equal(selectVietnameseVoice([{lang:"vi"}]).lang,"vi");
});
