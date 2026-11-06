/** Seeded circular labyrinth: three ordered seals on the sole route to the central well. */
export const SIZE = 19;
export const SYMBOLS = ['↑', '→', '↓', '←'];
export const DIRECTIONS = ['北', '东', '南', '西'];
export const CELL = 1.27;
export const CENTER = (SIZE - 1) / 2;
export const RUIN_RADIUS = 9.0;
// Ten consecutive grid checkpoints, projected onto the *visible* spiral steps.
// Hand-cleared open stone courtyard around the upper-left/north side of the well.
// These are the exact L-shaped tiles formerly covered by the tall wall band.
// The first two cells stay blocked by visible root-filled cracks; these two
// natural barriers preserve the three-gate puzzle without invisible walls.
export const WELL_CLEARING_WALKABLE = Object.freeze([
  [6,7],[6,8],[6,9],[6,10],
  [7,7],[7,8],[7,9],[7,10],
  [8,6],[8,7],[8,10],
  [9,7],[10,7],
].map(([x,z])=>Object.freeze({x,z})));
export const WELL_CLEARING_ROOTS = Object.freeze([
  Object.freeze({x:6,z:6}),Object.freeze({x:7,z:6}),
]);
export const WELL_ROUTE = Object.freeze([
  {x:9,z:6},{x:10,z:6},{x:11,z:6},{x:11,z:7},{x:11,z:8},
  {x:11,z:9},{x:11,z:10},{x:10,z:10},{x:9,z:10},{x:9,z:9},
]);
// Del Toro-inspired circular footprint: no rectangular maze corners.
export const withinRuin = (x, z) => Math.hypot(x - CENTER, z - CENTER) <= RUIN_RADIUS;
const DELTAS = [[0,-1],[1,0],[0,1],[-1,0]];
export const id = (x, z) => `${x},${z}`;
export const same = (a, b) => a.x === b.x && a.z === b.z;
export const inside = (x,z) => x > 0 && z > 0 && x < SIZE - 1 && z < SIZE - 1;

function random(seed) {
  let state = seed >>> 0;
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
}
function shuffle(xs, rand) {
  const result = [...xs];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function neighbours(cell) {
  return DELTAS.map(([dx,dz]) => ({ x: cell.x + dx, z: cell.z + dz }));
}
export function openCell(grid, cell) {
  return Boolean(grid[cell.z]?.[cell.x]);
}
export function shortestPath(grid, start, end, blocked = new Set()) {
  if (!openCell(grid,start) || !openCell(grid,end) || blocked.has(id(end.x,end.z))) return null;
  const nodes = [start];
  const previous = new Map([[id(start.x,start.z), null]]);
  for (let cursor = 0; cursor < nodes.length; cursor++) {
    const cell = nodes[cursor];
    if (same(cell,end)) {
      const result = [];
      let node = cell;
      while (node) { result.push(node); node = previous.get(id(node.x,node.z)); }
      return result.reverse();
    }
    for (const next of neighbours(cell)) {
      const key = id(next.x,next.z);
      if (!openCell(grid,next) || blocked.has(key) || previous.has(key)) continue;
      previous.set(key,cell);
      nodes.push(next);
    }
  }
  return null;
}

// Curated default: mandatory passage through both western quadrants.
export function generateMaze(seed = 132) {
  const rand = random(seed);
  const grid = Array.from({length: SIZE}, () => Array(SIZE).fill(false));
  const start = {x:15,z:15}; // southeast-facing entrance, framed by the skull arch
  const approach = {x:9,z:5}; // sole entrance to the sunken well
  const exit = {x:9,z:9};  // the sacred centre at the base of the shaft
  const restricted = new Set(WELL_ROUTE.flatMap(c => neighbours(c)
    .filter(n => !same(n,approach)).map(n => id(n.x,n.z))));
  const stack = [start];
  grid[start.z][start.x] = true;
  // Recursive-backtracker without recursion: all carved cells form a tree.
  while (stack.length) {
    const cell = stack[stack.length - 1];
    const choices = shuffle(DELTAS,rand)
      .map(([dx,dz])=>({ x:cell.x+2*dx,z:cell.z+2*dz,wx:cell.x+dx,wz:cell.z+dz }))
      .filter(n=> inside(n.x,n.z) && withinRuin(n.x,n.z) && withinRuin(n.wx,n.wz)
        && Math.hypot(n.x-CENTER,n.z-CENTER)>=3.95
        && Math.hypot(n.wx-CENTER,n.wz-CENTER)>=3.95
        && !restricted.has(id(n.x,n.z)) && !restricted.has(id(n.wx,n.wz))
        && !grid[n.z][n.x]);
    if (!choices.length) { stack.pop(); continue; }
    const next = choices[0];
    grid[next.wz][next.wx] = true;
    grid[next.z][next.x] = true;
    stack.push({ x:next.x,z:next.z });
  }
  // The outer puzzle is a tree.  Only one hand-carved path enters the stone
  // shaft; it doubles back in a rough spiral before reaching the floor.
  // Keeping it outside the random maze protects the funnel silhouette and
  // prevents short-cuts around the three puzzle gates.
  const outerRoute = shortestPath(grid,start,approach);
  if (!outerRoute || outerRoute.length < 15) throw new Error('Outer route unexpectedly short');
  for (const cell of WELL_ROUTE) grid[cell.z][cell.x]=true;
  const mainRoute = [...outerRoute,...WELL_ROUTE];
  // All three gate stones live in the outer maze, away from the well opening.
  const positions = [0.23, 0.48, 0.74].map(t=>Math.min(outerRoute.length-3,Math.max(3, Math.floor((outerRoute.length-1)*t))));
  const gateCells = positions.map(i=>mainRoute[i]);
  const routeIndex = new Map(mainRoute.map((cell,i)=>[id(cell.x,cell.z),i]));
  const gates = gateCells.map((cell,index)=>({ ...cell,index,open:false }));
  const targets = [2,0,3];
  const colors = [0xA8DCC4,0xC6B1F1,0xEBCE95];
  // Place each rune in the reachable region *preceding* its corresponding gate.
  const runes = positions.map((gateIndex,index)=>{
    const previousGate = index ? positions[index-1] : 0;
    const middle = Math.floor((previousGate+gateIndex)/2);
    let choice = mainRoute[Math.max(previousGate+1,middle)];
    let best = -1;
    // Find secluded side-branch termini, but never cross the next lock.
    for (let j=previousGate+1;j<gateIndex;j++) {
      const root = mainRoute[j];
      for (const n of neighbours(root)) {
        if (!openCell(grid,n) || routeIndex.has(id(n.x,n.z))) continue;
        const todo = [[n,1,root]];
        const visited = new Set([id(root.x,root.z)]);
        while (todo.length) {
          const [cell,depth] = todo.pop();
          const key = id(cell.x,cell.z);
          if (visited.has(key) || routeIndex.has(key)) continue;
          visited.add(key);
          const more = neighbours(cell).filter(q => openCell(grid,q) && !visited.has(id(q.x,q.z)) && !routeIndex.has(id(q.x,q.z)));
          const score = depth + (more.length === 0 ? 8 : 0) - Math.abs(j-middle)*0.12;
          if (score > best) { best=score; choice=cell; }
          for (const q of more) todo.push([q,depth+1,cell]);
        }
      }
    }
    return { ...choice,index,phase:[1,2,0][index],target:targets[index],solved:false,color:colors[index] };
  });
  // The authored first chapter gets a readable open courtyard in front of the
  // well. Do this AFTER choosing the original route, gates and rune placements,
  // so no puzzle shifts and the mandatory west-side exploration is preserved.
  // Other procedural seeds remain unchanged.
  if(seed===132) for(const {x,z} of WELL_CLEARING_WALKABLE) grid[z][x]=true;
  return { grid,start,approach,exit,mainRoute,gates,runes,seed };
}

export function availablePath(maze,from,to) {
  const blocked = new Set(maze.gates.filter(g=>!g.open).map(g=>id(g.x,g.z)));
  return shortestPath(maze.grid,from,to,blocked);
}
export function turnRune(maze,index) {
  const rune=maze.runes[index];
  if (!rune || rune.solved) return false;
  rune.phase=(rune.phase+1)%4;
  if (rune.phase===rune.target) {
    rune.solved=true;
    maze.gates[index].open=true;
    return true;
  }
  return false;
}
