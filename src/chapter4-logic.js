// Final trial: a real navigable miniature labyrinth with two divergent fates.
// Canonical route = refuse the faun, Vidal takes the infant and shoots Ofelia;
// the girl's own blood then unlocks the royal vision. The alternative route
// (giving innocent blood) is an explicitly original, non-film what-if ending.
import {blockedByFinalMaze,FINAL_WELL_CENTER} from './chapter4-maze-layout.js';
import {FINAL_CUES,finalStage} from './chapter4-cinematic.js';
export const CHAPTER4_TIME_LIMIT=62;
export const CHAPTER4_SPEED=3.75;
export const CHAPTER4_RADIUS=12.7;
export const FINAL_ALTAR=Object.freeze({x:-1.6,z:0});
export const FINAL_START=Object.freeze({x:-9.65,z:7.2});
// Captain enters from a paved part of the miniature, not beyond the round rim.
export const VIDAL_START=Object.freeze({x:-10.1,z:6.8});
// Both narrative branches reach the SAME stone lip before any blood appears.
export const FINAL_BLOOD_STAND=Object.freeze({
 x:FINAL_WELL_CENTER.x-2.29,z:FINAL_WELL_CENTER.z+.27
});
export const FINAL_CHOICE_RADIUS=1.75;
export const FINAL_DIALOGUE=Object.freeze([
 Object.freeze({speaker:'潘神',text:'公主殿下，你终于来了。地底王国的门就在这口古井下面。'}),
 Object.freeze({speaker:'潘神',text:'最后一项试炼，只需要一滴无辜之血。把你怀里的弟弟交给我。'}),
 Object.freeze({speaker:'奥菲莉娅',text:'你说的是……弟弟的血？如果我不答应呢？'})
]);
export const FINAL_CINEMATIC=Object.freeze({mercy:FINAL_CUES.mercy.end,offering:FINAL_CUES.offering.end});
export const FINAL_OUTCOMES=Object.freeze({
 mercy:Object.freeze({
  id:'mercy',title:'无辜之血',subtitle:'原片结局 · 守护',
  banner:'你没有交出弟弟。',
  speech:'欢迎回来，我的女儿。真正重要的试炼，不是带回钥匙与匕首，而是在黑暗里仍然拒绝伤害无辜。',
  second:'你的血落入石井。父亲与母亲为你留着王座；这究竟是另一个世界，还是最后一场梦，没有人能够替你回答。',
  last:'她选择保护无辜。那扇门终于记起了她的名字。'
 }),
 offering:Object.freeze({
  id:'offering',title:'猩红归途',subtitle:'架空结局 · 交换',
  banner:'王国的门终于开了。',
  speech:'欢迎回来，女儿。这里始终有你的位置。',
  second:'金色殿堂出现在她面前，失落的父母仍在等候。弟弟留在了人间，他有自己的母亲，也属于另一个世界。王国的父母没有因此责备她；关于那滴血的记忆，只留在她自己的心里。',
  last:'她回到了梦寐以求的家，但仍记得那条以无辜之血打开的路。'
 })
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function walkableFinal(p,radius=.28){
 return Number.isFinite(p.x)&&Number.isFinite(p.z)&&
  Math.hypot(p.x+.2,p.z-.2)<=CHAPTER4_RADIUS-radius&&
  !blockedByFinalMaze(p,radius);
}
export function newFinalTrial(){
 return {phase:'approach',player:{...FINAL_START},vidal:{...VIDAL_START},
  timeLeft:CHAPTER4_TIME_LIMIT,elapsed:0,cinematicTime:0,ending:null,
  timeOut:false,foundAltar:false,dialogueShown:false,dialogueStep:0,royalShown:false,
  brotherVisible:true,gunFlash:false,cinematicBeat:null};
}
export function nearFaun(state){return distance(state.player,FINAL_ALTAR)<=FINAL_CHOICE_RADIUS;}
export function advanceFaunDialogue(state){
 if(state.phase!=='dialogue'||state.timeLeft<=0)return false;
 state.dialogueStep++;
 if(state.dialogueStep>=FINAL_DIALOGUE.length){
  state.phase='decision';
  state.dialogueStep=FINAL_DIALOGUE.length;
 }
 return true;
}
export function decideFinal(state,decision){
 if(!['offering','mercy'].includes(decision)||state.phase!=='decision')return false;
 if(!nearFaun(state)||state.timeLeft<=0)return false;
 state.ending=decision;
 state.phase='cinematic';
 state.cinematicTime=0;
 state.cinematicBeat=finalStage(decision,0);
 state.dialogueShown=true;
 return true;
}
export function updateFinalTrial(state,dt){
 const d=clamp(Number(dt)||0,0,.1);
 if(state.phase==='done')return state;
 if(['approach','dialogue','decision'].includes(state.phase)){
  state.elapsed+=d;state.timeLeft=Math.max(0,state.timeLeft-d);
  if(state.phase==='approach'&&nearFaun(state)){
   state.phase='dialogue';state.foundAltar=true;
   state.dialogueStep=0;state.dialogueShown=true;
  }
  // Clock running out means the captain catches up. He takes the infant
  // and the story follows Ofelia's refusal (no harm to the baby).
  if(state.timeLeft<=0){
   state.ending='mercy';state.timeOut=true;
   state.phase='cinematic';state.cinematicTime=0;
   state.cinematicBeat=finalStage('mercy',0);
  }
 }else if(state.phase==='cinematic'){
  state.cinematicTime+=d;
  const time=state.cinematicTime;
  const cues=FINAL_CUES[state.ending];
  state.cinematicBeat=finalStage(state.ending,time);
  state.brotherVisible=time<cues.handOff;
  state.gunFlash=state.ending==='mercy'&&time>=cues.shot&&time<cues.shotEnd;
  // The end-state cannot skip ahead to the palace while either ending
  // still shows the character at the well.
  state.royalShown=time>=cues.royalAt;
  if(time>=FINAL_CINEMATIC[state.ending])state.phase='done';
 }
 return state;
}
export function moveFinalPlayer(state,axisX,axisZ,dt){
 if(state.phase!=='approach')return 0;
 const len=Math.hypot(axisX,axisZ);
 if(len<1e-5)return 0;
 const step=CHAPTER4_SPEED*clamp(dt,0,.085);
 const dx=axisX/len*step,dz=axisZ/len*step;
 const before={...state.player};
 const afterX={...state.player,x:state.player.x+dx};
 if(walkableFinal(afterX))state.player=afterX;
 const afterZ={...state.player,z:state.player.z+dz};
 if(walkableFinal(afterZ))state.player=afterZ;
 return distance(before,state.player);
}
export function finalClockLabel(timeLeft){
 const s=Math.max(0,Math.ceil(Number(timeLeft)||0));
 return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
}
