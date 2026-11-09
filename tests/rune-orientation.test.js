import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COMPASS_SYMBOLS,headingAngle,headingPosition} from '../src/rune-orientation.js';
import {generateMaze} from '../src/maze.js';
import {stepRune} from '../src/rune-turn.js';

test('all four compass symbols map to the same headings as clue and inspector',()=>{
 assert.deepEqual(COMPASS_SYMBOLS,['↑','→','↓','←']);
 const expected=[[0,-1],[1,0],[0,1],[-1,0]];
 for(let i=0;i<4;i++){
   const v=headingPosition(i);
   assert.ok(Math.abs(v.x-expected[i][0])<1e-10);
   assert.ok(Math.abs(v.z-expected[i][1])<1e-10);
   assert.ok(Math.abs(headingAngle(i)+i*Math.PI/2)<1e-10);
 }
});
test('every correct phase actually unlocks the expected seal',()=>{
 const maze=generateMaze();
 assert.deepEqual(maze.runes.map(r=>r.target),[2,0,3]);
 for(let i=0;i<3;i++){
   const rune=maze.runes[i];
   for(let j=0;j<4&&!rune.solved;j++)stepRune(maze,i,1);
   assert.equal(rune.phase,rune.target);
   assert.equal(maze.gates[i].open,true);
 }
});
test('overworld pointer uses the SAME Y-axis convention as the clue and closeup',()=>{
 const scene=readFileSync(new URL('../src/scene.js',import.meta.url),'utf8');
 const inspector=readFileSync(new URL('../src/rune-inspector.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.match(scene,/v\.pointer\.rotation\.y=headingAngle\(rune\.phase\)/);
 assert.match(scene,/carvedHeading\.rotation\.y=headingAngle\(rune\.target\)/);
 assert.doesNotMatch(scene,/v\.pointer\.rotation\.z/);
 assert.match(inspector,/headingPosition\(i,\.955\)/);
 assert.match(inspector,/COMPASS_SYMBOLS\[i\]/);
 assert.match(inspector,/headingAngle\(rune\.phase\)/);
 assert.doesNotMatch(main,/SYMBOLS\[near\.target\]/);
});

test('the closeup distinguishes carved goal from the current pointer',()=>{
 const inspector=readFileSync(new URL('../src/rune-inspector.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
 assert.match(inspector,/targetLabel\.textContent=/);
 assert.match(inspector,/currentLabel\.textContent=/);
 assert.match(inspector,/headingPosition\(rune\.target,\.955\)/);
 assert.match(inspector,/isTarget=index===rune\.target/);
 assert.doesNotMatch(inspector,/i===0\?'#e6d9af'/);
 for(const id of ['rune-inspector-target','rune-inspector-current','rune-inspector-match'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(css,/\.rune-inspector-soft-hint\{animation:none!important/);
});
