// Final trial: a real navigable miniature labyrinth with two divergent fates.
// Canonical route = refuse the faun, Vidal takes the infant and shoots Ofelia;
// the girl's own blood then unlocks the royal vision. The alternative route
// (giving innocent blood) is an explicitly original, non-film what-if ending.
export const CHAPTER4_TIME_LIMIT=62;
export const CHAPTER4_SPEED=3.75;
export const CHAPTER4_RADIUS=12.7;
export const FINAL_ALTAR=Object.freeze({x:1.1,z:-.65});
export const FINAL_START=Object.freeze({x:-9.65,z:7.2});
export const VIDAL_START=Object.freeze({x:-11.8,z:8.45});
export const FINAL_CHOICE_RADIUS=2.15;
// Let the camera linger in the royal hall long enough for the King and Queen
// to speak in separate world-anchored bubbles before the results card appears.
export const ROYAL_ENTRY_TIME=Object.freeze({mercy:4.7,offering:3.6});
export const FINAL_CINEMATIC=Object.freeze({mercy:17.6,offering:16.5});
export const ROYAL_DIALOGUES=Object.freeze({
 mercy:Object.freeze([
  Object.freeze({speaker:'father',at:.35,text:'欢迎回来，我的女儿。我们一直在等你。'}),
  Object.freeze({speaker:'father',at:3.55,text:'你宁愿流自己的血，也没有伤害无辜。你通过了最后的考验。'}),
  Object.freeze({speaker:'mother',at:7.45,text:'回到我们身边吧。中间那张王座，始终是为你留的。'})
 ]),
 offering:Object.freeze([
  Object.freeze({speaker:'father',at:.35,text:'你终于回来了，我的女儿。王国的大门为你而开。'}),
  Object.freeze({speaker:'mother',at:3.65,text:'但这条路，留下了另一个无辜的生命。'}),
  Object.freeze({speaker:'father',at:7.45,text:'你得到了王冠，也必须带着自己的选择走下去。'})
 ])
});
export function royalDialogueAt(ending,cinematicTime){
 const beats=ROYAL_DIALOGUES[ending],entry=ROYAL_ENTRY_TIME[ending];
 if(!beats||!Number.isFinite(cinematicTime)||cinematicTime<entry)return null;
 const relative=cinematicTime-entry;
 if(relative<beats[0].at||relative>11.8)return null;
 let active=null;
 for(const beat of beats)if(relative>=beat.at)active=beat;
 return active;
}
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
  speech:'欢迎回家。通往王座的路，从来不是免费的。',
  second:'金色殿堂确实出现在她面前，失落的父母也在等候。但弟弟再没有来到她身边。王冠很重，掌心更重。',
  last:'她得到了想要的家，却将最珍贵的东西留在了门外。'
 })
});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function walkableFinal(p,radius=.28){
 return Number.isFinite(p.x)&&Number.isFinite(p.z)&&
  Math.hypot(p.x+.2,p.z-.2)<=CHAPTER4_RADIUS-radius;
}
export function newFinalTrial(){
 return {phase:'approach',player:{...FINAL_START},vidal:{...VIDAL_START},
  timeLeft:CHAPTER4_TIME_LIMIT,elapsed:0,cinematicTime:0,ending:null,
  timeOut:false,foundAltar:false,dialogueShown:false,royalShown:false,
  brotherVisible:true,gunFlash:false};
}
export function nearFaun(state){return distance(state.player,FINAL_ALTAR)<=FINAL_CHOICE_RADIUS;}
export function decideFinal(state,decision){
 if(!['offering','mercy'].includes(decision)||!['approach','decision'].includes(state.phase))return false;
 if(!nearFaun(state)||state.timeLeft<=0)return false;
 state.ending=decision;
 state.phase='cinematic';
 state.cinematicTime=0;
 state.dialogueShown=true;
 return true;
}
export function updateFinalTrial(state,dt){
 const d=clamp(Number(dt)||0,0,.1);
 if(state.phase==='done')return state;
 if(['approach','decision'].includes(state.phase)){
  state.elapsed+=d;state.timeLeft=Math.max(0,state.timeLeft-d);
  if(nearFaun(state)){state.phase='decision';state.foundAltar=true;}
  else state.phase='approach';
  // Clock running out means the captain catches up. He takes the infant
  // and the story follows Ofelia's refusal (no harm to the baby).
  if(state.timeLeft<=0){
   state.ending='mercy';state.timeOut=true;
   state.phase='cinematic';state.cinematicTime=0;
  }
 }else if(state.phase==='cinematic'){
  state.cinematicTime+=d;
  const time=state.cinematicTime;
  if(state.ending==='mercy'){
   state.brotherVisible=time<1.6;
   state.gunFlash=time>=2.16&&time<2.36;
   state.royalShown=time>=ROYAL_ENTRY_TIME.mercy;
  }else{
   state.brotherVisible=time<2.0;
   state.royalShown=time>=ROYAL_ENTRY_TIME.offering;
  }
  if(time>=FINAL_CINEMATIC[state.ending])state.phase='done';
 }
 return state;
}
export function moveFinalPlayer(state,axisX,axisZ,dt){
 if(!['approach','decision'].includes(state.phase))return 0;
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
