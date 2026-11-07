import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {createChapter2Ending,endingPhase,ENDING_SECONDS} from '../src/chapter2-ending.js';

function setup(){
 const stage=new THREE.Group(),toad=new THREE.Group(),jaw=new THREE.Group();
 const belly=new THREE.Mesh(new THREE.IcosahedronGeometry(1),new THREE.MeshBasicMaterial());
 const goldKey=new THREE.Group(),player=new THREE.Group(),exterior={group:new THREE.Group()};
 toad.add(jaw,belly);
 stage.add(toad,goldKey,player);
 player.position.set(8,-2.75,1);
 let cuts=0;
 const ending=createChapter2Ending({stage,toad,jaw,belly,goldKey,player,exterior,onExterior:()=>{cuts++}});
 return {ending,stage,toad,jaw,belly,goldKey,player,exterior,getCuts:()=>cuts};
}
const advance=(ending,seconds)=>{let snapshot;for(let i=0;i<Math.round(seconds/.05);i++)snapshot=ending.update(.05);return snapshot;};

test('storyboard phases are deterministic and end with a truly revived tree',()=>{
 assert.equal(endingPhase(0).step,'swallow');
 assert.equal(endingPhase(2.0).step,'awaken');
 assert.equal(endingPhase(3.8).step,'key');
 assert.equal(endingPhase(5.3).step,'transition');
 assert.equal(endingPhase(7.2).step,'spring');
 assert.equal(endingPhase(ENDING_SECONDS).step,'complete');
 assert.equal(endingPhase(ENDING_SECONDS).done,true);
 assert.equal(endingPhase(4.99).exterior,false);
 assert.equal(endingPhase(5.10).exterior,true);
});

test('the 3D cutscene does not reveal key or new leaves before last offering',()=>{
 const {ending,stage,goldKey,exterior}=setup();
 for(let index=0;index<2;index++){
  ending.playOffering(index);
  advance(ending,1.40);
  assert.equal(ending.state().active,false);
  assert.equal(goldKey.visible,false);
  assert.equal(ending.spring.group.visible,false);
 }
 const jewels=stage.children.filter(o=>o.isMesh&&o.geometry?.type==='OctahedronGeometry');
 assert.equal(jewels.length,3,'must have a real 3D gemstone for each offering');
 assert.equal(exterior.group.children.includes(ending.spring.group),true);
});

test('third jewel starts a sequence with a toad reaction and floating golden key',()=>{
 const {ending,goldKey,belly}=setup();
 ending.start();
 let status=advance(ending,1.05);
 assert.equal(status.step,'swallow');assert.equal(goldKey.visible,false);
 status=advance(ending,1.45);
 assert.equal(status.step,'awaken');
 assert.ok(belly.scale.x>.59,'swallowing changes real 3D belly scale');
 status=advance(ending,1.15);
 assert.equal(status.step,'key');assert.equal(goldKey.visible,true);
 assert.ok(goldKey.scale.x>.1,'key should physically grow and rise');
});

test('the camera transitions to living exterior exactly once and foliage grows visibly',()=>{
 const {ending,exterior,getCuts,goldKey}=setup();
 ending.start();
 advance(ending,5.45);
 assert.equal(getCuts(),1);
 assert.equal(ending.spring.group.visible,true);
 assert.equal(goldKey.visible,false,'key shot ends before tree revival');
 assert.equal(ending.exteriorKey.visible,true,'a real 3D golden reward must remain visible outdoors');
 assert.ok(ending.exteriorKey.children.some(o=>o.isMesh&&o.geometry.type==='TorusGeometry'),
  'visible outdoor trophy contains the 3D golden key ring');
 advance(ending,3.4);
 assert.equal(getCuts(),1,'do not switch scenes repeatedly');
 const expanded=ending.spring.leaves.filter(l=>l.mesh.scale.x>.1);
 assert.ok(expanded.length>=25,'visible new leaves must actually grow on the tree');
 const grass=ending.spring.sprouts.filter(s=>s.mesh.scale.y>.1);
 assert.ok(grass.length>10,'ground sprouts must grow as real meshes');
 assert.ok(exterior.group.children.includes(ending.spring.group));
 assert.equal(advance(ending,2).done,true,'victory modal should wait until 3D animation ends');
 assert.equal(ending.exteriorKey.visible,true,'gold key must remain visible behind the final dialog');
 assert.ok(ending.exteriorKey.scale.x>1,'key must remain big enough to spot');
});

test('the game UI waits for the ending and allows a reproducible cinematic replay',()=>{
 const main=readFileSync(new URL('../src/chapter2-main.js',import.meta.url),'utf8');
 assert.match(main,/view\.playOffering\(result\.count-1\)/);
 assert.match(main,/view\.startFinale\(\)/);
 assert.match(main,/if\(ending\.done&&!finaleCompleted\)/);
 assert.doesNotMatch(main,/case 'victory':[^\n]*setTimeout\(/,'must not display modal while animation is still in progress');
 assert.match(main,/id="root-cinema"/);
 assert.match(main,/id="root-review"/);
 assert.match(main,/previewFinale=1/);
 const scene=readFileSync(new URL('../src/chapter2-scene.js',import.meta.url),'utf8');
 assert.match(scene,/const ending=createChapter2Ending\(/);
 assert.match(scene,/const cinematic=ending\.update\(dt\)/);
 assert.doesNotMatch(scene,/goldKey\.visible=state\.won/);
});
