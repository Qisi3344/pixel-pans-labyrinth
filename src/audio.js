/** Tiny original, synthesized UI sounds. No external assets. */
let context=null;
let enabled=true;
export function toggleSound(){enabled=!enabled;return enabled;}
export function note(freq=440,duration=.15,type='sine',gain=.035){
 if(!enabled)return;
 try{
  context ??=new (window.AudioContext||window.webkitAudioContext)();
  if(context.state==='suspended')context.resume();
  const osc=context.createOscillator(),vol=context.createGain(),now=context.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(freq,now);
  vol.gain.setValueAtTime(.0001,now);
  vol.gain.exponentialRampToValueAtTime(gain,now+.02);
  vol.gain.exponentialRampToValueAtTime(.0001,now+duration);
  osc.connect(vol);vol.connect(context.destination);osc.start(now);osc.stop(now+duration+.04);
 }catch{/* muted environments may not support Web Audio */}
}
export function chime(){note(392,.21);setTimeout(()=>note(587.33,.26),85);setTimeout(()=>note(783.99,.39),180);}
