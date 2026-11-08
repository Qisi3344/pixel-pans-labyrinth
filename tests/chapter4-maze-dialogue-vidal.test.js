import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {generateMaze} from '../src/maze.js';
import {buildFirstMazeCenterFragment} from '../src/chapter4-maze-center.js';
import {FINAL_MAZE_WALLS,FINAL_MAZE_FLOORS,
 FINAL_WELL_CENTER,FINAL_FAUN_POSITION,
 FINAL_APPROACH_PATH,blockedByFinalMaze} from '../src/chapter4-maze-layout.js';
import {buildVidal,animateVidal,royalHall} from '../src/chapter4-scene.js';
import {CHAPTER4_TIME_LIMIT,FINAL_ALTAR,FINAL_DIALOGUE,
 newFinalTrial,updateFinalTrial,advanceFaunDialogue,decideFinal,
 nearFaun,walkableFinal,moveFinalPlayer} from '../src/chapter4-logic.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('last maze reuses FIRST CHAPTER maze geometry instead of an empty new stage',()=>{
 const first=generateMaze(132);
 assert.equal(first.grid.length,19);
 assert.ok(FINAL_MAZE_WALLS.length>14,'central labyrinth should be bounded by real stone walls');
 assert.ok(FINAL_MAZE_FLOORS.length>14,'there are traversable stone-floor tiles');
 assert.ok(FINAL_MAZE_WALLS.some(c=>!first.grid[c.gridZ][c.gridX]));
 assert.ok(FINAL_MAZE_FLOORS.some(c=>first.grid[c.gridZ][c.gridX]));
 const group=new THREE.Group(),fragment=buildFirstMazeCenterFragment(group);
 assert.equal(fragment.wallCount,FINAL_MAZE_WALLS.length);
 assert.equal(fragment.floorCount,FINAL_MAZE_FLOORS.length);
 assert.ok(fragment.root.children.length>FINAL_MAZE_WALLS.length+FINAL_MAZE_FLOORS.length);
 // Every visible wall is backed by exactly the same collision data.
 const wall=FINAL_MAZE_WALLS[0];
 assert.equal(blockedByFinalMaze(wall),true);
 assert.equal(walkableFinal(wall),false);
 assert.ok(!walkableFinal({x:100,z:100}));
});

test('approach has an unobstructed, PLAYER-SIZED corridor into the stone well',()=>{
 assert.ok(walkableFinal(FINAL_ALTAR));
 assert.ok(walkableFinal(FINAL_APPROACH_PATH[0]));
 for(let i=1;i<FINAL_APPROACH_PATH.length;i++){
  const a=FINAL_APPROACH_PATH[i-1],b=FINAL_APPROACH_PATH[i];
  for(let k=0;k<=20;k++){
   const t=k/20,p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};
   assert.equal(walkableFinal(p),true,
    'passage must be clear from start to Faun conversation at '+JSON.stringify(p));
  }
 }
 const d=Math.hypot(FINAL_FAUN_POSITION.x-FINAL_WELL_CENTER.x,
  FINAL_FAUN_POSITION.z-FINAL_WELL_CENTER.z);
 assert.ok(d>4.6,'Faun stands at the SIDE of the well, not inside the black shaft');
 assert.ok(Math.hypot(FINAL_ALTAR.x-FINAL_WELL_CENTER.x,
  FINAL_ALTAR.z-FINAL_WELL_CENTER.z)>3.4,'player stays out of pit');
 assert.ok(Math.hypot(FINAL_ALTAR.x-FINAL_FAUN_POSITION.x,
  FINAL_ALTAR.z-FINAL_FAUN_POSITION.z)>2.4,'Ofelia no longer overlaps Faun');
 const scene=read('../src/chapter4-scene.js');
 assert.ok(scene.includes('buildFirstMazeCenterFragment(root)'));
 assert.ok(scene.includes('FINAL_FAUN_POSITION.x'));
 assert.ok(scene.includes('const direction=new THREE.Vector3(1,1.14,1.30).normalize()'));
 assert.ok(scene.includes('new THREE.OrthographicCamera('));
});

test('Faun says three actual lines BEFORE the decision; clock still runs',()=>{
 const s=newFinalTrial();
 assert.equal(decideFinal(s,'mercy'),false);
 assert.equal(s.phase,'approach');
 s.player={...FINAL_ALTAR};updateFinalTrial(s,.05);
 assert.equal(s.phase,'dialogue');
 assert.ok(nearFaun(s));assert.equal(s.dialogueStep,0);
 assert.ok(FINAL_DIALOGUE.length>=3);
 assert.equal(decideFinal(s,'offering'),false);
 const remaining=s.timeLeft;
 updateFinalTrial(s,.10);
 assert.ok(s.timeLeft<remaining,'dialogue cannot freeze Vidal timer');
 for(let i=0;i<FINAL_DIALOGUE.length-1;i++){
  assert.equal(advanceFaunDialogue(s),true);
  assert.equal(s.phase,'dialogue');
 }
 assert.equal(moveFinalPlayer(s,1,0,.05),0,'cannot leave while Faun speaks');
 assert.equal(advanceFaunDialogue(s),true);
 assert.equal(s.phase,'decision');
 assert.equal(decideFinal(s,'mercy'),true);
 assert.equal(s.ending,'mercy');
 assert.equal(advanceFaunDialogue(s),false);
 const ui=read('../src/chapter4-main.js');
 assert.ok(ui.includes('id="final-faun-dialogue"'));
 assert.ok(ui.includes('advanceFaunDialogue(state)'));
 assert.ok(ui.includes("preview==='dialogue'"));
});

test('Vidal has hinged legs, knees and shoulders and walks with measured strides',()=>{
 const root=new THREE.Group(),vidal=buildVidal(root);
 assert.equal(vidal.legs.length,2);
 assert.equal(vidal.knees.length,2);
 assert.equal(vidal.arms.length,2);
 assert.equal(vidal.pistol.visible,false);
 const staticLeg=vidal.legs[0].rotation.x;
 for(let i=0;i<12;i++)animateVidal(vidal,.05,.14,false);
 assert.ok(vidal.walkBlend>.8,'gait should blend in when the captain walks');
 assert.notEqual(vidal.legs[0].rotation.x,staticLeg,'left hip advances');
 assert.ok(Math.abs(vidal.legs[0].rotation.x-vidal.legs[1].rotation.x)>.1,
  'legs must alternate rather than slide in lockstep');
 assert.ok(Math.abs(vidal.arms[0].rotation.x-vidal.arms[1].rotation.x)>.03,
  'arm swing counterbalances stepping');
 assert.ok(vidal.knees.some(j=>j.rotation.x>.01),'one knee bends during stride');
 animateVidal(vidal,.05,.15,true);
 assert.ok(vidal.arms[1].rotation.x<-.7,'pistol hand aims without disabling leg movement');
 for(let i=0;i<20;i++)animateVidal(vidal,.05,0,false);
 assert.ok(vidal.walkBlend<.03,'running animation stops when the captain stops');
 const scene=read('../src/chapter4-scene.js');
 assert.ok(scene.includes('const strideDistance=Math.hypot(vx,vz)'));
 assert.ok(scene.includes('animateVidal(vidal,d,strideDistance,aiming)'));
});

test('royal courtyard has one Faun, fairy attendants and an EMPTY central throne',()=>{
 const hall=royalHall(new THREE.Group());
 assert.ok(hall.faun);
 assert.equal(hall.fairies.length,7);
 assert.ok(hall.centerThrone);
 assert.equal(hall.throneGroups[1],hall.centerThrone);
 assert.ok(hall.father.position.x<0&&hall.mother.position.x>0);
 const scene=read('../src/chapter4-scene.js');
 assert.ok(scene.includes('const invitation=state.ending==='));
 assert.ok(scene.includes('hero.body.position.set(0,.13,6.00-eased*8.0)'),
  'Ofelia approaches the third throne AFTER parents begin the invitation');
});
