// Third chapter logic is deliberately DOM/Three.js independent and testable.
// Continuous exploration -> forbidden feast -> waking -> pursuit -> chalk door.
export const HALL=Object.freeze({minX:-9.3,maxX:9.3,minZ:-4.7,maxZ:4.7});
export const TABLE=Object.freeze({minX:-4.35,maxX:5.25,minZ:-1.13,maxZ:1.13});
export const START=Object.freeze({x:-7.45,z:3.35});
export const FOOD=Object.freeze({x:-1.45,z:2.35});
export const DOOR=Object.freeze({x:-8.37,z:-3.38});
export const MONSTER_START=Object.freeze({x:6.78,z:.12});
export const PLAYER_SPEED=4.15;
export const HUNTER_SPEED=2.95;
export const AWAKEN_SECONDS=3.35;
export const CATCH_RADIUS=.76;
export const DOOR_RADIUS=1.40;
export const DOOR_POLYLINE=Object.freeze([
 Object.freeze({x:.17,y:.84}),
 Object.freeze({x:.17,y:.16}),
 Object.freeze({x:.83,y:.16}),
 Object.freeze({x:.83,y:.84})
]);
const EPS=.00001;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const inRect=(p,box,pad=0)=>p.x>box.minX-pad&&p.x<box.maxX+pad&&p.z>box.minZ-pad&&p.z<box.maxZ+pad;
export function walkable(p,radius=.25){
 if(!(p.x>HALL.minX+radius&&p.x<HALL.maxX-radius&&p.z>HALL.minZ+radius&&p.z<HALL.maxZ-radius))return false;
 if(inRect(p,TABLE,radius+.07))return false;
 return true;
}
export function moveActor(point,xAxis,zAxis,dt,speed=PLAYER_SPEED,radius=.25){
 const m=Math.hypot(xAxis,zAxis);
 if(m<EPS)return {...point};
 // Substep at most 0.12 world units to avoid tunnelling across table corners.
 const dx=xAxis/m*Math.min(dt,.09)*speed, dz=zAxis/m*Math.min(dt,.09)*speed;
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.11));
 let current={...point};
 for(let i=0;i<steps;i++){
  const x={...current,x:current.x+dx/steps};
  if(walkable(x,radius))current=x;
  const z={...current,z:current.z+dz/steps};
  if(walkable(z,radius))current=z;
 }
 return current;
}
export function newBanquet(){
 return {phase:'invitation',player:{...START},monster:{...MONSTER_START},
  eaten:false,awakeTime:0,chaseTime:0,doorProgress:0,doorSegment:0,segmentT:0,
  deathTime:0,winTime:0,crumbleTime:0,hasDragged:false};
}
export function eat(state){
 if(state.phase!=='invitation'||distance(state.player,FOOD)>1.48)return false;
 state.phase='awakening';state.eaten=true;state.awakeTime=0;
 return true;
}
export function atDoor(state){return distance(state.player,DOOR)<DOOR_RADIUS;}
export function startDrawing(state){
 if(state.phase!=='chase'||!atDoor(state))return false;
 state.phase='drawing';state.doorProgress=0;state.doorSegment=0;
 state.segmentT=0;state.hasDragged=false;
 return true;
}
export function cancelDrawing(state){
 if(state.phase==='drawing'){state.phase='chase';return true;}
 return false;
}
// Each segment must be traced, in sequence, from bottom-left over the top to
// bottom-right. Dragging straight across or tapping the endpoint cannot open it.
export function traceChalk(state,x,y){
 if(state.phase!=='drawing')return false;
 const seg=state.doorSegment;
 const a=DOOR_POLYLINE[seg],b=DOOR_POLYLINE[seg+1];
 if(!a||!b)return false;
 const vx=b.x-a.x,vy=b.y-a.y,len2=vx*vx+vy*vy;
 const t=clamp(((x-a.x)*vx+(y-a.y)*vy)/len2,0,1);
 const near=Math.hypot(x-(a.x+vx*t),y-(a.y+vy*t))<.14;
 if(!near||t<state.segmentT-.11||t>state.segmentT+.24)return false;
 if(t>state.segmentT+.005)state.hasDragged=true;
 state.segmentT=Math.max(state.segmentT,t);
 state.doorProgress=(seg+state.segmentT)/3;
 if(state.segmentT>=.95){
  if(seg===2){state.phase='escape';state.doorProgress=1;state.winTime=0;}
  else {state.doorSegment++;state.segmentT=0;}
 }
 return true;
}
export function tickBanquet(state,dt){
 const d=clamp(dt,0,.10);
 if(state.phase==='awakening'){
  state.awakeTime+=d;
  if(state.awakeTime>=AWAKEN_SECONDS){
   state.phase='chase';state.chaseTime=0;
  }
 }else if(state.phase==='chase'||state.phase==='drawing'){
  state.chaseTime+=d;
 }else if(state.phase==='caught'){
  state.deathTime+=d;
 }else if(state.phase==='escape'){
  state.winTime+=d;
 }
 return state.phase;
}
export function attemptCatch(state){
 if(!['chase','drawing'].includes(state.phase))return false;
 if(distance(state.player,state.monster)>CATCH_RADIUS)return false;
 state.phase='caught';state.deathTime=0;return true;
}
// 8-neighbour A* for a hunter that actually routes AROUND the banquet table.
const CELL=.48;
const W=Math.floor((HALL.maxX-HALL.minX)/CELL)+1;
const H=Math.floor((HALL.maxZ-HALL.minZ)/CELL)+1;
const toNode=(point)=>({
  i:clamp(Math.round((point.x-HALL.minX)/CELL),0,W-1),
  j:clamp(Math.round((point.z-HALL.minZ)/CELL),0,H-1)
});
const toPoint=(i,j)=>({x:HALL.minX+i*CELL,z:HALL.minZ+j*CELL});
const key=(i,j)=>j*W+i;
const directions=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
export function huntRoute(start,goal,radius=.24){
 const s=toNode(start),end=toNode(goal);
 const startId=key(s.i,s.j),endId=key(end.i,end.j);
 // Search from a valid nearby point if the character is between grid samples.
 const legal=(i,j)=>i>=0&&i<W&&j>=0&&j<H&&walkable(toPoint(i,j),radius);
 if(!legal(s.i,s.j)||!legal(end.i,end.j))return [];
 const frontier=[{i:s.i,j:s.j,g:0,f:0}],visited=new Set();
 const came=new Map(),cost=new Map([[startId,0]]);
 while(frontier.length){
  frontier.sort((a,b)=>a.f-b.f);
  const current=frontier.shift(),id=key(current.i,current.j);
  if(visited.has(id))continue;visited.add(id);
  if(id===endId){
   let node=id;const result=[];
   while(node!==startId){
    result.push(toPoint(node%W,Math.floor(node/W)));
    node=came.get(node);
    if(node===undefined)return [];
   }
   result.reverse();
   if(result.length)result.push({...goal});
   return result;
  }
  for(const [di,dj] of directions){
   const i=current.i+di,j=current.j+dj;
   if(!legal(i,j))continue;
   // Forbid diagonal squeezing through a table corner.
   if(di!==0&&dj!==0&&(!legal(current.i+di,current.j)||!legal(current.i,current.j+dj)))continue;
   const id2=key(i,j),next=current.g+(di&&dj?Math.SQRT2:1);
   if(next>=(cost.get(id2)??Infinity))continue;
   cost.set(id2,next);came.set(id2,id);
   frontier.push({i,j,g:next,f:next+Math.hypot(end.i-i,end.j-j)});
  }
 }
 return [];
}
