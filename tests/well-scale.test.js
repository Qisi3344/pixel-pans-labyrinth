import test from 'node:test';
import assert from 'node:assert/strict';
import {WELL,spiralPosition,visibleSpiralPosition,visibleWellFloorY} from '../src/architecture.js';
import {generateMaze,shortestPath,WELL_ROUTE} from '../src/maze.js';

test('scaled well is half the former diameter and its stair path matches the mesh scale',()=>{
 assert.equal(WELL.visualScale,.5);
 assert.equal(WELL.radius*WELL.visualScale,1.775);
 for(const t of [0,.12,.42,.75,.98,1]){
   const normal=spiralPosition(t),small=visibleSpiralPosition(t);
   for(const key of ['x','y','z'])assert.ok(Math.abs(small[key]-normal[key]*.5)<1e-8);
 }
 assert.equal(visibleWellFloorY(5),0);
 assert.ok(visibleWellFloorY(0)<-2);
});

test('existing west-side maze route and stair checkpoints are unchanged',()=>{
 const m=generateMaze();
 assert.deepEqual(m.mainRoute.slice(-WELL_ROUTE.length),WELL_ROUTE);
 const outer=m.mainRoute.slice(0,-WELL_ROUTE.length);
 assert.ok(outer.some(c=>c.x<=3&&c.z>=10));
 assert.ok(outer.some(c=>c.x<=5&&c.z<=5));
 assert.equal(shortestPath(m.grid,m.start,m.exit).length,m.mainRoute.length);
});
