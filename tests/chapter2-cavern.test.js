import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {createCavern} from '../src/chapter2-cavern.js';
import {EDGES,NODES,STONE_NODES,newChapter,findPath,step,interact} from '../src/chapter2-logic.js';

test('new cave is three-dimensional, jagged, and has visible branching walkways',()=>{
 const world=new THREE.Group();
 const cavern=createCavern(world);
 assert.ok(world.children.length>35, 'root arches, stones, mushrooms and cave should be separate geometry');
 const terrain=world.children.find(o=>o.isMesh&&o.material.vertexColors===true);
 assert.ok(terrain,'path and cave soil should be vertex-coloured geometry, not a box');
 const positions=terrain.geometry.getAttribute('position');
 let top=-Infinity,bottom=Infinity,minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
  minX=Math.min(minX,x);maxX=Math.max(maxX,x);
  minZ=Math.min(minZ,z);maxZ=Math.max(maxZ,z);
  top=Math.max(top,y);bottom=Math.min(bottom,y);
 }
 assert.ok(maxX-minX>16,'cave should span the route');
 assert.ok(maxZ-minZ>3,'branching passage must actually extend toward player');
 assert.ok(top-bottom>1,'soil layers must have thickness');
 assert.deepEqual(cavern.amberPosition.toArray().slice(0,1),[4]);
});

test('amber grotto has a side branch BEFORE the boulder and the toad',()=>{
 assert.deepEqual(NODES[STONE_NODES[2]],{x:4,z:3});
 assert.ok(EDGES.some(e=>e.includes(8)&&e.includes(11)),'amber corridor must branch directly from junction 8');
 const state=newChapter();state.node=8;
 assert.equal(state.boulderMoved,false);
 assert.deepEqual(findPath(state,8,11),[8,11]);
 assert.equal(step(state,11),true);
 assert.deepEqual(interact(state),{type:'stone',index:2});
 assert.equal(state.stones[2],true);
});

test('all three stones still have distinct accessible grottoes',()=>{
 assert.equal(new Set(STONE_NODES).size,3);
 for(const node of STONE_NODES)assert.ok(NODES[node]);
 const stage=new THREE.Group();createCavern(stage);
 const bounds=new THREE.Box3().setFromObject(stage);
 for(const node of STONE_NODES){
  assert.ok(node>=0&&node<NODES.length);
  assert.ok(bounds.min.x<NODES[node].x&&bounds.max.x>NODES[node].x);
  assert.ok(bounds.min.z<NODES[node].z&&bounds.max.z>NODES[node].z);
 }
});

test('amber floor beacon remains discoverable without the intrusive floating tag',()=>{
 const main=readFileSync(new URL('../src/chapter2-main.js',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../src/chapter2-scene.js',import.meta.url),'utf8');
 assert.doesNotMatch(main,/id="amber-marker"/);
 assert.match(main,/id="amber-guide"/);
 assert.match(main,/follow\(STONE_NODES\[2\]\)/);
 assert.doesNotMatch(main,/stoneScreenPosition\(2\)/);
 assert.match(scene,/createCavern\(stage\)/);
 assert.match(scene,/new THREE\.OctahedronGeometry\(i===2\?\.55/);
 assert.doesNotMatch(scene,/block\(stage,0x313d39,\[0,-4\.25,0\]/,
  'the former opaque square underground base must never return');
});
