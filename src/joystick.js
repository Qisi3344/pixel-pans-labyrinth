/** Camera-facing joystick input projected onto the existing four-way grid.
 * Screen movement follows the game's fixed isometric view (45-degree yaw).
 * No new collision or free-flight logic is introduced.
 */
export function normalizeJoystick(dx,dy,maxTravel=48){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Number.isFinite(maxTravel)||maxTravel<=0)
   return {x:0,y:0};
 const scale=Math.max(1,Math.hypot(dx,dy)/maxTravel);
 return {x:dx/(maxTravel*scale),y:dy/(maxTravel*scale)};
}
const DIRS=[
 {dx:1,dz:0,sx:1,sy:.57735},
 {dx:0,dz:1,sx:-1,sy:.57735},
 {dx:-1,dz:0,sx:-1,sy:-.57735},
 {dx:0,dz:-1,sx:1,sy:-.57735},
];
export function joystickGridStep(x,y,deadZone=.18){
 if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<deadZone)return null;
 let best=DIRS[0],max=-Infinity;
 // Match the stick to the projected directions, not arbitrary W/A/S/D labels.
 for(const dir of DIRS){
   const score=(x*dir.sx+y*dir.sy)/Math.hypot(dir.sx,dir.sy);
   if(score>max){max=score;best=dir;}
 }
 return {dx:best.dx,dz:best.dz};
}
