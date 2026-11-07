import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {createExterior} from '../src/chapter2-exterior.js';
import {nearEntrance,stepOnEarth,directionTo} from '../src/chapter2-overworld.js';

test('tree cave entrance has a large, clickable physical hit target',()=>{
 const world=createExterior(new THREE.Scene());
 assert.equal(world.hit.userData.kind,'entrance');
 assert.ok(world.hit.geometry.parameters.width>=3);
 assert.ok(world.hit.geometry.parameters.height>=3);
 assert.ok(world.hit.position.z>=2,'click target must be in front of the hollow');
});

test('explicit entrance guidance actually sets a goal for autonomous walking',()=>{
 const main=readFileSync(new URL('../src/chapter2-main.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/chapter2-style.css',import.meta.url),'utf8');
 assert.match(main,/id="root-enter-guide"/);
 assert.match(main,/function guideToTree\(\)/);
 assert.match(main,/exteriorGoal=\{\.\.\.view\.exterior\.entrance\}/);
 assert.match(main,/\$\('root-enter-guide'\)\.addEventListener\('click',guideToTree\)/);
 assert.match(main,/else guideToTree\(\);/);
 assert.match(css,/\.root-enter-guide\{[\s\S]*pointer-events:auto/);
});

test('following the entrance goal from spawn physically reaches the cave mouth',()=>{
 const exterior=createExterior(new THREE.Scene());
 let cursor={...exterior.spawn};
 for(let i=0;i<200 && !nearEntrance(cursor,exterior.entrance);i++){
  const d=directionTo(cursor,exterior.entrance);
  cursor=stepOnEarth(cursor,d.x,d.z,.05,exterior.walkable);
 }
 assert.ok(nearEntrance(cursor,exterior.entrance),
  'auto-walk must reach the cave via walkable forest terrain');
});
