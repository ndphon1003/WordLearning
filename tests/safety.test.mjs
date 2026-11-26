import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("credentials template contains placeholders only",()=>{
 const env=read(".env.example");
 for(const line of env.split("\n").filter(x=>/^GOOGLE_|^ADMIN_PASSWORD=/.test(x)))assert.ok(line.endsWith("="));
 assert.match(read(".gitignore"),/\.env\*/);
});
test("server boundaries and password check precede body parsing",()=>{
 assert.match(read("src/lib/drive.ts"),/import "server-only"/);
 assert.match(read("src/lib/security.ts"),/timingSafeEqual/);
 const api=read("src/app/api/[...path]/route.ts");
 assert.ok(api.indexOf("guard(req)")<api.indexOf("await form(req)"));
});
test("media API checks published record and Drive folder",()=>{
 const drive=read("src/lib/drive.ts");
 assert.match(drive,/parents\?\.includes\(root\(\)\)/);
 assert.match(drive,/ownerId!==ownerId/);
 assert.match(drive,/slot!==slot/);
});
test("browser speech does not require cloud TTS",()=>{
 const env=read(".env.example"),catalog=read("src/lib/catalog.ts"),learning=read("src/components/LearningApp.tsx");
 assert.doesNotMatch(env,/GOOGLE_CLOUD_PROJECT_ID|GOOGLE_TTS_VOICE|GOOGLE_APPLICATION_CREDENTIALS/);
 assert.doesNotMatch(catalog,/synthesizeVietnamese|from "\.\/tts"/);
 assert.match(learning,/SpeechSynthesisUtterance/);
 assert.match(learning,/voiceschanged/);
 assert.match(learning,/selectVietnameseVoice/);
});
test("whole-word Piper fallback runs in browser only",()=>{
 const api=read("src/app/api/[...path]/route.ts"),tts=read("src/lib/browser-tts.ts"),learning=read("src/components/LearningApp.tsx");
 const env=read(".env.example"),pkg=JSON.parse(read("package.json"));
 assert.equal(pkg.dependencies["@diffusionstudio/vits-web"],"1.0.3");
 assert.match(tts,/import\("@diffusionstudio\/vits-web"\)/);
 assert.match(tts,/vi_VN-vais1000-medium/);
 assert.match(tts,/tts\.predict/);
 assert.doesNotMatch(tts,/writeFile|addMedia|texttospeech.googleapis/);
 assert.doesNotMatch(api,/liveSpeech|p\[0\]==="speech"/);
 assert.doesNotMatch(env,/ESPEAK_NG_PATH/);
 assert.doesNotMatch(learning,/Đọc từng tiếng|part=\{part\}|\/api\/speech\//);
 assert.match(learning,/SpeechSynthesisUtterance\(word.text\)/);
 assert.match(learning,/predictVietnamese\(word.text/);
 assert.match(learning,/URL.revokeObjectURL/);
});

test("Turbopack aliases Piper Node-only dependencies for browser builds only",()=>{
 const config=read("next.config.ts");
 assert.match(config,/turbopack:\s*\{/);
 assert.match(config,/fs:\s*\{\s*browser:/);
 assert.match(config,/path:\s*\{\s*browser:/);
 assert.match(read("src/lib/empty-node-module.ts"),/export \{\}/);
});

test("pronunciation is prewarmed, bounded in memory and played slowly",()=>{
 const tts=read("src/lib/browser-tts.ts"),learning=read("src/components/LearningApp.tsx");
 assert.match(tts,/MAX_CACHE_BYTES=4\*1024\*1024/);
 assert.match(tts,/cache\.size>12/);
 assert.match(learning,/SPEECH_RATE=0\.65/);
 assert.match(learning,/AUDIO_RATE=0\.70/);
 assert.match(learning,/element\.preservesPitch=true/);
 assert.match(learning,/getCachedVietnamese\(word\.text\)/);
 assert.match(learning,/predictVietnamese\(word\.text,\(\)=>\{\}\)/);
});
