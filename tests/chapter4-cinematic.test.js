import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 FINAL_CUES,VIDAL_CINEMATIC_ENTRY,finalStage,normalizedBeat
} from '../src/chapter4-cinematic.js';
import {
 FINAL_ALTAR,FINAL_CINEMATIC,FINAL_BLOOD_STAND,FINAL_DIALOGUE,
 newFinalTrial,advanceFaunDialogue,decideFinal,updateFinalTrial
} from '../src/chapter4-logic.js';
import {ROYAL_DIALOGUE} from '../src/chapter4-royal-dialogue.js';
const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const updateTo=(s,time)=>{
 while(s.cinematicTime+0.025<time&&s.phase==='cinematic'){
  updateFinalTrial(s,Math.min(.05,time-s.cinematicTime));
 }
 return s;
};
function begin(ending){
 const state=newFinalTrial();state.player={...FINAL_ALTAR};
 updateFinalTrial(state,.05);
 assert.equal(state.phase,'dialogue');
 FINAL_DIALOGUE.forEach(()=>advanceFaunDialogue(state));
 assert.equal(state.phase,'decision');
 assert.equal(decideFinal(state,ending),true);
 return state;
}
test('refusal visibly stages Vidal, infant handoff, aimed shot and stone-well blood BEFORE palace',()=>{
 const c=FINAL_CUES.mercy,s=begin('mercy');
 assert.ok(c.approachEnd>=3.2,'show several seconds of genuine entry and walking');
 assert.ok(c.approachEnd<c.handOff);
 assert.ok(c.handOff<c.aim&&c.aim<c.shot);
 assert.ok(c.shot<c.bloodStart&&c.bloodStart<c.bloodEnd);
 assert.ok(c.bloodEnd<=c.portalStart&&c.portalStart<c.royalAt);
 assert.ok(c.royalAt>=9.5,'cannot jump straight to throne after refusal');
 updateTo(s,c.approachEnd-.1);
 assert.equal(s.brotherVisible,true);
 assert.equal(s.royalShown,false);
 assert.equal(s.cinematicBeat,'vidal-approaches');
 updateTo(s,c.handOff+.05);
 assert.equal(s.brotherVisible,false,'Vidal now carries the child');
 assert.equal(s.cinematicBeat,'baby-taken');
 updateTo(s,c.aim+.05);
 assert.equal(s.cinematicBeat,'captain-aims');
 updateTo(s,c.shot+.06);
 assert.equal(s.gunFlash,true,'shot only after real visible approach');
 updateTo(s,c.shotEnd+.04);
 assert.equal(s.gunFlash,false);
 updateTo(s,c.bloodStart+.15);
 assert.equal(s.cinematicBeat,'blood-descends');
 assert.equal(s.royalShown,false,'blood must visibly fall before throne');
 updateTo(s,c.royalAt+.05);
 assert.equal(s.royalShown,true);
});
test('offering visibly approaches rim, lifts knife, gives drop and opens shaft BEFORE palace',()=>{
 const c=FINAL_CUES.offering,s=begin('offering');
 assert.ok(c.approachEnd>=2.4);
 assert.ok(c.approachEnd<=c.knifeStart&&c.knifeStart<c.knifeLiftEnd);
 assert.ok(c.knifeLiftEnd<c.bloodMoment&&c.bloodMoment<c.bloodStart);
 assert.ok(c.bloodStart<c.bloodEnd&&c.bloodEnd<=c.portalStart);
 assert.ok(c.portalStart<c.royalAt&&c.royalAt>=9);
 updateTo(s,c.approachEnd-.1);
 assert.equal(s.cinematicBeat,'approach-well');
 assert.equal(s.brotherVisible,true);
 assert.equal(s.royalShown,false);
 updateTo(s,c.knifeStart+.15);
 assert.equal(s.cinematicBeat,'lift-ritual-knife');
 assert.equal(s.brotherVisible,true);
 updateTo(s,c.handOff+.1);
 assert.equal(s.brotherVisible,false);
 assert.equal(s.cinematicBeat,'blood-descends');
 updateTo(s,c.bloodEnd-.1);
 assert.equal(s.royalShown,false,'still at the visible spiral well');
 updateTo(s,c.royalAt+.06);
 assert.equal(s.royalShown,true);
});
test('Vidal enters on a real stone route, and the fixed orthographic camera shows both actors',()=>{
 assert.deepEqual(VIDAL_CINEMATIC_ENTRY,{x:-6.8,z:4.8});
 assert.ok(Math.hypot(VIDAL_CINEMATIC_ENTRY.x-FINAL_BLOOD_STAND.x,
  VIDAL_CINEMATIC_ENTRY.z-FINAL_BLOOD_STAND.z)>5,
  'captain walks across ground rather than spawning beside Ofelia');
 const scene=source('../src/chapter4-scene.js');
 assert.ok(scene.includes('vidal.root.visible=chase||lateApproach'));
 assert.ok(scene.includes('const chaseProgress=normalizedBeat(localT,0,cues.approachEnd)'));
 assert.ok(scene.includes('VIDAL_CINEMATIC_ENTRY.x'));
 assert.ok(scene.includes('animateVidal(vidal,d,strideDistance,aiming)'));
 assert.ok(scene.includes('const captainShare=cinematic'));
 assert.ok(scene.includes('new THREE.OrthographicCamera('));
 assert.ok(scene.includes('const direction=new THREE.Vector3(1,1.14,1.30).normalize()'));
});
test('offering shows a held knife, red ritual pulse, complete blood stream and delayed 3D portal',()=>{
 const scene=source('../src/chapter4-scene.js');
 const well=source('../src/chapter4-well.js');
 const ui=source('../src/chapter4-main.js');
 assert.ok(scene.includes("ceremonyKnife.name='Ofelia-held-ritual-knife'"));
 assert.ok(scene.includes('hero.arms[1].add(ceremonyKnife)'));
 assert.ok(scene.includes('ceremonyKnife.visible=alternate&&localT>=cues.knifeStart'));
 assert.ok(scene.includes('ritualGlow.visible=alternate&&localT>=cues.bloodMoment'));
 assert.ok(scene.includes('normalizedBeat(localT,cues.bloodStart,cues.bloodEnd)'));
 assert.ok(scene.includes('const portalAt=cues.portalStart'));
 assert.ok(well.includes("import {buildWell} from './scene.js'"));
 assert.ok(ui.includes('finalStage(state.ending,state.cinematicTime)'));
 assert.ok(ui.includes("case 'vidal-approaches'"));
 assert.ok(ui.includes("case 'lift-ritual-knife'"));
 assert.ok(ui.includes("case 'well-opens'"));
});
test('royal speeches cannot begin while the final trial is still visible',()=>{
 for(const ending of ['mercy','offering']){
  const c=FINAL_CUES[ending],dialog=ROYAL_DIALOGUE[ending];
  assert.equal(FINAL_CINEMATIC[ending],c.end);
  assert.ok(dialog[0].start>c.royalAt);
  assert.ok(dialog[1].end<c.end);
  assert.ok(c.royalAt>c.portalStart);
 }
 assert.equal(finalStage('mercy',FINAL_CUES.mercy.royalAt+.1),'royal');
 assert.equal(finalStage('offering',FINAL_CUES.offering.royalAt+.1),'royal');
 assert.equal(normalizedBeat(1,0,2),.5);
 assert.equal(normalizedBeat(0,0,2),0);
 assert.equal(normalizedBeat(3,0,2),1);
});
