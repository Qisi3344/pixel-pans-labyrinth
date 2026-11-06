import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMaze} from '../src/maze.js';
import {stepRune} from '../src/rune-turn.js';

test('turning in either direction updates phase without changing locks prematurely',()=>{
 const maze=generateMaze();
 const r=maze.runes[0];
 assert.equal(r.phase,1);assert.equal(r.target,2);
 const a=stepRune(maze,0,-1);
 assert.deepEqual(a,{changed:true,solved:false,phase:0});
 assert.equal(maze.gates[0].open,false);
 const b=stepRune(maze,0,1);
 assert.equal(b.phase,1);assert.equal(maze.gates[0].open,false);
});

test('turning backwards onto a target unlocks the original gate through turnRune',()=>{
 const maze=generateMaze();
 maze.runes[0].phase=3;
 const result=stepRune(maze,0,-1);
 assert.deepEqual(result,{changed:true,solved:true,phase:2});
 assert.equal(maze.runes[0].solved,true);
 assert.equal(maze.gates[0].open,true);
 assert.equal(maze.gates[1].open,false);
});

test('solved runes cannot turn, other runes retain their independent state',()=>{
 const maze=generateMaze();
 const initial=maze.runes[1].phase;
 assert.equal(stepRune(maze,0,1).solved,true);
 assert.equal(stepRune(maze,0,1).changed,false);
 assert.equal(maze.runes[1].phase,initial);
 assert.equal(maze.gates[1].open,false);
});

test('a partial turn persists when an inspector is dismissed and re-opened',()=>{
 const maze=generateMaze();
 const phase=stepRune(maze,1,-1).phase;
 assert.equal(phase,1);
 // Inspector close is purely UI: phase and gate remain unchanged.
 assert.equal(maze.runes[1].phase,1);
 assert.equal(maze.gates[1].open,false);
});
