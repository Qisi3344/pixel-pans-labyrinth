import test from 'node:test';
import assert from 'node:assert/strict';
import {dampHeading} from '../src/chapter3-scene.js';
import {readFileSync} from 'node:fs';
import {
 HALL,TABLE,START,FOOD,DOOR,MONSTER_START,PLAYER_SPEED,HUNTER_SPEED,
 AWAKEN_SECONDS,DOOR_POLYLINE,newBanquet,walkable,moveActor,distance,eat,
 atDoor,startDrawing,traceChalk,cancelDrawing,tickBanquet,attemptCatch,huntRoute,
 inspectSleepingMonster,MONSTER_INSPECT_RADIUS
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
 for(let i=0;i<9;i++)tickBanquet(s,.1);
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
 assert.equal(s.phase,'climbing');
 for(let i=0;i<10;i++)tickBanquet(s,.1);
 assert.equal(s.phase,'drawing');
 assert.equal(cancelDrawing(s),true);
 assert.equal(s.phase,'chase');
 assert.equal(startDrawing(s),true);
});

test('door must be physically traced from left-bottom to left-top, across and down',()=>{
 const s=newBanquet();s.phase='chase';s.player={...DOOR};startDrawing(s);
 for(let i=0;i<10;i++)tickBanquet(s,.1);
 assert.equal(traceChalk(s,.83,.84),false,'one tap at end cannot solve');
 assert.equal(s.doorProgress,0);
 for(let k=0;k<DOOR_POLYLINE.length-1;k++){
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
 assert.match(chapter2,/href="\?stage=3&flow=1"/,'Chapter II completion should link to III within campaign');
});

test('scene heading rotation is browser-safe and wraps across +/- PI',()=>{
 const from=Math.PI-.08,to=-Math.PI+.08;
 const next=dampHeading(from,to,10,.08);
 assert.ok(next>from&&next<from+.17,'shortest rotation must not spin the long way');
 assert.ok(dampHeading(0,0,6,.016)===0);
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 assert.equal(scene.includes('THREE.MathUtils.dampAngle('),false,
  'a nonexistent MathUtils method would crash the entire game at first render');
 assert.equal(typeof dampHeading,'function');
});

test('awakening zoom is cinematic and even chalk QA keeps the monster chasing',()=>{
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 assert.ok(scene.includes("const cinematicZoom=1+Math.max(0,reveal)"));
 assert.ok(scene.includes("state.awakeTime/AWAKEN_SECONDS"));
 assert.ok(main.includes("if(params.has('previewDoor'))"));
 assert.ok(!main.includes("if(QA_CHALK_PREVIEW&&['climbing','drawing'].includes(state.phase))return;"),
  'no silent QA chase freeze while Ofelia traces the ceiling door');
 assert.ok(main.includes("if(!['chase','climbing','drawing'].includes(state.phase))return;"));
});

test('sleeping monster can be observed nearby or by click without waking or navigating to feast',()=>{
 const s=newBanquet();
 assert.equal(s.inspectedMonster,false);
 assert.equal(inspectSleepingMonster(s),false,'entering corridor should not trigger');
 assert.equal(s.phase,'invitation');
 s.player={x:MONSTER_START.x-1.3,z:MONSTER_START.z+.6};
 assert.ok(distance(s.player,s.monster)<MONSTER_INSPECT_RADIUS);
 assert.equal(inspectSleepingMonster(s),true);
 assert.equal(s.inspectedMonster,true);
 assert.equal(s.phase,'invitation','quiet approach must not start chase');
 assert.equal(s.eaten,false);
 const clicked=newBanquet();
 assert.equal(inspectSleepingMonster(clicked,{clicked:true}),true,'clicking figure works without proximity');
 assert.equal(clicked.phase,'invitation');
 assert.equal(clicked.eaten,false);
 clicked.phase='awakening';
 assert.equal(inspectSleepingMonster(clicked,{clicked:true}),false,'do not override waking/chase UI');
});

test('third chapter invites free exploration instead of sending the player directly to food',()=>{
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 assert.ok(main.includes('✧ 先四处看看吧'));
 assert.ok(main.includes("actionButton.hidden=!(canDagger||canEat||canDraw)"));
 assert.ok(main.includes("actionButton.style.display=(canDagger||canEat||canDraw)?'':'none'"));
 assert.ok(!main.includes("前往盛宴 ↗"));
 assert.ok(main.includes("if(hit.kind==='monster')"));
 assert.ok(main.includes("showSleepingObservation();return;"));
 assert.ok(main.includes("if(distance(state.player,FOOD)<1.55)doEat();"),
  'E interaction cannot path to grapes from spawn');
 assert.ok(main.includes("if(started&&state.phase==='invitation'&&!state.inspectedMonster"));
 assert.ok(main.includes("tell('他好像在沉睡……'"));
 assert.ok(scene.includes("ray.intersectObject(pale.root,true)"));
 assert.ok(scene.includes("return {kind:'monster'}"));
});

test('third chapter uses the world itself for clues, without the old side task card',()=>{
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 const css=readFileSync(new URL('../src/chapter3-style.css',import.meta.url),'utf8');
 for(const dead of ['pale-side','pale-objective','pale-description','pale-danger','pale-timer','pale-relic-hint']){
  assert.ok(!main.includes(dead),'remove detached sidebar reference '+dead);
  assert.ok(!css.includes(dead),'remove unused sidebar styling '+dead);
 }
 assert.ok(main.includes('pale-suggest'),'keep the small contextual interactable hint');
 assert.ok(main.includes('pale-escape-guide'),'keep chase directions');
 assert.ok(main.includes("remaining+' 秒后入口关闭'"),'keep the timed chase information');
});
