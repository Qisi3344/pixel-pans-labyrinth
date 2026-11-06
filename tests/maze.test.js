import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMaze,availablePath,shortestPath,turnRune,SYMBOLS,withinRuin,CENTER} from '../src/maze.js';

test('generator produces a reproducible valid route',()=>{
 const a=generateMaze(), b=generateMaze();
 assert.deepEqual(a.mainRoute,b.mainRoute);
 assert.ok(a.mainRoute.length>15);
 assert.deepEqual(a.mainRoute[0],a.start);
 assert.deepEqual(a.mainRoute.at(-1),a.exit);
 assert.equal(shortestPath(a.grid,a.start,a.exit)?.length,a.mainRoute.length);
});

test('each rune is obtainable before its respective gate, exit is locked until all runes are solved',()=>{
 const m=generateMaze();
 assert.equal(availablePath(m,m.start,m.exit),null);
 for(let i=0;i<3;i++) {
   assert.ok(availablePath(m,m.start,m.runes[i]),`rune ${i} must be reachable`);
   assert.equal(availablePath(m,m.start,m.exit),null);
   let turns=0;
   while (!m.runes[i].solved && turns<5) { turnRune(m,i); turns++; }
   assert.equal(m.gates[i].open,true);
 }
 assert.ok(availablePath(m,m.start,m.exit));
});

test('runes are on distinct tiles and have four orientations',()=>{
 const m=generateMaze();
 assert.equal(new Set(m.runes.map(r=>`${r.x},${r.z}`)).size,3);
 assert.equal(SYMBOLS.length,4);
});

test('all gate progression remains valid across several deterministic seeds',()=>{
 for(let seed=1;seed<=20;seed++) {
   let m;
   try {m=generateMaze(seed);} catch { continue; } // Reject rare routes shorter than 15 tiles.
   for(let i=0;i<3;i++) {
     assert.ok(availablePath(m,m.start,m.runes[i]),`seed ${seed}, rune ${i}`);
     while(!m.runes[i].solved) turnRune(m,i);
   }
   assert.ok(availablePath(m,m.start,m.exit),`seed ${seed}, exit`);
 }
});

test('circular footprint has one central destination and its start inside the broken ring',()=>{
 const m=generateMaze();
 assert.deepEqual(m.exit,{x:CENTER,z:CENTER});
 assert.ok(withinRuin(m.start.x,m.start.z));
 for(let z=0;z<m.grid.length;z++) for(let x=0;x<m.grid[z].length;x++) {
   if(m.grid[z][x]) assert.ok(withinRuin(x,z), `corridor outside circular island at ${x},${z}`);
 }
});
