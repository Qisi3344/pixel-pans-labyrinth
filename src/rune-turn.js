/** UI-only bidirectional rotation adapter. Maze generation and lock semantics stay unchanged. */
import {turnRune} from './maze.js';

export function stepRune(maze,index,direction){
  const rune=maze.runes[index];
  if(!rune || rune.solved || ![-1,1].includes(direction)){
    return {changed:false,solved:false,phase:rune?.phase ?? null};
  }
  const next=(rune.phase+direction+4)%4;
  let solved=false;
  if(direction===1){
    // Keep the original one-way turnRune behaviour and its gate unlocks intact.
    solved=turnRune(maze,index);
  }else if(next===rune.target){
    // Turn backwards to the target, then delegate the exact unlock to turnRune.
    rune.phase=(next+3)%4;
    solved=turnRune(maze,index);
  }else{
    rune.phase=next;
  }
  return {changed:true,solved,phase:rune.phase};
}
