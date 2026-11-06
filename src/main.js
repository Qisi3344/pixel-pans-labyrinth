import './style.css';
import {generateMaze,availablePath,same,CELL,SYMBOLS} from './maze.js';
import {stepRune} from './rune-turn.js';
import {createRuneInspector} from './rune-inspector.js';
import {createDiorama,world,spiralProgress,spiralWorldAt} from './scene.js';
import {shouldStartDescent,spiralDescentRoute} from './descent.js';
import {note,chime,toggleSound} from './audio.js';

const $=id=>document.getElementById(id);
const maze=generateMaze();
const diorama=createDiorama($('world'),maze);
let current={...maze.start}, moving=null, route=[],started=false,won=false,autoDescending=false;
let autoRune=null,lastTime=0,lastNotice=0,tipTimeout=null;
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
  $('hint-content').innerHTML=`石碑刻痕 <strong style="font-size:1.4em;color:#6b9680">${SYMBOLS[near.target]}</strong> · 旋转指针与石碑箭头一致，按 <strong>E</strong> 查看符印。`;
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
function moveTo(dx,dz){
 if(!started||won||moving||autoDescending||inspector.isOpen())return;
 const to={x:current.x+dx,z:current.z+dz};
 autoRune=null;route=[];
 const path=availablePath(maze,current,to);
 if(path&&path.length===2){route=[to];}
 else note(160,.06,'square',.009);
}
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
 route=spiralDescentRoute();
 autoRune=null;
 document.body.classList.add('auto-descending');
 note(370,.18,'sine',.022);
 notice('石阶在脚下延伸，脚步自动走向井底……',3.5);
}
function wonGame(){
 if(won)return;won=true;route=[];moving=null;
 chime();setTimeout(()=>chime(),320);
 $('victory').classList.remove('hidden');
}
function update(now){
 const dt=Math.min(.05,lastTime?(now-lastTime)/1000:.016);lastTime=now;
 if(started&&!won&&!inspector.isOpen()){
  if(!moving)beginAutoDescent();
  if(!moving&&route.length){
   const dest=route.shift();
   if(availablePath(maze,current,dest)){
    moving={from:{...current},to:dest,elapsed:0,
      duration:(spiralProgress(current)!==undefined || spiralProgress(dest)!==undefined) ? .64 : .18};
    const dx=dest.x-current.x,dz=dest.z-current.z;
    diorama.player.body.rotation.y=Math.atan2(dx,dz);
   } else route=[];
  }
  if(moving){
   moving.elapsed+=dt;
   const t=Math.min(1,moving.elapsed/moving.duration),e=t*t*(3-2*t);
   const a=vector(moving.from),b=vector(moving.to);
   const stepA=spiralProgress(moving.from),stepB=spiralProgress(moving.to);
   if(stepA!==undefined&&stepB!==undefined){
     diorama.player.body.position.copy(spiralWorldAt(stepA+(stepB-stepA)*e));
     const tangent=spiralWorldAt(Math.min(.999,stepA+(stepB-stepA)*e+.008))
       .sub(diorama.player.body.position);
     diorama.player.body.rotation.y=Math.atan2(tangent.x,tangent.z);
   }else diorama.player.body.position.lerpVectors(a,b,e);
   diorama.player.body.position.y+=.13+Math.sin(Math.PI*t)*.075;
   if(t>=1){
    current={...moving.to};moving=null;
    beginAutoDescent();
    if(same(current,maze.exit)&&maze.gates.every(g=>g.open)){wonGame();}
    if(route.length===0&&autoRune!==null&&distance(current,maze.runes[autoRune])<=1){const index=autoRune;autoRune=null;interact(index);}
    updateUI();
   }
  }
 }
 diorama.draw(now/1000,dt,current,Boolean(moving));
 inspector.render(now/1000,dt);
 requestAnimationFrame(update);
}
requestAnimationFrame(update);

$('begin').addEventListener('click',startGame);
$('play-again').addEventListener('click',()=>location.reload());
$('restart').addEventListener('click',()=>location.reload());
$('interact').addEventListener('click',()=>interact());
$('touch-interact').addEventListener('click',()=>interact());
$('sound').addEventListener('click',()=>{const enabled=toggleSound();$('sound').setAttribute('aria-pressed',String(enabled));if(enabled)note(523,.13);});
$('zoom-in').addEventListener('click',()=>diorama.setZoom(diorama.getZoom()+.12));
$('zoom-out').addEventListener('click',()=>diorama.setZoom(diorama.getZoom()-.12));
for(const button of document.querySelectorAll('[data-move]')){
 button.addEventListener('click',()=>{const [dx,dz]=button.dataset.move.split(',').map(Number);moveTo(dx,dz);});
}
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
  return; // Never move the maze character or re-open a rune while focused.
 }
 if(!started){if(event.key==='Enter')startGame();return;}
 if(autoDescending)return;
 if(event.repeat||won)return;
 const keys={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};
 if(keys[event.key])moveTo(...keys[event.key]);
 if(['e','E',' ','Enter'].includes(event.key))interact();
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
