import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMaze,availablePath,shortestPath,turnRune,WELL_ROUTE,
  WELL_CLEARING_WALKABLE,WELL_CLEARING_ROOTS,id} from '../src/maze.js';

test('the outlined upper-left well wall is gone and its ground is walkable',()=>{
 const m=generateMaze();
 assert.equal(WELL_CLEARING_WALKABLE.length,13);
 const removed=new Set(WELL_CLEARING_WALKABLE.map(({x,z})=>id(x,z)));
 for(const {x,z} of WELL_CLEARING_WALKABLE) {
   assert.equal(m.grid[z][x],true,`removed wall ${x},${z} must be traversable`);
 }
 for(const {x,z} of WELL_CLEARING_ROOTS){
   assert.ok(!removed.has(id(x,z)));
   assert.equal(m.grid[z][x],false,'visible bramble pit blocks the only bypass');
 }
 // The existing mandatory route to the well is not short-circuited.
 assert.deepEqual(shortestPath(m.grid,m.start,m.exit),m.mainRoute);
 assert.deepEqual(m.mainRoute.slice(-WELL_ROUTE.length),WELL_ROUTE);
});

test('removing the stone band does not let any gate or seal be skipped',()=>{
 const m=generateMaze();
 for(let i=0;i<3;i++){
   assert.equal(availablePath(m,m.start,m.approach),null);
   for(const point of WELL_ROUTE){
     assert.equal(availablePath(m,m.start,point),null,
       `stair route ${point.x},${point.z} accessible before gate ${i+1}`);
   }
   assert.ok(availablePath(m,m.start,m.runes[i]),`seal ${i} reachable`);
   while(!m.runes[i].solved)turnRune(m,i);
 }
 assert.ok(availablePath(m,m.start,m.approach));
 assert.ok(availablePath(m,m.start,m.exit));
});

test('alternate procedural seeds keep their original walls',()=>{
 const m=generateMaze(140629);
 assert.equal(m.grid[7][7],false);
});
