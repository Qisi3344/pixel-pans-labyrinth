// A single source of truth for both WORLD animation and narrative timing.
// The palace must not replace the well while the captain is still approaching
// or while Ofelia is walking, lifting the knife, or blood enters the shaft.
export const FINAL_CUES=Object.freeze({
 mercy:Object.freeze({
  approachEnd:3.5,handOff:4.25,aim:5.35,shot:5.95,shotEnd:6.23,
  bloodStart:6.53,bloodEnd:8.25,portalStart:8.25,
  royalAt:10.00,end:21.50
 }),
 offering:Object.freeze({
  approachEnd:2.65,knifeStart:2.75,knifeLiftEnd:4.45,
  bloodMoment:5.10,handOff:5.12,
  bloodStart:5.35,bloodEnd:7.35,portalStart:7.26,
  royalAt:9.30,end:20.60
 })
});
export const VIDAL_CINEMATIC_ENTRY=Object.freeze({x:-6.8,z:4.8});
export function finalCues(ending){return FINAL_CUES[ending]||null;}
export function normalizedBeat(t,start,end){
 if(!Number.isFinite(t)||!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return 0;
 return Math.max(0,Math.min(1,(t-start)/(end-start)));
}
export function finalStage(ending,t){
 const c=finalCues(ending);
 if(!c||!Number.isFinite(t))return 'none';
 if(t>=c.royalAt)return 'royal';
 if(ending==='mercy'){
  if(t<c.handOff)return 'vidal-approaches';
  if(t<c.aim)return 'baby-taken';
  if(t<c.shot)return 'captain-aims';
  if(t<c.bloodStart)return 'shot';
  if(t<c.portalStart)return 'blood-descends';
  return 'well-opens';
 }
 if(t<c.approachEnd)return 'approach-well';
 if(t<c.bloodMoment)return 'lift-ritual-knife';
 if(t<c.portalStart)return 'blood-descends';
 return 'well-opens';
}
