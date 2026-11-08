import './style.css';
import {recordChapterComplete,campaignChapterUrl} from './campaign.js';
import {generateMaze,availablePath,same,CELL} from './maze.js';
import {stepRune} from './rune-turn.js';
import {createRuneInspector} from './rune-inspector.js';
import {createDiorama,world,spiralProgress,spiralWorldAt} from './scene.js';
import {shouldStartDescent,spiralDescentRoute} from './descent.js';
import {note,chime,toggleSound} from './audio.js';
import {normalizeJoystick,joystickGridStep} from './joystick.js';
import {normalizeMovementKey,lastHeldStep,stepDuration,advanceStep} from './walk.js';

const $=id=>document.getElementById(id);
const maze=generateMaze();
const diorama=createDiorama($('world'),maze);
let current={...maze.start}, moving=null, route=[],started=false,won=false,autoDescending=false;
let autoRune=null,lastTime=0,lastNotice=0,tipTimeout=null;
const heldMovementKeys=[]; // held state, not single keypress commands
const inspector=createRuneInspector({
 onTurn:(index,direction)=>{
  const result=stepRune(maze,index,direction);
  if(result.changed){
   // A single crisp latch sound on success; no popup gives away the answer.
   if(result.solved)note(980,.10,'triangle',.065);
   else note(direction>0?440:380,.09,'triangle',.018);
   updateUI();
  }
  return result;
 },
 onClose:()=>updateUI(),
});
const vector=(c)=>world(c);
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
function notice(message,seconds=3){
 const elem=$('game-tip');elem.textContent=message;elem.classList.add('show');lastNotice=performance.now();
 clearTimeout(tipTimeout);tipTimeout=setTimeout(()=>elem.classList.remove('show'),seconds*1000);
}
function updateUI(){
 let released=maze.gates.filter(g=>g.open).length;
 $('progress').innerHTML=`${released} / 3 <span>SEALS RELEASED</span>`;
 for (let i=0;i<3;i++) {
  const elem=document.querySelector(`[data-rune="${i}"]`);
  elem.classList.toggle('completed',maze.runes[i].solved);
  elem.querySelector('b').textContent=maze.runes[i].solved?'已解':'未解';
 }
 const near=maze.runes.find(r=>!r.solved&&distance(current,r)<=1);
 const hint=$('hint');
 if (near&&started&&!won){
  $('hint-content').innerHTML=`观察石台旁石碑的刻箭头，按 <strong>E</strong> 旋转符印，将指针对准相同的方位刻度。`;
  hint.classList.add('visible');
 } else {hint.classList.remove('visible');}
}
function startGame(){
 started=true;$('intro').classList.add('hidden');
 note(440,.15);notice('穿过带石面孔的古老拱门。寻找三枚符印，沿螺旋石阶下到井底。',4);
 updateUI();
}
function interact(withIndex=null){
 if(!started||won||autoDescending||inspector.isOpen())return;
 releaseJoystick();
 heldMovementKeys.length=0;
 const available=maze.runes.filter(r=>!r.solved&&distance(current,r)<=1);
 const rune=withIndex===null?available[0]:available.find(r=>r.index===withIndex);
 if(!rune){notice('还没靠近可操作的符印。试着沿岔路寻找石台。');return;}
 // Pause the maze path queue while a single isolated 3D rune is inspected.
 route=[];autoRune=null;
 note(523,.16,'sine',.025);
 inspector.open(rune);
}

function planTo(to){
 if(!started||won||autoDescending||inspector.isOpen())return false;
 if(moving)return false;
 const path=availablePath(maze,current,to);
 if(!path){notice('这条路被石墙封住了。先寻找符印。');return false;}
 route=path.slice(1);autoRune=null;
 return true;
}
// Manual controls are sampled each frame. Every attempted tile is still
// checked against existing gates, walls, and legal adjacent grid links.
function manualDirection(){
 if(joystickPointer!==null)return joystickGridStep(joystickX,joystickY);
 return lastHeldStep(heldMovementKeys);
}
// A floating analogue joystick is active only on touch-size layouts.
// We preserve the original cell-based collision, auto-path and keyboard controls.
const joystickPad=$('joystick');
let joystickPointer=null,joystickX=0,joystickY=0;
function updateJoystickFromPointer(event){
 const rect=joystickPad.getBoundingClientRect();
 const travel=Math.min(48,rect.width*.29);
 const stick=normalizeJoystick(
   event.clientX-rect.left-rect.width/2,
   event.clientY-rect.top-rect.height/2,
   travel
 );
 joystickX=stick.x;joystickY=stick.y;
 joystickPad.style.setProperty('--stick-x',`${(stick.x*travel).toFixed(1)}px`);
 joystickPad.style.setProperty('--stick-y',`${(stick.y*travel).toFixed(1)}px`);
}
function releaseJoystick(event){
 if(joystickPointer===null || (event && event.pointerId!==joystickPointer))return;
 const pointer=joystickPointer;joystickPointer=null;
 joystickX=0;joystickY=0;
 joystickPad.classList.remove('is-active');
 joystickPad.style.setProperty('--stick-x','0px');
 joystickPad.style.setProperty('--stick-y','0px');
 if(joystickPad.hasPointerCapture?.(pointer))joystickPad.releasePointerCapture(pointer);
 // Finish any in-progress step naturally, but don't start another after release.
 if(!autoDescending)route=[];
}
joystickPad.addEventListener('pointerdown',event=>{
 if(joystickPointer!==null||event.button>0||!started||won||autoDescending||inspector.isOpen())return;
 event.preventDefault();
 joystickPointer=event.pointerId;
 joystickPad.setPointerCapture(event.pointerId);
 joystickPad.classList.add('is-active');
 route=[];autoRune=null;updateJoystickFromPointer(event);
});
joystickPad.addEventListener('pointermove',event=>{
 if(event.pointerId!==joystickPointer)return;
 event.preventDefault();updateJoystickFromPointer(event);
});
joystickPad.addEventListener('pointerup',releaseJoystick);
joystickPad.addEventListener('pointercancel',releaseJoystick);
joystickPad.addEventListener('lostpointercapture',releaseJoystick);
function walkToRune(index){
 if(autoDescending)return;
 const rune=maze.runes[index];
 if(rune.solved){notice('这枚符印已经归位。');return;}
 if(distance(current,rune)<=1){interact(index);return;}
 if(planTo(rune)) autoRune=index;
}
function beginAutoDescent(){
 if(!shouldStartDescent(maze,current,autoDescending))return;
 autoDescending=true;
 releaseJoystick();
 heldMovementKeys.length=0;
 route=spiralDescentRoute();
 autoRune=null;
 document.body.classList.add('auto-descending');
 note(370,.18,'sine',.022);
 notice('石阶在脚下延伸，脚步自动走向井底……',3.5);
}
function wonGame(){
 if(won)return;won=true;route=[];moving=null;
 recordChapterComplete(1);
 chime();setTimeout(()=>chime(),320);
 $('victory').classList.remove('hidden');
}
function update(now){
 const dt=window.__pansModalOpen?0:Math.min(.05,lastTime?(now-lastTime)/1000:.016);lastTime=now;
 let distanceMoved=0;
 if(started&&!won&&!inspector.isOpen()){
  // Carry remaining frame time across a tile seam, so long-press movement is
  // one fluid walk rather than repeating stop / ease / restart every tile.
  let timeLeft=dt, iterations=0;
  while(timeLeft>0.000001 && iterations++<8 && !won && !inspector.isOpen()){
   if(!moving){
    beginAutoDescent();
    const input=!autoDescending?manualDirection():null;
    let dest=null;
    if(input){
      route=[];autoRune=null;
      const candidate={x:current.x+input.dx,z:current.z+input.dz};
      if(availablePath(maze,current,candidate)?.length===2)dest=candidate;
    }else if(route.length){
      const candidate=route.shift();
      if(availablePath(maze,current,candidate)?.length===2)dest=candidate;
      else route=[];
    }
    if(!dest)break;
    const spiral=spiralProgress(current)!==undefined||spiralProgress(dest)!==undefined;
    moving={from:{...current},to:{...dest},elapsed:0,duration:stepDuration(spiral)};
    const dx=dest.x-current.x,dz=dest.z-current.z;
    diorama.player.body.rotation.y=Math.atan2(dx,dz);
   }
   const p=advanceStep(moving.elapsed,moving.duration,timeLeft);
   moving.elapsed=p.elapsed;timeLeft=p.remaining;
   const position=diorama.player.body.position,old=position.clone();
   const start=vector(moving.from),end=vector(moving.to);
   const stepA=spiralProgress(moving.from),stepB=spiralProgress(moving.to);
   if(stepA!==undefined&&stepB!==undefined){
     position.copy(spiralWorldAt(stepA+(stepB-stepA)*p.t));
     const tangent=spiralWorldAt(Math.min(.999,stepA+(stepB-stepA)*p.t+.006)).sub(position);
     if(tangent.lengthSq()>.0000001)
       diorama.player.body.rotation.y=Math.atan2(tangent.x,tangent.z);
   }else position.lerpVectors(start,end,p.t);
   position.y+=.13;
   distanceMoved+=position.distanceTo(old);
   if(p.finished){
     current={...moving.to};moving=null;
     beginAutoDescent();
     if(same(current,maze.exit)&&maze.gates.every(g=>g.open))wonGame();
     if(route.length===0&&autoRune!==null&&distance(current,maze.runes[autoRune])<=1){
       const index=autoRune;autoRune=null;interact(index);
     }
     updateUI();
   }
  }
 }
 diorama.draw(now/1000,dt,current,Boolean(moving),distanceMoved);
 inspector.render(now/1000,dt);
 requestAnimationFrame(update);
}
requestAnimationFrame(update);

$('begin').addEventListener('click',startGame);
$('play-again').addEventListener('click',()=>{location.href=campaignChapterUrl(2);});
$('restart').addEventListener('click',()=>location.reload());
$('interact').addEventListener('click',()=>interact());
$('touch-interact').addEventListener('click',()=>interact());
$('sound').addEventListener('click',()=>{const enabled=toggleSound();$('sound').setAttribute('aria-pressed',String(enabled));if(enabled)note(523,.13);});
$('zoom-in').addEventListener('click',()=>diorama.setZoom(diorama.getZoom()+.12));
$('zoom-out').addEventListener('click',()=>diorama.setZoom(diorama.getZoom()-.12));
window.addEventListener('keydown',event=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(event.key))event.preventDefault();
 if(inspector.isOpen()){
  if(['Escape','e','E'].includes(event.key)){event.preventDefault();inspector.close();return;}
  if(event.key==='ArrowLeft'||event.key==='ArrowDown'){
   event.preventDefault();if(!event.repeat)inspector.rotate(-1);return;
  }
  if(event.key==='ArrowRight'||event.key==='ArrowUp'){
   event.preventDefault();if(!event.repeat)inspector.rotate(1);return;
  }
  return;
 }
 if(!started){if(event.key==='Enter')startGame();return;}
 const key=normalizeMovementKey(event.key);
 if(key){
  event.preventDefault();
  if(!won&&!autoDescending){
   if(!heldMovementKeys.includes(key))heldMovementKeys.push(key);
   route=[];autoRune=null;
  }
  return;
 }
 if(event.repeat||won||autoDescending)return;
 if(['e','E',' ','Enter'].includes(event.key))interact();
});
window.addEventListener('keyup',event=>{
 const key=normalizeMovementKey(event.key);
 if(!key)return;
 event.preventDefault();
 const index=heldMovementKeys.indexOf(key);
 if(index!==-1)heldMovementKeys.splice(index,1);
});
function releaseKeyboard(){heldMovementKeys.length=0;}
window.addEventListener('blur',releaseKeyboard);
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){releaseKeyboard();releaseJoystick();}
});
let pointerStart=null;
$('world').addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
$('world').addEventListener('pointerup',event=>{
 if(!started||won||autoDescending||!pointerStart)return;
 if(Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>15){pointerStart=null;return;}
 pointerStart=null;
 const hit=diorama.pick(event.clientX,event.clientY);
 if(!hit)return;
 if(hit.kind==='rune')walkToRune(hit.index);
 if(hit.kind==='tile')planTo({x:hit.x,z:hit.z});
 if(hit.kind==='gate'&&!maze.gates[hit.index].open)notice('古老石墙上的封印没有回应。需要先修复符印。');
});
$('world').addEventListener('wheel',event=>{if(!started||autoDescending)return;event.preventDefault();diorama.setZoom(diorama.getZoom()+(event.deltaY>0?-.06:.06));},{passive:false});
window.addEventListener('resize',()=>{diorama.resize();inspector.resize();});
updateUI();
