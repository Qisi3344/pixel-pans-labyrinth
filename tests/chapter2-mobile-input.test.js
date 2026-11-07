import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {chapterFraming,screenHorizontal} from '../src/chapter2-camera.js';
import {createExterior} from '../src/chapter2-exterior.js';
import {stepOnEarth} from '../src/chapter2-overworld.js';
import {readFileSync} from 'node:fs';

test('390px portrait always frames both player and cave entrance',()=>{
 const hero={x:-4.2,z:3.8},entrance={x:0,z:2.6};
 for(const [width,height] of [[390,844],[320,740],[430,932],[280,700]]){
  const framing=chapterFraming({width,height,hero,entrance});
  const half=framing.right;
  assert.ok(framing.portrait);
  assert.ok(half>0);
  const heroX=screenHorizontal(hero,framing.focus);
  const treeX=screenHorizontal(entrance,framing.focus);
  assert.ok(Math.abs(heroX)<half-1, 'hero cropped at '+width);
  assert.ok(Math.abs(treeX)<half-1, 'tree cropped at '+width);
  assert.ok(framing.top-framing.bottom>=18);
  assert.ok(Math.abs((framing.right-framing.left)/(framing.top-framing.bottom)-width/height)<.00001);
 }
});

test('camera reflows with movement without losing the doorway',()=>{
 for(const hero of [{x:-7,z:4},{x:6,z:-4},{x:-3,z:5},{x:3,z:3}]){
  const entrance={x:0,z:2.6},framing=chapterFraming({width:375,height:812,hero,entrance});
  const half=framing.right;
  assert.ok(Math.abs(screenHorizontal(hero,framing.focus))<half-1);
  assert.ok(Math.abs(screenHorizontal(entrance,framing.focus))<half-1);
 }
});

test('desktop shows a wider model; cave mode remains person-following on portrait',()=>{
 const portrait=chapterFraming({width:390,height:844,area:'interior',hero:{x:8,z:1}});
 const desktop=chapterFraming({width:1440,height:900,area:'exterior',hero:{x:-4.2,z:3.8}});
 assert.deepEqual({x:portrait.focus.x,z:portrait.focus.z},{x:8,z:1});
 assert.equal(desktop.portrait,false);
 assert.ok(desktop.right>12);
});

test('forest geometry has real thickness and is batched to mobile-friendly meshes',()=>{
 const world=createExterior(new THREE.Scene());
 const meshes=[];
 world.group.traverse(m=>{if(m.isMesh)meshes.push(m);});
 assert.ok(meshes.length<260,'too many draw calls: '+meshes.length);
 assert.ok(world.hit.isMesh&&world.floor.isMesh,'raycast targets must survive batching');
 const bb=new THREE.Box3().setFromObject(world.group);
 assert.ok(bb.max.y>7&&bb.min.y<-.9,'tree and layered soil must remain 3D');
});

test('spawn is far enough from the border to move in four directions',()=>{
 const scene=new THREE.Scene(),outside=createExterior(scene);
 const {spawn,walkable}=outside;
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const after=stepOnEarth(spawn,dx,dz,.145,walkable);
  assert.ok(Math.hypot(after.x-spawn.x,after.z-spawn.z)>.20,'movement blocked at spawn');
 }
});

test('physical-key WASD mappings and immediate-tap impulse remain wired',()=>{
 const main=readFileSync(new URL('../src/chapter2-main.js',import.meta.url),'utf8');
 for(const code of ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown']){
  assert.ok(main.includes(code+':'), 'missing physical keyboard code '+code);
 }
 assert.match(main,/applyExteriorMovement\(axis\.dx,axis\.dz,\.145\)/);
});
