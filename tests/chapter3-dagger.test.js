import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createDaggerNiche,DAGGER_POINT,DAGGER_RADIUS} from '../src/chapter3-dagger.js';
import {newBanquet,walkable,huntRoute,START} from '../src/chapter3-logic.js';

test('a real miniature three-door cabinet holds the ritual dagger',()=>{
 const scene=new THREE.Scene(),cabinet=createDaggerNiche(scene);
 assert.ok(cabinet.target.userData.kind==='dagger-niche');
 assert.ok(cabinet.dagger.children.length>=4,'blade, handle, crossguard and pommel');
 assert.ok(cabinet.doorPivot.children.length>3,'actual cabinet door and keyhole');
 assert.ok(walkable(DAGGER_POINT,.27),'must stand in front of lock');
 assert.ok(huntRoute(START,DAGGER_POINT).length>30,'niche is reachable down long corridor');
 assert.ok(DAGGER_RADIUS>=1.2);
 cabinet.update(.05,false,0);
 assert.equal(cabinet.target.visible,true);
 const shut=cabinet.doorPivot.rotation.y;
 for(let i=0;i<100;i++)cabinet.update(.05,true,i*.05);
 assert.ok(cabinet.doorPivot.rotation.y<shut-.5);
 assert.ok(cabinet.dagger.scale.x<.4,'blade visibly claimed rather than hovering forever');
});
test('dagger is earned before grapes wake the monster in normal campaign',()=>{
 const src=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 const passage=readFileSync(new URL('../src/chapter3-passage.js',import.meta.url),'utf8');
 const logic=readFileSync(new URL('../src/chapter3-logic.js',import.meta.url),'utf8');
 assert.ok(logic.includes('hasDagger:false'));
 assert.ok(src.includes("if(!state.hasDagger){"));
 assert.ok(src.includes('state.hasDagger=true'));
 assert.ok(src.includes('if(!hasGoldenKey)'));
 assert.ok(src.includes('loadCampaign().completed>=2'));
 assert.ok(src.includes("setActionTarget(DAGGER_POINT,'dagger')"));
 assert.ok(src.includes("if(hit.kind==='dagger')"));
 assert.ok(scene.includes('createDaggerNiche(scene)'));
 assert.ok(scene.includes("return {kind:'dagger'}"));
 assert.ok(!passage.includes('Small dagger in a niche for film fidelity; not a mandatory fetch quest'));
 const state=newBanquet();assert.equal(state.hasDagger,false);
});
