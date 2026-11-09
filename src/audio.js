/** Tiny original, synthesized UI sounds. No external assets. */
let context=null;
let enabled=true;
const VOLUME_KEY='pans-labyrinth:volume-v1';
let volume=1;
try{if(typeof window!=='undefined')volume=Math.max(0,Math.min(1,Number(window.localStorage.getItem(VOLUME_KEY)??1)));}catch{}
export const getSoundVolume=()=>volume;
export function setSoundVolume(next){
 const n=Number(next);if(!Number.isFinite(n))throw new TypeError('Invalid audio volume');
 volume=Math.max(0,Math.min(1,n));
 try{if(typeof window!=='undefined')window.localStorage.setItem(VOLUME_KEY,String(volume));}catch{}
 return volume;
}
export function toggleSound(){enabled=!enabled;return enabled;}
export function note(freq=440,duration=.15,type='sine',gain=.035){
 if(!enabled||volume<=0)return;
 try{
  context ??=new (window.AudioContext||window.webkitAudioContext)();
  if(context.state==='suspended')context.resume();
  const osc=context.createOscillator(),vol=context.createGain(),now=context.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(freq,now);
  vol.gain.setValueAtTime(.0001,now);
  vol.gain.exponentialRampToValueAtTime(Math.max(.0002,gain*volume),now+.02);
  vol.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(vol);vol.connect(context.destination);osc.start(now);osc.stop(now+duration+.04);
 }catch{/* muted environments may not support Web Audio */}
}
export function chime(){note(392,.21);setTimeout(()=>note(587.33,.26),85);setTimeout(()=>note(783.99,.39),180);}
