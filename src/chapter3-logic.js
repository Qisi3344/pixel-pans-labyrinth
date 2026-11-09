// Chapter III: one continuous route — chalk doorway -> vaulted approach passage
// -> banquet with forbidden fruit -> awakened Pale Man -> long return pursuit.
export const HALL=Object.freeze({minX:-9.3,maxX:9.3,minZ:-4.7,maxZ:4.7});
export const CORRIDOR=Object.freeze({minX:-33.2,maxX:-8.45,minZ:-1.72,maxZ:1.72});
export const TABLE=Object.freeze({minX:-4.35,maxX:5.25,minZ:-1.13,maxZ:1.13});
// Frescoes are embedded in the rear stone wall. A solid clearance strip keeps
// the red-dressed avatar on the CAMERA side, instead of walking behind a mural.
export const FRESCO_POINTS=Object.freeze([
 Object.freeze({x:-5.10,z:-4.27}),Object.freeze({x:2.88,z:-4.27})
]);
export const FRESCO_INSPECT_RADIUS=2.35;
export function nearestFresco(point,radius=FRESCO_INSPECT_RADIUS){
 let best=-1,closest=radius;
 for(let i=0;i<FRESCO_POINTS.length;i++){
  const d=Math.hypot(point.x-FRESCO_POINTS[i].x,point.z-FRESCO_POINTS[i].z);
  if(d<closest){best=i;closest=d;}
 }
 return best;
}
export const ENTRANCE=Object.freeze({x:-9.02,z:0});
export const START=Object.freeze({x:-30.95,z:.06});
export const FOOD=Object.freeze({x:-1.45,z:2.35});
export const DOOR=Object.freeze({x:-29.65,z:0});
export const CHAIR=Object.freeze({minX:-30.10,maxX:-29.20,minZ:-1.39,maxZ:-.47});
export const MONSTER_START=Object.freeze({x:6.78,z:.12});
export const MONSTER_INSPECT_RADIUS=2.35;
export const PLAYER_SPEED=4.6;
// Approximately 1.5 extra seconds over a representative 40-unit pursuit.
export const HUNTER_SPEED=3.60;
export const AWAKEN_SECONDS=3.35;
export const CATCH_RADIUS=.76;
export const DOOR_RADIUS=1.35;
export const CHAIR_CLIMB_SECONDS=.90;
export const ESCAPE_CLIMB_SECONDS=2.45;
// An hourglass warns that the *original* passage is sealing shut; the player
// always escapes by returning and drawing a new chalk doorway, as in the film.
export const SEAL_SECONDS=7.8;
// The final chalk passage is a full RECTANGLE on the CEILING, not a
// freestanding wall-shaped panel. Trace all four sides with the mouse/finger.
export const DOOR_POLYLINE=Object.freeze([
 Object.freeze({x:.18,y:.82}),Object.freeze({x:.18,y:.18}),
 Object.freeze({x:.82,y:.18}),Object.freeze({x:.82,y:.82}),
 Object.freeze({x:.18,y:.82})
]);
const EPS=.00001;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const inRect=(p,rect,pad=0)=>p.x>rect.minX-pad&&p.x<rect.maxX+pad&&p.z>rect.minZ-pad&&p.z<rect.maxZ+pad;
export function zone(p){
 if(inRect(p,CORRIDOR))return 'passage';
 if(inRect(p,HALL))return 'feast';
 return 'outside';
}
export function walkable(p,radius=.25){
 const inHall=p.x>HALL.minX+radius&&p.x<HALL.maxX-radius&&
  p.z>HALL.minZ+radius&&p.z<HALL.maxZ-radius;
 const inPassage=p.x>CORRIDOR.minX+radius&&p.x<CORRIDOR.maxX-radius&&
  p.z>CORRIDOR.minZ+radius&&p.z<CORRIDOR.maxZ-radius;
 if(!(inHall||inPassage))return false;
 if(inRect(p,TABLE,radius+.07))return false;
 // Solid chair: walk beside it, then climb through the scripted interaction.
 if(inRect(p,CHAIR,radius*.55))return false;
 // Wall paintings have real depth. Stop the character BEFORE their frames,
 // rather than allowing her head to be occluded by a hanging art panel.
 if(p.z< -4.03){
  for(const fresco of FRESCO_POINTS){
   if(Math.abs(p.x-fresco.x)<1.20+radius)return false;
  }
 }
 return true;
}
export function moveActor(point,xAxis,zAxis,dt,speed=PLAYER_SPEED,radius=.25){
 const length=Math.hypot(xAxis,zAxis);
 if(length<EPS)return {...point};
 const dx=xAxis/length*Math.min(dt,.09)*speed,dz=zAxis/length*Math.min(dt,.09)*speed;
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.105));
 let current={...point};
 for(let k=0;k<steps;k++){
  const x={...current,x:current.x+dx/steps};
  if(walkable(x,radius))current=x;
  const z={...current,z:current.z+dz/steps};
  if(walkable(z,radius))current=z;
 }
 return current;
}
export function newBanquet(){
 return {phase:'invitation',player:{...START},monster:{...MONSTER_START},
  eaten:false,awakeTime:0,chaseTime:0,doorProgress:0,doorSegment:0,
  segmentT:0,deathTime:0,winTime:0,crumbleTime:0,hasDragged:false,
  sealed:false,distanceEscaped:0,climbTime:0,inspectedMonster:false,hasDagger:false};
}
export function eat(state){
 if(state.phase!=='invitation'||distance(state.player,FOOD)>1.48)return false;
 state.phase='awakening';state.eaten=true;state.awakeTime=0;return true;
}
// Looking at the seated creature is an observation, never a wake-up trigger.
// A click may inspect it from afar; walking near it triggers the same line once.
export function inspectSleepingMonster(state,{clicked=false}={}){
 if(state.phase!=='invitation')return false;
 if(!clicked&&distance(state.player,state.monster)>MONSTER_INSPECT_RADIUS)return false;
 state.inspectedMonster=true;
 return true;
}
export function atDoor(state){return distance(state.player,DOOR)<DOOR_RADIUS;}
export function startDrawing(state){
 if(state.phase!=='chase'||!atDoor(state))return false;
 // First step UP onto the chair, then reach the ceiling to draw the hatch.
 state.phase='climbing';state.climbTime=0;
 state.doorProgress=0;state.doorSegment=0;
 state.segmentT=0;state.hasDragged=false;return true;
}
export function cancelDrawing(state){
 if(state.phase==='drawing'||state.phase==='climbing'){
  state.phase='chase';state.climbTime=0;return true;
 }
 return false;
}
export function traceChalk(state,x,y){
 if(state.phase!=='drawing')return false;
 const seg=state.doorSegment,a=DOOR_POLYLINE[seg],b=DOOR_POLYLINE[seg+1];
 const total=DOOR_POLYLINE.length-1;
 if(!a||!b)return false;
 const vx=b.x-a.x,vy=b.y-a.y;
 const t=clamp(((x-a.x)*vx+(y-a.y)*vy)/(vx*vx+vy*vy),0,1);
 const near=Math.hypot(x-(a.x+vx*t),y-(a.y+vy*t))<.14;
 if(!near||t<state.segmentT-.11||t>state.segmentT+.24)return false;
 if(t>state.segmentT+.005)state.hasDragged=true;
 state.segmentT=Math.max(t,state.segmentT);
 state.doorProgress=(seg+state.segmentT)/total;
 if(state.segmentT>=.95){
  if(seg===total-1){state.phase='escape';state.doorProgress=1;state.winTime=0;}
  else {state.doorSegment++;state.segmentT=0;}
 }
 return true;
}
export function tickBanquet(state,dt){
 const d=clamp(dt,0,.10);
 if(state.phase==='awakening'){
  state.awakeTime+=d;
  if(state.awakeTime>=AWAKEN_SECONDS){state.phase='chase';state.chaseTime=0;}
 }else if(['chase','climbing','drawing'].includes(state.phase)){
  state.chaseTime+=d;
  if(state.chaseTime>=SEAL_SECONDS)state.sealed=true;
  if(state.phase==='climbing'){
   state.climbTime+=d;
   if(state.climbTime>=CHAIR_CLIMB_SECONDS){state.phase='drawing';state.climbTime=CHAIR_CLIMB_SECONDS;}
  }
 }else if(state.phase==='caught')state.deathTime+=d;
 else if(state.phase==='escape')state.winTime+=d;
 return state.phase;
}
export function attemptCatch(state){
 if(!['chase','climbing','drawing'].includes(state.phase))return false;
 if(distance(state.player,state.monster)>CATCH_RADIUS)return false;
 state.phase='caught';state.deathTime=0;return true;
}
// 8-way A* over both connected spaces. Binary heap avoids repeated sorting
// hundreds of nodes on each hunter repath, especially on mobile hardware.
const CELL=.48,LEFT=CORRIDOR.minX,RIGHT=HALL.maxX;
const BOTTOM=HALL.minZ,TOP=HALL.maxZ;
const W=Math.ceil((RIGHT-LEFT)/CELL)+1,H=Math.ceil((TOP-BOTTOM)/CELL)+1;
const node=(p)=>({i:clamp(Math.round((p.x-LEFT)/CELL),0,W-1),
 j:clamp(Math.round((p.z-BOTTOM)/CELL),0,H-1)});
const point=(i,j)=>({x:LEFT+i*CELL,z:BOTTOM+j*CELL});
const id=(i,j)=>j*W+i;
const steps=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
class Heap{
 constructor(){this.items=[];}
 push(item){let a=this.items,i=a.length;a.push(item);
  while(i>0){const p=(i-1)>>1;if(a[p].f<=item.f)break;a[i]=a[p];i=p;}a[i]=item;
 }
 pop(){const a=this.items,top=a[0],last=a.pop();
  if(a.length){let i=0;while(true){
   const l=i*2+1,r=l+1;if(l>=a.length)break;
   const child=r<a.length&&a[r].f<a[l].f?r:l;
   if(a[child].f>=last.f)break;a[i]=a[child];i=child;
  }a[i]=last;}return top;
 }
 get length(){return this.items.length;}
}
export function huntRoute(start,goal,radius=.24){
 const s=node(start),end=node(goal),startId=id(s.i,s.j),endId=id(end.i,end.j);
 const valid=(i,j)=>i>=0&&i<W&&j>=0&&j<H&&walkable(point(i,j),radius);
 if(!valid(s.i,s.j)||!valid(end.i,end.j))return [];
 const heap=new Heap();heap.push({i:s.i,j:s.j,g:0,f:0});
 const cost=new Map([[startId,0]]),previous=new Map(),done=new Set();
 while(heap.length){
  const curr=heap.pop(),self=id(curr.i,curr.j);
  if(done.has(self))continue;done.add(self);
  if(self===endId){
   let at=self;const route=[];
   while(at!==startId){
    route.push(point(at%W,Math.floor(at/W)));
    at=previous.get(at);if(at===undefined)return [];
   }
   route.reverse();
   if(route.length)route.push({...goal});
   return route;
  }
  for(const [di,dj] of steps){
   const i=curr.i+di,j=curr.j+dj;if(!valid(i,j))continue;
   if(di&&dj&&(!valid(curr.i+di,curr.j)||!valid(curr.i,curr.j+dj)))continue;
   const nextId=id(i,j),g=curr.g+(di&&dj?Math.SQRT2:1);
   if(g>=(cost.get(nextId)??Infinity))continue;
   cost.set(nextId,g);previous.set(nextId,self);
   heap.push({i,j,g,f:g+Math.hypot(end.i-i,end.j-j)});
  }
 }
 return [];
}
