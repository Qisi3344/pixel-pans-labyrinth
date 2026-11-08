import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {HALL,CORRIDOR,TABLE,START,ENTRANCE,FOOD,DOOR,MONSTER_START,
 zone,walkable,huntRoute,moveActor,newBanquet,eat,tickBanquet,SEAL_SECONDS,
 PLAYER_SPEED,HUNTER_SPEED,AWAKEN_SECONDS,atDoor,startDrawing,traceChalk,
 DOOR_POLYLINE} from '../src/chapter3-logic.js';
import {PALE_UPPER_FACE_Y,palmEyePosition} from '../src/chapter3-scene.js';
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
 assert.equal(startDrawing(s),true,'player can redraw the closed portal');
 for(let i=0;i<3;i++){
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
 assert.ok(scene.includes("const cx=DOOR.x,z=-1.72"));
 assert.ok(main.includes('id="pale-escape-guide"'));
 assert.ok(main.includes('previewReturn'));
 assert.ok(main.includes('SEAL_SECONDS-state.chaseTime'));
 assert.ok(!main.includes('沿长桌侧边绕到左后方'));
});
