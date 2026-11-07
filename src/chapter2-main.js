import './chapter2-style.css';
import {NODES,STONE_NODES,TOAD_NODE,newChapter,step,interact,findPath,nextDirection,rootOpen,edgeAccessible} from './chapter2-logic.js';
import {createTreeScene} from './chapter2-scene.js';
import {note,chime,toggleSound} from './audio.js';
import {nearEntrance,stepOnEarth,directionTo,distance2d} from './chapter2-overworld.js';

document.title='巨树之腹 | 石之迷宫 · 第二章';
document.body.innerHTML=`
<main class="root-game" id="root-game">
  <canvas id="root-world" aria-label="巨树与地下洞穴，等距视角三维互动场景"></canvas>
  <header class="root-head"><div><small>CHAPTER II · THE HOLLOW ROOTS</small><h1>巨树之腹 <span>/ 02</span></h1><p>三枚魔石，垂死的古树，吞噬一切的地下生物。</p></div>
   <div class="root-tools"><button id="root-less" aria-label="缩小">−</button><button id="root-more" aria-label="放大">+</button><button id="root-sound" aria-label="切换音效">♫</button><button id="root-reset" aria-label="重新开始">↻</button></div>
  </header>
  <aside class="root-inventory"><div class="root-label">INVENTORY</div>
    <div class="stone-row" id="root-stones"><span>◇ 苔绿魔石</span><span>◇ 紫晶魔石</span><span>◇ 琥珀魔石</span></div>
    <div class="root-meter"><span>已献祭魔石</span><b id="root-offerings">0 / 3</b></div>
    <div class="root-status" id="root-status">循着树根，寻找第一颗魔石。</div>
  </aside>
  <div class="root-tip" id="root-tip" role="status" aria-live="polite">点击石道上的节点，或使用方向键探索。</div>
  <section class="root-bottom"><div class="root-keys">WASD / 方向键 移动　·　E 交互　·　点击石道自动行走</div><a href="?stage=1" class="root-back">← 第一章</a></section>
  <div class="root-touch"><div id="root-pad" class="root-pad" role="group" aria-label="拖动虚拟摇杆移动"><div class="root-knob" id="root-knob"></div></div><button id="root-act" class="root-act" type="button">✦<small>交互</small></button></div>
  <div class="root-overlay" id="root-intro" role="dialog" aria-modal="true"><div class="root-card"><div class="root-orn">✦　✧　✦</div><small>CHAPTER II · BENEATH THE ANCIENT FIG</small><h2>巨树之腹</h2><p>石井的尽头，长着一棵正在死去的树。<br/>地下深处有三颗魔石，<br/>还有一个饥饿的守护者。</p><button id="root-start" type="button">探索巨树 ↗</button><footer>3D PIXEL DIORAMA · CUTAWAY ROOT WORLD</footer></div></div>
  <div class="root-overlay hidden" id="root-win" role="dialog" aria-modal="true"><div class="root-card"><div class="root-orn">✦　✦　✦</div><small>THE HEART BEATS AGAIN</small><h2>枯树复苏</h2><p>三颗魔石消失在巨蟾蜍的腹中。<br/>金色钥匙从黑暗里浮现。<br/>树根深处，第一次有了春天。</p><button id="root-repeat" type="button">再次探索 ↻</button><footer><a href="?stage=1">返回第一章</a></footer></div></div>
</main>`;
const $=id=>document.getElementById(id);
const state=newChapter(),view=createTreeScene($('root-world'),state);
let started=false,active=null,queue=[],last=0,lastMove=0,tipTimer=null;
let keyboard=new Set(),pointer=null,stickX=0,stickY=0,elapsed=0;
let outside=true,exteriorGoal=null;
const physicalKey={
 KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',
 ArrowUp:'arrowup',ArrowLeft:'arrowleft',ArrowDown:'arrowdown',ArrowRight:'arrowright',
 KeyE:'e',Enter:'enter',Space:' '
};
function normalizedKey(event){
 return physicalKey[event.code] || (event.key||'').toLowerCase();
}
function exteriorAxis(){
 let dx=stickX,dz=stickY;
 if(keyboard.has('w')||keyboard.has('arrowup'))dz=-1;
 if(keyboard.has('s')||keyboard.has('arrowdown'))dz=1;
 if(keyboard.has('a')||keyboard.has('arrowleft'))dx=-1;
 if(keyboard.has('d')||keyboard.has('arrowright'))dx=1;
 return {dx,dz};
}
function applyExteriorMovement(dx,dz,seconds){
 const hero=view.player.position;
 const startX=hero.x,startZ=hero.z;
 const next=stepOnEarth(hero,dx,dz,seconds,view.exterior.walkable);
 hero.set(next.x,view.exterior.height(next.x,next.z)+.035,next.z);
 const moved=Math.hypot(hero.x-startX,hero.z-startZ);
 if(moved>.0001)view.player.rotation.y=Math.atan2(dx,dz);
 return moved;
}
$('root-game').classList.add('is-forest');
const point=n=>view.pos(n);
function tip(message,delay=3200){
 const el=$('root-tip');el.textContent=message;el.classList.add('show');
 clearTimeout(tipTimer);tipTimer=setTimeout(()=>el.classList.remove('show'),delay);
}
function drawHUD(){
 if(outside){
  $('root-status').textContent='黑暗的裂口藏在巨树根部。走近树洞，按 E 进入，或直接点击洞口。';
  return;
 }
 document.querySelectorAll('#root-stones span').forEach((element,i)=>{
  element.classList.toggle('got',state.stones[i]);
  element.textContent=(state.stones[i]?'◆ ':'◇ ')+['苔绿魔石','紫晶魔石','琥珀魔石'][i];
 });
 $('root-offerings').textContent=state.offerings+' / 3';
 const node=state.node;
 let status='沿着地下根脉探索，寻找魔石。';
 if(STONE_NODES.some((n,i)=>n===node&&!state.stones[i])) status='魔石就在这里。按 E 拾取。';
 else if(node===8&&!state.boulderMoved)status='沉重的石块堵住了前路。按 E 推动。';
 else if(node===10)status='面对蟾蜍。集齐魔石后按 E 一颗颗投喂。';
 else if(node===4&&!rootOpen(state.time))status='树根收缩！等待它舒展开，再向前穿过。';
 else if(node===10&&state.stones.every(Boolean))status='按 E 将三颗魔石送进蟾蜍的嘴里。';
 $('root-status').textContent=status;
}
function enterTree(){
 if(!outside)return;
 outside=false;exteriorGoal=null;keyboard.clear();
 if(pointer!==null)release();
 view.setArea('interior');$('root-game').classList.remove('is-forest');
 note(360,.27,'triangle',.028);
 tip('奥菲莉娅俯身钻入树洞。地底盘绕着会收缩的根须……',5000);
 drawHUD();
}
function action(){
 if(!started||active||state.won)return;
 if(outside){
  if(nearEntrance(view.player.position,view.exterior.entrance))enterTree();
  else tip('先走到树干中间的黑色洞口。点击洞口也能自动走过去。',3400);
  return;
 }
 const result=interact(state);
 switch(result.type){
  case 'stone':note(660,.19,'triangle',.042);tip('获得第 '+(result.index+1)+' 颗魔石。它在掌心微微发光。');break;
  case 'boulder':note(186,.35,'sawtooth',.018);tip('石块被推向侧面。通往树心的路打开了。');break;
  case 'need-stones':note(170,.15,'triangle',.02);tip('巨蟾蜍等待着三颗魔石。还差 '+result.remaining+' 颗。');break;
  case 'offering':note(330,.19,'sine',.035);tip('蟾蜍吞下魔石。还要再喂 '+(3-result.count)+' 颗。');break;
  case 'victory':chime();tip('金色钥匙出现了！巨树正在苏醒。',5500);setTimeout(()=>$('root-win').classList.remove('hidden'),1400);break;
  default:tip('这里没有可操作的东西。去探索另一处根脉。');
 }
 drawHUD();
}
function follow(destination){
 if(outside||!started||state.won||active)return;
 const path=findPath(state,state.node,destination);
 if(!path){tip('这段根脉还不能通行。观察收缩的树根或搬动石块。');return;}
 queue=path.slice(1);
}
function tryMove(to){
 if(to===null||active||state.won)return;
 if(!edgeAccessible(state,state.node,to))return;
 queue=[];active={from:state.node,to,progress:0};
}
function direction(){
 const keys=[...keyboard];let dx=stickX,dz=stickY;
 if(keys.includes('w')||keys.includes('arrowup'))dz=-1;
 if(keys.includes('s')||keys.includes('arrowdown'))dz=1;
 if(keys.includes('a')||keys.includes('arrowleft'))dx=-1;
 if(keys.includes('d')||keys.includes('arrowright'))dx=1;
 if(Math.hypot(dx,dz)<.3)return null;
 const length=Math.hypot(dx,dz);return nextDirection(state,dx/length,dz/length);
}
function begin(){started=true;$('root-intro').classList.add('hidden');note(440,.17);tip('沿着枯木、青苔和盘根前进，找到树干中央的洞口。',5000);}
$('root-start').addEventListener('click',begin);
$('root-repeat').addEventListener('click',()=>location.reload());
$('root-reset').addEventListener('click',()=>location.reload());
$('root-more').addEventListener('click',()=>view.setZoom(1.22));
$('root-less').addEventListener('click',()=>view.setZoom(.84));
$('root-act').addEventListener('click',action);
$('root-sound').addEventListener('click',()=>{const on=toggleSound();$('root-sound').style.opacity=on?'1':'.4';});
const pad=$('root-pad');
function padMove(event){
 const rect=pad.getBoundingClientRect(),range=rect.width*.28;
 stickX=Math.max(-1,Math.min(1,(event.clientX-rect.left-rect.width/2)/range));
 stickY=Math.max(-1,Math.min(1,(event.clientY-rect.top-rect.height/2)/range));
 const l=Math.max(1,Math.hypot(stickX,stickY));stickX/=l;stickY/=l;
 $('root-knob').style.transform='translate(-50%,-50%) translate('+stickX*range+'px,'+stickY*range+'px)';
}
function release(event){
 if(pointer===null||(event&&event.pointerId!==pointer))return;
 pointer=null;stickX=0;stickY=0;$('root-knob').style.transform='translate(-50%,-50%)';
}
pad.addEventListener('pointerdown',event=>{if(!started||pointer!==null)return;pointer=event.pointerId;pad.setPointerCapture(pointer);padMove(event);queue=[];exteriorGoal=null;});
pad.addEventListener('pointermove',event=>{if(event.pointerId===pointer)padMove(event);});
pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);
pad.addEventListener('lostpointercapture',release);
window.addEventListener('keydown',event=>{
 const k=normalizedKey(event);
 const movement=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
 if([...movement,' '].includes(k))event.preventDefault();
 if(!started){if(k==='enter')begin();return;}
 if(movement.includes(k)){
  const firstPress=!keyboard.has(k);
  keyboard.add(k);queue=[];exteriorGoal=null;
  // Frame-only polling can miss quick keyboard taps, especially on a slow
  // mobile GPU. Give each real key-down a visible first step immediately.
  if(outside&&firstPress){
   const axis=exteriorAxis();
   const moved=applyExteriorMovement(axis.dx,axis.dz,.145);
   if(moved<.005)tip('前方是树根或地形边缘，换个方向试试。',1650);
  }
 } else if(['e',' ','enter'].includes(k)&&!event.repeat)action();
});
window.addEventListener('keyup',event=>keyboard.delete(normalizedKey(event)));
window.addEventListener('blur',()=>{keyboard.clear();release();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keyboard.clear();release();}});
let tap=null;
$('root-world').addEventListener('pointerdown',event=>tap={x:event.clientX,y:event.clientY});
$('root-world').addEventListener('pointerup',event=>{
 if(!tap||Math.hypot(tap.x-event.clientX,tap.y-event.clientY)>16){tap=null;return;}
 tap=null;
 const hit=view.pick(event.clientX,event.clientY);
 if(!hit)return;
 if(outside){
  if(hit.kind==='entrance'){
   exteriorGoal={...view.exterior.entrance};tip('奥菲莉娅正在走向树洞……',2200);
  } else if(hit.kind==='ground'&&view.exterior.walkable(hit.x,hit.z)){
   exteriorGoal={x:hit.x,z:hit.z};
  }
  return;
 }
 if(hit.kind==='node')follow(hit.index);
 if(hit.kind==='stone')follow(STONE_NODES[hit.index]);
 if(hit.kind==='toad')follow(TOAD_NODE);
});
$('root-world').addEventListener('wheel',event=>{event.preventDefault();view.setZoom(event.deltaY>0?.88:1.16);},{passive:false});
window.addEventListener('resize',view.resize);
function frame(now){
 const dt=Math.min(.10,last?(now-last)/1000:.016);last=now;
 let distance=0;
 if(started&&!state.won){
  if(outside){
   const hero=view.player.position;
   let {dx,dz}=exteriorAxis();
   if(Math.hypot(dx,dz)<.18&&exteriorGoal){
    const dir=directionTo(hero,exteriorGoal);dx=dir.x;dz=dir.z;
   }
   distance=applyExteriorMovement(dx,dz,dt);
   if(exteriorGoal&&distance2d(hero,exteriorGoal)<.38){
    const goalIsDoor=distance2d(exteriorGoal,view.exterior.entrance)<.20;
    exteriorGoal=null;
    if(goalIsDoor&&nearEntrance(hero,view.exterior.entrance))enterTree();
   }
  } else {
   state.time+=dt;
   if(!active&&queue.length){
    const n=queue[0];
    if(edgeAccessible(state,state.node,n))active={from:state.node,to:queue.shift(),progress:0};
   }
   if(!active&&!queue.length&&now-lastMove>235){
    const n=direction();
    if(n!==null)active={from:state.node,to:n,progress:0};
   }
   if(active){
    const prev=view.player.position.clone();
    active.progress=Math.min(1,active.progress+dt/0.43);
    const a=point(active.from),b=point(active.to),t=active.progress;
    const smooth=t*t*(3-2*t);
    view.player.position.lerpVectors(a,b,smooth);
    view.player.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);
    distance=view.player.position.distanceTo(prev);
    if(t>=1){
     step(state,active.to);active=null;lastMove=now;drawHUD();
     if(state.node===TOAD_NODE)tip('巨蟾蜍就在面前。按 E 与它互动。',2500);
    }
   }
  }
 }
 view.draw(now/1000,dt,distance);
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
drawHUD();
