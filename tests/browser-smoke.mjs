// Headless WebGL smoke QA across the full campaign and responsive HUD.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {chromium} from 'playwright';

const port=4177,url='http://127.0.0.1:'+port+'/';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js',
 '--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'pipe'});
server.stderr.on('data',d=>process.stderr.write('[vite] '+d));
let browser;
const waitForServer=async()=>{
 for(let i=0;i<60;i++){
  try{const r=await fetch(url);if(r.ok)return;}catch{}
  await delay(350);
 }
 throw new Error('Vite did not become ready');
};
async function visit(page,query,selector){
 await page.goto(url+query,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator(selector).waitFor({state:'visible',timeout:20000});
 await delay(300);
}
async function runForViewport(viewport,name){
 const context=await browser.newContext({viewport,deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 try{
  await visit(page,'?screen=menu','#tale-save-tools');
  await page.locator('#tale-save-tools').click();
  const backup=await page.locator('#tale-save-export').inputValue();
  assert.equal(JSON.parse(backup).format,'pans-labyrinth-save-v1');
  await page.locator('#tale-save-import').fill('invalid json');
  await page.locator('#tale-save-restore').click();
  assert.match(await page.locator('#tale-save-feedback').innerText(),/无法读取存档/);
  await page.locator('#tale-save-cancel').click();
  await page.locator('#tale-controls').click();
  await page.locator('.tale-extra-settings summary').click();
  await page.locator('[data-quality-mode]').selectOption('low');
  await page.locator('[data-motion-mode]').selectOption('reduce');
  await page.locator('[data-sound-volume]').evaluate(el=>{el.value='45';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('[data-mode-accept]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('pans-labyrinth:quality-v1')),'low');
  assert.equal(await page.evaluate(()=>localStorage.getItem('pans-labyrinth:motion-v1')),'reduce');

  await visit(page,'?stage=1','#begin');
  await page.locator('#begin').click();
  assert.ok(await page.locator('#world').isVisible());
  assert.equal(await page.locator('#intro').evaluate(el=>el.classList.contains('hidden')),true);
  assert.ok(await page.locator('#rune-inspector-help').count());
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.reducedMotion),'true');

  await visit(page,'?stage=2','#root-start');
  await page.locator('#root-start').click();
  assert.ok(await page.locator('#root-enter-guide').isVisible());
  assert.ok(await page.locator('#root-world').isVisible());

  await visit(page,'?stage=3','#pale-start');
  await page.locator('#pale-start').click();
  const generic=await page.locator('#pale-suggest').evaluate(el=>el.classList.contains('show'));
  assert.equal(generic,false,'generic permanent exploration hint must be absent');
  await visit(page,'?stage=3&previewChase=1','#pale-game');
  await page.waitForTimeout(500);
  assert.ok(['awakening','chase','caught'].includes(
   await page.locator('#pale-game').getAttribute('data-phase')));

  await visit(page,'?stage=4&previewFinal=choice','#final-world');
  await page.locator('#final-choice').waitFor({state:'visible',timeout:12000});
  assert.ok(await page.locator('#final-clock').isVisible());
  assert.ok(await page.locator('#final-mercy').isVisible());
  assert.ok(await page.locator('#final-offering').isVisible());
  assert.deepEqual(errors,[],name+': browser runtime exceptions');
  console.log('PASS',name,'all chapters + menus + backup + quality + cinematic choice');
 }finally{await context.close();}
}
try{
 await waitForServer();
 browser=await chromium.launch({headless:true,args:[
  '--use-gl=angle','--use-angle=swiftshader',
  '--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--disable-dev-shm-usage'
 ]});
 await runForViewport({width:1280,height:800},'desktop');
 await runForViewport({width:390,height:844},'portrait phone');
}catch(error){console.error(error);process.exitCode=1;}
finally{await browser?.close();server.kill('SIGTERM');}
