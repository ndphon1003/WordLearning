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
