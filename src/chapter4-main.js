import './chapter4-style.css';
import {newFinalTrial,updateFinalTrial,moveFinalPlayer,walkableFinal,
 nearFaun,decideFinal,FINAL_ALTAR,CHAPTER4_TIME_LIMIT,FINAL_OUTCOMES,
 finalClockLabel,distance} from './chapter4-logic.js';
import {createFinalScene} from './chapter4-scene.js';
import {activeRoyalDialogue} from './chapter4-royal-dialogue.js';
import {recordFinalOutcome,loadCampaign,campaignChapterUrl,CAMPAIGN_FINAL} from './campaign.js';

document.title='最终试炼 · 石井之血 | 潘神的迷宫';
document.body.innerHTML=`
 <main class="final-game" id="final-game">
  <canvas id="final-world" aria-label="固定正交等距视角：夜色石迷宫、中央石井、抱着弟弟的奥菲莉娅和潘神"></canvas>
  <header class="final-header"><div class="final-eyebrow">FINAL TRIAL · THE BLOOD OF INNOCENCE</div>
   <h1>最后的石井 <small>/ 04</small></h1>
   <p>她把弟弟抱在怀里。远处，军靴正在逼近。</p>
  </header>
  <div class="final-right">
   <div class="final-tools" aria-label="游戏设置">
    <button type="button" id="final-sound" title="开启或关闭音效">♫</button>
   </div>
   <div class="final-clock" id="final-clock" role="timer" aria-live="off">
    <div class="final-clock-top"><small>维达尔正在赶来</small><strong id="final-clock-numbers">01:02</strong></div>
    <div class="final-clock-bar"><div class="final-clock-fill" id="final-clock-fill"></div></div>
   </div>
  </div>
  <div class="final-message hidden" id="final-message" role="status"></div>
  <div class="final-guide" id="final-guide">
   <span id="final-guide-text">石井在迷宫的中央。潘神正在等你。</span>
   <button id="final-guide-action" type="button">前往石井 ↗</button>
  </div>
  <section class="final-choice hidden" id="final-choice" aria-label="终极试炼的选择">
   <small>THE THIRD TASK · 最后的考验</small>
   <h2>只要一滴无辜之血</h2>
   <p>潘神举起从宴会厅取来的匕首。弟弟在你怀里动了一下。石井下方，仿佛有什么东西正在等待。</p>
   <button id="final-offering" class="final-offering" type="button">
    <span>✢</span><span><strong>献出弟弟的血</strong><small>架空结局 · 用无辜换一扇回家的门</small></span>
   </button>
   <button id="final-mercy" class="final-mercy" type="button">
    <span>✧</span><span><strong>拒绝献祭，保护弟弟</strong><small>原片路线 · 不拿无辜之血交换王座</small></span>
   </button>
   <div class="final-choice-warning">⚑ 倒计时不会停下。维达尔随时会追上来。</div>
  </section>
  <div class="final-touch" id="final-touch">
   <div class="final-joystick" id="final-joystick" role="group" aria-label="触屏移动摇杆">
    <div class="final-stick" id="final-stick"></div></div>
   <button type="button" id="final-touch-action" aria-label="前往石井或观察">交互</button>
  </div>
  <div class="final-gun-flash" id="final-gun-flash"></div>
  <!-- The royal family now speaks in-character above their world-space heads. -->
  <div id="final-father-bubble" class="final-royal-bubble hidden" data-speaker="father"
       role="status" aria-live="polite">
   <div class="royal-bubble-label">✧ 父王</div>
   <p id="final-father-words"></p>
  </div>
  <div id="final-mother-bubble" class="final-royal-bubble hidden" data-speaker="mother"
       role="status" aria-live="polite">
   <div class="royal-bubble-label">✧ 母后</div>
   <p id="final-mother-words"></p>
  </div>
  <div class="final-overlay" id="final-start">
   <div class="final-card"><div class="symbol">✧</div>
    <small>CHAPTER IV · THE LAST TEST</small><h2>最后的血</h2>
    <p>金钥匙已经转动，匕首已经带回。<br>
    奥菲莉娅抱着刚出生的弟弟，奔向古老石井。<br>
    潘神在那里等候，而维达尔上尉也正在追赶。<br><br>
    一项最后的请求，将决定两条截然不同的归途。</p>
    <button class="main-button" id="final-begin" type="button">抱紧弟弟，进入迷宫 ↗</button>
   </div>
  </div>
  <div class="final-overlay final-result hidden" id="final-result" role="dialog" aria-modal="true"
       aria-labelledby="final-result-title" data-ending="">
   <div class="final-card">
    <div class="symbol" id="final-result-symbol">✧</div>
    <small id="final-result-label">ENDING · THE ROYAL COURT</small>
    <h2 id="final-result-title">最后的试炼</h2>
    <p id="final-result-banner"></p>
    <div class="final-royal-words" id="final-result-speech"></div>
    <p class="final-text" id="final-result-text"></p>
    <div class="ending-count" id="final-ending-count"></div>
    <div class="final-actions">
     <button class="main-button" id="final-epilogue" type="button">查看最终结算 ↗</button>
     <button class="secondary-button" id="final-retry" type="button">重选另一条路 ↻</button>
    </div>
    <button class="secondary-button" id="final-home" type="button">返回章节目录</button>
   </div>
  </div>
 </main>`;

const $=id=>document.getElementById(id),params=new URLSearchParams(window.location.search);
const state=newFinalTrial(),view=createFinalScene($('final-world'),state);
const keyboard=new Set();
let started=false,lastTime=0,elapsed=0,moveTo=null,pad={x:0,z:0},padPointer=null;
let lastNote='',resultShown=false,selectedEnding=null,sound=true;
let cachedPhase='',screenUpdate=0,royalBubbleKey='',royalPreviouslyShown=false;
const CANVAS=$('final-world');
const toMenu=()=>{location.href='?screen=menu';};
const showMessage=t=>{
 if(!t){$('final-message').classList.add('hidden');return;}
 if(t!==lastNote){lastNote=t;$('final-message').textContent=t;}
 $('final-message').classList.remove('hidden');
};
const goAltar=()=>{
 if(!started||!['approach','decision'].includes(state.phase))return;
 moveTo={...FINAL_ALTAR};
 if(nearFaun(state))$('final-offering').focus({preventScroll:true});
};
function tone(freq=430,duration=.18,type='sine'){
 if(!sound)return;
 try{
  const ctx=tone.ctx||(tone.ctx=new (window.AudioContext||window.webkitAudioContext)());
  if(ctx.state==='suspended')ctx.resume();
  const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime;
  osc.type=type;osc.frequency.setValueAtTime(freq,at);
  gain.gain.setValueAtTime(.0001,at);
  gain.gain.exponentialRampToValueAtTime(.065,at+.018);
  gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(gain);gain.connect(ctx.destination);
  osc.start(at);osc.stop(at+duration+.01);
 }catch{}
}
function choose(choice){
 if(!started||!decideFinal(state,choice))return;
 selectedEnding=choice;keyboard.clear();pad={x:0,z:0};moveTo=null;
 $('final-choice').classList.add('hidden');
 $('final-guide').classList.add('hidden');
 tone(choice==='mercy'?390:270,.42,'triangle');
 showMessage(choice==='mercy'
  ?'奥菲莉娅把弟弟护在怀里。她拒绝了潘神。'
  :'匕首悬在井口上方。一滴无辜之血，换一扇归家的门。');
}
$('final-offering').addEventListener('click',()=>choose('offering'));
$('final-mercy').addEventListener('click',()=>choose('mercy'));
$('final-guide-action').addEventListener('click',goAltar);
$('final-touch-action').addEventListener('click',()=>{
 if(state.phase==='decision')$('final-offering').focus({preventScroll:true});
 else goAltar();
});
$('final-sound').addEventListener('click',()=>{
 sound=!sound;$('final-sound').setAttribute('aria-pressed',String(sound));
 $('final-sound').textContent=sound?'♫':'♪';
});
$('final-epilogue').addEventListener('click',()=>{location.href=CAMPAIGN_FINAL;});
$('final-retry').addEventListener('click',()=>{location.href=campaignChapterUrl(4);});
$('final-home').addEventListener('click',toMenu);
function start(){
 if(started)return;started=true;
 $('final-start').classList.add('hidden');
 showMessage('潘神等在石井旁。别忘记你抱着的是谁。');
 tone(460,.20,'triangle');
}
$('final-begin').addEventListener('click',start);
function movement(dt){
 if(!['approach','decision'].includes(state.phase)||window.__pansModalOpen)return;
 let x=pad.x,z=pad.z;
 const held=k=>keyboard.has(k);
 if(held('a')||held('arrowleft'))x-=1;
 if(held('d')||held('arrowright'))x+=1;
 if(held('w')||held('arrowup'))z-=1;
 if(held('s')||held('arrowdown'))z+=1;
 if(Math.hypot(x,z)>.08)moveTo=null;
 if(moveTo&&Math.hypot(x,z)<.08){
  const dx=moveTo.x-state.player.x,dz=moveTo.z-state.player.z;
  if(Math.hypot(dx,dz)<.29)moveTo=null;
  else{x=dx;z=dz;}
 }
 const before={...state.player};
 const travelled=moveFinalPlayer(state,x,z,dt);
 view.hero.walkDistance=travelled;
 if(travelled>.001){
  const angle=Math.atan2(state.player.x-before.x,state.player.z-before.z);
  view.hero.body.rotation.y=angle;
 }
}
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
 if(window.__pansModalOpen)return;
 if(k==='escape'){
  if(state.phase==='done')toMenu();else if(state.phase==='decision')$('final-mercy').focus({preventScroll:true});
  return;
 }
 if(!started&&k==='enter'){start();return;}
 if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))keyboard.add(k);
 if(k==='e'&&started&&!resultShown){
  if(state.phase==='decision')$('final-mercy').focus({preventScroll:true});
  else goAltar();
 }
});
document.addEventListener('keyup',e=>keyboard.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keyboard.clear();pad={x:0,z:0};moveTo=null;});
CANVAS.addEventListener('pointerup',event=>{
 if(!started||!['approach','decision'].includes(state.phase)||window.__pansModalOpen)return;
 const hit=view.pick(event.clientX,event.clientY);
 if(!hit)return;
 const target=distance(hit,FINAL_ALTAR)<=2.7?FINAL_ALTAR:hit;
 if(walkableFinal(target))moveTo={...target};
});
const stick=$('final-stick'),joy=$('final-joystick');
function setPad(event){
 const rect=joy.getBoundingClientRect();
 const dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2);
 const max=rect.width*.34,mag=Math.max(1,Math.hypot(dx,dy));
 const px=dx/mag*Math.min(max,mag),py=dy/mag*Math.min(max,mag);
 // Screen's isometric axes project diagonally into world x/z.
 pad={x:(px+py)*.018,z:(py-px)*.018};
 stick.style.setProperty('--stick-x',px+'px');
 stick.style.setProperty('--stick-y',py+'px');
}
function clearPad(){
 padPointer=null;pad={x:0,z:0};
 stick.style.setProperty('--stick-x','0px');
 stick.style.setProperty('--stick-y','0px');
}
joy.addEventListener('pointerdown',e=>{
 if(!started||padPointer!==null)return;
 padPointer=e.pointerId;joy.setPointerCapture(e.pointerId);setPad(e);
});
joy.addEventListener('pointermove',e=>{if(padPointer===e.pointerId)setPad(e);});
for(const kind of ['pointerup','pointercancel','lostpointercapture'])
 joy.addEventListener(kind,e=>{if(e.pointerId===padPointer)clearPad();});
function cinematicNarration(){
 const t=state.cinematicTime,mercy=state.ending==='mercy';
 if(mercy){
  if(t<1.3)return '潘神伸出手。奥菲莉娅把弟弟抱得更紧。';
  if(t<2.17)return '靴声已至。维达尔看不见潘神，只看见抱着孩子的少女。';
  if(t<3.35)return '枪声打碎了沉默。弟弟被带走，她倒在冰冷的石沿旁。';
  if(t<4.7)return '鲜红的血顺着石阶滑入井底。古老的石门亮了起来。';
  return '金色王宫里，父亲与母亲仍在等待。她听见有人唤她公主。';
 }
 if(t<1.55)return '一滴无辜之血滴向井口。潘神的影子没有动。';
 if(t<3.6)return '弟弟的声音留在了门外。石井却真的为她打开。';
 return '王宫终于在眼前亮起。她所盼望的家，终于出现了。';
}
function renderRoyalDialogue(){
 const line=activeRoyalDialogue(state.ending,state.cinematicTime,state.royalShown);
 const key=line?state.ending+':'+line.speaker:'';
 if(key!==royalBubbleKey){
  royalBubbleKey=key;
  for(const speaker of ['father','mother']){
   const node=$('final-'+speaker+'-bubble');
   const visible=line?.speaker===speaker&&!resultShown;
   node.classList.toggle('hidden',!visible);
   if(visible){
    $('final-'+speaker+'-words').textContent=line.text;
    node.dataset.ending=state.ending;
   }
  }
 }
 if(!line||resultShown)return;
 const bubble=$('final-'+line.speaker+'-bubble');
 const anchor=view.projectRoyalSpeaker(line.speaker);
 if(!anchor?.visible){bubble.classList.add('hidden');return;}
 bubble.classList.remove('hidden');
 const surface=$('final-game').getBoundingClientRect();
 const width=Math.min(window.innerWidth<=820?268:342,surface.width-26);
 const margin=13;
 const x=Math.max(margin+width*.5,
  Math.min(surface.width-margin-width*.5,anchor.x));
 const minY=window.innerWidth<=820?138:150;
 const y=Math.max(minY,Math.min(surface.height*.77,anchor.y-8));
 bubble.style.left=x+'px';
 bubble.style.top=y+'px';
}
function showResult(){
 if(resultShown)return;resultShown=true;
 const kind=state.ending||'mercy',out=FINAL_OUTCOMES[kind];
 // A QA freeze/preview must never create a real completed campaign save.
 const stored=params.has('previewFinal')?loadCampaign():recordFinalOutcome(kind),
  seen=stored.endingsSeen||[];
 $('final-result').dataset.ending=kind;
 $('final-result-symbol').textContent=kind==='mercy'?'✧':'✢';
 $('final-result-label').textContent=out.subtitle;
 $('final-result-title').textContent=out.title;
 $('final-result-banner').textContent='恭喜完成最后的试炼。'+out.banner;
 $('final-result-speech').textContent=kind==='mercy'
  ?'父王与母后的欢迎，已经在王宫中响起。中间的王座仍为她空着。'
  :'王座向她敞开，但父王与母后的话无法替她抹去这份代价。';
 $('final-result-text').textContent=out.second+'\n'+out.last;
 $('final-ending-count').textContent='已发现的命运：'+seen.length+' / 2';
 $('final-result').classList.remove('hidden');
 tone(kind==='mercy'?650:420,.42,'triangle');
}
function updateHud(){
 const time=state.timeLeft;
 $('final-clock-numbers').textContent=finalClockLabel(time);
 $('final-clock-fill').style.width=Math.max(0,Math.min(100,time/CHAPTER4_TIME_LIMIT*100))+'%';
 $('final-clock').classList.toggle('warning',time<=18);
 const isChoice=state.phase==='decision';
 $('final-choice').classList.toggle('hidden',!started||!isChoice);
 $('final-guide').classList.toggle('hidden',!started||isChoice||['cinematic','done'].includes(state.phase));
 if(isChoice)showMessage('潘神要求用弟弟的血开启地下王国的门。');
 else if(state.phase==='approach'){
  const d=Math.max(0,distance(state.player,FINAL_ALTAR)-1.5);
  $('final-guide-text').textContent=d>2
   ?'抱紧弟弟，去中央石井。还有 '+Math.ceil(d)+' 米。'
   :'潘神就在前面。走到石井旁听他最后的要求。';
  $('final-guide-action').textContent=d>2?'前往石井 ↗':'靠近潘神 ↗';
  showMessage(time<=17?'维达尔的脚步越来越近，快做决定。':
   '月光落在石井上。潘神正等待你的到来。');
 }else if(state.phase==='cinematic'){
  showMessage(cinematicNarration());
  $('final-gun-flash').classList.toggle('show',state.gunFlash);
 }else if(state.phase==='done')showResult();
}
function frame(t){
 requestAnimationFrame(frame);
 const dt=lastTime?Math.max(0,Math.min(.05,(t-lastTime)/1000)):.016;lastTime=t;
 const active=started&&!resultShown&&!window.__pansModalOpen;
 if(active){
  elapsed+=dt;
  movement(dt);
  updateFinalTrial(state,dt);
 }
 view.update(active?dt:0,elapsed);
 const royalNow=Boolean(state.royalShown);
 $('final-game').classList.toggle('is-royal',royalNow);
 if(royalNow&&!royalPreviouslyShown)tone(state.ending==='mercy'?610:380,.32,'triangle');
 royalPreviouslyShown=royalNow;
 renderRoyalDialogue();
 if(t-screenUpdate>90||state.phase!==cachedPhase){
  cachedPhase=state.phase;screenUpdate=t;updateHud();
 }
}
const preview=params.get('previewFinal');
if(['choice','mercy','offering','royalMercy','royalOffering'].includes(preview)){
 start();state.player={x:FINAL_ALTAR.x-.85,z:FINAL_ALTAR.z+.60};
 state.phase='decision';state.foundAltar=true;
 if(preview==='mercy'||preview==='offering')choose(preview);
 if(preview==='royalMercy'||preview==='royalOffering'){
  choose(preview==='royalMercy'?'mercy':'offering');
  state.cinematicTime=preview==='royalMercy'?5.45:4.3;
  state.royalShown=true;state.brotherVisible=false;
 }
}
requestAnimationFrame(frame);
