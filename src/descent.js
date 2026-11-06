/** Automatic stair descent without changing maze collision or path rules. */
import {WELL_ROUTE,same} from './maze.js';
export function shouldStartDescent(maze,cell,alreadyDescending=false){
 return !alreadyDescending && same(cell,maze.approach) && maze.gates.every(g=>g.open);
}
export function spiralDescentRoute(){return WELL_ROUTE.map(cell=>({...cell}));}
