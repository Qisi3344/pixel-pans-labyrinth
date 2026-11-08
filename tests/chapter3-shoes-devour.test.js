import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createChildShoePile,CHILD_SHOE_PILE,SHOE_INSPECT_RADIUS,SHOE_MESSAGE} from '../src/chapter3-shoes.js';
import {deathBeat,DEVOUR_DURATION} from '../src/chapter3-devour.js';
import {buildPaleMan} from '../src/chapter3-scene.js';
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
 assert.ok(scene.includes("jawPivot.rotation.x=open*.42"));
 assert.ok(scene.includes("jawPivot.position.set(0,-.26-open*.065,.074)"));
 assert.ok(scene.includes("maw.scale.set(.145,.025+open*.118,.027)"));
 assert.ok(scene.includes("teeth.forEach(tooth=>{tooth.visible=open>.11;})"));
 assert.ok(scene.includes("(portrait?1.85:3.15)*deathBeat(state.deathTime).grip"));
 assert.ok(scene.includes("const deathCameraAngle=new THREE.Vector3(.05,.42,1.78).normalize()"));
 assert.ok(scene.includes("state.phase==='caught'?biteAngle:angle"));
 assert.ok(scene.includes("biteLight.intensity=.18+open*.64"));
 assert.ok(scene.includes(".52+.10*devour.jawOpen"));
 assert.ok(scene.includes("fragment.visible=elapsed>0&&elapsed<1.55"));
 assert.ok(scene.includes("teeth.forEach(tooth=>{tooth.visible=open>.11;})"));
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
 assert.ok(scene.includes('PALE_HEAD_BASE_SCALE.x*(1+open*.015)'),
  'bite animation must stretch the skull relative to its base shape');
 assert.ok(!scene.includes('head.scale.set(1,1,1)'),
  'setting a unit icosahedron to 1,1,1 inflates the head dramatically');
 assert.ok(!scene.includes('head.scale.set(1+open*.10,1+open*.22,1)'),
  'bite must not grow the head to a 2+ world-unit ball');
});

test('skull, mouth, and hinged jaw form ONE connected facial rig throughout devouring',()=>{
 const scene=new THREE.Scene();
 const model=buildPaleMan(scene);
 const s=newBanquet();
 assert.equal(model.maw.parent,model.skull,'cavity must be rigidly parented to skull');
 assert.equal(model.mouthShadow.parent,model.skull);
 assert.equal(model.lip.parent,model.skull);
 assert.equal(model.jawPivot.parent,model.skull,'chin must hinge from same head');
 assert.equal(model.head.parent,model.skull);
 for(const t of [0,1.40,1.92,2.35,2.65,3.30,4.00]){
  s.phase='caught';s.deathTime=t;
  s.player={x:6.46,z:.8};
  model.pose(s,t,.016);
  const beat=deathBeat(t);
  assert.ok(model.maw.position.z<.33,'dark cavity never floats in front of face');
  assert.ok(model.lip.position.z<.33,'lip rim is anchored in the skull');
  assert.ok(model.maw.scale.y<.17,'mouth never stretches longer than skull');
  assert.ok(model.jawPivot.position.y>-.34,'hinge remains inside the lower cheek');
  assert.ok(model.jawPivot.rotation.x<.43,'jaw opens anatomically');
  assert.ok(model.head.scale.x<.35 && model.head.scale.y<.49,'skull remains human-proportioned');
  assert.equal(model.closedMouth.visible,false);
  assert.ok(Math.abs(model.jawPivot.rotation.x-beat.jawOpen*.42)<1e-8);
  // Chunks of head can't detach and become the giant triangular jaw seen in screenshot.
  model.skull.updateWorldMatrix(true,true);
  const faceLocal=model.skull.worldToLocal(model.maw.getWorldPosition(new THREE.Vector3()));
  assert.ok(Math.abs(faceLocal.x)<.01 &&
   faceLocal.y>-.32 && faceLocal.y<0 && faceLocal.z<.30,
   'the mouth remains anchored inside the lower-front skull coordinates');
 }
 s.phase='invitation';model.pose(s,5,.016);
 assert.equal(model.closedMouth.visible,true);
 assert.equal(model.maw.visible,false);
 assert.equal(model.jawPivot.visible,false);
});

test('death close-up follows the monsters facing direction, not an accidental side profile',()=>{
 const src=readFileSync(new URL('../src/chapter3-scene.js',import.meta.url),'utf8');
 assert.ok(src.includes('biteAngle.copy(deathCameraAngle).applyAxisAngle(upAxis,pale.root.rotation.y)'));
 assert.ok(src.includes("state.phase==='caught'?biteAngle:angle"));
 assert.ok(src.includes('.52+.10*devour.jawOpen,devour.heroLift'));
 assert.ok(!src.includes('jawPivot.position.y=2.21-open*.45'));
 assert.ok(!src.includes('lip.position.set(0,2.29,.605)'));
 assert.ok(!src.includes('maw.scale.set(.34+open*.12,.10+open*.44,.14)'));
});
