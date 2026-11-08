// One campaign shared by the three previously standalone Three.js chapters.
// Scene modules stay independently bundled (useful for low-memory phones),
// while chapter unlocking, items, navigation and input preference persist.
export const SAVE_KEY='pans-labyrinth:fairytale-v1';
export const CHAPTERS=Object.freeze([
 Object.freeze({number:1,name:'石之迷宫',english:'THE STONE LABYRINTH',kind:'序幕 · 迷宫的召唤',item:'三枚归位的符印',icon:'✧',description:'石面孔拱门与井底的三枚符印，揭开故事的第一道门。'}),
 Object.freeze({number:2,name:'巨树之腹',english:'THE HOLLOW TREE',kind:'第一项试炼 · 黄金钥匙',item:'黄金钥匙',icon:'⚷',description:'将三颗魔石交给树根深处的巨蟾蜍，取回黄金钥匙。'}),
 Object.freeze({number:3,name:'苍白盛宴',english:'THE PALE MAN',kind:'第二项试炼 · 祭仪匕首',item:'祭仪匕首',icon:'✢',description:'观察禁忌宴席，带走匕首，在怪物醒来后逃回粉笔门。'})
]);
export const CAMPAIGN_FINAL='?screen=epilogue';
export const CAMPAIGN_MENU='?screen=menu';
const clampStage=n=>Math.max(0,Math.min(3,Math.trunc(Number(n)||0)));
const validMode=m=>m==='touch'||m==='keyboard';
export function defaultProgress(){
 return {version:1,completed:0,lastStage:1,mode:null,dagger:false};
}
export function normalizeProgress(raw){
 const d=defaultProgress();
 if(!raw||typeof raw!=='object')return d;
 const completed=clampStage(raw.completed);
 return {version:1,completed,
  lastStage:Math.max(1,Math.min(completed+1,clampStage(raw.lastStage)||1)),
  mode:validMode(raw.mode)?raw.mode:null,
  dagger:Boolean(raw.dagger)&&completed>=3};
}
function storageOrNull(storage){
 if(storage!==undefined)return storage;
 try{return typeof window!=='undefined'?window.localStorage:null;}catch{return null;}
}
export function loadCampaign(storage){
 const s=storageOrNull(storage);
 try{return normalizeProgress(JSON.parse(s?.getItem(SAVE_KEY)||'null'));}
 catch{return defaultProgress();}
}
export function storeCampaign(progress,storage){
 const clean=normalizeProgress(progress),s=storageOrNull(storage);
 try{s?.setItem(SAVE_KEY,JSON.stringify(clean));}catch{/* private browsing */ }
 return clean;
}
export function setInputPreference(mode,storage){
 if(!validMode(mode))throw new Error('Only touch and keyboard input are supported');
 return storeCampaign({...loadCampaign(storage),mode},storage);
}
export function recordChapterComplete(number,storage){
 const n=clampStage(number),save=loadCampaign(storage);
 // Never unlock three chapters just because someone opened a QA URL.
 if(n<1||n>save.completed+1)return save;
 return storeCampaign({...save,completed:Math.max(n,save.completed),
  lastStage:Math.min(3,n+1),dagger:n===3?true:save.dagger},storage);
}
export function chapterUnlocked(number,save=loadCampaign()){
 return number>=1&&number<=3&&number<=save.completed+1;
}
export function campaignChapterUrl(number){
 return '?stage='+Math.max(1,Math.min(3,Math.trunc(Number(number)||1)))+'&flow=1';
}
export function inferredInputMode(win=typeof window!=='undefined'?window:null){
 try{return win?.matchMedia?.('(pointer: coarse)').matches?'touch':'keyboard';}
 catch{return 'keyboard';}
}
export function selectedInputMode(storage,win){
 return loadCampaign(storage).mode||inferredInputMode(win);
}
export function isCampaignScreen(params){
 return !params.has('stage')||params.get('screen')==='menu'||params.get('screen')==='epilogue';
}
export const getItemNames=save=>CHAPTERS.slice(0,Math.max(0,Math.min(3,save.completed))).map(c=>c.item);
