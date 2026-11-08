import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createChildShoePile,CHILD_SHOE_PILE,SHOE_INSPECT_RADIUS,SHOE_MESSAGE} from '../src/chapter3-shoes.js';
import {deathBeat,DEVOUR_DURATION} from '../src/chapter3-devour.js';
import {newBanquet,distance,walkable} from '../src/chapter3-logic.js';

test('child shoes are shaped leather shoes with soles, toes, laces and straps, not cuboids',()=>{
 const scene=new THREE.Scene();
 const pile=createChildShoePile(scene);
 assert.equal(pile.shoes.length,25);
 assert.equal(pile.root.userData.kind,'child-shoe-pile');
 assert.deepEqual(pile.point,CHILD_SHOE_PILE);
 assert.equal(walkable(CHILD_SHOE_PILE),true,'shoe discovery area remains accessible');
 const styles=new Set(pile.shoes.map(s=>s.userData.style));
 assert.deepEqual([...styles].sort(),['boot','lace-up','mary-jane'].sort());
 for(const child of pile.shoes){
  assert.equal(child.userData.size,'child');
  const geometries=new Set();
  child.traverse(node=>{if(node.isMesh)geometries.add(node.geometry.type);});
  assert.ok(geometries.has('ExtrudeGeometry'),'each sole should follow a real curved footwear outline');
  assert.ok(geometries.has('SphereGeometry'),'shoe should have rounded toe/heel geometry');
  assert.ok(child.children.length>=6,'models need actual straps or laces/details');
 }
 assert.ok(SHOE_MESSAGE.includes('小孩的鞋子'));
 assert.ok(SHOE_INSPECT_RADIUS>1.1);
 assert.ok(distance({...CHILD_SHOE_PILE},CHILD_SHOE_PILE)<SHOE_INSPECT_RADIUS);
});

test('caught state plays a full-length, readable grab, lift, bite, gulp, and fade',()=>{
 assert.ok(DEVOUR_DURATION>=3.8);
 const events=[];
 for(let t=0;t<=DEVOUR_DURATION+.01;t+=.04){
  const b=deathBeat(t);
  if(events.at(-1)!==b.stage)events.push(b.stage);
 }
 assert.deepEqual(events,['grab','lift','bite','gulp','fade']);
 const beginning=deathBeat(.25);
 assert.ok(beginning.grip>0 && beginning.grip<1);
 assert.equal(beginning.fade,0);
 const lifted=deathBeat(1.25);
 assert.ok(lifted.heroLift>.6);
 assert.equal(lifted.fade,0);
 assert.ok(deathBeat(1.90).jawOpen>.55,'first visible jaw bite must happen');
 assert.ok(deathBeat(2.65).jawOpen>.55,'second visible jaw bite must happen');
 assert.equal(deathBeat(2.1).fade,0,'no early darkness during bites');
 assert.equal(deathBeat(DEVOUR_DURATION).completed,true);
 assert.ok(deathBeat(DEVOUR_DURATION).fade>.99,'cut to failure card only after black screen');
});

test('the captured heroine stays normal size in the 3D cutscene until after swallowing',()=>{
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 assert.ok(scene.includes("const devour=state.phase==='caught'?deathBeat(state.deathTime):null"));
 assert.ok(scene.includes("player.body.scale.setScalar(1);"));
 assert.ok(scene.includes("player.body.visible=devour.fade<.97"));
 assert.ok(scene.includes("const held=pale.root.localToWorld("));
 assert.ok(scene.includes("jawPivot.rotation.x=open*.9"));
 assert.ok(scene.includes("jawPivot.position.y=2.21-open*.45"));
 assert.ok(scene.includes("maw.scale.set(.34+open*.12,.10+open*.44,.14)"));
 assert.ok(scene.includes("teeth.forEach(tooth=>{tooth.visible=true;})"));
 assert.ok(scene.includes("(portrait?2.7:5.4)*deathBeat(state.deathTime).grip"));
 assert.ok(scene.includes("const deathCameraAngle=new THREE.Vector3(-.10,.55,1.7).normalize()"));
 assert.ok(scene.includes("state.phase==='caught'?deathCameraAngle:angle"));
 assert.ok(scene.includes("biteLight.intensity=.36+open*1.9"));
 assert.ok(scene.includes(".19+.34*devour.jawOpen"));
 assert.ok(scene.includes("fragment.visible=elapsed>0&&elapsed<1.55"));
 assert.ok(scene.includes("teeth.forEach(tooth=>{tooth.visible=true;})"));
 assert.ok(!scene.includes("player.body.scale.setScalar(Math.max(.01,1-t))"));
 assert.ok(main.includes("if(beat.completed&&!endingShown)"));
 assert.ok(!main.includes("state.deathTime>=1.08&&!endingShown"));
 assert.ok(main.includes("state.phase==='caught'"));
 assert.ok(main.includes("previewDevour"));
});

test('shoe clue is encountered physically, shown once and has a safe visual QA entry',()=>{
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 const style=readFileSync(new URL('../src/chapter3-style.css',import.meta.url),'utf8');
 const passage=readFileSync(new URL('../src/chapter3-passage.js',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 assert.ok(main.includes('distance(state.player,CHILD_SHOE_PILE)<SHOE_INSPECT_RADIUS'));
 assert.ok(main.includes("inspectedShoes=true"));
 assert.ok(main.includes("tell(SHOE_MESSAGE"));
 assert.ok(main.includes('previewShoes'));
 assert.ok(main.includes('id="pale-shoe-clue"'));
 assert.ok(main.includes('id="pale-death-vignette"'));
 assert.ok(style.includes('.pale-shoe-clue.visible'));
 assert.ok(style.includes('.pale-death-vignette'));
 assert.ok(scene.includes('shoePile=createChildShoePile(scene)'));
 assert.ok(!passage.includes("const shoe=cube(props,"));
});

test('QA-only frozen bite frame allows exact visual inspection without altering live gameplay',()=>{
 const main=readFileSync(new URL('../src/chapter3-main.js',import.meta.url),'utf8');
 assert.ok(main.includes("q.has('previewDevour')"));
 assert.ok(main.includes("q.has('poseAt')"));
 assert.ok(main.includes("if(QA_POSE_AT!==null&&state.phase==='caught')state.deathTime=QA_POSE_AT;"));
 assert.ok(main.includes("Math.max(0,Math.min(3.60,t))"));
});

// Regression: the huge spherical head was caused by resetting a UNIT icosahedron
// to scale=(1,1,1) every idle frame, overriding its .35/.49/.33 modeling scale.
test('Pale Man retains human-sized elongated head in idle, chase and death poses',()=>{
 const scene=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 assert.ok(scene.includes('export const PALE_HEAD_BASE_SCALE=Object.freeze({x:.32,y:.46,z:.29})'));
 assert.ok(scene.includes('head.scale.set(PALE_HEAD_BASE_SCALE.x,PALE_HEAD_BASE_SCALE.y,PALE_HEAD_BASE_SCALE.z)'),
  'rest pose must use anatomical dimensions, not unit mesh scale');
 assert.ok(scene.includes('PALE_HEAD_BASE_SCALE.x*(1+open*.06)'),
  'bite animation must stretch the skull relative to its base shape');
 assert.ok(!scene.includes('head.scale.set(1,1,1)'),
  'setting a unit icosahedron to 1,1,1 inflates the head dramatically');
 assert.ok(!scene.includes('head.scale.set(1+open*.10,1+open*.22,1)'),
  'bite must not grow the head to a 2+ world-unit ball');
});
