// Deterministic exterior movement and entrance trigger, independent of Three.js.
export const APPROACH_SPEED = 2.85;
export const ENTRY_RADIUS = 1.25;
export const distance2d = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
export const nearEntrance = (position,entrance) => distance2d(position,entrance)<=ENTRY_RADIUS;

export function normalizedInput(dx,dz) {
 const l=Math.hypot(dx,dz);
 return l<.16 ? {x:0,z:0} : {x:dx/l,z:dz/l};
}
export function stepOnEarth(position,dx,dz,dt,canWalk) {
 const velocity=normalizedInput(dx,dz);
 const length=Math.hypot(velocity.x,velocity.z)*Math.max(0,dt)*APPROACH_SPEED;
 if(length<.00001)return {...position};
 const x=position.x+velocity.x*length,z=position.z+velocity.z*length;
 // Axis-separated sweep, smooth sliding around a gnarled trunk.
 const canX=canWalk(x,position.z);
 const nextX=canX?x:position.x;
 const canZ=canWalk(nextX,z);
 return {x:nextX,z:canZ?z:position.z};
}
export function directionTo(from,to) {
 const dx=to.x-from.x,dz=to.z-from.z;
 return normalizedInput(dx,dz);
}
