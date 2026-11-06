import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMaze,availablePath,turnRune,WELL_ROUTE,CELL} from '../src/maze.js';
import {shouldStartDescent,spiralDescentRoute} from '../src/descent.js';
import {WELL,isStairheadClearance} from '../src/architecture.js';

test('westside is mandatory and runes are split across three regions',()=>{
 const m=generateMaze(),outer=m.mainRoute.slice(0,-WELL_ROUTE.length);
 assert.ok(outer.some(c=>c.x<=3&&c.z>=10));
 assert.ok(outer.some(c=>c.x<=5&&c.z<=5));
 assert.ok(outer.some(c=>c.x>=13));
 assert.ok(m.runes.some(r=>r.x>=12));
 assert.ok(m.runes.some(r=>r.x<=4&&r.z>=10));
 assert.ok(m.runes.some(r=>r.x<=6&&r.z<=6));
});
test('auto descent only begins after all gates unlock at the mouth',()=>{
 const m=generateMaze();
 assert.equal(shouldStartDescent(m,m.approach),false);
 for(let i=0;i<3;i++){
   assert.ok(availablePath(m,m.start,m.runes[i]));
   while(!m.runes[i].solved)turnRune(m,i);
 }
 assert.equal(shouldStartDescent(m,m.start),false);
 assert.equal(shouldStartDescent(m,m.approach,true),false);
 assert.equal(shouldStartDescent(m,m.approach),true);
 const route=spiralDescentRoute();
 assert.deepEqual(route,WELL_ROUTE);assert.deepEqual(route.at(-1),m.exit);
 let prev=m.approach;
 for(const next of route){assert.equal(availablePath(m,prev,next)?.length,2);prev=next}
 route[0].x=-100;assert.notEqual(route[0].x,WELL_ROUTE[0].x);
});
test('northern first flight clearance does not affect distant walls',()=>{
 assert.equal(isStairheadClearance(0,-WELL.rimOuter-CELL*.2,CELL),true);
 assert.equal(isStairheadClearance(WELL.rimOuter+CELL*.3,0,CELL),false);
 assert.equal(isStairheadClearance(0,-WELL.rimOuter-CELL*2,CELL),false);
});
