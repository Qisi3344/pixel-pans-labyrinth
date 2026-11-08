import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {
 NODES,TOAD_NODE,TOAD_APPROACH_NODE,TOAD_INTERACTION_NODES,
 newChapter,interact,edgeAccessible
} from '../src/chapter2-logic.js';
import {DAGGER_POINT,CABINET_CENTER,createDaggerNiche} from '../src/chapter3-dagger.js';
import {START,huntRoute,walkable,moveActor,HUNTER_SPEED,newBanquet} from '../src/chapter3-logic.js';
import {buildTable,chalkPortal} from '../src/chapter3-scene.js';

const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('chapter II frog is approachable and receives gems without Ofelia entering its mesh',()=>{
 assert.equal(TOAD_APPROACH_NODE,9);
 assert.ok(TOAD_INTERACTION_NODES.includes(TOAD_NODE));
 assert.ok(TOAD_INTERACTION_NODES.includes(TOAD_APPROACH_NODE));
 const approach=NODES[TOAD_APPROACH_NODE];
 const frog={x:8.7,z:1};
 assert.ok(Math.hypot(approach.x-frog.x,approach.z-frog.z)>=2.4,
  'Ofelia can speak from a visibly separate tunnel node');
 const standing=NODES[TOAD_NODE];
 assert.ok(Math.hypot(standing.x-frog.x,standing.z-frog.z)>1.6,
  'even the last walk node cannot occupy the toad centre');
 const s=newChapter();s.node=TOAD_APPROACH_NODE;s.boulderMoved=true;
 assert.equal(interact(s).type,'need-stones');
 s.stones.fill(true);
 assert.equal(interact(s).type,'offering');
 assert.equal(interact(s).type,'offering');
 assert.equal(interact(s).type,'victory');
 assert.equal(s.won,true);
});

test('chapter II stage camera sees toad front and the pushed rock slides to a side recess',()=>{
 const scene=source('../src/chapter2-scene.js');
 const main=source('../src/chapter2-main.js');
 const style=source('../src/chapter2-style.css');
 assert.ok(scene.includes('const cavernDirection=new THREE.Vector3('));
 assert.ok(scene.includes('Math.sqrt(1*1+1.3*1.3-.60*.60)'),
  'azimuth may change but original elevation is invariant');
 assert.ok(scene.includes('toad.rotation.y=1.08'));
 assert.ok(scene.includes("area==='interior'?cavernDirection:direction"));
 assert.ok(scene.includes('boulder.position.z=THREE.MathUtils.damp(boulder.position.z,1-2.20*lateral'));
 assert.ok(!scene.includes('state.boulderMoved?7.5:5'));
 assert.ok(!main.includes('id="amber-marker"'));
 assert.ok(!main.includes("const marker=$('amber-marker')"));
 assert.ok(!style.includes('.root-amber-marker{'));
 assert.ok(main.includes('follow(TOAD_APPROACH_NODE)'));
 assert.ok(main.includes('站在这里就能与巨蟾蜍互动'));
});

test('chapter III dagger cabinet is on a clear foreground showcase and reachable',()=>{
 const cabinet=createDaggerNiche(new THREE.Scene());
 assert.equal(CABINET_CENTER.x,DAGGER_POINT.x);
 assert.ok(CABINET_CENTER.z>2.6);
 assert.ok(DAGGER_POINT.z>CABINET_CENTER.z);
 assert.ok(walkable(DAGGER_POINT,.28),'front-side approach is accessible');
 assert.ok(huntRoute(START,DAGGER_POINT).length>30);
 assert.ok(cabinet.root.children.length>13,'reliquary has freestanding plinth and detailed cabinet');
 assert.equal(cabinet.target.userData.kind,'dagger-niche');
 const bounds=new THREE.Box3().setFromObject(cabinet.root);
 assert.ok(bounds.min.z>2,'cabinet is no longer against the fresco wall');
});

test('Pale Man BANQUET chair rotates clockwise; chalk stool stays unchanged',()=>{
 const table=buildTable(new THREE.Scene());
 assert.ok(Math.abs(table.monsterChair.rotation.y+Math.PI/2)<1e-8);
 assert.ok(table.monsterChair.position.x>6,'banquet chair still under the monster');
 const stool=chalkPortal(new THREE.Scene()).stool;
 assert.equal(stool.rotation.y,0,'Ofelia chalk climbing stool is separate');
});

test('monster continues a real, dangerous chase while the ceiling door is traced',()=>{
 const main=source('../src/chapter3-main.js');
 assert.ok(main.includes("if(!['chase','climbing','drawing'].includes(state.phase))return;"));
 assert.ok(main.includes("state.phase==='drawing'?.90:1"));
 assert.ok(!main.includes("if(QA_CHALK_PREVIEW&&['climbing','drawing'].includes(state.phase))return"));
 assert.ok(main.includes("state.monster={x:-17.5,z:0};huntPath=[];huntTime=0"));
 assert.ok(main.includes("if(attemptCatch(state))"));
 const player={x:-29.65,z:0};
 const start={x:-17.5,z:0};
 const path=huntRoute(start,player,.28);
 assert.ok(path.length>2,'monster must have a route down the passage');
 const dest=path.find(point=>Math.hypot(start.x-point.x,start.z-point.z)>.30);
 assert.ok(dest);
 const next=moveActor(start,dest.x-start.x,dest.z-start.z,.16,HUNTER_SPEED*.9,.28);
 assert.ok(Math.hypot(next.x-start.x,next.z-start.z)>.04,
  'monster must advance during drawing at 90% chase speed');
 const state=newBanquet();state.phase='drawing';
 assert.equal(state.phase,'drawing');
});
