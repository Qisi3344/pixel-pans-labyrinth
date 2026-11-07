import test from 'node:test';
import assert from 'node:assert/strict';
import {NODES,EDGES,STONE_NODES,newChapter,rootOpen,edgeAccessible,step,findPath,interact,nextDirection} from '../src/chapter2-logic.js';

test('chapter two graph edges refer to valid distinct tunnel nodes',()=>{
 for(const [a,b] of EDGES){
  assert.ok(a>=0&&a<NODES.length);
  assert.ok(b>=0&&b<NODES.length);
  assert.notEqual(a,b);
 }
 assert.equal(new Set(EDGES.map(e=>[...e].sort((a,b)=>a-b).join('-'))).size,EDGES.length);
});
test('root breath alternates closed and open',()=>{
 assert.equal(rootOpen(0),true);
 assert.equal(rootOpen(3.0),false);
 assert.equal(rootOpen(4.3),true);
});
test('three magic stones can be collected before reaching toad',()=>{
 const state=newChapter();
 assert.equal(findPath(state,0,10),null);
 assert.deepEqual(findPath(state,0,3),[0,1,2,3]);
 for(const n of [3,7,11]){
  // Access through root passage while the tree breathes out.
  state.time=0;
  const p=findPath(state,state.node,n);
  assert.ok(p,'each rune must have accessible path: '+n);
  for(const to of p.slice(1)) assert.equal(step(state,to),true);
  assert.equal(interact(state).type,'stone');
 }
 assert.deepEqual(state.stones,[true,true,true]);
 assert.equal(findPath(state,state.node,10),null);
 const p=findPath(state,state.node,8);
 assert.ok(p);
 for(const to of p.slice(1))step(state,to);
 assert.equal(interact(state).type,'boulder');
 assert.equal(state.boulderMoved,true);
 assert.ok(findPath(state,8,10));
});
test('toad does not yield reward before all stones, takes exactly three offerings',()=>{
 const state=newChapter();state.node=10;
 assert.equal(interact(state).type,'need-stones');
 state.stones=[true,true,true];
 assert.deepEqual(interact(state),{type:'offering',count:1});
 assert.deepEqual(interact(state),{type:'offering',count:2});
 assert.deepEqual(interact(state),{type:'victory'});
 assert.equal(state.won,true);assert.equal(state.offerings,3);
 assert.deepEqual(interact(state),{type:'complete'});
});
test('root blocks movement when closed, boulder blocks before push',()=>{
 const s=newChapter();s.time=3;
 assert.equal(edgeAccessible(s,4,5),false);
 assert.equal(edgeAccessible(s,8,9),false);
 s.time=0;assert.equal(edgeAccessible(s,4,5),true);
 s.boulderMoved=true;assert.equal(edgeAccessible(s,8,9),true);
});
test('directional movement picks forward path and rejects unknown directions',()=>{
 const s=newChapter();assert.equal(nextDirection(s,1,0),1);
 assert.equal(nextDirection(s,-1,0),null);
});