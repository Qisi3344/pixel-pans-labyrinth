// Pure, testable chapter-two progression. Each tunnel node has actual connections.
export const NODES = Object.freeze([
  {x:-8,z:1},{x:-6,z:1},{x:-4,z:1},{x:-4,z:-1},
  {x:-2,z:1},{x:0,z:1},{x:2,z:1},{x:2,z:-1},
  {x:4,z:1},{x:6,z:1},{x:7.15,z:2.55},{x:4,z:3}
]);
export const EDGES = Object.freeze([[0,1],[1,2],[2,3],[2,4],[4,5],[5,6],[6,7],[6,8],[8,9],[9,10],[8,11]]);
export const STONE_NODES = Object.freeze([3,7,11]);
export const TOAD_NODE = 10;
// Offer the gems from the clear front approach tile, *not inside* the toad.
export const TOAD_APPROACH_NODE = 9;
export const TOAD_INTERACTION_NODES = Object.freeze([TOAD_APPROACH_NODE,TOAD_NODE]);
export const ROOT_EDGE = '4-5';
export const BOULDER_EDGE = '8-9';
export const rootOpen = time => (time % 4.2) < 2.45;
export const edgeId = (a,b) => [a,b].sort((x,y)=>x-y).join('-');
export function newChapter() {
 return {node:0,stones:[false,false,false],boulderMoved:false,offerings:0,won:false,time:0,rootWait:0};
}
export function neighbours(node) {
 return EDGES.filter(e=>e.includes(node)).map(e=>e[0]===node?e[1]:e[0]);
}
export function edgeAccessible(state,a,b) {
 if(!EDGES.some(e=>edgeId(...e)===edgeId(a,b)))return false;
 if(edgeId(a,b)===ROOT_EDGE && !rootOpen(state.time))return false;
 if(edgeId(a,b)===BOULDER_EDGE && !state.boulderMoved)return false;
 return true;
}
export function step(state,to) {
 if(state.won||!edgeAccessible(state,state.node,to))return false;
 state.node=to;return true;
}
export function interact(state) {
 if(state.won)return {type:'complete'};
 const stone=STONE_NODES.indexOf(state.node);
 if(stone!==-1&&!state.stones[stone]) {
  state.stones[stone]=true;return {type:'stone',index:stone};
 }
 if(state.node===8&&!state.boulderMoved) {
  state.boulderMoved=true;return {type:'boulder'};
 }
 if(TOAD_INTERACTION_NODES.includes(state.node)&&state.boulderMoved) {
  const collected=state.stones.filter(Boolean).length;
  if(collected<3)return {type:'need-stones',remaining:3-collected};
  if(state.offerings<3){
   state.offerings++;
   if(state.offerings===3){state.won=true;return {type:'victory'};}
   return {type:'offering',count:state.offerings};
  }
 }
 return {type:'nothing'};
}
export function findPath(state,from,to) {
 if(from===to)return [from];
 const queue=[from],visited=new Set([from]),prev=new Map();
 for(let i=0;i<queue.length;i++){
  for(const next of neighbours(queue[i])){
   if(visited.has(next)||!edgeAccessible(state,queue[i],next))continue;
   visited.add(next);prev.set(next,queue[i]);queue.push(next);
   if(next===to){
    const path=[to];let node=to;
    while(node!==from){node=prev.get(node);path.push(node);}
    return path.reverse();
   }
  }
 }
 return null;
}
export function nextDirection(state,dx,dz) {
 const ns=neighbours(state.node).filter(n=>edgeAccessible(state,state.node,n));
 let best=-Infinity,pick=null;
 for(const n of ns){
  const d=NODES[n],p=NODES[state.node],vx=d.x-p.x,vz=d.z-p.z;
  const dot=(vx*dx+vz*dz)/Math.hypot(vx,vz);
  if(dot>best){best=dot;pick=n;}
 }
 return best>.35?pick:null;
}