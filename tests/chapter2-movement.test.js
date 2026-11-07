import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stepOnEarth,nearEntrance,atTreeMouth,directionTo} from '../src/chapter2-overworld.js';

// Execute the actual shared keyboard/joystick movement handler. A position
// has set(), x/y/z, but only the player object has a rotation transform.
const source=readFileSync(new URL('../src/chapter2-main.js',import.meta.url),'utf8');
const handler=source.match(/function applyExteriorMovement\(dx,dz,seconds\)\{([\s\S]*?)\n\}/)[1];
function world(){
 const position={x:-4.2,y:0,z:3.8,set(x,y,z){Object.assign(this,{x,y,z});}};
 const view={player:{position,rotation:{y:0}},exterior:{walkable:()=>true,height:()=>.4}};
 const move=new Function('view','stepOnEarth',`return (dx,dz,seconds)=>{${handler}}`)(view,stepOnEarth);
 return {view,position,move};
}
test('exterior keyboard tap and held movement keep running and turn the character',()=>{
 for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,-1]]){
  const {view,position,move}=world();
  const start={...position};
  assert.ok(move(dx,dz,.145)>.4);
  for(let frame=0;frame<60;frame++)assert.ok(move(dx,dz,1/60)>0);
  assert.ok(Math.hypot(position.x-start.x,position.z-start.z)>3);
  assert.equal(view.player.rotation.y,Math.atan2(dx,dz));
  assert.ok(Math.abs(position.y-.435)<1e-10);
 }
});
test('joystick frames can reach the tree entrance; idle and blocked movement stay still',()=>{
 const {view,position,move}=world();
 const entrance={x:0,z:2.6};
 for(let frame=0;frame<100;frame++)move(entrance.x-position.x,entrance.z-position.z,1/60);
 assert.ok(nearEntrance(position,entrance));
 const before={...position};
 const facing=view.player.rotation.y;
 assert.equal(move(0,0,1/60),0);
 view.exterior.walkable=()=>false;
 assert.equal(move(1,0,1/60),0);
 assert.equal(position.x,before.x);
 assert.equal(position.z,before.z);
 assert.equal(view.player.rotation.y,facing);
});

test('walking and click-to-walk reach the automatic entry before trunk collision',()=>{
 const exterior=readFileSync(new URL('../src/chapter2-exterior.js',import.meta.url),'utf8');
 const entrance=JSON.parse(exterior.match(/entrance:(\{x:0,z:[\d.]+\})/)[1].replace(/([xz]):/g,'"$1":'));
 const collision=exterior.match(/function walkable\(x,z\)\{([\s\S]*?)\n \}/)[1];
 const canWalk=new Function('x','z',collision);
 for(const start of [{x:-4.2,z:3.8},{x:0,z:2.65},{x:.5,z:2.6}]){
  let position={...start},entered=false;
  for(let frame=0;frame<300;frame++){
   const d=directionTo(position,entrance);
   position=stepOnEarth(position,d.x,d.z,1/60,canWalk);
   if(atTreeMouth(position,entrance)){entered=true;break;}
  }
  assert.ok(entered,'must enter before being stopped by bark');
 }
 assert.equal(atTreeMouth({x:1.3,z:2},entrance),false,'side of trunk is not a doorway');
 assert.equal(atTreeMouth({x:0,z:-.5},entrance),false,'back of tree is not a doorway');
 assert.match(source,/if\(atTreeMouth\(hero,view.exterior.entrance\)\)enterTree\(\)/);
});
