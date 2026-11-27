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
test("manual audio only, without generated speech or special bundler aliases",()=>{
 const env=read(".env.example"),catalog=read("src/lib/catalog.ts"),learning=read("src/components/LearningApp.tsx"),admin=read("src/components/Admin.tsx");
 const pkg=JSON.parse(read("package.json")),config=read("next.config.ts");
 assert.equal(pkg.dependencies["@diffusionstudio/vits-web"],undefined);
 assert.doesNotMatch(env,/GOOGLE_CLOUD_PROJECT_ID|GOOGLE_TTS_VOICE|ESPEAK_NG_PATH/);
 assert.doesNotMatch(learning,/SpeechSynthesisUtterance|speechSynthesis|predictVietnamese|browser-tts/);
 assert.doesNotMatch(config,/empty-node-module/);
 assert.match(learning,/new Audio\(word.audio\)/);
 assert.match(learning,/audio.playbackRate=1/);
 assert.match(catalog,/action==="required"/);
 assert.match(admin,/required=\{!w\?\.audio\}/);
});
test("lesson media starts hidden, opens only on user selection and resets per word",()=>{
 const ui=read("src/components/LearningApp.tsx");
 const media=ui.slice(ui.indexOf("function WordMedia("),ui.indexOf("export default function LearningApp"));
 assert.match(media,/useState<"image"\|"video"\|null>\(null\)/);
 assert.match(media,/onClick=\{\(\)=>toggle\("image"\)\}/);
 assert.match(media,/onClick=\{\(\)=>toggle\("video"\)\}/);
 assert.match(media,/panel==="image"&&<section/);
 assert.match(media,/panel==="video"&&<section/);
 assert.doesNotMatch(media,/autoPlay/);
 assert.match(ui,/<WordMedia key=\{word.id\} word=\{word\}/);
 const list=ui.slice(ui.indexOf('<div className="cards">{words.map'),ui.indexOf('view[0]==="topics"&&view[2]==="words"'));
 assert.doesNotMatch(list,/<Art|<video/);
});

test("child-facing layout keeps one word heading, three media actions and progress",()=>{
 const ui=read("src/components/LearningApp.tsx"),css=read("src/app/globals.css");
 assert.match(ui,/<h1>\{word.text\}<\/h1>/);
 assert.doesNotMatch(ui,/className="word-description"/);
 assert.match(ui,/className="lesson-progress"/);
 assert.match(ui,/<progress value=\{words.indexOf\(word\)\+1\}/);
 assert.match(ui,/aria-label="Khám phá từ ngữ"/);
 assert.match(css,/\.media-actions\s*\{[^}]*repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
});

test("media optimization preserves access checks and streaming",()=>{
 const drive=read("src/lib/drive.ts"),api=read("src/app/api/[...path]/route.ts"),catalog=read("src/lib/catalog.ts"),ui=read("src/components/LearningApp.tsx");
 assert.match(api,/await cachedEntry<StoredTopic>\("topic",w.topicId\)/);
 assert.match(drive,/f\.parents\?\.includes\(root\(\)\)/);
 assert.match(drive,/new Response\(r.body/);
 assert.match(drive,/private, max-age=300/);
 assert.match(api,/finally\{clearCatalogCache\(\);clearDriveReadCache\(\);\}/);
 assert.match(catalog,/versionedUrl\("word",v.id,"image",v.updatedAt\)/);
 assert.match(catalog,/versionedUrl\("word",v.id,"video",v.updatedAt\)/);
 assert.match(ui,/const image=new Image\(\);image.src=word.image/);
 assert.match(ui,/audioRef.current\?\?new Audio\(word.audio\)/);
 assert.match(ui,/panel==="video"&&<section/);
});
