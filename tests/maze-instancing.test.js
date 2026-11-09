import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {buildStoneInstances,resolveStonePick} from '../src/maze-instancing.js';

test('instanced floor raycasts preserve the logical cell for each separate tile',()=>{
 const geometry=new THREE.BoxGeometry(1,1,1);
 const material=new THREE.MeshBasicMaterial();
 const entries=[
  {position:[0,0,0],scale:[1,.22,1],cell:{x:4,z:7}},
  {position:[3,0,0],scale:[1,.22,1],cell:{x:6,z:7}},
  {position:[6,0,0],scale:[1,.22,1],cell:{x:8,z:7}},
 ];
 const mesh=buildStoneInstances(entries,geometry,material,{kind:'tile'});
 assert.equal(mesh.isInstancedMesh,true);
 assert.equal(mesh.count,3);
 for(let i=0;i<3;i++){
  const ray=new THREE.Raycaster(new THREE.Vector3(i*3,3,0),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObject(mesh,false)[0];
  assert.ok(hit,'each rendered tile should be clickable');
  assert.equal(hit.instanceId,i);
  assert.deepEqual(resolveStonePick(hit),{kind:'tile',...entries[i].cell});
 }
 assert.equal(resolveStonePick(null),null);
});
test('batched walls remain visible shadow casters but do not claim floor picking',()=>{
 const walls=buildStoneInstances([
  {position:[0,1,0],scale:[1,2,1]}
 ],new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial(),
 {kind:'wall',castShadow:true});
 assert.equal(walls.castShadow,true);
 assert.equal(walls.receiveShadow,true);
 assert.equal(walls.userData.cells,null);
 assert.equal(buildStoneInstances([],new THREE.BoxGeometry(),new THREE.MeshBasicMaterial()),null);
});
test('first chapter retains click-to-path while static rock meshes are instanced',()=>{
 const src=readFileSync(new URL('../src/scene.js',import.meta.url),'utf8');
 assert.match(src,/const floorBatches=PALETTE\.floor\.map/);
 assert.match(src,/const wallBatches=PALETTE\.rock\.map/);
 assert.match(src,/clickables\.push\(mesh\)/);
 assert.match(src,/return resolveStonePick\(hit\)/);
 assert.match(src,/makeRune\(stage,r,clickables\)/);
 assert.match(src,/makeGate\(stage,g,clickables\)/);
});
