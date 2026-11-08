import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFileSync} from 'node:fs';
import {royalHall} from '../src/chapter4-scene.js';
import {FINAL_CINEMATIC,newFinalTrial,advanceFaunDialogue,FINAL_DIALOGUE,decideFinal,updateFinalTrial,FINAL_ALTAR} from '../src/chapter4-logic.js';
import {ROYAL_DIALOGUE,activeRoyalDialogue,royalDialogueEnd} from '../src/chapter4-royal-dialogue.js';
const source=name=>readFileSync(new URL(name,import.meta.url),'utf8');

test('vast throne room is a real 3D miniature at least twice the original dimensions',()=>{
 const root=new THREE.Group();
 const hall=royalHall(root);
 const bounds=new THREE.Box3().setFromObject(hall.floor);
 const dim=bounds.getSize(new THREE.Vector3());
 assert.ok(dim.x>=32,'large 32-world-unit width, not old 17.7');
 assert.ok(dim.z>=24,'wide floor with real walkway and deep stage');
 assert.equal(hall.throneGroups.length,3,'king, princess and queen each have a seat');
 assert.equal(hall.columns.length,10,'five symmetrical pairs of columns');
 assert.equal(hall.podium.length,4,'four tier raised throne stage');
 assert.ok(hall.centerThrone.position.x===0);
 assert.ok(hall.father.position.x<0&&hall.mother.position.x>0);
 assert.ok(Math.abs(hall.father.position.x+hall.mother.position.x)<1e-8);
 assert.equal(hall.throneGroups[1],hall.centerThrone);
 assert.ok(hall.throneGroups[0]!==hall.throneGroups[1]);
 assert.ok(hall.throneGroups[2]!==hall.throneGroups[1]);
 assert.ok(root.children.includes(hall.father)&&root.children.includes(hall.mother));
 assert.ok(hall.faun,'faun must still be part of the royal court');
});

test('the middle throne is reserved for Ofelia, with speech anchors on each actual parent',()=>{
 const root=new THREE.Group(),hall=royalHall(root);
 root.updateWorldMatrix(true,true);
 assert.equal(hall.father.userData.speechAnchor,hall.speechAnchors.father);
 assert.equal(hall.mother.userData.speechAnchor,hall.speechAnchors.mother);
 const father=hall.speechAnchors.father.getWorldPosition(new THREE.Vector3());
 const mother=hall.speechAnchors.mother.getWorldPosition(new THREE.Vector3());
 assert.ok(father.x<0&&mother.x>0);
 assert.ok(Math.abs(father.x+mother.x)<1e-8);
 assert.ok(father.y>4&&mother.y>4,'bubbles appear above the crowned figures');
 assert.ok(hall.centerThrone.position.z<0);
 assert.ok(hall.centerThrone.children.length>10,'empty throne has an ornate high back and gold crest');
});

test('monarch dialogue is sequential, actor-specific and distinct in both endings',()=>{
 for(const ending of ['mercy','offering']){
  const lines=ROYAL_DIALOGUE[ending];
  assert.equal(lines.length,2);
  assert.equal(lines[0].speaker,'father');
  assert.equal(lines[1].speaker,'mother');
  assert.ok(lines[0].start<lines[0].end&&lines[0].end===lines[1].start);
  assert.ok(lines[1].end<FINAL_CINEMATIC[ending],
   'royal dialogue finishes before ending card is displayed');
  assert.equal(activeRoyalDialogue(ending,lines[0].start-.01,true),null);
  assert.equal(activeRoyalDialogue(ending,lines[0].start+.05,true)?.speaker,'father');
  assert.equal(activeRoyalDialogue(ending,lines[1].start+.05,true)?.speaker,'mother');
  assert.equal(activeRoyalDialogue(ending,lines[1].end+.01,true),null);
  assert.equal(activeRoyalDialogue(ending,lines[1].start+.05,false),null);
  assert.equal(royalDialogueEnd(ending),lines[1].end);
 }
 assert.notEqual(ROYAL_DIALOGUE.mercy[0].text,ROYAL_DIALOGUE.offering[0].text);
 assert.notEqual(ROYAL_DIALOGUE.mercy[1].text,ROYAL_DIALOGUE.offering[1].text);
 assert.ok(ROYAL_DIALOGUE.mercy[1].text.includes('王座'));
 assert.ok(ROYAL_DIALOGUE.offering[1].text.includes('欢迎回来')||
  ROYAL_DIALOGUE.offering[1].text.includes('回到'));
 assert.doesNotMatch(ROYAL_DIALOGUE.offering[1].text,/责备|伤害|弟弟|代价/,
  'royal parents do not scold Ofelia about her human infant brother');
});

test('both ending timelines keep the actual royal court visible while each parent speaks',()=>{
 for(const ending of ['mercy','offering']){
  const s=newFinalTrial();
  s.player={...FINAL_ALTAR};
  updateFinalTrial(s,.02);assert.equal(s.phase,'dialogue');
 for(let i=0;i<FINAL_DIALOGUE.length;i++)assert.equal(advanceFaunDialogue(s),true);
 assert.equal(s.phase,'decision');
  assert.equal(decideFinal(s,ending),true);
  const lines=ROYAL_DIALOGUE[ending];
  while(s.cinematicTime<lines[1].start+.2&&s.phase==='cinematic')updateFinalTrial(s,.05);
  assert.equal(s.royalShown,true);
  assert.equal(s.phase,'cinematic');
  assert.equal(activeRoyalDialogue(ending,s.cinematicTime,true)?.speaker,'mother');
  while(s.phase==='cinematic')updateFinalTrial(s,.05);
  assert.equal(s.phase,'done');
 }
});

test('3D projected speech moves with camera while orthographic projection remains locked',()=>{
 const scene=source('../src/chapter4-scene.js');
 const main=source('../src/chapter4-main.js');
 const style=source('../src/chapter4-style.css');
 assert.ok(scene.includes('new THREE.OrthographicCamera('));
 assert.ok(scene.includes('const direction=new THREE.Vector3(1,1.14,1.30).normalize()'));
 assert.ok(scene.includes('const scale=state.royalShown?'));
 assert.ok(scene.includes('projectRoyalSpeaker(speaker)'));
 assert.ok(scene.includes('anchor.getWorldPosition(new THREE.Vector3()).project(camera)'));
 assert.ok(main.includes('activeRoyalDialogue(state.ending,state.cinematicTime,state.royalShown)'));
 assert.ok(main.includes("id=\"final-father-bubble\""));
 assert.ok(main.includes("id=\"final-mother-bubble\""));
 assert.ok(main.includes('bubble.style.left=x'));
 assert.ok(main.includes('bubble.style.top=y'));
 assert.ok(main.includes("preview==='royalMercy'"));
 assert.ok(main.includes("preview==='royalOffering'"));
 assert.ok(style.includes('.final-royal-bubble'));
 assert.ok(style.includes('.final-game.is-royal .final-header'));
 assert.ok(!main.includes('王座上的父母说：“'));
});
