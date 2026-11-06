/** Held keyboard controls and time-continuous, linear grid traversal.
 * Each tile still requires a valid maze edge; holding an input doesn't skip walls.
 */
const DELTAS=Object.freeze({
 arrowup:Object.freeze({dx:0,dz:-1}),w:Object.freeze({dx:0,dz:-1}),
 arrowdown:Object.freeze({dx:0,dz:1}),s:Object.freeze({dx:0,dz:1}),
 arrowleft:Object.freeze({dx:-1,dz:0}),a:Object.freeze({dx:-1,dz:0}),
 arrowright:Object.freeze({dx:1,dz:0}),d:Object.freeze({dx:1,dz:0}),
});
export function normalizeMovementKey(key){
 if(typeof key!=='string')return null;
 const normalized=key.toLowerCase();
 return Object.prototype.hasOwnProperty.call(DELTAS,normalized)?normalized:null;
}
export function lastHeldStep(keys){
 for(let i=keys.length-1;i>=0;i--)if(DELTAS[keys[i]])return DELTAS[keys[i]];
 return null;
}
export function stepDuration(spiral=false){return spiral?.64:.27;}
export function advanceStep(elapsed,duration,delta){
 if(!Number.isFinite(duration)||duration<=0)throw new RangeError('duration must be positive');
 const now=Math.max(0,Math.min(duration,elapsed));
 const used=Math.min(Math.max(0,delta),duration-now);
 const next=now+used;
 return {elapsed:next,t:next/duration,remaining:Math.max(0,delta-used),finished:next>=duration-1e-9};
}
