// Deliberately slow, readable 3D catch-and-devour choreography.
// Never shrink or delete the avatar as the substitute for an animation.
export const DEVOUR_DURATION=4.25;
const clamp=n=>Math.min(1,Math.max(0,n));
const smooth=n=>{const u=clamp(n);return u*u*(3-2*u);};
const pulse=(t,centre,width)=>Math.max(0,1-Math.abs(t-centre)/width);
export function deathBeat(time){
 const t=Math.max(0,Number.isFinite(time)?time:0);
 const grip=smooth((t-.08)/.55);
 const lift=smooth((t-.50)/.95);
 const biteOne=pulse(t,1.92,.40),biteTwo=pulse(t,2.65,.36);
 const jawOpen=clamp(
  smooth((t-1.22)/.40)*(1-smooth((t-3.34)/.28))
  *(.20+.73*Math.max(biteOne,biteTwo))
 );
 const yank=smooth((t-1.35)/1.35);
 const swallow=smooth((t-3.02)/.65);
 const fade=smooth((t-3.72)/.53);
 return {
  time:t,
  stage:t<.60?'grab':t<1.42?'lift':t<3.27?'bite':t<3.73?'gulp':'fade',
  grip,lift,yank,jawOpen,swallow,fade,
  cameraZoom:1+smooth(t/.75)*2.05,
  headLower:jawOpen*.18+swallow*.11,
  heroLift:lift*.84,
  heroLean:smooth((t-1.15)/.65)*.24,
  shake:biteOne*.075+biteTwo*.10,
  completed:t>=DEVOUR_DURATION
 };
}
