import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {WELL} from '../src/architecture.js';
import {buildWell} from '../src/scene.js';
import {buildFinalSpiralWell,createFinalStageWithCutout} from '../src/chapter4-well.js';
import {FINAL_WELL_CENTER} from '../src/chapter4-maze-layout.js';
import {FINAL_BLOOD_STAND,VIDAL_START,CHAPTER4_RADIUS,
 FINAL_OUTCOMES,walkableFinal} from '../src/chapter4-logic.js';
import {ROYAL_DIALOGUE} from '../src/chapter4-royal-dialogue.js';
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');

test('fourth chapter uses EXACT same 52-tread spiral and tapered shaft as chapter one',()=>{
 const original=buildWell(new THREE.Group());
 const final=buildFinalSpiralWell(new THREE.Group());
 assert.equal(WELL.stepCount,52);
 assert.ok(WELL.turns>2);
 assert.equal(final.well.children.length,original.children.length,
  'reuse existing mesh factory, do not imitate its geometry');
 assert.equal(final.well.scale.x,WELL.visualScale);
 assert.equal(final.well.name,'chapter-one-spiral-reused-in-finale');
 assert.equal(final.well.position.x,FINAL_WELL_CENTER.x);
 assert.equal(final.well.position.z,FINAL_WELL_CENTER.z);
 const source=read('../src/chapter4-well.js');
 assert.ok(source.includes("import {buildWell} from './scene.js'"));
 assert.ok(source.includes('const well=buildWell(parent)'));
 assert.ok(!read('../src/chapter4-scene.js').includes('for(let i=0;i<20;i++){\n   const angle=i/20'),
  'the former fake, flat 20-brick circle must be gone');
});

test('fourth chapter has a real off-center cutout; solid grass cannot cap the spiral',()=>{
 const scene=new THREE.Group(),{ground,cap,holeRadius}=createFinalStageWithCutout(scene);
 assert.equal(scene.children.length,2);
 assert.ok(holeRadius>=WELL.rimOuter*WELL.visualScale);
 for(const mesh of [ground,cap]){
  const shape=mesh.geometry.parameters.shapes;
  assert.equal(shape.holes.length,1,'solid terrain must have a REAL hole');
  const path=shape.holes[0];
  const points=path.getPoints();
  const radii=points.map(p=>Math.hypot(p.x-FINAL_WELL_CENTER.x,p.y-FINAL_WELL_CENTER.z));
  assert.ok(Math.max(...radii)-Math.min(...radii)<.01,
   'hole is circular and centered precisely on final well');
  assert.ok(mesh.geometry.parameters.options.depth>0);
 }
 assert.ok(ground.position.y<cap.position.y);
 assert.ok(read('../src/chapter4-scene.js').includes('createFinalStageWithCutout(root)'));
});

test('raycasts see THROUGH the cutout and hit real spiral stair geometry below',()=>{
 const stage=new THREE.Group(),{ground,cap}=createFinalStageWithCutout(stage);
 const ray=new THREE.Raycaster();
 ray.set(new THREE.Vector3(FINAL_WELL_CENTER.x,6,FINAL_WELL_CENTER.z),
  new THREE.Vector3(0,-1,0));
 assert.equal(ray.intersectObjects([ground,cap]).length,0,
  'unbroken stage cylinders must not occlude the well opening');
 ray.set(new THREE.Vector3(0,6,0),new THREE.Vector3(0,-1,0));
 assert.ok(ray.intersectObjects([ground,cap]).length>=1,
  'ground stays solid everywhere except the actual shaft');
 const well=buildFinalSpiralWell(stage);
 const firstStepRadius=(3.12)*WELL.visualScale;
 ray.set(new THREE.Vector3(FINAL_WELL_CENTER.x,4,
  FINAL_WELL_CENTER.z-firstStepRadius),new THREE.Vector3(0,-1,0));
 const hits=ray.intersectObject(well.well,true);
 assert.ok(hits.length>0,'actual descent treads must be visible from above');
});

test('each ending has a blood path FROM Ofelia at the stone lip INTO the same spiral',()=>{
 const scene=new THREE.Group(),well=buildFinalSpiralWell(scene);
 const start=well.bloodCurve.getPoint(0),end=well.bloodCurve.getPoint(1);
 assert.ok(Math.abs(start.x+FINAL_WELL_CENTER.x-FINAL_BLOOD_STAND.x)<.02);
 assert.ok(Math.abs(start.z+FINAL_WELL_CENTER.z-FINAL_BLOOD_STAND.z)<.02);
 assert.ok(end.y<start.y-1.9,'blood visibly descends into the shaft');
 assert.ok(Math.hypot(end.x,end.z)<Math.hypot(start.x,start.z));
 assert.ok(walkableFinal(FINAL_BLOOD_STAND),'girl stands on walkable STONE beside rim');
 assert.equal(well.portal.position.y<-1.8,true,
  'magic portal stays below the steps instead of hiding them at the mouth');
 well.setBloodProgress(0);
 assert.ok(well.bloodSegments.every(s=>!s.visible));
 well.setBloodProgress(.54);
 assert.ok(well.bloodSegments.some(s=>s.visible));
 assert.ok(well.bloodSegments.some(s=>!s.visible));
 well.setBloodProgress(1);
 assert.ok(well.bloodSegments.every(s=>s.visible));
 const script=read('../src/chapter4-scene.js');
 assert.ok(script.includes('FINAL_BLOOD_STAND'));
 assert.ok(script.includes('sceneActor=cinematic'));
 assert.ok(script.includes('maze.well.setBloodProgress(bloodProgress)'));
});

test('Vidal is grounded inside the circular arena and invisible before he arrives',()=>{
 assert.ok(Math.hypot(VIDAL_START.x+.2,VIDAL_START.z-.2)<CHAPTER4_RADIUS,
  'captain spawn must be INSIDE the stage edge');
 const scene=read('../src/chapter4-scene.js');
 assert.ok(scene.includes('vidal.root.visible=chase||'));
 assert.ok(scene.includes("state.elapsed>=23"));
 assert.ok(scene.includes('animateVidal(vidal,d,strideDistance,aiming)'));
 assert.ok(scene.includes('new THREE.OrthographicCamera('));
});

test('ending paragraphs do not print literal slash-n and royal parents do not scold about the human baby',()=>{
 const ui=read('../src/campaign-ui.js');
 assert.ok(!ui.includes('\\\\n'),'real paragraph breaks, not literal backslash-n characters');
 assert.ok(ui.includes('\\n'),'a single JavaScript escape is appropriate');
 assert.match(FINAL_OUTCOMES.offering.second,/他有自己的母亲/);
 assert.doesNotMatch(ROYAL_DIALOGUE.offering[0].text,/孩子|血|代价/);
 assert.doesNotMatch(ROYAL_DIALOGUE.offering[1].text,/责备|伤害|代价|责难/);
});
