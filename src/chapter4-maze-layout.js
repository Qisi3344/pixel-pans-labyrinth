// Shared level-I maze DATA: the final trial revisits only the central ring of
// the very same deterministic maze rather than inventing a disconnected set.
// Pure coordinates are also consumed by chapter-IV collision and navigation.
import {generateMaze,CELL,CENTER,SIZE} from './maze.js';

export const FINAL_WELL_CENTER=Object.freeze({x:2.17,z:-2.06});
export const FINAL_FAUN_POSITION=Object.freeze({x:-3.2,z:-2.50});
export const FINAL_APPROACH_PATH=Object.freeze([
 Object.freeze({x:-9.65,z:7.2}),
 Object.freeze({x:-6.8,z:4.8}),
 Object.freeze({x:-4.2,z:2.0}),
 Object.freeze({x:-1.6,z:0})
]);
const d=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const distSegment=(p,a,b)=>{
 const dx=b.x-a.x,dz=b.z-a.z,den=dx*dx+dz*dz;
 const t=Math.max(0,Math.min(1,den?((p.x-a.x)*dx+(p.z-a.z)*dz)/den:0));
 return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);
};
export function finalApproachClear(p){
 if(d(p,FINAL_FAUN_POSITION)<2.05||d(p,FINAL_APPROACH_PATH.at(-1))<2.8)return true;
 if(d(p,FINAL_WELL_CENTER)<4.75)return true;
 return FINAL_APPROACH_PATH.slice(1).some((b,i)=>
  distSegment(p,FINAL_APPROACH_PATH[i],b)<2.10);
}
const firstMaze=generateMaze(132);
const walls=[];
const open=[];
for(let z=0;z<SIZE;z++)for(let x=0;x<SIZE;x++){
 const p={x:(x-CENTER)*CELL+FINAL_WELL_CENTER.x,
  z:(z-CENTER)*CELL+FINAL_WELL_CENTER.z};
 const dist=d(p,FINAL_WELL_CENTER);
 if(dist>10.8||dist<3.60)continue;
 const entry=Object.freeze({...p,gridX:x,gridZ:z,cell:CELL});
 if(!firstMaze.grid[z][x]&&!finalApproachClear(p))walls.push(entry);
 else open.push(entry);
}
export const FINAL_MAZE_WALLS=Object.freeze(walls);
export const FINAL_MAZE_FLOORS=Object.freeze(open);
// A clearance consistent with the visible stone cells, not invisible walls.
export function blockedByFinalMaze(p,r=.28){
 return FINAL_MAZE_WALLS.some(w=>Math.abs(p.x-w.x)<CELL*.495+r&&
  Math.abs(p.z-w.z)<CELL*.495+r);
}
