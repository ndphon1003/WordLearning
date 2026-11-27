import {test} from "node:test";
import assert from "node:assert/strict";
import {createReadCache} from "../src/lib/read-cache.mjs";
test("coalesces concurrent reads and reuses fresh result",async()=>{
 let calls=0,now=0;
 const cache=createReadCache({ttlMs:60,maxEntries:2,now:()=>now});
 const load=async()=>++calls;
 assert.deepEqual(await Promise.all([cache.get("a",load),cache.get("a",load)]),[1,1]);
 now=59;assert.equal(await cache.get("a",load),1);
 now=60;assert.equal(await cache.get("a",load),2);
});
test("failed reads are retried",async()=>{
 const cache=createReadCache({ttlMs:60,maxEntries:2});
 await assert.rejects(cache.get("a",async()=>{throw Error("offline");}));
 assert.equal(await cache.get("a",async()=>42),42);
});
test("clearing cache prevents an old in-flight result from repopulating it",async()=>{
 const cache=createReadCache({ttlMs:60,maxEntries:2});
 let resolve;
 const old=cache.get("a",()=>new Promise(r=>{resolve=r;}));
 await Promise.resolve();
 cache.clear();
 assert.equal(await cache.get("a",async()=>2),2);
 resolve(1);assert.equal(await old,1);
 assert.equal(await cache.get("a",async()=>3),2);
});
test("primed values avoid reads, and memory is bounded",async()=>{
 const cache=createReadCache({ttlMs:60,maxEntries:2});
 cache.prime("a",1);cache.prime("b",2);
 assert.equal(await cache.get("a",async()=>99),1);
 cache.prime("c",3);
 assert.equal(await cache.get("b",async()=>4),4);
});
