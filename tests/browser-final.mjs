// Genuine headless Chromium WebGL QA. Unlike unit tests, these checks verify
// the CAPTAIN and KNIFE actually DRAW PIXELS inside the player's camera.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const port=4176,host='127.0.0.1',url=`http://${host}:${port}/`;
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host',host,
 '--port',String(port),'--strictPort'],{stdio:'pipe'});
server.stdout.on('data',d=>process.stdout.write('[vite] '+d));
server.stderr.on('data',d=>process.stderr.write('[vite] '+d));
let browser;
function pixelDiff(a,b){
 const p=PNG.sync.read(a),q=PNG.sync.read(b);
 assert.equal(p.width,q.width);assert.equal(p.height,q.height);
 let changed=0;
 for(let i=0;i<p.data.length;i+=4){
  const delta=Math.abs(p.data[i]-q.data[i])+
   Math.abs(p.data[i+1]-q.data[i+1])+
   Math.abs(p.data[i+2]-q.data[i+2]);
  if(delta>35)changed++;
 }
 return changed;
}
async function awaitServer(){
 for(let i=0;i<60;i++){
  if(server.exitCode!==null)throw Error('Vite exited before browser QA');
  try{const r=await fetch(url);if(r.ok)return;}catch{}
  await delay(350);
 }
 throw Error('Vite never opened its port');
}
async function openPage(page,ending){
 const errors=[];
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.goto(url+`?stage=4&previewFinal=${ending}&qa=1`,{
  waitUntil:'domcontentloaded',timeout:30000
 });
 await page.waitForFunction(
  ()=>window.__finalQA?.snapshot().phase==='cinematic',
  {timeout:20000}
 );
 await page.waitForTimeout(550);
 if(errors.length)throw Error('Browser runtime exceptions: '+errors.join('\n'));
}
async function at(page,t,required){
 const state=await page.evaluate(n=>window.__finalQA.seek(n),t);
 await page.waitForTimeout(320);
 const s=await page.evaluate(()=>window.__finalQA.snapshot());
 console.log('VISIBLE_FRAME',JSON.stringify({
  seconds:t,mode:s.viewMode,ending:s.ending,beat:s.beat,
  vidal:s.captainVisible,vidalOnscreen:s.captain.inside,
  vidalUV:[Number(s.captain.u.toFixed(3)),Number(s.captain.v.toFixed(3))],
  ofeliaOnscreen:s.hero.inside,
  ofeliaUV:[Number(s.hero.u.toFixed(3)),Number(s.hero.v.toFixed(3))],
  knife:s.knifeVisible,ritual:s.ritualGlowVisible,
  blood:s.bloodSegmentsVisible,portal:s.portalVisible,royal:s.royalShown
 }));
 assert.equal(s.cameraType,'OrthographicCamera','fixed isometric camera required');
 for(const [name,value] of Object.entries(required))
  assert.equal(s[name],value,`at ${t}s ${s.ending} ${name}`);
 return s;
}
async function provePixelRendering(page,hideFlag,minChanged,subject){
 // Freeze plot time, but keep the game's THREE renderer animating normally.
 await page.evaluate(()=>{window.__pansModalOpen=true;});
 await page.waitForTimeout(180);
 const before=await page.locator('#final-world').screenshot();
 await page.evaluate(flag=>{window.__finalQA[flag]=true;},hideFlag);
 await page.waitForTimeout(180);
 const after=await page.locator('#final-world').screenshot();
 await page.evaluate(flag=>{window.__finalQA[flag]=false;
  window.__pansModalOpen=false;},hideFlag);
 const changed=pixelDiff(before,after);
 console.log('REAL_WEBGL_PIXELS',subject,changed);
 assert.ok(changed>=minChanged,
  subject+' is marked visible but not actually drawing enough pixels (changed '+changed+')');
}
async function scenario(viewport,label){
 const page=await browser.newPage({viewport,deviceScaleFactor:1});
 try{
  await openPage(page,'mercy');
  let s=await at(page,2.0,{captainVisible:true,royalShown:false});
  assert.ok(s.captain.inside,label+': Vidal is outside the visible scene');
  assert.ok(s.hero.inside,label+': Ofelia not visible in the two-shot');
  await provePixelRendering(page,'hideCaptain',35,label+' captain');
  s=await at(page,3.15,{captainVisible:true,royalShown:false});
  assert.ok(s.captain.inside,label+': Vidal leaves the screen during approach');
  s=await at(page,5.6,{brotherVisible:false,royalShown:false});
  assert.ok(s.captain.inside,'Vidal must be visible for actual baby handoff');
  s=await at(page,6.72,{royalShown:false});
  assert.ok(s.bloodSegmentsVisible>0,'mercy blood must flow BEFORE royal transition');
  await at(page,8.8,{portalVisible:true,royalShown:false});
  await at(page,10.15,{royalShown:true});

  await openPage(page,'offering');
  s=await at(page,1.95,{royalShown:false});
  assert.ok(s.hero.inside,label+': heroine must be in the ritual shot');
  s=await at(page,3.7,{knifeVisible:true,royalShown:false});
  assert.ok(s.hero.inside,label+': holding knife but outside frame');
  await provePixelRendering(page,'hideKnife',10,label+' ritual dagger');
  s=await at(page,5.8,{ritualGlowVisible:true,royalShown:false});
  assert.ok(s.bloodSegmentsVisible>0,'red drop must stream into spiral');
  await at(page,7.9,{portalVisible:true,royalShown:false});
  await at(page,9.5,{royalShown:true});
 }finally{
  await page.close();
 }
}
try{
 await awaitServer();
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl',
  '--ignore-gpu-blocklist','--disable-dev-shm-usage'
 ]});
 await scenario({width:1280,height:768},'desktop');
 await scenario({width:390,height:844},'portrait-phone');
 console.log('PASS: both ending cutscenes visually verified on desktop + portrait');
}catch(e){console.error(e);process.exitCode=1;}
finally{
 await browser?.close();
 server.kill('SIGTERM');
}
