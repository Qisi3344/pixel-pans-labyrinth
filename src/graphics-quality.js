// Shared visual quality policy across four chapters. All three settings are reversible.
export const GRAPHICS_KEY='pans-labyrinth:quality-v1';
export const QUALITY_MODES=Object.freeze(['auto','low','high']);
let adaptiveLow=false;
let samplingStart=0,samplingFrames=0,slowWindows=0;

function browserStorage(){
 try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}
}
export function graphicsMode(storage=browserStorage()){
 try{
  const mode=storage?.getItem(GRAPHICS_KEY);
  return QUALITY_MODES.includes(mode)?mode:'auto';
 }catch{return 'auto';}
}
export function setGraphicsMode(mode,storage=browserStorage()){
 if(!QUALITY_MODES.includes(mode))throw new TypeError('Unknown graphics mode');
 try{storage?.setItem(GRAPHICS_KEY,mode);}catch{}
 adaptiveLow=false;samplingStart=0;samplingFrames=0;slowWindows=0;
 if(typeof window!=='undefined')window.dispatchEvent(new Event('pans:qualitychange'));
 return mode;
}
export function qualityProfile({mode=graphicsMode(),mobile,devicePixelRatio=1}={}){
 const width=typeof window==='undefined'?1280:window.innerWidth;
 const coarse=typeof window!=='undefined'&&Boolean(window.matchMedia?.('(pointer: coarse)')?.matches);
 const isMobile=mobile??(coarse||width<=820);
 const low=mode==='low'||(mode==='auto'&&(isMobile||adaptiveLow));
 return {
  low,shadowSize:low?1024:2048,softShadows:!low,
  // Original pixel-art downsampling stays in place; higher quality sharpens, not changes framing.
  renderScale:low?1:Math.min(1.85,Math.max(1.45,Number(devicePixelRatio)||1))
 };
}
export function applyShadowQuality(renderer,light,THREE,profile=qualityProfile({
 devicePixelRatio:typeof window==='undefined'?1:window.devicePixelRatio||1
})){
 renderer.shadowMap.type=profile.softShadows?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
 if(light.shadow.mapSize.x!==profile.shadowSize||light.shadow.mapSize.y!==profile.shadowSize){
  light.shadow.map?.dispose();
  light.shadow.map=null;
  light.shadow.mapSize.set(profile.shadowSize,profile.shadowSize);
 }
 light.shadow.needsUpdate=true;
 // Animated actors still cast live shadows; never globally turn shadow autoUpdate off.
 return profile;
}
// Four consecutive half-second low-FPS windows ~= two seconds, auto-mode only.
export function sampleQualityFrame(now,visible=true){
 if(!visible||graphicsMode()!=='auto'||adaptiveLow){
  samplingStart=0;samplingFrames=0;slowWindows=0;return false;
 }
 if(!samplingStart||now-samplingStart>1800){
  samplingStart=now;samplingFrames=0;slowWindows=0;return false;
 }
 samplingFrames++;
 if(now-samplingStart<500)return false;
 const fps=samplingFrames*1000/(now-samplingStart);
 slowWindows=fps<30?slowWindows+1:0;
 samplingStart=now;samplingFrames=0;
 if(slowWindows<4)return false;
 adaptiveLow=true;
 if(typeof window!=='undefined')window.dispatchEvent(new Event('pans:qualitychange'));
 return true;
}

export const MOTION_KEY='pans-labyrinth:motion-v1';
export function motionPreference(storage=browserStorage()){
 try{const value=storage?.getItem(MOTION_KEY);return value==='reduce'||value==='normal'?value:'system';}
 catch{return 'system';}
}
export function reducedMotion(){
 const setting=motionPreference();
 if(setting==='reduce')return true;
 if(setting==='normal')return false;
 try{return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);}catch{return false;}
}
export function setMotionPreference(mode,storage=browserStorage()){
 if(!['system','reduce','normal'].includes(mode))throw new TypeError('Invalid motion preference');
 try{storage?.setItem(MOTION_KEY,mode);}catch{}
 applyMotionPreference();
 return mode;
}
export function applyMotionPreference(){
 if(typeof document!=='undefined')document.documentElement.dataset.reducedMotion=String(reducedMotion());
}
