import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FRESCO_POINTS,FRESCO_INSPECT_RADIUS,nearestFresco,walkable,huntRoute,START,FOOD,newBanquet} from '../src/chapter3-logic.js';
import {FRESCO_CAPTIONS} from '../src/chapter3-fresco.js';

test('fresco wall meshes have solid collision clearance, preventing the player from walking behind art',()=>{
 assert.equal(FRESCO_POINTS.length,2);
 for(let i=0;i<FRESCO_POINTS.length;i++){
  const panel=FRESCO_POINTS[i];
  assert.equal(walkable({x:panel.x,z:-4.31}),false,
    'player must not enter behind a painted wall plane');
  assert.equal(walkable({x:panel.x,z:-3.83}),true,
    'front viewing area must remain walkable');
  assert.equal(nearestFresco({x:panel.x,z:-3.22}),i);
 }
 assert.equal(nearestFresco(START),-1);
 assert.ok(FRESCO_INSPECT_RADIUS>2,'auto appreciation must work before hitting artwork');
});

test('both murals remain reachable and the full game route survives mural collision',()=>{
 for(const mural of FRESCO_POINTS){
  const front={x:mural.x,z:-3.68};
  const route=huntRoute(FOOD,front);
  assert.ok(route.length>1,'front of each wall mural must be reachable from food area');
  assert.ok(route.every(p=>walkable(p,.24)));
 }
 assert.ok(huntRoute(START,FOOD).length>20,'long approach route stays accessible');
});

test('artwork captions express the film fresco narrative, not generic mosaic blocks',()=>{
 assert.equal(FRESCO_CAPTIONS.length,2);
 assert.ok(FRESCO_CAPTIONS[0].title.includes('噬童'));
 assert.ok(FRESCO_CAPTIONS[0].detail.includes('无眼'));
 assert.ok(FRESCO_CAPTIONS[1].detail.includes('小鞋'));
 const art=readFileSync(new URL('../src/chapter3-fresco.js',import.meta.url),'utf8');
 const passage=readFileSync(new URL('../src/chapter3-passage.js',import.meta.url),'utf8');
 assert.ok(art.includes('new THREE.CanvasTexture(canvas)'));
 assert.ok(art.includes('function paintGiant(ctx,index)'));
 assert.ok(art.includes('function child(ctx,x,y,scale=1)'));
 assert.ok(art.includes('new THREE.PlaneGeometry(1.93,1.86)'));
 assert.ok(!passage.includes('for(let i=0;i<9;i++){\n   const px=x-.61'),
  'old nine-blob mural placeholders must be removed');
});

test('walking to fresco opens gallery once; click reopens the exact matching 3D texture',()=>{
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 const style=readFileSync(new URL('../src/chapter3-style.css',import.meta.url),'utf8');
 assert.ok(main.includes("const frescoIndex=nearestFresco(state.player)"));
 assert.ok(main.includes("!viewedFrescoes.has(frescoIndex)"));
 assert.ok(main.includes("openFresco(frescoIndex)"));
 assert.ok(main.includes("view.fresco.items[index]"));
 assert.ok(main.includes("item.canvas.toDataURL('image/png')"),
  'modal must render the SAME canvas texture used in the world');
 assert.ok(main.includes("if(hit.kind==='fresco')"));
 assert.ok(main.includes("if(frescoOpen)closeFresco()"));
 assert.ok(main.includes("!frescoOpen&&state.phase!=='awakening'"));
 assert.ok(main.includes("previewFresco"));
 assert.ok(style.includes('.pale-fresco-modal'));
 assert.ok(style.includes('#pale-fresco-image'));
 assert.ok(scene.includes("fresco=createFrescoes(scene)"));
 assert.ok(scene.includes("ray.intersectObjects(fresco.targets,false)"));
 assert.ok(scene.includes("return {kind:'fresco',index:frescoHit.object.userData.frescoIndex}"));
 const initial=newBanquet();
 assert.equal(initial.phase,'invitation');
 assert.equal(nearestFresco(initial.player),-1,
  'beginning the game should not open a mural from 24 meters away');
});
