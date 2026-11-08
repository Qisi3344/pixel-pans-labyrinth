import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 CHAPTER4_TIME_LIMIT,CHAPTER4_SPEED,FINAL_START,FINAL_ALTAR,FINAL_OUTCOMES,
 newFinalTrial,nearFaun,decideFinal,updateFinalTrial,moveFinalPlayer,
 finalClockLabel,walkableFinal
} from '../src/chapter4-logic.js';
import {
 defaultProgress,loadCampaign,storeCampaign,recordChapterComplete,
 recordFinalOutcome,chapterUnlocked,campaignChapterUrl,CHAPTERS
} from '../src/campaign.js';

const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const mem=()=>{const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
const forward=(s,sec)=>{for(let i=0;i<Math.ceil(sec/.05);i++)updateFinalTrial(s,.05);};

test('final trial is accessible as a fourth chapter without erasing three finished stages',()=>{
 const s=mem();
 assert.equal(CHAPTERS.length,4);
 assert.deepEqual(CHAPTERS.map(c=>c.name),
  ['石之迷宫','巨树之腹','苍白盛宴','最后的石井']);
 assert.ok(CHAPTERS[3].kind.includes('第三项试炼'));
 assert.equal(chapterUnlocked(4,loadCampaign(s)),false);
 recordChapterComplete(1,s);recordChapterComplete(2,s);recordChapterComplete(3,s);
 assert.equal(loadCampaign(s).completed,3);
 assert.equal(chapterUnlocked(4,loadCampaign(s)),true);
 assert.equal(campaignChapterUrl(4),'?stage=4&flow=1');
 assert.deepEqual(loadCampaign(s).endingsSeen,[]);
});

test('offering at the stone well opens the invented route before the captain arrives',()=>{
 const s=newFinalTrial();
 assert.equal(decideFinal(s,'offering'),false,'cannot sacrifice while still outside the centre');
 assert.equal(s.ending,null);
 s.player={...FINAL_ALTAR};
 updateFinalTrial(s,.05);
 assert.equal(s.phase,'decision');
 assert.equal(decideFinal(s,'offering'),true);
 assert.equal(s.ending,'offering');
 forward(s,1);
 assert.equal(s.brotherVisible,true);
 forward(s,1.5);
 assert.equal(s.brotherVisible,false);
 forward(s,1.5);
 assert.equal(s.royalShown,true);
 forward(s,11);
 assert.equal(s.phase,'done');
 assert.equal(s.gunFlash,false);
});

test('refusing the Faun keeps the baby alive, Vidal takes the baby and Ofelia sees the royal court',()=>{
 const s=newFinalTrial();
 s.player={...FINAL_ALTAR};updateFinalTrial(s,.05);
 assert.equal(decideFinal(s,'mercy'),true);
 forward(s,1.7);
 assert.equal(s.brotherVisible,false,'Vidal takes the baby away from Ofelia');
 forward(s,.55);
 assert.equal(s.gunFlash,true,'short non-graphic shot beat');
 forward(s,.5);
 assert.equal(s.gunFlash,false);
 forward(s,3);
 assert.equal(s.royalShown,true);
 forward(s,10);
 assert.equal(s.phase,'done');
});

test('a player who runs out of time without harming the infant enters canon refusal branch',()=>{
 const s=newFinalTrial();forward(s,CHAPTER4_TIME_LIMIT+.2);
 assert.equal(s.timeOut,true);
 assert.equal(s.ending,'mercy');
 assert.equal(s.phase,'cinematic');
 assert.equal(decideFinal(s,'offering'),false);
 forward(s,16);assert.equal(s.phase,'done');
});

test('countdown remains live while the ritual choice is visible, and movement cannot move the camera out of the diorama',()=>{
 const s=newFinalTrial();
 assert.ok(walkableFinal(s.player));
 const start={...s.player},moved=moveFinalPlayer(s,1,0,.08);
 assert.ok(moved>0&&s.player.x>start.x);
 s.player={...FINAL_ALTAR};updateFinalTrial(s,.05);
 assert.equal(s.phase,'decision');
 const remain=s.timeLeft;updateFinalTrial(s,1);
 assert.ok(s.timeLeft<remain,'no pause while choosing');
 assert.equal(finalClockLabel(62),'01:02');
 assert.equal(finalClockLabel(7),'00:07');
 assert.equal(finalClockLabel(0),'00:00');
 assert.equal(CHAPTER4_SPEED>0,true);
 assert.equal(moveFinalPlayer(s,100,0,1000)<=CHAPTER4_SPEED*.085+.01,true);
});

test('the two actual ending scenes are recorded separately, and returning players can reveal both',()=>{
 const s=mem();
 assert.equal(recordFinalOutcome('mercy',s).completed,0,'no fake endings from QA mode');
 recordChapterComplete(1,s);recordChapterComplete(2,s);recordChapterComplete(3,s);
 assert.equal(recordFinalOutcome('mercy',s).completed,4);
 assert.deepEqual(loadCampaign(s).endingsSeen,['mercy']);
 assert.equal(recordFinalOutcome('offering',s).ending,'offering');
 assert.deepEqual(loadCampaign(s).endingsSeen,['mercy','offering']);
 assert.equal(recordFinalOutcome('offering',s).endingsSeen.length,2);
 assert.equal(recordFinalOutcome('mercy',s).endingsSeen.length,2);
 assert.throws(()=>recordFinalOutcome('unknown',s));
 assert.ok(FINAL_OUTCOMES.mercy.speech.includes('拒绝伤害无辜'));
 assert.ok(FINAL_OUTCOMES.offering.second.includes('弟弟'));
});

test('original orthographic camera, 3D royal parents and gameplay/controller UI all exist',()=>{
 const scene=source('../src/chapter4-scene.js');
 const main=source('../src/chapter4-main.js');
 const css=source('../src/chapter4-style.css');
 const boot=source('../src/boot.js');
 const ui=source('../src/campaign-ui.js');
 assert.ok(scene.includes('new THREE.OrthographicCamera('));
 assert.ok(scene.includes('createPlayer(scene,'));
 assert.ok(scene.includes('buildFaun(root,'));
 assert.ok(scene.includes('buildVidal(labyrinth)'));
 assert.ok(scene.includes('const father=royalFigure('));
 assert.ok(scene.includes('const mother=royalFigure('));
 assert.ok(scene.includes('spiralWell(root)'));
 assert.ok(main.includes('updateFinalTrial(state,dt)'));
 assert.ok(main.includes("previewFinal"));
 assert.ok(main.includes("choose('offering')"));
 assert.ok(main.includes("choose('mercy')"));
 assert.ok(main.includes("recordFinalOutcome(kind)"));
 assert.ok(main.includes("倒计时不会停下"));
 assert.ok(css.includes('.final-joystick'));
 assert.ok(css.includes('html[data-input-mode="touch"] .final-touch'));
 assert.ok(boot.includes("stage==='4'?import('./chapter4-main.js')"));
 assert.ok(ui.includes('save.completed<4'));
 assert.ok(ui.includes('FINAL_OUTCOMES[viewed]'));
 assert.ok(ui.includes("stage===3?'.pale-tools':'.final-tools'"));
});
