import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createExterior} from '../src/chapter2-exterior.js';
import {directionTo,distance2d,nearEntrance,stepOnEarth} from '../src/chapter2-overworld.js';

test('exterior features a separate visible three-dimensional terrain',()=>{
 const scene=new THREE.Scene();
 const world=createExterior(scene);
 assert.ok(world.group.visible);
 assert.ok(world.floor.isMesh);
 assert.ok(world.hit.isMesh);
 assert.equal(world.hit.userData.kind,'entrance');
 const bbox=new THREE.Box3().setFromObject(world.group);
 assert.ok(bbox.max.y>7,'tree must be towering and nearly leafless');
 assert.ok(bbox.min.y<-1,'ground must have a real soil cross section');
 assert.ok(bbox.max.x-bbox.min.x>15,'not a small plain tree planted in a square slab');
 assert.ok(bbox.max.z-bbox.min.z>10);
 assert.ok(scene.children.includes(world.group));
});
test('Ofelia begins within the playable forest, visibly away from the portal',()=>{
 const scene=new THREE.Scene(),world=createExterior(scene);
 assert.ok(world.walkable(world.spawn.x,world.spawn.z));
 assert.ok(world.walkable(world.entrance.x,world.entrance.z));
 assert.ok(world.height(world.spawn.x,world.spawn.z)>-.7);
 assert.ok(distance2d(world.spawn,world.entrance)>3);
 assert.equal(nearEntrance(world.spawn,world.entrance),false);
});
test('continuous walking from Ofelia spawn reaches the cave mouth without collision deadlocks',()=>{
 const world=createExterior(new THREE.Scene());
 let current={...world.spawn},t=0;
 while(!nearEntrance(current,world.entrance)&&t<400){
  const d=directionTo(current,world.entrance);
  current=stepOnEarth(current,d.x,d.z,.04,world.walkable);
  t++;
 }
 assert.ok(nearEntrance(current,world.entrance),'player should reach the hollow tree from the start point');
});
test('footsteps slide against tree roots and respect the diorama edge',()=>{
 const world=createExterior(new THREE.Scene());
 let pos={x:2,z:1};
 const stopped=stepOnEarth(pos,-1,0,.2,world.walkable);
 assert.equal(stopped.x,pos.x,'solid trunk base blocks walking through bark');
 const edge={x:8.55,z:0};
 const blocked=stepOnEarth(edge,1,0,1.0,world.walkable);
 assert.equal(blocked.x,edge.x,'walking beyond forest island is disallowed');
});
