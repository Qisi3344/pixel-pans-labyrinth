import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 HALL,TABLE,START,FOOD,DOOR,MONSTER_START,PLAYER_SPEED,HUNTER_SPEED,
 AWAKEN_SECONDS,DOOR_POLYLINE,newBanquet,walkable,moveActor,distance,eat,
 atDoor,startDrawing,traceChalk,cancelDrawing,tickBanquet,attemptCatch,huntRoute
} from '../src/chapter3-logic.js';

const nearly=(a,b,err=.0001)=>Math.abs(a-b)<err;
test('banquet footprint includes a blocked long dining table and walkable side lanes',()=>{
 assert.equal(walkable(START),true);
 assert.equal(walkable(FOOD),true);
 assert.equal(walkable(DOOR),true);
 assert.equal(walkable(MONSTER_START),true);
 assert.equal(walkable({x:0,z:0}),false);
 assert.equal(walkable({x:0,z:1.8}),true);
 assert.equal(walkable({x:0,z:-1.8}),true);
 assert.ok(TABLE.maxX-TABLE.minX>9);
});

test('food is a real interactable trigger, does not wake the monster from afar',()=>{
 const s=newBanquet();
 assert.equal(s.phase,'invitation');
 assert.equal(eat(s),false);
 assert.equal(s.eaten,false);
 s.player={...FOOD};
 assert.equal(eat(s),true);
 assert.equal(s.phase,'awakening');
 assert.equal(eat(s),false,'no repeated snack interaction');
 tickBanquet(s,1);
 assert.equal(s.phase,'awakening');
 for(let k=0;k<80;k++)tickBanquet(s,.05);
 assert.equal(s.phase,'chase');
 assert.ok(s.awakeTime>=AWAKEN_SECONDS);
});

test('player collides with the banquet table and outer wall without tunnelling',()=>{
 let p={x:-1.4,z:2.20};
 for(let i=0;i<30;i++)p=moveActor(p,0,-1,.05,PLAYER_SPEED,.25);
 assert.ok(p.z>TABLE.maxZ,'the player may not walk through dinner plates');
 let edge={x:-8.85,z:3.3};
 edge=moveActor(edge,-1,0,.09,PLAYER_SPEED,.25);
 assert.ok(edge.x>HALL.minX+.24,'outer boundary collision');
});

test('A* finds a real path from the entrance to the food and around the table',()=>{
 const approach=huntRoute(START,FOOD);
 const escape=huntRoute(FOOD,DOOR);
 const pursue=huntRoute(MONSTER_START,FOOD);
 assert.ok(approach.length>3,'must physically approach feast');
 assert.ok(escape.length>3,'must reach chalk wall from dinner');
 assert.ok(pursue.length>4,'monster must chase around the solid table');
 for(const path of [approach,escape,pursue]){
  for(const node of path)assert.ok(walkable(node,.24),'route must not cross table');
 }
 assert.ok(pursue.some(p=>p.z>TABLE.maxZ+.3||p.x>TABLE.maxX+.3),
  'hunter must go around the table and not pass through it');
});

test('chase only catches within range and results in an explicit lose state',()=>{
 const s=newBanquet();
 s.player={...FOOD};eat(s);
 for(let i=0;i<72;i++)tickBanquet(s,.05);
 assert.equal(s.phase,'chase');
 assert.equal(attemptCatch(s),false);
 s.monster={x:s.player.x+.25,z:s.player.z+.15};
 assert.equal(attemptCatch(s),true);
 assert.equal(s.phase,'caught');
 tickBanquet(s,.9);
 assert.ok(s.deathTime>.8);
 assert.equal(startDrawing(s),false);
});

test('drawing requires chase and the player to reach the chalk-marked wall',()=>{
 const s=newBanquet();
 assert.equal(startDrawing(s),false);
 s.phase='chase';s.player={...FOOD};
 assert.equal(startDrawing(s),false);
 s.player={...DOOR};
 assert.equal(atDoor(s),true);
 assert.equal(startDrawing(s),true);
 assert.equal(s.phase,'drawing');
 assert.equal(cancelDrawing(s),true);
 assert.equal(s.phase,'chase');
 assert.equal(startDrawing(s),true);
});

test('door must be physically traced from left-bottom to left-top, across and down',()=>{
 const s=newBanquet();s.phase='chase';s.player={...DOOR};startDrawing(s);
 assert.equal(traceChalk(s,.83,.84),false,'one tap at end cannot solve');
 assert.equal(s.doorProgress,0);
 for(let k=0;k<3;k++){
  const a=DOOR_POLYLINE[k],b=DOOR_POLYLINE[k+1];
  for(let i=0;i<=100;i++){
   const t=i/100;
   traceChalk(s,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
  }
 }
 assert.equal(s.phase,'escape');
 assert.equal(s.doorProgress,1);
 tickBanquet(s,.10);
 assert.ok(s.winTime>0);
 assert.equal(attemptCatch(s),false,'escape is terminal');
});

test('UI integrates touch controls, pencil tracing and movie-story reveal',()=>{
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 const style=readFileSync(new URL('../src/chapter3-style.css',import.meta.url),'utf8');
 const boot=readFileSync(new URL('../src/boot.js',import.meta.url),'utf8');
 const chapter2=readFileSync(new URL('../src/chapter2-main.js',import.meta.url),'utf8');
 assert.match(boot,/import\('\.\/chapter3-main\.js'\)/,'Vite must statically bundle the third chapter');
 assert.match(main,/id="pale-pad"/);
 assert.match(main,/id="pale-chalk"/);
 assert.match(main,/id="pale-death"/);
 assert.match(main,/id="pale-win"/);
 assert.match(main,/state\.phase==='caught'/);
 assert.match(main,/previewChase/);
 assert.match(main,/previewDoor/);
 assert.match(scene,/createPlayer\(scene/,'shared avatar model must be reused');
 assert.match(scene,/const grapes=new THREE\.Group\(\)/);
 assert.match(scene,/function buildPaleMan/);
 assert.match(scene,/function chalkPortal/);
 assert.match(style,/touch-action:none/);
 assert.match(chapter2,/href="\?stage=3"/,'Chapter II completion should link to III');
});
