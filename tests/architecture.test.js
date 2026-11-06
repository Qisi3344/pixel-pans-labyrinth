import test from 'node:test';
import assert from 'node:assert/strict';
import {ARCH,WELL,spiralStep,spiralPosition,entranceAngle} from '../src/architecture.js';
import {generateMaze,shortestPath,availablePath,WELL_ROUTE,CELL,CENTER} from '../src/maze.js';

test('the stone arch is a full opening with an elevated carved keystone',()=>{
  assert.ok(ARCH.openingRadius > .6);
  assert.ok(ARCH.outerRadius > ARCH.openingRadius);
  assert.ok(ARCH.springY > 1.4);
  assert.ok(ARCH.stones >= 11);
  const m=generateMaze();
  assert.ok(Math.abs(entranceAngle(m.start,CENTER)-Math.PI/4)<.01);
});

test('the well is a deep hollow shaft with descending, inward-winding 3D stairs',()=>{
  assert.ok(WELL.radius>=3.4);
  assert.ok(WELL.depth>=4.5);
  assert.ok(WELL.stepCount>=48);
  assert.ok(WELL.turns>=2);
  let previous=spiralStep(0);
  for(let i=1;i<WELL.stepCount;i++){
    const next=spiralStep(i);
    assert.ok(next.radius<previous.radius);
    assert.ok(next.y<previous.y);
    assert.ok(next.angle>previous.angle);
    previous=next;
  }
  const top=spiralPosition(0),bottom=spiralPosition(1);
  assert.ok(top.y>bottom.y+3.5);
  assert.deepEqual({x:bottom.x,z:bottom.z},{x:0,z:0});
});

test('all seals remain outside the shaft; the sole interior route is playable',()=>{
  const m=generateMaze();
  assert.deepEqual(m.mainRoute.slice(-WELL_ROUTE.length),WELL_ROUTE);
  assert.deepEqual(m.approach,{x:9,z:5});
  for(const thing of [...m.gates,...m.runes]){
    assert.ok(Math.hypot(thing.x-CENTER,thing.z-CENTER)*CELL>WELL.radius+.1);
  }
  assert.equal(availablePath(m,m.start,m.exit),null);
  for(const rune of m.runes){rune.solved=true;m.gates[rune.index].open=true;}
  assert.deepEqual(shortestPath(m.grid,m.start,m.exit),m.mainRoute);
  assert.ok(availablePath(m,m.start,m.exit));
});
