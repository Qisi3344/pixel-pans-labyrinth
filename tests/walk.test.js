import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMovementKey,lastHeldStep,stepDuration,advanceStep} from '../src/walk.js';
test('WASD and arrow keys stay held and the newest direction has priority',()=>{
 const held=[];
 const press=k=>{k=normalizeMovementKey(k);if(k&&!held.includes(k))held.push(k);};
 press('w');press('W');press('ArrowRight');press('ArrowRight');
 assert.deepEqual(held,['w','arrowright']);
 assert.deepEqual(lastHeldStep(held),{dx:1,dz:0});
 held.splice(held.indexOf('arrowright'),1);
 assert.deepEqual(lastHeldStep(held),{dx:0,dz:-1});
 held.length=0;assert.equal(lastHeldStep(held),null);
 assert.equal(normalizeMovementKey('e'),null);
});
test('linear movement carries leftover time into the next grid cell',()=>{
 const duration=stepDuration(false);
 const a=advanceStep(0,duration,.12);
 assert.ok(a.t>0&&a.t<1);
 const b=advanceStep(a.elapsed,duration,.20);
 assert.equal(b.finished,true);assert.equal(b.t,1);
 assert.ok(b.remaining>.04&&b.remaining<.06);
 const c=advanceStep(0,duration,b.remaining);
 assert.ok(c.t>0);assert.equal(stepDuration(true),.64);
});
test('release finishes the current tile without accelerating or snapping',()=>{
 const state=advanceStep(.14,.27,.04);
 assert.ok(state.t>.5&&state.t<.7);
 assert.equal(state.finished,false);
 assert.equal(state.remaining,0);
 assert.equal(lastHeldStep([]),null);
});
