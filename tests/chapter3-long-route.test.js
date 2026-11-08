import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {HALL,CORRIDOR,TABLE,START,ENTRANCE,FOOD,DOOR,MONSTER_START,
 zone,walkable,huntRoute,moveActor,newBanquet,eat,tickBanquet,SEAL_SECONDS,
 PLAYER_SPEED,HUNTER_SPEED,AWAKEN_SECONDS,atDoor,startDrawing,traceChalk,
 attemptCatch,DOOR_POLYLINE} from '../src/chapter3-logic.js';
import {PALE_UPPER_FACE_Y,palmEyePosition,chalkPortal} from '../src/chapter3-scene.js';
import {createProcessionalPassage,enrichForbiddenFeast} from '../src/chapter3-passage.js';

test('long processional corridor has real dimensions and joins the banquet arch',()=>{
 assert.ok(CORRIDOR.minX < HALL.minX-20,'must add a 20+ unit approach');
 assert.ok(CORRIDOR.maxX > HALL.minX+.5,'corridor and hall must overlap at walkable entrance');
 assert.ok(walkable(START)&&walkable(FOOD)&&walkable(DOOR));
 assert.equal(zone(START),'passage');
 assert.equal(zone(FOOD),'feast');
 assert.equal(zone(DOOR),'passage');
 assert.equal(zone({x:0,z:0}),'feast');
 assert.equal(walkable({x:0,z:0}),false,'the table must remain an obstacle');
 assert.equal(walkable({x:-23,z:3}),false,'the passage is narrow and walled');
 assert.equal(walkable(ENTRANCE),true);
});

test('player can actually traverse the entire approach and 30+ unit return route',()=>{
 const toFood=huntRoute(START,FOOD),toDoor=huntRoute(FOOD,DOOR);
 assert.ok(toFood.length>35,'the approach must be longer than one room');
 assert.ok(toDoor.length>35,'the return run must be long, not two steps in place');
 let travelled=0;
 for(let i=1;i<toDoor.length;i++)travelled+=Math.hypot(
  toDoor[i].x-toDoor[i-1].x,toDoor[i].z-toDoor[i-1].z
 );
 assert.ok(travelled>25,'the escape corridor must be physically long');
 assert.ok(toFood.some(p=>zone(p)==='passage')&&toFood.some(p=>zone(p)==='feast'));
 assert.ok(toDoor.some(p=>zone(p)==='passage')&&toDoor.some(p=>zone(p)==='feast'));
 for(const p of [...toFood,...toDoor])assert.equal(walkable(p,.24),true,'path must stay on real floor');
});

test('walkable route can be followed with continuous physical player movement',()=>{
 const path=huntRoute(START,FOOD);
 let current={...START},idx=0,moved=0;
 for(let frame=0;frame<3500&&idx<path.length;frame++){
  while(idx<path.length&&Math.hypot(current.x-path[idx].x,current.z-path[idx].z)<.28)idx++;
  if(idx>=path.length)break;
  const next=moveActor(current,path[idx].x-current.x,path[idx].z-current.z,.032,PLAYER_SPEED);
  moved+=Math.hypot(next.x-current.x,next.z-current.z);
  current=next;
 }
 assert.ok(Math.hypot(current.x-FOOD.x,current.z-FOOD.z)<.62,
  'the entrance/banquet seam must never create an invisible blocked passage');
 assert.ok(moved>20);
});

test('monster path is continuous and can follow the same long return corridor',()=>{
 const route=huntRoute(MONSTER_START,DOOR,.28);
 assert.ok(route.length>36,'pursuer must chase through the hall and corridor');
 assert.ok(route.every(p=>walkable(p,.28)));
 assert.ok(route.some(p=>p.x<-22),'monster must truly enter the narrow corridor');
 assert.ok(PLAYER_SPEED>HUNTER_SPEED,'running player must be faster while moving');
});

test('hourglass marks the sealing of the original exit while chalk escape stays available',()=>{
 const s=newBanquet();s.player={...FOOD};
 assert.equal(eat(s),true);
 for(let i=0;i<80;i++)tickBanquet(s,.05);
 assert.equal(s.phase,'chase');
 assert.equal(s.sealed,false);
 for(let i=0;i<Math.ceil(SEAL_SECONDS/.05)+2;i++)tickBanquet(s,.05);
 assert.equal(s.sealed,true,'original doorway must close during the long chase');
 s.player={...DOOR};
 assert.equal(atDoor(s),true);
 assert.equal(startDrawing(s),true,'player can climb chair and redraw the ceiling portal');
 for(let n=0;n<10;n++)tickBanquet(s,.1);
 assert.equal(s.phase,'drawing');
 for(let i=0;i<DOOR_POLYLINE.length-1;i++){
  const a=DOOR_POLYLINE[i],b=DOOR_POLYLINE[i+1];
  for(let k=0;k<=100;k++){
   const t=k/100;
   traceChalk(s,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
  }
 }
 assert.equal(s.phase,'escape');
});

test('the Pale Man lifts BOTH palm-eyes above the center of its faceless head',()=>{
 for(const sign of [-1,1]){
  const idle=palmEyePosition(sign,0);
  const awake=palmEyePosition(sign,1);
  assert.ok(idle.y<1.2,'hands begin down by the seated creature');
  assert.ok(awake.y>2.6,'palm iris must sit at upper-face height');
  assert.ok(Math.abs(awake.x)<.33,'palms cover the two empty eye areas');
  assert.ok(awake.z>.4,'eyes remain visibly in front of the forehead');
 }
 assert.ok(PALE_UPPER_FACE_Y>2.53,'iris should be above head midpoint');
});

test('new diorama has arches, flame props, hourglass and stacked banquet food',()=>{
 const scene=new THREE.Scene();
 const passage=createProcessionalPassage(scene),dressing=enrichForbiddenFeast(scene);
 assert.equal(passage.arches.length,8);
 assert.ok(passage.hourglass.children.length>8);
 assert.ok(passage.section.children.length>250);
 assert.ok(dressing.children.length>125,'food and ritual decor need generous density');
 const bounds=new THREE.Box3().setFromObject(passage.section);
 assert.ok(bounds.min.x<-32 && bounds.max.x>-9);
 assert.ok(bounds.max.y>3.6 && bounds.min.y<-.9);
});

test('desktop and mobile both use follow camera and route signage is accessible',()=>{
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 assert.ok(scene.includes("const hall=banquetHall(scene),passage=createProcessionalPassage(scene)"));
 assert.ok(scene.includes("const lead=zone(state.player)==='passage'"));
 assert.ok(scene.includes("const cx=DOOR.x,oldX=-31.62"));
 assert.ok(main.includes('id="pale-escape-guide"'));
 assert.ok(main.includes('previewReturn'));
 assert.ok(main.includes('SEAL_SECONDS-state.chaseTime'));
 assert.ok(!main.includes('沿长桌侧边绕到左后方'));
});

test('safe corridor preview is isolated to explicit QA URL only',()=>{
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 assert.ok(main.includes("const QA_RETURN_PREVIEW=new URLSearchParams(location.search).has('previewReturn')"));
 assert.ok(main.includes("if(QA_RETURN_PREVIEW&&state.phase==='chase')return;"));
 assert.ok(main.includes("if(!['chase','climbing','drawing'].includes(state.phase))return;"));
});

test('closed original doorway is flush wall chalk; actual exit is a raised ceiling hatch with wooden chair',()=>{
 const scene=new THREE.Scene();
 const hatch=chalkPortal(scene);
 assert.ok(hatch.roof.position.y>=3.7,'the new hatch is above the player, not in a side wall');
 assert.ok(hatch.stool.position.z<-.6,'wooden chair should sit beside the rear wall');
 assert.equal(hatch.lines.length,4,'full four-sided chalk rectangle in ceiling');
 assert.ok(hatch.stool.children.length>=8,'seat, legs, backrest and bracing are modelled');
 assert.equal(hatch.target.material.opacity,0,'the raycast target must be invisible');
 assert.equal(hatch.darkOpening.parent,hatch.roof,
  'the exit belongs to the elevated ceiling, not a freestanding wall panel');
 assert.ok(walkable(DOOR,.25),'approach interaction point stays navigable');
 assert.equal(walkable({x:DOOR.x,z:-.92},.25),false,'the chair body cannot be walked through');
});

test('film-like escape: climb stool, trace four sides on ceiling, then pull up through opening',()=>{
 const scene=new THREE.Scene(),hatch=chalkPortal(scene);
 const state=newBanquet();state.phase='chase';state.player={...DOOR};
 assert.ok(startDrawing(state));
 assert.equal(state.phase,'climbing');
 hatch.update(0,.1,state);
 assert.equal(hatch.darkOpening.visible,false);
 for(let i=0;i<10;i++)tickBanquet(state,.10);
 assert.equal(state.phase,'drawing');
 assert.equal(state.doorProgress,0);
 for(let i=0;i<DOOR_POLYLINE.length-1;i++){
  const start=DOOR_POLYLINE[i],end=DOOR_POLYLINE[i+1];
  for(let n=0;n<=100;n++){
   const t=n/100;
   traceChalk(state,start.x+(end.x-start.x)*t,start.y+(end.y-start.y)*t);
  }
 }
 assert.equal(state.phase,'escape','a full rectangle is required to open the trapdoor');
 assert.equal(state.doorProgress,1);
 hatch.update(state.doorProgress,2,state);
 assert.equal(hatch.darkOpening.visible,true,'escape is in the horizontal roof');
 assert.ok(hatch.lines.every(segment=>segment.visible));
 for(let i=0;i<20;i++)tickBanquet(state,.10);
 hatch.update(1,3,state);
 assert.equal(hatch.ceiling.material.opacity,0,'hatch cover disappears during actual climb');
});

test('the Pale Man can catch Ofelia on the chair before she finishes her chalk drawing',()=>{
 const state=newBanquet();state.phase='chase';state.player={...DOOR};
 assert.equal(startDrawing(state),true);
 state.monster={...state.player};
 assert.equal(attemptCatch(state),true);
 assert.equal(state.phase,'caught');
});

test('ceiling drawing UI does not obscure its actual 3D chair and trapdoor',()=>{
 const style=readFileSync(new URL('../src/chapter3-style.css',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 assert.ok(style.includes('.pale-game[data-phase="drawing"] .pale-draw'));
 assert.ok(style.includes('left:auto;right:clamp(14px,3vw,48px)'),
  'desktop tracing must be on the right rather than covering the center of the canvas');
 assert.ok(style.includes('bottom:calc(8px + env(safe-area-inset-bottom))'),
  'mobile tracing must leave visible scene space above the bottom sheet');
 assert.ok(style.includes('top:auto;'));
 assert.ok(scene.includes("const verticalTarget=portrait&&state.phase==='drawing'?-2.2"),
  'mobile world camera must keep stool and overhead roof above the bottom sheet');
 assert.ok(scene.includes("(portrait?.04:.86)"),
  'portrait should keep enough room to show both chair and raised hatch');
});
