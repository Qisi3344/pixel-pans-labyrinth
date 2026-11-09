import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {graphicsMode,setGraphicsMode,qualityProfile,motionPreference,
 setMotionPreference,GRAPHICS_KEY,MOTION_KEY} from '../src/graphics-quality.js';
import {exportCampaign,importCampaign,loadCampaign,recordChapterComplete,
 SAVE_FORMAT} from '../src/campaign.js';
import {getSoundVolume,setSoundVolume} from '../src/audio.js';

function memory(){
 const map=new Map();
 return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
}
test('auto is low-cost on touch phones but high-resolution desktop option is reversible',()=>{
 const storage=memory();
 assert.equal(graphicsMode(storage),'auto');
 assert.equal(qualityProfile({mode:'auto',mobile:true,devicePixelRatio:3}).shadowSize,1024);
 assert.equal(qualityProfile({mode:'auto',mobile:true,devicePixelRatio:3}).softShadows,false);
 const high=qualityProfile({mode:'high',mobile:true,devicePixelRatio:3});
 assert.equal(high.shadowSize,2048);
 assert.ok(high.renderScale>1&&high.renderScale<=2);
 assert.equal(qualityProfile({mode:'low',mobile:false}).renderScale,1);
 setGraphicsMode('low',storage);
 assert.equal(graphicsMode(storage),'low');
 assert.equal(storage.getItem(GRAPHICS_KEY),'low');
 assert.throws(()=>setGraphicsMode('ultra',storage));
});
test('motion preference has a safe system default and explicit reduction',()=>{
 const storage=memory();
 assert.equal(motionPreference(storage),'system');
 setMotionPreference('reduce',storage);
 assert.equal(motionPreference(storage),'reduce');
 assert.equal(storage.getItem(MOTION_KEY),'reduce');
 assert.throws(()=>setMotionPreference('unsafe',storage));
});
test('text backup imports a validated complete chapter progress across simulated browsers',()=>{
 const original=memory(),restored=memory();
 recordChapterComplete(1,original);
 recordChapterComplete(2,original);
 const exported=exportCampaign(original);
 assert.equal(JSON.parse(exported).format,SAVE_FORMAT);
 const loaded=importCampaign(exported,restored);
 assert.equal(loaded.completed,2);
 assert.deepEqual(loadCampaign(restored),loadCampaign(original));
 const before=loadCampaign(restored);
 for(const bad of ['','{bad','{"format":"unknown","progress":{"completed":4}}',
  JSON.stringify({format:SAVE_FORMAT,progress:{completed:99}})]){
  assert.throws(()=>importCampaign(bad,restored));
  assert.deepEqual(loadCampaign(restored),before,'invalid import must not overwrite save');
 }
});
test('audio volume is bounded; all chapters use one renderer policy',()=>{
 assert.equal(setSoundVolume(-1),0);
 assert.equal(setSoundVolume(2),1);
 assert.equal(setSoundVolume(.4),.4);
 assert.equal(getSoundVolume(),.4);
 assert.throws(()=>setSoundVolume(NaN));
 for(const name of ['scene.js','chapter2-scene.js','chapter3-scene.js','chapter4-scene.js']){
  const source=readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
  assert.match(source,/applyShadowQuality\(renderer,/);
  assert.match(source,/pans:qualitychange/);
  assert.match(source,/sampleQualityFrame/);
 }
 const palace=readFileSync(new URL('../src/chapter4-scene.js',import.meta.url),'utf8');
 assert.match(palace,/tileBatches\.forEach/);
 assert.match(palace,/buildStoneInstances\(entries,sharedTileGeometry/);
});
