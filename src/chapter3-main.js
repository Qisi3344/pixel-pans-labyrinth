import './chapter3-style.css';
import {HALL,TABLE,START,FOOD,DOOR,PLAYER_SPEED,HUNTER_SPEED,AWAKEN_SECONDS,
 newBanquet,walkable,moveActor,distance,eat,atDoor,startDrawing,cancelDrawing,traceChalk,
 tickBanquet,attemptCatch,huntRoute,DOOR_POLYLINE,SEAL_SECONDS,zone} from './chapter3-logic.js';
import {createBanquetScene} from './chapter3-scene.js';
import {note,chime,toggleSound} from './audio.js';
import {CHILD_SHOE_PILE,SHOE_INSPECT_RADIUS,SHOE_MESSAGE} from './chapter3-shoes.js';
import {deathBeat,DEVOUR_DURATION} from './chapter3-devour.js';

document.title='苍白盛宴 | 石之迷宫 · 第三章';
document.body.innerHTML=[
 '<main id="pale-game" class="pale-game">',
  '<canvas id="pale-world" aria-label="可操纵的三维宴会大厅，长桌尽头坐着手掌有眼睛的怪物"></canvas>',
  '<header class="pale-header"><div class="pale-brand"><small>CHAPTER III · THE FORBIDDEN BANQUET</small><h1>苍白盛宴 <em>/ 03</em></h1>',
   '<p>席间的食物，究竟是为谁准备的？</p></div>',
   '<div class="pale-tools"><button id="pale-zoom-out" title="缩小">−</button><button id="pale-zoom-in" title="放大">+</button><button id="pale-sound" title="音效">♫</button><button id="pale-reset" title="重开">↻</button></div></header>',
  '<aside class="pale-side"><small>THE THIRD TRIAL</small><h2 id="pale-objective">穿过古老石廊</h2><p id="pale-description">魔法粉笔门在身后，前方还有一段很长的甬道。</p>',
   '<div class="pale-danger" id="pale-danger"><span></span><div><b>它苏醒了</b><small>别让它靠近，去墙边画出逃生门。</small></div></div>',
   '<div class="pale-timer" id="pale-timer"></div>',
  '</aside>',
  '<div id="pale-tip" class="pale-tip" role="status" aria-live="polite"></div>',
  '<div id="pale-escape-guide" class="pale-escape-guide" aria-live="polite"><strong>← 原路冲回粉笔门</strong><div class="pale-escape-track"><span id="pale-escape-fill"></span></div><small id="pale-escape-distance">沿长廊撤退</small></div>',
  '<div class="pale-bottom"><div>WASD / 方向键移动　·　E 交互　·　鼠标点击地面寻路</div><a href="?stage=2">← 巨树之腹</a></div>',
  '<div class="pale-touch"><div id="pale-pad" class="pale-pad" aria-label="虚拟方向摇杆" role="group"><div id="pale-knob" class="pale-knob"></div></div>',
   '<button id="pale-act" class="pale-act" type="button">✦<small>交互</small></button></div>',
  '<div id="pale-suggest" class="pale-suggest"><span id="pale-suggest-text">✦ 走近长桌，按 E 品尝食物</span><button id="pale-suggest-act" type="button">交互 E</button></div>',
  '<div id="pale-cinematic" class="pale-cinematic" aria-live="polite"></div>',
  '<div id="pale-shoe-clue" class="pale-shoe-clue" role="status" aria-live="polite"><small>环境线索 · 遗失的鞋子</small><p>这些都是小孩的鞋子……</p></div>',
  '<div id="pale-death-vignette" class="pale-death-vignette" aria-hidden="true"></div>',
  '<div id="pale-draw" class="pale-draw hidden"><div class="draw-frame">',
   '<div class="draw-heading"><div><small>CHALK GATE · DOOR</small><strong>画出逃生门</strong><p>从左下角开始，向上、向右、向下连续描画。怪物不会停下。</p></div>',
   '<button id="pale-draw-close" type="button" aria-label="关闭画门操作">×</button></div>',
   '<canvas id="pale-chalk" width="300" height="360" aria-label="拖动画出一扇倒 U 形粉笔门"></canvas>',
   '<div class="draw-meter"><span id="draw-percent">0%</span><span>粉笔描画进度</span></div></div></div>',
  '<section id="pale-intro" class="pale-overlay" role="dialog" aria-modal="true"><div class="pale-card">',
   '<div class="pale-sigil">✦　◈　✦</div><small>CHAPTER III · PALE MAN</small><h2>苍白盛宴</h2>',
   '<p>粉笔门在你身后，古老石廊通向一场盛宴。<br>桌尾的守卫安静地坐着，仿佛早已死去。<br>如果惊醒它，你必须原路逃回来。</p>',
   '<button id="pale-start" class="pale-primary" type="button">踏入石廊 ↗</button><footer>LONG PURSUIT · BANQUET & CHALK ESCAPE</footer>',
  '</div></section>',
  '<section id="pale-death" class="pale-overlay hidden" role="dialog" aria-modal="true"><div class="pale-card">',
   '<div class="pale-sigil death">✧　✧　✧</div><small>YOU WERE SEEN</small><h2>盛宴的最后一道菜</h2>',
   '<p>手掌里的眼睛终于找到了你。<br>黑暗合拢，宴席恢复寂静。</p>',
   '<button id="pale-retry" class="pale-primary" type="button">重新逃跑 ↻</button>',
   '<footer>每次重试都从宴会入口开始</footer></div></section>',
  '<section id="pale-win" class="pale-overlay hidden" role="dialog" aria-modal="true"><div class="pale-card">',
   '<div class="pale-sigil">✧　✦　✧</div><small>CHAPTER III · COMPLETE</small><h2>粉笔划开了黑暗</h2>',
   '<p>你穿过刚刚画出的门。<br>长桌、盛宴与那双眼睛，被留在身后。</p>',
   '<button id="pale-again" class="pale-primary" type="button">再次挑战 ↻</button>',
   '<footer><a href="?stage=1">返回石之迷宫</a></footer></div></section>',
 '</main>'
].join('');

const $=id=>document.getElementById(id);
const state=newBanquet();
const view=createBanquetScene($('pale-world'),state);
let started=false,last=0,currentTime=0,moveDistance=0,navPath=[],navAction=null;
let keyboard=new Set(),joystick=null,stickX=0,stickY=0,tipTimer=null;
let huntPath=[],huntTime=0,lastPhase=state.phase,endingShown=false;
let inspectedShoes=false,shoeClueUntil=0,deathStage='';
// The previewDoor URL is exclusively a QA mode; normal play never pauses the hunter.
const QA_CHALK_PREVIEW=new URLSearchParams(location.search).has('previewDoor');
const QA_RETURN_PREVIEW=new URLSearchParams(location.search).has('previewReturn');
let drawPointer=null,drawPrevious=null;
const movementCodes={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',
 ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'};
const interp=(a,b,t)=>a+(b-a)*t;
function tell(message,duration=3200){
 const n=$('pale-tip');n.textContent=message;n.classList.add('show');
 clearTimeout(tipTimer);tipTimer=setTimeout(()=>n.classList.remove('show'),duration);
}
function allowedMovement(){
 return started&&state.phase!=='awakening'&&
  !['drawing','caught','escape','escaped'].includes(state.phase);
}
function updateHUD(){
 const phase=state.phase;
 const inPassage=zone(state.player)==='passage';
 let title=inPassage?'沿石廊深入宴会厅':'靠近宴会长桌';
 let desc=inPassage?'身后的粉笔门是唯一退路。穿过漫长石廊，前往尽头的盛宴。':
  '桌上堆满葡萄、面包和烤肉；苍白怪守在桌尾。';
 if(phase==='invitation'&&inspectedShoes&&currentTime<shoeClueUntil){
  title='这些都是小孩的鞋子……';
  desc='有鞋带、有搭扣，鞋底磨得很旧。为什么会被丢在宴会厅的角落？';
 }
 if(phase==='awakening'){
  title='它在苏醒';desc='两只掌心的眼睛正缓缓升到额头的位置。';
 }else if(phase==='chase'){
  title=inPassage?'不要停！沿石廊继续跑':'绕开长桌！逃回石廊';
  desc=state.sealed?'粉笔门已经关闭。冲回入口，在怪物到达前重新画开它。':
   '身后的粉笔门正在消失，沿来路跑回原来的入口！';
 }else if(phase==='drawing'){
  title='门已关闭，快画！';desc='从左下角向上、向右、向下描画门框。怪物正在追来。';
 }else if(phase==='caught'){
  title='被苍白怪抓住了';desc='它伸出手把奥菲莉娅提到面前……';
 }else if(phase==='escape'||phase==='escaped'){
  title='粉笔门已开启';desc='甬道尽头的门重新撕开，赶在它伸手之前逃出去。';
 }
 $('pale-objective').textContent=title;
 $('pale-description').textContent=desc;
 $('pale-game').dataset.phase=phase;
 const chased=['chase','drawing','caught'].includes(phase);
 $('pale-danger').classList.toggle('active',chased);
 $('pale-escape-guide').classList.toggle('active',chased);
 const remaining=Math.max(0,Math.ceil(SEAL_SECONDS-state.chaseTime));
 $('pale-timer').textContent=['chase','drawing'].includes(phase)?
   state.sealed?'⌛ 粉笔门已关闭 · 必须重新描画':'⌛ 沙漏：'+remaining+' 秒后入口消失':'';
 const span=Math.abs(FOOD.x-DOOR.x);
 const progress=Math.max(0,Math.min(1,(FOOD.x-state.player.x)/span));
 $('pale-escape-fill').style.width=(progress*100).toFixed(1)+'%';
 $('pale-escape-distance').textContent=
  Math.ceil(distance(state.player,DOOR))+' 米 · '+(inPassage?'直走，出口在前方':'先离开宴会厅');
 const canEat=phase==='invitation'&&distance(state.player,FOOD)<1.55;
 const canDraw=phase==='chase'&&atDoor(state);
 const suggest=phase==='invitation'||canDraw;
 $('pale-suggest').classList.toggle('show',suggest);
 $('pale-suggest-text').textContent=canEat?'✦ 葡萄就在眼前：吃一颗':
  canDraw?'✦ 粉笔门已关闭：快画出新门':
  inPassage?'✦ 沿石廊穿过拱门，去宴会长桌':'✦ 长桌就在前方。走到葡萄果盘';
 $('pale-suggest-act').textContent=canEat?'吃一口 E':canDraw?'画门 E':'前往盛宴 ↗';
 $('pale-act').innerHTML=phase==='drawing'?'✎<small>画门中</small>':
  canEat?'🍇<small>吃一口</small>':canDraw?'✎<small>画门</small>':'✦<small>交互</small>';
}
function start(){
 if(started)return;started=true;$('pale-intro').classList.add('hidden');
 note(392,.25);tell('你从粉笔门进入长甬道。沿石廊向右前方前进，走到尽头的盛宴。',5300);
 updateHUD();
}
function setActionTarget(target,action=null){
 if(!allowedMovement())return;
 const path=huntRoute(state.player,target,.27);
 if(!path.length&&distance(state.player,target)>.55){
  tell('道路被石墙或长桌挡住了。沿着甬道走，或绕过宴会长桌。');return;
 }
 navPath=path;navAction=action;
}
function doEat(){
 if(state.phase!=='invitation')return;
 if(!eat(state)){setActionTarget(FOOD,'eat');tell('走向长桌前的葡萄……');return;}
 navPath=[];navAction=null;keyboard.clear();
 note(560,.2,'sine',.04);
 $('pale-cinematic').classList.add('active');
 $('pale-cinematic').textContent='你吃下了桌上的葡萄。';
 tell('咀嚼的声音在空荡大厅中回响。',2300);
 updateHUD();
}
function beginChalk(){
 if(state.phase==='drawing')return;
 if(!startDrawing(state)){setActionTarget(DOOR,'draw');tell('还没抵达出口！沿宴会厅入口原路返回长石廊，直到尽头的粉笔门。');return;}
 navPath=[];navAction=null;keyboard.clear();
 $('pale-draw').classList.remove('hidden');
 drawPrevious=null;drawPointer=null;
 paintChalk();note(590,.15,'triangle',.035);updateHUD();
}
function interact(){
 if(!started)return;
 if(state.phase==='invitation')doEat();
 else if(state.phase==='chase')beginChalk();
}
function cancelChalk(){
 if(!cancelDrawing(state))return;
 $('pale-draw').classList.add('hidden');
 drawPointer=null;drawPrevious=null;
 tell('粉笔中断了！怪物还在逼近。',1600);updateHUD();
}
function chalkPoint(event){
 const r=$('pale-chalk').getBoundingClientRect();
 return {x:(event.clientX-r.left)/r.width,y:(event.clientY-r.top)/r.height};
}
function chalkSample(a,b){
 const n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/.012));
 for(let j=1;j<=n;j++){
  const t=j/n;
  const ok=traceChalk(state,interp(a.x,b.x,t),interp(a.y,b.y,t));
  if(state.phase==='escape')break;
 }
 paintChalk();
 if(state.phase==='escape'){
  drawPointer=null;drawPrevious=null;
  $('pale-draw').classList.add('hidden');
  keyboard.clear();navPath=[];
  chime();tell('粉笔划开了石墙！逃脱成功。',4000);
  $('pale-cinematic').classList.add('active');
  $('pale-cinematic').textContent='门后的光照亮了石厅。';
  updateHUD();
 }
}
function paintChalk(){
 const canvas=$('pale-chalk'),ctx=canvas.getContext('2d');
 const W=300,H=360;
 ctx.clearRect(0,0,W,H);
 ctx.fillStyle='#2c3335';ctx.fillRect(0,0,W,H);
 // Ancient wall scratches, strictly decorative.
 ctx.strokeStyle='rgba(198,191,159,.09)';ctx.lineWidth=2;
 for(let n=0;n<13;n++){
  ctx.beginPath();ctx.moveTo(10+n*21,0);ctx.lineTo(n*21-14,H);ctx.stroke();
 }
 ctx.lineCap='round';ctx.lineJoin='round';
 ctx.lineWidth=7;ctx.strokeStyle='rgba(231,222,193,.32)';
 ctx.setLineDash([7,13]);ctx.beginPath();
 ctx.moveTo(DOOR_POLYLINE[0].x*W,DOOR_POLYLINE[0].y*H);
 for(const p of DOOR_POLYLINE.slice(1))ctx.lineTo(p.x*W,p.y*H);
 ctx.stroke();ctx.setLineDash([]);
 ctx.lineWidth=10;ctx.shadowBlur=9;ctx.shadowColor='rgba(245,222,156,.50)';
 ctx.strokeStyle='#eee6cf';ctx.beginPath();
 ctx.moveTo(DOOR_POLYLINE[0].x*W,DOOR_POLYLINE[0].y*H);
 const progress=state.doorProgress*3;
 for(let i=0;i<3;i++){
  if(progress<=i)break;
  const a=DOOR_POLYLINE[i],b=DOOR_POLYLINE[i+1],f=Math.min(1,progress-i);
  ctx.lineTo((a.x+(b.x-a.x)*f)*W,(a.y+(b.y-a.y)*f)*H);
 }
 ctx.stroke();ctx.shadowBlur=0;
 const current=DOOR_POLYLINE[Math.min(2,state.doorSegment)];
 const next=DOOR_POLYLINE[Math.min(3,state.doorSegment+1)];
 const t=state.segmentT;
 ctx.beginPath();ctx.arc((current.x+(next.x-current.x)*t)*W,(current.y+(next.y-current.y)*t)*H,10,0,Math.PI*2);
 ctx.fillStyle='#d5b578';ctx.fill();
 $('draw-percent').textContent=Math.floor(state.doorProgress*100)+'%';
}
$('pale-chalk').addEventListener('pointerdown',e=>{
 if(state.phase!=='drawing')return;
 drawPointer=e.pointerId;drawPrevious=chalkPoint(e);
 $('pale-chalk').setPointerCapture(e.pointerId);
 chalkSample(drawPrevious,drawPrevious);
});
$('pale-chalk').addEventListener('pointermove',e=>{
 if(e.pointerId!==drawPointer||state.phase!=='drawing'||!drawPrevious)return;
 const next=chalkPoint(e);chalkSample(drawPrevious,next);drawPrevious=next;
});
function releaseDraw(e){
 if(e.pointerId!==drawPointer)return;
 drawPointer=null;drawPrevious=null;
}
$('pale-chalk').addEventListener('pointerup',releaseDraw);
$('pale-chalk').addEventListener('pointercancel',releaseDraw);
$('pale-draw-close').addEventListener('click',cancelChalk);
$('pale-suggest-act').addEventListener('click',interact);
$('pale-act').addEventListener('click',interact);
$('pale-start').addEventListener('click',start);
$('pale-retry').addEventListener('click',()=>location.replace('?stage=3'));
$('pale-again').addEventListener('click',()=>location.replace('?stage=3'));
$('pale-reset').addEventListener('click',()=>location.replace('?stage=3'));
$('pale-zoom-in').addEventListener('click',()=>view.setZoom(.12));
$('pale-zoom-out').addEventListener('click',()=>view.setZoom(-.12));
$('pale-sound').addEventListener('click',()=>{
 const active=toggleSound();
 $('pale-sound').style.opacity=active?'1':'.4';
});
window.addEventListener('keydown',e=>{
 const k=movementCodes[e.code]||(e.key||'').toLowerCase();
 if(['w','a','s','d',' ','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
 if(!started){if(k==='enter')start();return;}
 if(k==='escape'){cancelChalk();return;}
 if(['e',' ','enter'].includes(k)&&!e.repeat){interact();return;}
 if(['w','a','s','d'].includes(k)&&allowedMovement()){
  const first=!keyboard.has(k);
  keyboard.add(k);navPath=[];navAction=null;
  if(first){
   const dx=(keyboard.has('d')?1:0)-(keyboard.has('a')?1:0);
   const dz=(keyboard.has('s')?1:0)-(keyboard.has('w')?1:0);
   const next=moveActor(state.player,dx,dz,.09,PLAYER_SPEED);
   if(distance(next,state.player)>.00001){
    state.face=Math.atan2(dx,dz);state.player=next;
   }
  }
 }
});
window.addEventListener('keyup',e=>{
 const k=movementCodes[e.code]||(e.key||'').toLowerCase();
 keyboard.delete(k);
});
window.addEventListener('blur',()=>{keyboard.clear();resetPad();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keyboard.clear();resetPad();}});
let pointerStart=null;
$('pale-world').addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};});
$('pale-world').addEventListener('pointerup',e=>{
 if(!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>14){
  pointerStart=null;return;
 }
 pointerStart=null;
 const hit=view.pick(e.clientX,e.clientY);
 if(!hit||!allowedMovement())return;
 if(hit.kind==='food'){setActionTarget(FOOD,'eat');return;}
 if(hit.kind==='door'){setActionTarget(DOOR,'draw');return;}
 if(hit.kind==='floor'&&walkable(hit,.28))setActionTarget(hit);
});
const pad=$('pale-pad');
function resetPad(){joystick=null;stickX=0;stickY=0;$('pale-knob').style.transform='translate(-50%,-50%)';}
function updatePad(e){
 const rect=pad.getBoundingClientRect(),radius=rect.width*.28;
 stickX=Math.max(-1,Math.min(1,(e.clientX-rect.left-rect.width/2)/radius));
 stickY=Math.max(-1,Math.min(1,(e.clientY-rect.top-rect.height/2)/radius));
 const m=Math.max(1,Math.hypot(stickX,stickY));stickX/=m;stickY/=m;
 $('pale-knob').style.transform='translate(-50%,-50%) translate('+(stickX*radius)+'px,'+(stickY*radius)+'px)';
}
pad.addEventListener('pointerdown',e=>{
 if(!allowedMovement()||joystick!==null)return;
 joystick=e.pointerId;pad.setPointerCapture(joystick);
 updatePad(e);navPath=[];navAction=null;
});
pad.addEventListener('pointermove',e=>{if(e.pointerId===joystick)updatePad(e);});
pad.addEventListener('pointerup',e=>{if(e.pointerId===joystick)resetPad();});
pad.addEventListener('pointercancel',e=>{if(e.pointerId===joystick)resetPad();});
pad.addEventListener('lostpointercapture',()=>resetPad());
function drivePlayer(dt){
 if(!allowedMovement())return 0;
 let dx=stickX+(keyboard.has('d')?1:0)-(keyboard.has('a')?1:0);
 let dz=stickY+(keyboard.has('s')?1:0)-(keyboard.has('w')?1:0);
 if(Math.hypot(dx,dz)<.15&&navPath.length){
  while(navPath.length&&distance(state.player,navPath[0])<.28)navPath.shift();
  if(navPath.length){
   dx=navPath[0].x-state.player.x;dz=navPath[0].z-state.player.z;
  }
 }
 const before=state.player;
 const next=moveActor(before,dx,dz,dt,PLAYER_SPEED,.25);
 const moved=distance(before,next);
 if(moved>.00001){
  state.face=Math.atan2(dx,dz);state.player=next;
 }
 if(!navPath.length&&navAction){
  const action=navAction;navAction=null;
  if(action==='eat'&&distance(state.player,FOOD)<1.55)doEat();
  if(action==='draw'&&atDoor(state))beginChalk();
 }
 return moved;
}
function driveHunter(dt){
 // QA-only long-passage visual inspection does not immediately end in death.
 // Normal play still keeps pursuit, catching and drawing hazards intact.
 if(QA_RETURN_PREVIEW&&state.phase==='chase')return;
 if(QA_CHALK_PREVIEW&&state.phase==='drawing')return;
 if(!['chase','drawing'].includes(state.phase))return;
 huntTime-=dt;
 if(huntTime<=0||!huntPath.length){
  huntPath=huntRoute(state.monster,state.player,.28);
  huntTime=.26;
 }
 if(huntPath.length){
  while(huntPath.length&&distance(state.monster,huntPath[0])<.27)huntPath.shift();
  if(huntPath.length){
   const dest=huntPath[0];
   const speed=HUNTER_SPEED*(state.phase==='drawing'?.90:1);
   const next=moveActor(state.monster,dest.x-state.monster.x,dest.z-state.monster.z,dt,speed,.28);
   if(distance(next,state.monster)<.0003)huntTime=0;
   state.monster=next;
  }
 }
 if(attemptCatch(state)){
  deathStage='';keyboard.clear();navPath=[];resetPad();
  $('pale-draw').classList.add('hidden');
  $('pale-cinematic').classList.add('active');
  $('pale-cinematic').textContent='苍白的手抓住了她。';
  note(115,.45,'sawtooth',.04);updateHUD();
 }
}
function updateTransition(){
 if(state.phase!==lastPhase){
  lastPhase=state.phase;updateHUD();
  if(lastPhase==='chase'){
   $('pale-cinematic').classList.remove('active');
   tell('快跑！先绕过长桌，再穿过整条石廊，跑回最初的粉笔门！',4400);
   note(180,.36,'sawtooth',.027);
  }
  if(lastPhase==='awakening')updateHUD();
 }
}
function frame(now){
 const dt=Math.min(.08,last?(now-last)/1000:.016);last=now;
 currentTime=now/1000;
 moveDistance=started?drivePlayer(dt):0;
 // Environment discovery happens through walking, not by inspecting a menu.
 if(started&&!inspectedShoes&&state.phase==='invitation'&&
    distance(state.player,CHILD_SHOE_PILE)<SHOE_INSPECT_RADIUS){
  inspectedShoes=true;shoeClueUntil=currentTime+6.0;
  $('pale-shoe-clue').classList.add('visible');
  tell(SHOE_MESSAGE,5700);
  note(215,.26,'triangle',.026);
  updateHUD();
 }
 if(inspectedShoes&&currentTime>shoeClueUntil){
  $('pale-shoe-clue').classList.remove('visible');
 }
 if(started)tickBanquet(state,dt);
 if(started)driveHunter(dt);
 updateTransition();
 if(state.phase==='awakening'){
  const t=state.awakeTime;
  $('pale-cinematic').textContent=t<1.15?'盛宴突然安静了。':
   t<2.25?'它缓缓抬起双手……':'眼睛在手掌里睁开。';
 }
 if(state.phase==='caught'){
  const beat=deathBeat(state.deathTime);
  $('pale-death-vignette').style.opacity=String(beat.fade);
  if(beat.stage!==deathStage){
   deathStage=beat.stage;
   $('pale-cinematic').textContent={
    grab:'它伸出双手，攥住了奥菲莉娅。',
    lift:'苍白怪把她提到面前。',
    bite:'那张没有眼睛的脸，张开了嘴。',
    gulp:'牙齿合拢，剩下的声音被吞没。',
    fade:'盛宴恢复了死一般的寂静。'
   }[deathStage];
   if(deathStage==='bite')note(94,.32,'sawtooth',.08);
   if(deathStage==='gulp')note(72,.30,'triangle',.07);
  }
  if(beat.completed&&!endingShown){
   endingShown=true;$('pale-death').classList.remove('hidden');
  }
 }else{
  $('pale-death-vignette').style.opacity='0';
 }
 if(state.phase==='escape'&&state.winTime>1.50&&!endingShown){
  endingShown=true;state.phase='escaped';
  $('pale-win').classList.remove('hidden');chime();
 }
 if(started&&Math.floor(now/240)!==Math.floor((now-dt*1000)/240))updateHUD();
 view.draw(currentTime,dt,moveDistance);
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Explicit reproducible QA links: never require a tester to fake a whole run.
const params=new URLSearchParams(location.search);
if(params.has('previewChase')){
 start();state.player={...FOOD};eat(state);state.awakeTime=AWAKEN_SECONDS-.025;
}
if(params.has('previewReturn')){
 start();state.player={x:-12.6,z:.1};state.phase='chase';state.eaten=true;
 state.sealed=true;state.monster={x:-8.3,z:.1};
}
if(params.has('previewDoor')){
 start();state.player={...DOOR};state.phase='chase';state.monster={x:6.7,z:2.5};
 beginChalk();
}
if(params.has('previewShoes')){
 start();state.player={x:CHILD_SHOE_PILE.x-1.09,z:CHILD_SHOE_PILE.z+.08};
 updateHUD();
}
if(params.has('previewDevour')){
 start();state.player={x:6.49,z:.76};state.monster={x:6.78,z:.12};
 state.phase='caught';state.deathTime=0;state.eaten=true;
 updateHUD();
}
